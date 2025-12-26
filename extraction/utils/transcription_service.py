# Description: Transcription service using OpenAI Whisper API
# Converts audio files to text transcripts with language detection and timestamps

import logging
import requests
from typing import Dict, List, Optional
from openai import OpenAI
from utils.config import config
from utils.supabase_client import download_file_from_bucket

logger = logging.getLogger(__name__)

# Initialize OpenAI client
_openai_client: Optional[OpenAI] = None


def get_openai_client() -> OpenAI:
    """
    Get or create OpenAI client instance.
    
    Returns:
        OpenAI client instance
    """
    global _openai_client
    if _openai_client is None:
        _openai_client = OpenAI(api_key=config.OPENAI_API_KEY)
        logger.info("OpenAI client initialized")
    return _openai_client


def download_audio_from_url(audio_url: str) -> bytes:
    """
    Download audio file from URL or Supabase storage.
    
    Handles both public URLs and Supabase storage references.
    
    Args:
        audio_url: URL to audio file or Supabase storage reference (supabase://bucket/path)
        
    Returns:
        Audio file content as bytes
    """
    try:
        # Check if this is a Supabase storage reference
        if audio_url.startswith("supabase://"):
            # Extract bucket and file path
            parts = audio_url.replace("supabase://", "").split("/", 1)
            if len(parts) == 2:
                bucket_name, file_path = parts
                logger.info(f"Downloading audio from Supabase bucket '{bucket_name}': {file_path}")
                audio_bytes = download_file_from_bucket(bucket_name, file_path)
                logger.info(f"Audio downloaded from Supabase. Size: {len(audio_bytes)} bytes")
                return audio_bytes
        
        # Regular HTTP URL
        logger.info(f"Downloading audio from URL: {audio_url[:50]}...")
        response = requests.get(audio_url, timeout=300)  # 5 minute timeout for large files
        response.raise_for_status()
        logger.info(f"Audio downloaded. Size: {len(response.content)} bytes")
        return response.content
    except Exception as e:
        logger.error(f"Failed to download audio: {e}")
        raise RuntimeError(f"Failed to download audio: {str(e)}")


def transcribe_audio(audio_url: str) -> Dict:
    """
    Transcribe audio file using OpenAI Whisper API.
    
    Downloads audio from URL and sends to OpenAI Whisper for transcription.
    Returns transcript with text, language, and timestamp segments.
    
    Args:
        audio_url: URL to audio file (Supabase storage URL or direct URL)
        
    Returns:
        Dictionary containing:
        - text: Full transcript text
        - language: Detected language code
        - segments: List of timestamped segments (optional)
    """
    try:
        logger.info(f"Starting transcription for audio: {audio_url[:50]}...")
        
        # Download audio file
        audio_bytes = download_audio_from_url(audio_url)
        
        # Initialize OpenAI client
        client = get_openai_client()
        
        # Create a temporary file-like object for OpenAI API
        import io
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = "audio.mp3"  # OpenAI needs a filename
        
        # Call OpenAI Whisper API
        logger.info("Sending audio to OpenAI Whisper API...")
        transcript = client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
            response_format="verbose_json",  # Get detailed response with segments
            language=None  # Auto-detect language
        )
        
        # Extract segments if available
        segments = []
        if hasattr(transcript, 'segments') and transcript.segments:
            for segment in transcript.segments:
                segments.append({
                    'id': segment.id if hasattr(segment, 'id') else None,
                    'start': segment.start,
                    'end': segment.end,
                    'text': segment.text
                })
        
        result = {
            'text': transcript.text,
            'language': transcript.language if hasattr(transcript, 'language') else None,
            'segments': segments if segments else None
        }
        
        logger.info(f"Transcription complete. Language: {result['language']}, Text length: {len(result['text'])} chars")
        
        return result
        
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise RuntimeError(f"Failed to transcribe audio: {str(e)}")

