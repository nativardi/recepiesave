# Description: Audio processor module for extracting MP3 audio from video files
# Downloads video from URL and uses ffmpeg to extract and convert audio to MP3

import os
import subprocess
import tempfile
import requests
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


def extract_thumbnail(video_path: str) -> bytes:
    """
    Extract thumbnail image from video file using ffmpeg.
    
    Extracts a frame at 1 second into the video as a JPEG thumbnail.
    
    Args:
        video_path: Path to input video file
        
    Returns:
        Thumbnail image as bytes (JPEG format)
        
    Raises:
        RuntimeError: If ffmpeg fails or thumbnail extraction fails
    """
    try:
        logger.info(f"Extracting thumbnail from video: {video_path}")
        
        # Use ffmpeg to extract thumbnail at 1 second mark
        # -ss 00:00:01: seek to 1 second
        # -vframes 1: extract only 1 frame
        # -q:v 2: high quality JPEG (2-31, lower is better)
        # -f image2pipe: output to pipe
        # -vcodec mjpeg: use MJPEG codec
        # -: output to stdout
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-ss', '00:00:01',  # Seek to 1 second
            '-vframes', '1',  # Extract 1 frame
            '-q:v', '2',  # High quality
            '-f', 'image2pipe',  # Output to pipe
            '-vcodec', 'mjpeg',  # JPEG codec
            '-'  # Output to stdout
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            timeout=30
        )
        
        if result.returncode != 0:
            error_msg = result.stderr.decode('utf-8', errors='ignore') or "Unknown error"
            logger.error(f"ffmpeg thumbnail extraction failed: {error_msg}")
            raise RuntimeError(f"Failed to extract thumbnail: {error_msg[:200]}")
        
        thumbnail_bytes = result.stdout
        if not thumbnail_bytes or len(thumbnail_bytes) == 0:
            raise RuntimeError("Thumbnail extraction failed: empty output")
        
        logger.info(f"Thumbnail extracted successfully. Size: {len(thumbnail_bytes)} bytes")
        return thumbnail_bytes
        
    except subprocess.TimeoutExpired:
        logger.error("Thumbnail extraction timed out")
        raise RuntimeError("Thumbnail extraction timed out")
    except FileNotFoundError:
        logger.error("ffmpeg not found. Please install ffmpeg.")
        raise RuntimeError("ffmpeg is not installed. Please install ffmpeg on your system.")
    except Exception as e:
        logger.error(f"Unexpected error extracting thumbnail: {e}")
        raise RuntimeError(f"Failed to extract thumbnail: {str(e)}")


