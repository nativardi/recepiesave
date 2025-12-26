# Description: YouTube Shorts platform handler for validating URLs and fetching video metadata
# Uses yt-dlp to extract YouTube Shorts video metadata and video URLs

import re
import logging
import os
from typing import Dict, Optional

import glob

path_env = os.environ.get("PATH", "")
if "/opt/homebrew/bin" not in path_env.split(":"):
    os.environ["PATH"] = "/opt/homebrew/bin:" + path_env if path_env else "/opt/homebrew/bin"
os.environ.setdefault("YT_DLP_JS_ENGINE", "node")
from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError
from utils.platforms.base_handler import BasePlatformHandler

logger = logging.getLogger(__name__)


class YouTubeHandler(BasePlatformHandler):
    """YouTube Shorts platform handler for video metadata extraction."""
    
    def validate_url(self, url: str) -> bool:
        """
        Validate if URL is a valid YouTube Shorts URL.
        
        Supports:
        - https://www.youtube.com/shorts/VIDEO_ID
        - https://youtu.be/VIDEO_ID (will check if it's a short)
        - https://www.youtube.com/watch?v=VIDEO_ID (will check if it's a short)
        """
        if not url or not isinstance(url, str):
            return False
        
        url = url.strip().lower()
        
        patterns = [
            r'youtube\.com/shorts/[\w-]+',
            r'youtu\.be/[\w-]+',
            r'youtube\.com/watch\?v=[\w-]+',
        ]
        
        for pattern in patterns:
            if re.search(pattern, url):
                return True
        
        return False
    
    def extract_id(self, url: str) -> str:
        """
        Extract YouTube video ID from URL.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Video ID string
            
        Raises:
            ValueError: If URL is invalid
        """
        if not self.validate_url(url):
            raise ValueError("Invalid YouTube URL. Please provide a valid YouTube Shorts URL.")
        
        url = url.strip()
        
        # Format: youtube.com/shorts/ID
        match = re.search(r'youtube\.com/shorts/([\w-]+)', url, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Format: youtu.be/ID
        match = re.search(r'youtu\.be/([\w-]+)', url, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # Format: youtube.com/watch?v=ID
        match = re.search(r'youtube\.com/watch\?v=([\w-]+)', url, re.IGNORECASE)
        if match:
            return match.group(1)
        
        raise ValueError("Could not extract video ID from YouTube URL")
    
    def _is_short_video(self, metadata: Dict) -> bool:
        """
        Check if YouTube video is a Short (typically < 60 seconds).
        
        Args:
            metadata: Video metadata from yt-dlp
            
        Returns:
            True if video is a Short, False otherwise
        """
        duration = metadata.get('duration', 0)
        # YouTube Shorts are typically 60 seconds or less
        return duration > 0 and duration <= 60
    
    def fetch_metadata(self, url: str) -> Dict:
        """
        Fetch YouTube video metadata using yt-dlp Python API.
        Validates that the video is a Short (≤ 60 seconds).
        """
        if not url:
            raise ValueError("URL cannot be empty")

        ydl_opts = {
            "quiet": True,
            "no_warnings": False,
            "noprogress": True,
            "skip_download": True,
            "user_agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                logger.info(f"Fetching YouTube metadata for URL: {url}")
                info = ydl.extract_info(url, download=False)

            # Validate short duration if URL not explicitly /shorts/
            if '/shorts/' not in url.lower() and not self._is_short_video(info):
                raise ValueError("This is not a YouTube Short. Only Shorts (videos ≤ 60 seconds) are supported.")

            video_url = info.get('url')
            if not video_url and info.get('formats'):
                formats = info['formats']
                video_audio_formats = [
                    f for f in formats
                    if f.get('vcodec') != 'none' and f.get('acodec') != 'none'
                ]
                if video_audio_formats:
                    video_audio_formats.sort(key=lambda x: x.get('height', 0) or 0, reverse=True)
                    video_url = video_audio_formats[0].get('url')
                    logger.info("Found YouTube video format with audio stream")
                else:
                    video_formats = [f for f in formats if f.get('vcodec') != 'none']
                    if video_formats:
                        video_formats.sort(key=lambda x: x.get('height', 0) or 0, reverse=True)
                        video_url = video_formats[0].get('url')
                        logger.warning("YouTube format found but may not include audio")

            if not video_url:
                raise RuntimeError("Could not extract video URL from YouTube metadata")

            title = info.get('title', 'YouTube Short')
            duration = info.get('duration', 0)

            logger.info(f"Successfully fetched YouTube metadata. Duration: {duration}s")

            return {
                'video_url': video_url,
                'title': title,
                'duration': duration,
                'metadata': info
            }
        except DownloadError as exc:
            error_msg = str(exc)
            logger.error(f"yt-dlp failed for YouTube: {error_msg}")
            if "Private video" in error_msg or "not available" in error_msg.lower():
                raise ValueError("This YouTube video is private or unavailable")
            if "Shorts" in error_msg and "not available" in error_msg.lower():
                raise ValueError("Unable to access this YouTube Short. It may be region-locked or removed.")
            if "YouTube said" in error_msg and "HTTP Error 429" in error_msg:
                raise RuntimeError("Rate limited by YouTube. Please try again later.")
            raise RuntimeError(f"Failed to fetch YouTube video metadata: {error_msg}")
        except Exception as e:
            logger.error(f"Unexpected error fetching YouTube metadata: {e}")
            raise RuntimeError(f"Failed to fetch YouTube video metadata: {str(e)}")
    
    def get_platform_name(self) -> str:
        """Get platform name."""
        return "YouTube"

    def download_video(self, url: str, output_path: str, metadata: Optional[Dict] = None) -> str:
        """
        Download YouTube Shorts video using yt-dlp Python API.

        Args:
            url: Original YouTube URL
            output_path: Temporary path (without guaranteed extension)

        Returns:
            Actual downloaded file path
        """
        logger.info("YouTubeHandler.download_video: starting download via yt-dlp API")

        output_base = output_path.rsplit('.', 1)[0] if '.' in output_path else output_path

        ydl_opts = {
            "quiet": True,
            "no_warnings": False,
            "noprogress": True,
            "outtmpl": f"{output_base}.%(ext)s",
            "format": "18/best[ext=mp4]/best",
            "merge_output_format": "mp4",
            "user_agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ),
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                logger.info("YouTubeHandler.download_video: invoking yt-dlp download for Shorts")
                info = ydl.extract_info(url, download=True)
                # prepare_filename returns the remuxed filename if merge occurred
                target_path = ydl.prepare_filename(info)

            if not target_path or not os.path.exists(target_path):
                # fallback: check for files matching output_base.*
                candidates = glob.glob(f"{output_base}.*")
                logger.info("YouTubeHandler.download_video: candidates %s", candidates)
                if not candidates:
                    raise RuntimeError("YouTube download failed: no file produced")
                target_path = max(candidates, key=os.path.getmtime)

            file_size = os.path.getsize(target_path)
            logger.info("YouTubeHandler.download_video: downloaded file %s (%d bytes)", target_path, file_size)

            if file_size == 0:
                raise RuntimeError("YouTube download failed: file is empty")

            return target_path
        except Exception as exc:
            logger.error("YouTubeHandler.download_video: yt-dlp failed: %s", exc)
            raise RuntimeError(f"YouTube download failed: {exc}") from exc
