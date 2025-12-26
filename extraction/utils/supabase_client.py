# Description: Supabase client utility for file storage and database operations
# Handles file uploads to Supabase Storage buckets and provides helper functions
# for managing audio files and thumbnails

import logging
from typing import Optional
from datetime import datetime
from supabase import create_client, Client
from utils.config import config

logger = logging.getLogger(__name__)

# Initialize Supabase client
_supabase_client: Optional[Client] = None


def _guess_content_type(file_path: str) -> str:
    """
    Infer MIME type from file extension.
    This keeps upload helpers simple whenever explicit content types are omitted.
    """
    if file_path.endswith('.mp3'):
        return 'audio/mpeg'
    if file_path.endswith(('.jpg', '.jpeg')):
        return 'image/jpeg'
    if file_path.endswith('.png'):
        return 'image/png'
    return 'application/octet-stream'


def get_supabase_client() -> Client:
    """
    Get or create Supabase client instance.
    
    Returns:
        Supabase client instance
    """
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = create_client(
            config.SUPABASE_URL,
            config.SUPABASE_SERVICE_ROLE_KEY
        )
        logger.info("Supabase client initialized")
    return _supabase_client


def upload_file_to_bucket(
    bucket_name: str,
    file_path: str,
    file_data: bytes,
    *,
    content_type: Optional[str] = None,
    is_public: bool = False
) -> str:
    """
    Upload file to Supabase Storage bucket.
    
    Args:
        bucket_name: Name of the storage bucket
        file_path: Path within the bucket (e.g., "audio/job_123.mp3")
        file_data: File content as bytes
        content_type: MIME type of the file (optional)
        
    Returns:
        Public URL for public buckets or an internal Supabase reference
        
    Raises:
        RuntimeError: If upload fails
    """
    try:
        client = get_supabase_client()
        
        resolved_content_type = content_type or _guess_content_type(file_path)
        
        logger.info(f"Uploading file to bucket '{bucket_name}' at path '{file_path}'")
        
        client.storage.from_(bucket_name).upload(
            path=file_path,
            file=file_data,
            file_options={
                "content-type": resolved_content_type,
                "upsert": "true"
            }
        )
        
        if is_public:
            public_url = f"{config.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_path}"
        else:
            public_url = f"supabase://{bucket_name}/{file_path}"
        
        logger.info(f"File uploaded successfully. Path: {file_path}, URL: {public_url}")
        return public_url
        
    except Exception as e:
        logger.error(f"Failed to upload file to Supabase: {e}")
        raise RuntimeError(f"Failed to upload file to Supabase: {str(e)}")


def upload_audio_file(
    audio_bytes: bytes,
    filename: str,
    job_id: str,
    *,
    bucket_name: Optional[str] = None,
    is_public: bool = False
) -> tuple[str, str]:
    """
    Upload audio file to configured Supabase audio bucket (private by default).
    
    Args:
        audio_bytes: Audio file content as bytes
        filename: Original filename (for extension detection)
        job_id: Job ID for unique file naming
        
    Returns:
        Tuple of (storage_reference, file_path) where:
        - storage_reference: Supabase storage reference (supabase://bucket/path)
        - file_path: Actual file path in bucket
    """
    # Generate unique filename: {job_id}_{timestamp}.mp3
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_path = f"{job_id}_{timestamp}.mp3"
    
    logger.info(f"Uploading audio file for job {job_id}: {file_path}")
    
    target_bucket = bucket_name or config.SUPABASE_AUDIO_BUCKET
    
    storage_ref = upload_file_to_bucket(
        bucket_name=target_bucket,
        file_path=file_path,
        file_data=audio_bytes,
        content_type="audio/mpeg",
        is_public=is_public
    )
    
    return storage_ref, file_path


def upload_thumbnail(
    thumbnail_bytes: bytes,
    job_id: str,
    *,
    bucket_name: Optional[str] = None,
    is_public: bool = True
) -> str:
    """
    Upload thumbnail image to configured Supabase thumbnail bucket (public by default).
    
    Args:
        thumbnail_bytes: Thumbnail image content as bytes
        job_id: Job ID for unique file naming
        
    Returns:
        Supabase storage URL of the uploaded thumbnail
    """
    # Generate unique filename: {job_id}_{timestamp}.jpg
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    file_path = f"{job_id}_{timestamp}.jpg"
    
    logger.info(f"Uploading thumbnail for job {job_id}: {file_path}")
    
    target_bucket = bucket_name or config.SUPABASE_THUMBNAIL_BUCKET
    
    return upload_file_to_bucket(
        bucket_name=target_bucket,
        file_path=file_path,
        file_data=thumbnail_bytes,
        content_type="image/jpeg",
        is_public=is_public
    )


def delete_file_from_bucket(bucket_name: str, file_path: str) -> None:
    """
    Delete file from Supabase Storage bucket.
    
    Args:
        bucket_name: Name of the storage bucket
        file_path: Path within the bucket
        
    Raises:
        RuntimeError: If deletion fails
    """
    try:
        client = get_supabase_client()
        client.storage.from_(bucket_name).remove([file_path])
        logger.info(f"File deleted from bucket '{bucket_name}': {file_path}")
    except Exception as e:
        logger.error(f"Failed to delete file from Supabase: {e}")
        raise RuntimeError(f"Failed to delete file from Supabase: {str(e)}")


def get_public_url(
    bucket_name: str,
    file_path: str,
    *,
    is_public_bucket: Optional[bool] = None
) -> str:
    """
    Get public URL for a file in Supabase Storage.
    
    Args:
        bucket_name: Name of the storage bucket
        file_path: Path within the bucket
        
    Returns:
        Public URL of the file
    """
    client = get_supabase_client()
    public_bucket = (
        is_public_bucket if is_public_bucket is not None
        else bucket_name == config.SUPABASE_THUMBNAIL_BUCKET
    )

    if public_bucket:
        return f"{config.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_path}"

        return client.storage.from_(bucket_name).create_signed_url(file_path, 3600)['signedURL']


def download_file_from_bucket(bucket_name: str, file_path: str) -> bytes:
    """
    Download file from Supabase Storage bucket.
    
    Args:
        bucket_name: Name of the storage bucket
        file_path: Path within the bucket
        
    Returns:
        File content as bytes
    """
    try:
        client = get_supabase_client()
        response = client.storage.from_(bucket_name).download(file_path)
        return response
    except Exception as e:
        logger.error(f"Failed to download file from Supabase: {e}")
        raise RuntimeError(f"Failed to download file from Supabase: {str(e)}")