def download_video(video_url: str, output_path: str) -> None:
    """
    Download video file from URL to local path.

    Args:
        video_url: Direct URL to video file
        output_path: Local file path to save video

    Raises:
        RuntimeError: If download fails
    """
    try:
        logger.info(f"Downloading video from: {video_url[:50]}...")

        # Headers to mimic a browser request and bypass platform restrictions
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://www.tiktok.com/',
            'Origin': 'https://www.tiktok.com',
            'Sec-Fetch-Dest': 'video',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site',
            'Range': 'bytes=0-',  # Ensure we get the whole file
        }

        # Download with streaming to handle large files
        response = requests.get(video_url, stream=True, timeout=60, headers=headers)
        response.raise_for_status()
        
        # Write video to file
        with open(output_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
        
        logger.info(f"Video downloaded successfully: {output_path}")
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Failed to download video: {e}")
        raise RuntimeError(f"Failed to download video: {str(e)}")


def check_video_has_audio(video_path: str) -> bool:
    """
    Check if video file has an audio stream.
    
    Args:
        video_path: Path to video file
        
    Returns:
        True if video has audio stream, False otherwise
    """
    try:
        # Use ffprobe to check for audio streams
        cmd = [
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'a',
            '-show_entries', 'stream=codec_type',
            '-of', 'csv=p=0',
            video_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )
        
        # If ffprobe returns 'audio', the video has an audio stream
        return 'audio' in result.stdout.lower()
    except Exception as e:
        logger.warning(f"Could not check for audio stream: {e}")
        # Assume it has audio if we can't check
        return True


def extract_audio_to_mp3(video_path: str, audio_path: str) -> None:
    """
    Extract audio from video file and convert to MP3 using ffmpeg.
    
    Args:
        video_path: Path to input video file
        audio_path: Path to output MP3 file
        
    Raises:
        RuntimeError: If ffmpeg fails, video has no audio, or is not installed
    """
    try:
        logger.info(f"Extracting audio from video: {video_path}")
        
        # Check if video has audio stream first
        if not check_video_has_audio(video_path):
            raise RuntimeError("This video has no audio stream. The Reel may be silent or the audio is not available.")
        
        # Use ffmpeg to extract audio
        # -i: input file
        # -vn: disable video (no video stream)
        # -acodec libmp3lame: use MP3 codec
        # -q:a 2: high quality audio (0-9, lower is better)
        # -y: overwrite output file if exists
        cmd = [
            'ffmpeg',
            '-i', video_path,
            '-vn',  # No video
            '-acodec', 'libmp3lame',
            '-q:a', '2',  # High quality
            '-y',  # Overwrite output
            audio_path
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout for processing
        )
        
        if result.returncode != 0:
            error_msg = result.stderr or result.stdout or "Unknown error"
            logger.error(f"ffmpeg failed: {error_msg}")
            
            # Check for specific error: no audio stream
            if "does not contain any stream" in error_msg or "no audio streams" in error_msg.lower():
                raise RuntimeError("This video has no audio stream. The Reel may be silent or the audio is not available.")
            
            raise RuntimeError(f"Failed to extract audio: {error_msg}")
        
        # Verify output file exists and has content
        if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
            raise RuntimeError("Audio extraction failed: output file is empty")
        
        logger.info(f"Audio extracted successfully: {audio_path}")
        
    except subprocess.TimeoutExpired:
        logger.error("ffmpeg processing timed out")
        raise RuntimeError("Audio extraction timed out")
    except FileNotFoundError:
        logger.error("ffmpeg not found. Please install ffmpeg.")
        raise RuntimeError("ffmpeg is not installed. Please install ffmpeg on your system.")
    except Exception as e:
        logger.error(f"Unexpected error extracting audio: {e}")
        raise RuntimeError(f"Failed to extract audio: {str(e)}")


def download_video_with_ytdlp(video_url: str, output_path: str) -> str:
    """
    Download video using yt-dlp (handles authentication and headers automatically).

    Args:
        video_url: Video URL (can be platform URL or direct URL)
        output_path: Local file path to save video (without extension)

    Returns:
        Actual path where video was saved (yt-dlp may add extension)

    Raises:
        RuntimeError: If download fails
    """
    try:
        logger.info(f"Downloading video with yt-dlp from: {video_url[:50]}...")

        # Remove extension from output_path if present, let yt-dlp handle it
        output_base = output_path.rsplit('.', 1)[0] if '.' in output_path else output_path

        # Use yt-dlp to download the video with template that preserves our path
        cmd = [
            'yt-dlp',
            '--verbose',  # Enable verbose output to see what's happening
            '-o', f'{output_base}.%(ext)s',  # Let yt-dlp add the correct extension
            # Use mobile user agent
            '--user-agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
            # Add extractor args
            '--extractor-args', 'tiktok:api_hostname=api16-normal-c-useast1a.tiktokv.com;app_name=musical_ly;app_version=30.0.0;manifest_app_version=30.0.0;iid=7318518857994389254;device_id=7318517321748022273',
            video_url
        ]

        logger.info(f"Running yt-dlp command: {' '.join(cmd[:5])}... (URL hidden)")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120
        )

        if result.returncode != 0:
            error_msg = result.stderr or result.stdout or "Unknown error"
            logger.error(f"yt-dlp download failed: {error_msg}")
            raise RuntimeError(f"Failed to download video: {error_msg[:200]}")

        # Log yt-dlp output for debugging
        if result.stdout:
            logger.info(f"yt-dlp stdout: {result.stdout}")
        if result.stderr:
            logger.warning(f"yt-dlp stderr: {result.stderr}")

        # Find the downloaded file (yt-dlp adds extension)
        import glob
        possible_files = glob.glob(f'{output_base}.*')
        
        logger.info(f"Looking for downloaded files matching: {output_base}.*")
        logger.info(f"Found files: {possible_files}")
        
        if not possible_files:
            raise RuntimeError("Video download failed: no output file found")

        actual_path = possible_files[0]
        file_size = os.path.getsize(actual_path) if os.path.exists(actual_path) else 0
        
        logger.info(f"Downloaded file: {actual_path}, size: {file_size} bytes")
        
        if not os.path.exists(actual_path) or file_size == 0:
            raise RuntimeError("Video download failed: output file is empty")

        logger.info(f"Video downloaded successfully with yt-dlp: {actual_path}")
        return actual_path

    except subprocess.TimeoutExpired:
        logger.error("yt-dlp download timed out")
        raise RuntimeError("Video download timed out")
    except Exception as e:
        logger.error(f"Failed to download video with yt-dlp: {e}")
        raise RuntimeError(f"Failed to download video: {str(e)}")


def convert_video_file_to_audio(video_path: str) -> Tuple[bytes, str, Optional[bytes]]:
    """
    Convert an already-downloaded video into audio bytes and thumbnail bytes.
    """
    audio_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp3')
    audio_path = audio_file.name
    audio_file.close()

    try:
        extract_audio_to_mp3(video_path, audio_path)

        thumbnail_bytes = None
        try:
            thumbnail_bytes = extract_thumbnail(video_path)
        except Exception as e:
            logger.warning(f"Thumbnail extraction failed (non-fatal): {e}")
            thumbnail_bytes = None

        with open(audio_path, 'rb') as f:
            audio_bytes = f.read()

        filename = f"video_audio_{os.path.basename(audio_path)}"
        logger.info(f"Audio conversion complete. Size: {len(audio_bytes)} bytes")
        if thumbnail_bytes:
            logger.info(f"Thumbnail extracted. Size: {len(thumbnail_bytes)} bytes")

        return audio_bytes, filename, thumbnail_bytes
    finally:
        if os.path.exists(audio_path):
            try:
                os.unlink(audio_path)
            except Exception as e:
                logger.warning(f"Failed to delete temporary audio file {audio_path}: {e}")


def process_video_to_audio(video_url: str, use_ytdlp: bool = False) -> Tuple[bytes, str, Optional[bytes]]:
    """
    Download video from URL and extract audio as MP3 and thumbnail.
    """
    video_path = None

    try:
        video_file = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        temp_video_path = video_file.name
        video_file.close()

        if use_ytdlp:
            video_path = download_video_with_ytdlp(video_url, temp_video_path)
        else:
            download_video(video_url, temp_video_path)
            video_path = temp_video_path

        return convert_video_file_to_audio(video_path)

    except Exception as e:
        logger.error(f"Error processing video to audio: {e}")
        raise
    finally:
        if video_path and os.path.exists(video_path):
            try:
                os.unlink(video_path)
                logger.debug(f"Cleaned up temporary video file: {video_path}")
            except Exception as e:
                logger.warning(f"Failed to delete temporary video file {video_path}: {e}")

