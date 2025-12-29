"""
Main orchestrator for recipe extraction pipeline.
Reuses IG Downloader utilities while adding recipe-specific logic.
"""
import io
import logging
import os
import sys
import tempfile
import shutil
from typing import Dict

# Add extraction/ to Python path to import IG Downloader utilities
extraction_path = os.path.join(os.path.dirname(__file__), '..', 'extraction')
sys.path.insert(0, extraction_path)

# Import IG Downloader utilities (pristine, never modified)
from utils.platform_router import PlatformRouter
from utils.audio_processor import convert_video_file_to_audio
from utils.platform_detector import detect_platform
from utils.supabase_client import upload_file_to_bucket

# Import RecipeSave-specific modules
from recipe_analyzer import extract_recipe_from_transcript
from data_mapper import map_recipe_to_database
from config import get_supabase_client, get_supabase_url, get_thumbnail_bucket

# Import OpenAI for direct transcription
from openai import OpenAI

logger = logging.getLogger(__name__)


def transcribe_audio_bytes(audio_bytes: bytes) -> Dict:
    """
    Transcribe audio bytes directly using OpenAI Whisper API.

    This is a local version that doesn't require uploading to storage first.

    Args:
        audio_bytes: Audio file content as bytes

    Returns:
        Dictionary containing:
        - text: Full transcript text
        - language: Detected language code
    """
    try:
        logger.info(f"Starting transcription for audio ({len(audio_bytes)} bytes)")

        client = OpenAI()

        # Create a file-like object for OpenAI API
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "audio.mp3"  # OpenAI needs a filename

        # Call OpenAI Whisper API
        logger.info("Sending audio to OpenAI Whisper API...")
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",
            language=None  # Auto-detect language
        )

        result = {
            'text': transcript.text,
            'language': transcript.language if hasattr(transcript, 'language') else None,
        }

        logger.info(f"Transcription complete. Language: {result['language']}, Length: {len(result['text'])} chars")

        return result

    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise RuntimeError(f"Failed to transcribe audio: {str(e)}")


def upload_thumbnail_to_storage(thumbnail_bytes: bytes, recipe_id: str) -> str:
    """
    Upload thumbnail to Supabase storage.

    Args:
        thumbnail_bytes: JPEG thumbnail bytes
        recipe_id: Recipe ID for unique naming

    Returns:
        Public URL of the uploaded thumbnail
    """
    from datetime import datetime

    bucket_name = get_thumbnail_bucket()
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_path = f"{recipe_id}_{timestamp}.jpg"

    supabase_url = get_supabase_url()

    # Upload to Supabase
    supabase = get_supabase_client()
    supabase.storage.from_(bucket_name).upload(
        path=file_path,
        file=thumbnail_bytes,
        file_options={
            "content-type": "image/jpeg",
            "upsert": "true"
        }
    )

    # Return public URL
    public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{file_path}"
    logger.info(f"Thumbnail uploaded: {public_url}")

    return public_url


