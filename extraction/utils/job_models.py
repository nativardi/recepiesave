# Description: Job status management and database operations
# Defines job status enum and provides database CRUD operations for audio jobs

import logging
from enum import Enum
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import uuid4
from utils.supabase_client import get_supabase_client, get_public_url

logger = logging.getLogger(__name__)


class JobStatus(Enum):
    """Job processing status values."""
    PENDING = "pending"
    DOWNLOADING = "downloading"
    EXTRACTING_AUDIO = "extracting_audio"
    UPLOADING = "uploading"
    TRANSCRIBING = "transcribing"
    ANALYZING = "analyzing"
    GENERATING_EMBEDDINGS = "generating_embeddings"
    STORING = "storing"
    COMPLETED = "completed"
    FAILED = "failed"


def create_job(url: str, platform: Optional[str] = None) -> str:
    """
    Create a new audio processing job in the database.
    
    Args:
        url: Video URL to process
        platform: Platform name (instagram, tiktok, youtube) - optional
        
    Returns:
        Job ID (UUID string)
    """
    try:
        client = get_supabase_client()
        job_id = str(uuid4())
        
        job_data = {
            'id': job_id,
            'url': url,
            'status': JobStatus.PENDING.value,
            'platform': platform,
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = client.table('audio_jobs').insert(job_data).execute()
        
        if result.data:
            logger.info(f"Created job {job_id} for URL: {url}")
            return job_id
        else:
            raise RuntimeError("Failed to create job: no data returned")
            
    except Exception as e:
        logger.error(f"Failed to create job: {e}")
        raise RuntimeError(f"Failed to create job: {str(e)}")


def update_job_status(job_id: str, status: JobStatus, error_message: Optional[str] = None) -> None:
    """
    Update job status in the database.
    
    Args:
        job_id: Job ID
        status: New job status
        error_message: Error message if status is FAILED
    """
    try:
        client = get_supabase_client()
        
        update_data = {
            'status': status.value,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        if error_message:
            update_data['error_message'] = error_message
        
        result = client.table('audio_jobs').update(update_data).eq('id', job_id).execute()
        
        if result.data:
            logger.info(f"Updated job {job_id} status to {status.value}")
        else:
            logger.warning(f"No job found with ID {job_id} to update")
            
    except Exception as e:
        logger.error(f"Failed to update job status: {e}")
        raise RuntimeError(f"Failed to update job status: {str(e)}")


def update_job_metadata(job_id: str, metadata: Dict[str, Any]) -> None:
    """
    Update job metadata in the database.
    
    Args:
        job_id: Job ID
        metadata: Metadata dictionary to store in metadata_json
    """
    try:
        client = get_supabase_client()
        
        update_data = {
            'metadata_json': metadata,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        result = client.table('audio_jobs').update(update_data).eq('id', job_id).execute()
        
        if result.data:
            logger.info(f"Updated job {job_id} metadata")
        else:
            logger.warning(f"No job found with ID {job_id} to update metadata")
            
    except Exception as e:
        logger.error(f"Failed to update job metadata: {e}")
        raise RuntimeError(f"Failed to update job metadata: {str(e)}")


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    """
    Get job details from database.
    
    Args:
        job_id: Job ID
        
    Returns:
        Job data dictionary or None if not found
    """
    try:
        client = get_supabase_client()
        result = client.table('audio_jobs').select('*').eq('id', job_id).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
        
    except Exception as e:
        logger.error(f"Failed to get job: {e}")
        raise RuntimeError(f"Failed to get job: {str(e)}")


def store_audio_file(job_id: str, file_path: str, supabase_url: str, duration: Optional[float] = None, size_bytes: Optional[int] = None) -> str:
    """
    Store audio file record in database.
    
    Args:
        job_id: Job ID
        file_path: File path in storage
        supabase_url: Supabase storage URL
        duration: Audio duration in seconds (optional)
        size_bytes: File size in bytes (optional)
        
    Returns:
        Audio file ID (UUID string)
    """
    try:
        client = get_supabase_client()
        audio_file_id = str(uuid4())
        
        audio_file_data = {
            'id': audio_file_id,
            'job_id': job_id,
            'file_path': file_path,
            'supabase_url': supabase_url,
            'duration': duration,
            'size_bytes': size_bytes,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = client.table('audio_files').insert(audio_file_data).execute()
        
        if result.data:
            logger.info(f"Stored audio file {audio_file_id} for job {job_id}")
            return audio_file_id
        else:
            raise RuntimeError("Failed to store audio file: no data returned")
            
    except Exception as e:
        logger.error(f"Failed to store audio file: {e}")
        raise RuntimeError(f"Failed to store audio file: {str(e)}")


def store_thumbnail(job_id: str, thumbnail_url: str) -> str:
    """
    Store thumbnail record in database.
    
    Args:
        job_id: Job ID
        thumbnail_url: Thumbnail URL
        
    Returns:
        Thumbnail ID (UUID string)
    """
    try:
        client = get_supabase_client()
        thumbnail_id = str(uuid4())
        
        thumbnail_data = {
            'id': thumbnail_id,
            'job_id': job_id,
            'thumbnail_url': thumbnail_url,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = client.table('thumbnails').insert(thumbnail_data).execute()
        
        if result.data:
            logger.info(f"Stored thumbnail {thumbnail_id} for job {job_id}")
            return thumbnail_id
        else:
            raise RuntimeError("Failed to store thumbnail: no data returned")
            
    except Exception as e:
        logger.error(f"Failed to store thumbnail: {e}")
        raise RuntimeError(f"Failed to store thumbnail: {str(e)}")


def store_transcription(audio_file_id: str, text: str, language: Optional[str] = None, timestamps: Optional[Dict] = None) -> str:
    """
    Store transcription record in database.
    
    Args:
        audio_file_id: Audio file ID
        text: Transcription text
        language: Detected language (optional)
        timestamps: Timestamp segments (optional)
        
    Returns:
        Transcription ID (UUID string)
    """
    try:
        client = get_supabase_client()
        transcription_id = str(uuid4())
        
        transcription_data = {
            'id': transcription_id,
            'audio_file_id': audio_file_id,
            'text': text,
            'language': language,
            'timestamps_json': timestamps,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = client.table('transcriptions').insert(transcription_data).execute()
        
        if result.data:
            logger.info(f"Stored transcription {transcription_id} for audio file {audio_file_id}")
            return transcription_id
        else:
            raise RuntimeError("Failed to store transcription: no data returned")
            
    except Exception as e:
        logger.error(f"Failed to store transcription: {e}")
        raise RuntimeError(f"Failed to store transcription: {str(e)}")


def store_analysis(audio_file_id: str, summary: str, topics: Optional[list] = None, sentiment: Optional[str] = None, category: Optional[str] = None) -> str:
    """
    Store AI analysis record in database.
    
    Args:
        audio_file_id: Audio file ID
        summary: Content summary
        topics: List of topics/tags (optional)
        sentiment: Sentiment analysis result (optional)
        category: Content category (optional)
        
    Returns:
        Analysis ID (UUID string)
    """
    try:
        client = get_supabase_client()
        analysis_id = str(uuid4())
        
        analysis_data = {
            'id': analysis_id,
            'audio_file_id': audio_file_id,
            'summary': summary,
            'topics_json': topics,
            'sentiment': sentiment,
            'category': category,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = client.table('analyses').insert(analysis_data).execute()
        
        if result.data:
            logger.info(f"Stored analysis {analysis_id} for audio file {audio_file_id}")
            return analysis_id
        else:
            raise RuntimeError("Failed to store analysis: no data returned")
            
    except Exception as e:
        logger.error(f"Failed to store analysis: {e}")
        raise RuntimeError(f"Failed to store analysis: {str(e)}")


def store_embedding(audio_file_id: str, vector: list, metadata: Optional[Dict] = None) -> str:
    """
    Store embedding vector in database.
    
    Args:
        audio_file_id: Audio file ID
        vector: Embedding vector (list of floats)
        metadata: Additional metadata (optional)
        
    Returns:
        Embedding ID (UUID string)
    """
    try:
        client = get_supabase_client()
        embedding_id = str(uuid4())
        
        # Convert vector to string format for pgvector
        # pgvector expects the format: '[0.1,0.2,0.3]'
        vector_str = '[' + ','.join(map(str, vector)) + ']'
        
        embedding_data = {
            'id': embedding_id,
            'audio_file_id': audio_file_id,
            'vector': vector_str,  # Will be converted to vector type by Supabase
            'metadata_json': metadata,
            'created_at': datetime.utcnow().isoformat()
        }
        
        result = client.table('embeddings').insert(embedding_data).execute()
        
        if result.data:
            logger.info(f"Stored embedding {embedding_id} for audio file {audio_file_id}")
            return embedding_id
        else:
            raise RuntimeError("Failed to store embedding: no data returned")
            
    except Exception as e:
        logger.error(f"Failed to store embedding: {e}")
        raise RuntimeError(f"Failed to store embedding: {str(e)}")


def get_job_result_data(job_id: str) -> Optional[Dict[str, Any]]:
    """
    Get complete job result data including all related records.
    
    Args:
        job_id: Job ID
        
    Returns:
        Complete job result dictionary or None if not found
    """
    try:
        client = get_supabase_client()
        
        # Get job
        job_result = client.table('audio_jobs').select('*').eq('id', job_id).execute()
        if not job_result.data:
            return None
        
        job = job_result.data[0]
        
        # Get audio file
        audio_file_result = client.table('audio_files').select('*').eq('job_id', job_id).execute()
        audio_file = audio_file_result.data[0] if audio_file_result.data else None
        
        # Get thumbnail
        thumbnail_result = client.table('thumbnails').select('*').eq('job_id', job_id).execute()
        thumbnail = thumbnail_result.data[0] if thumbnail_result.data else None
        
        result = {
            'job_id': job_id,
            'status': job.get('status'),
            'url': job.get('url'),
            'platform': job.get('platform'),
            'error_message': job.get('error_message'),
            'created_at': job.get('created_at'),
            'updated_at': job.get('updated_at')
        }
        
        # Add metadata_json to result
        if job.get('metadata_json'):
            result['metadata'] = job.get('metadata_json')
        
        if audio_file:
            audio_file_id = audio_file['id']
            audio_url = audio_file.get('supabase_url', '')
            
            # Convert Supabase storage reference to signed URL if needed
            if audio_url and audio_url.startswith('supabase://'):
                try:
                    # Extract bucket and path
                    parts = audio_url.replace('supabase://', '').split('/', 1)
                    if len(parts) == 2:
                        bucket_name, file_path = parts
                        # Generate signed URL for private bucket
                        audio_url = get_public_url(bucket_name, file_path)
                except Exception as e:
                    logger.warning(f"Failed to generate signed URL for audio: {e}")
            
            result['audio_file'] = {
                'id': audio_file_id,
                'url': audio_url,
                'duration': audio_file.get('duration'),
                'size_bytes': audio_file.get('size_bytes')
            }
            
            # Get transcription
            transcription_result = client.table('transcriptions').select('*').eq('audio_file_id', audio_file_id).execute()
            if transcription_result.data:
                result['transcription'] = transcription_result.data[0]
            
            # Get analysis
            analysis_result = client.table('analyses').select('*').eq('audio_file_id', audio_file_id).execute()
            if analysis_result.data:
                result['analysis'] = analysis_result.data[0]
            
            # Get embedding (without vector for response size)
            embedding_result = client.table('embeddings').select('id,metadata_json,created_at').eq('audio_file_id', audio_file_id).execute()
            if embedding_result.data:
                result['embedding'] = embedding_result.data[0]
        
        if thumbnail:
            result['thumbnail'] = {
                'url': thumbnail.get('thumbnail_url')
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to get job result data: {e}")
        raise RuntimeError(f"Failed to get job result data: {str(e)}")
