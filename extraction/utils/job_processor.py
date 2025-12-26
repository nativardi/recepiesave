# Description: Main pipeline orchestrator for audio processing jobs
# Coordinates all steps: download → extract → upload → transcribe → analyze → embed → store
# This file will be completed as we add transcription, AI analysis, and embedding services

import logging
import os
import shutil
import tempfile
from utils.job_models import (
    JobStatus, update_job_status, update_job_metadata, store_audio_file, store_thumbnail,
    store_transcription, store_analysis, store_embedding
)
from utils.platform_router import PlatformRouter
from utils.audio_processor import convert_video_file_to_audio
from utils.supabase_client import upload_audio_file, upload_thumbnail
from utils.platform_detector import detect_platform
from utils.transcription_service import transcribe_audio
from utils.ai_analyzer import analyze_content
from utils.embedding_service import generate_embeddings_for_content

logger = logging.getLogger(__name__)

# Initialize platform router
platform_router = PlatformRouter()


def process_audio_job(job_id: str, url: str):
    """
    Main pipeline orchestrator for processing audio jobs.
    
    Complete workflow:
    1. Download video and extract metadata
    2. Extract thumbnail → upload to Supabase → store in DB
    3. Extract audio → upload to Supabase → store in DB
    4. Transcribe audio → store in DB
    5. Analyze content → store in DB
    6. Generate embeddings → store in DB
    7. Mark as completed
    
    Args:
        job_id: Job ID
        url: Video URL to process
    """
    try:
        logger.info(f"Starting job {job_id} for URL: {url}")
        
        # Step 1: Update status to DOWNLOADING
        update_job_status(job_id, JobStatus.DOWNLOADING)
        
        # Step 2: Fetch metadata via platform handler
        handler = platform_router.get_handler(url)
        metadata = handler.fetch_metadata(url)
        video_url = metadata['video_url']
        title = metadata.get('title', 'Video')
        duration = metadata.get('duration', 0)
        
        # Extract additional metadata (uploader, description)
        uploader = metadata.get('uploader') or metadata.get('channel') or 'Unknown'
        description = metadata.get('description') or metadata.get('caption') or ''
        
        # Store metadata in database
        update_job_metadata(job_id, {
            'title': title,
            'duration': duration,
            'uploader': uploader,
            'description': description
        })
        
        # Detect platform
        platform = detect_platform(url)
        platform_name = platform.value if platform else handler.get_platform_name().lower()
        
        logger.info(f"Fetched metadata. Platform: {platform_name}, Title: {title}")
        
        # Step 3: Extract thumbnail and audio
        update_job_status(job_id, JobStatus.EXTRACTING_AUDIO)
        
        logger.info(f"{platform_name.capitalize()} processing: downloading video via handler to preserve session context")
        temp_dir = tempfile.mkdtemp(prefix=f"{platform_name}_")
        downloaded_path = None
        try:
            download_target = os.path.join(temp_dir, f"{job_id}")
            downloaded_path = handler.download_video(url, download_target, metadata=metadata)
            audio_bytes, filename, thumbnail_bytes = convert_video_file_to_audio(downloaded_path)
        finally:
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception as cleanup_error:
                logger.warning(f"Failed to delete {platform_name} temp directory {temp_dir}: {cleanup_error}")
        
        # Step 4: Upload thumbnail to Supabase
        thumbnail_url = None
        if thumbnail_bytes:
            try:
                update_job_status(job_id, JobStatus.UPLOADING)
                thumbnail_url = upload_thumbnail(thumbnail_bytes, job_id)
                store_thumbnail(job_id, thumbnail_url)
                logger.info(f"Thumbnail uploaded: {thumbnail_url}")
            except Exception as e:
                logger.warning(f"Thumbnail upload failed (non-fatal): {e}")
        
        # Step 5: Upload audio to Supabase
        update_job_status(job_id, JobStatus.UPLOADING)
        audio_url, audio_file_path = upload_audio_file(audio_bytes, filename, job_id)
        audio_file_id = store_audio_file(
            job_id=job_id,
            file_path=audio_file_path,  # Store actual file path
            supabase_url=audio_url,  # Store storage reference
            duration=duration,
            size_bytes=len(audio_bytes)
        )
        logger.info(f"Audio uploaded: {audio_file_path} (ref: {audio_url})")
        
        # Step 6: Transcribe audio
        update_job_status(job_id, JobStatus.TRANSCRIBING)
        transcript_data = transcribe_audio(audio_url)
        transcription_id = store_transcription(
            audio_file_id=audio_file_id,
            text=transcript_data['text'],
            language=transcript_data.get('language'),
            timestamps=transcript_data.get('segments')
        )
        logger.info(f"Transcription complete. ID: {transcription_id}")
        
        # Step 7: Analyze content
        update_job_status(job_id, JobStatus.ANALYZING)
        analysis_data = analyze_content(transcript_data['text'])
        analysis_id = store_analysis(
            audio_file_id=audio_file_id,
            summary=analysis_data['summary'],
            topics=analysis_data['topics'],
            sentiment=analysis_data['sentiment'],
            category=analysis_data['category']
        )
        logger.info(f"Analysis complete. ID: {analysis_id}, Category: {analysis_data['category']}")
        
        # Step 8: Generate embeddings
        update_job_status(job_id, JobStatus.GENERATING_EMBEDDINGS)
        embedding_vector = generate_embeddings_for_content(
            transcript=transcript_data['text'],
            summary=analysis_data['summary']
        )
        embedding_id = store_embedding(
            audio_file_id=audio_file_id,
            vector=embedding_vector,
            metadata={
                'summary': analysis_data['summary'],
                'category': analysis_data['category'],
                'sentiment': analysis_data['sentiment']
            }
        )
        logger.info(f"Embedding generated. ID: {embedding_id}, Vector dimension: {len(embedding_vector)}")
        
        # Step 9: Final status update
        update_job_status(job_id, JobStatus.STORING)
        
        # Step 10: Mark as completed
        update_job_status(job_id, JobStatus.COMPLETED)
        logger.info(f"Job {job_id} completed successfully")
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}", exc_info=True)
        update_job_status(job_id, JobStatus.FAILED, error_message=str(e))
        raise