def process_recipe_extraction(recipe_id: str, url: str, user_id: str) -> Dict:
    """
    Main recipe extraction pipeline.

    Flow:
        1. Download video (via IG Downloader platform handlers)
        2. Extract audio + thumbnail (via IG Downloader audio processor)
        3. Transcribe audio (via OpenAI Whisper)
        4. Extract recipe data (via RecipeSave recipe analyzer)
        5. Store in database (via RecipeSave data mapper)

    Args:
        recipe_id: UUID of recipe record in database
        url: Video URL to process
        user_id: UUID of user who created the recipe

    Returns:
        {
            "status": "completed",
            "recipe_id": str,
            "title": str
        }
    """
    supabase = None

    try:
        logger.info(f"Starting recipe extraction for {recipe_id} from {url}")

        supabase = get_supabase_client()

        # Update status: downloading
        update_recipe_status(supabase, recipe_id, "downloading")

        # Step 1: Detect platform and get handler (IG Downloader)
        platform = detect_platform(url)
        platform_name = platform.value if platform else "unknown"
        logger.info(f"Platform detected: {platform_name}")

        platform_router = PlatformRouter()
        handler = platform_router.get_handler(url)

        # Step 2: Fetch metadata (IG Downloader)
        metadata = handler.fetch_metadata(url)
        video_url = metadata.get('video_url')
        title = metadata.get('title', 'Recipe Video')
        duration = metadata.get('duration', 0)
        uploader = metadata.get('uploader') or metadata.get('channel') or 'Unknown'
        description = metadata.get('description') or metadata.get('caption') or ''

        logger.info(f"Metadata fetched. Title: {title}, Duration: {duration}s")

        # Update platform in database
        supabase.table("recipes").update({
            "platform": platform_name
        }).eq("id", recipe_id).execute()

        # Step 3: Download and extract audio (IG Downloader)
        update_recipe_status(supabase, recipe_id, "extracting_audio")

        temp_dir = tempfile.mkdtemp(prefix=f"{platform_name}_")
        try:
            download_target = os.path.join(temp_dir, recipe_id)
            downloaded_path = handler.download_video(url, download_target, metadata=metadata)

            audio_bytes, audio_filename, thumbnail_bytes = convert_video_file_to_audio(
                downloaded_path
            )

            logger.info(f"Audio extracted: {len(audio_bytes)} bytes")
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

        # Step 4: Upload thumbnail if available
        thumbnail_url = None
        if thumbnail_bytes:
            try:
                thumbnail_url = upload_thumbnail_to_storage(thumbnail_bytes, recipe_id)
                supabase.table("recipes").update({
                    "thumbnail_url": thumbnail_url
                }).eq("id", recipe_id).execute()
                logger.info(f"Thumbnail uploaded: {thumbnail_url}")
            except Exception as e:
                logger.warning(f"Thumbnail upload failed (non-critical): {e}")

        # Step 5: Transcribe audio (OpenAI Whisper)
        update_recipe_status(supabase, recipe_id, "transcribing")

        transcript_data = transcribe_audio_bytes(audio_bytes)
        transcript_text = transcript_data.get('text', '')
        language = transcript_data.get('language', 'en')

        logger.info(f"Transcription complete. Language: {language}, Length: {len(transcript_text)} chars")

        # Step 6: Extract recipe data (RecipeSave - Custom)
        update_recipe_status(supabase, recipe_id, "analyzing")

        recipe_data = extract_recipe_from_transcript(
            transcript_text,
            metadata={'title': title, 'description': description}
        )

        logger.info(f"Recipe extracted: {recipe_data['title']}")

        # Step 7: Map to database schema (RecipeSave - Custom)
        mapped_data = map_recipe_to_database(recipe_data, recipe_id, user_id)

        # Step 8: Store in database
        # Update recipe
        supabase.table("recipes").update(
            mapped_data["recipe_update"]
        ).eq("id", recipe_id).execute()

        # Insert ingredients
        if mapped_data["ingredients"]:
            supabase.table("ingredients").insert(
                mapped_data["ingredients"]
            ).execute()

        # Insert instructions
        if mapped_data["instructions"]:
            supabase.table("instructions").insert(
                mapped_data["instructions"]
            ).execute()

        logger.info(f"Recipe extraction completed successfully: {recipe_id}")

        return {
            "status": "completed",
            "recipe_id": recipe_id,
            "title": recipe_data["title"]
        }

    except Exception as e:
        logger.error(f"Recipe extraction failed: {e}", exc_info=True)

        # Update status to failed
        try:
            if supabase is None:
                supabase = get_supabase_client()
            supabase.table("recipes").update({
                "status": "failed"
            }).eq("id", recipe_id).execute()
        except Exception as update_error:
            logger.error(f"Failed to update recipe status to failed: {update_error}")

        raise


def update_recipe_status(supabase, recipe_id: str, status: str):
    """Helper to update recipe status."""
    logger.info(f"Status update: {recipe_id} -> {status}")
    supabase.table("recipes").update({
        "status": status
    }).eq("id", recipe_id).execute()
