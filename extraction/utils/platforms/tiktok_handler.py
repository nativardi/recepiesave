# Description: TikTok platform handler for validating URLs and fetching video metadata
# Uses yt-dlp Python API to extract TikTok video metadata and video URLs

import re
import logging
import os
import shutil
from typing import Dict, Optional

from yt_dlp import YoutubeDL

from utils.platforms.base_handler import BasePlatformHandler

logger = logging.getLogger(__name__)


class TikTokHandler(BasePlatformHandler):
    """TikTok platform handler for video metadata extraction."""
    
    def validate_url(self, url: str) -> bool:
        """
        Validate if URL is a valid TikTok video URL.
        
        Supports:
        - https://www.tiktok.com/@username/video/ID
        - https://vm.tiktok.com/...
        - https://vt.tiktok.com/...
        - https://www.tiktok.com/t/...
        """
        if not url or not isinstance(url, str):
            return False
        
        url = url.strip().lower()
        
        patterns = [
            r'tiktok\.com/@[\w.-]+/video/\d+',
            r'vm\.tiktok\.com/[\w]+',
            r'vt\.tiktok\.com/[\w]+',
            r'tiktok\.com/t/[\w]+',
        ]
        
        for pattern in patterns:
            if re.search(pattern, url):
                return True
        
        return False
    
    def extract_id(self, url: str) -> str:
        """
        Extract TikTok video ID from URL.
        
        Args:
            url: TikTok video URL
            
        Returns:
            Video ID string
            
        Raises:
            ValueError: If URL is invalid
        """
        if not self.validate_url(url):
            raise ValueError("Invalid TikTok URL. Please provide a valid TikTok video URL.")
        
        # Extract ID from different URL formats
        url = url.strip()
        
        # Format: tiktok.com/@user/video/ID
        match = re.search(r'tiktok\.com/@[\w.-]+/video/(\d+)', url, re.IGNORECASE)
        if match:
            return match.group(1)
        
        # For short links (vm.tiktok.com, vt.tiktok.com), we'll need to resolve them
        # For now, return a placeholder - yt-dlp will handle the resolution
        match = re.search(r'(vm|vt)\.tiktok\.com/([\w]+)', url, re.IGNORECASE)
        if match:
            return match.group(2)
        
        # Format: tiktok.com/t/ID
        match = re.search(r'tiktok\.com/t/([\w]+)', url, re.IGNORECASE)
        if match:
            return match.group(1)
        
        raise ValueError("Could not extract video ID from TikTok URL")
    
    def fetch_metadata(self, url: str) -> Dict:
        """
        Fetch TikTok video metadata using yt-dlp Python API.
        
        Uses the same yt-dlp Python API as download_video for consistency.
        This ensures session context is preserved and headers are properly set.
        
        Args:
            url: TikTok video URL
            
        Returns:
            Dictionary containing video_url, title, duration, and metadata
            
        Raises:
            ValueError: If URL is invalid or video cannot be accessed
            RuntimeError: If yt-dlp fails
        """
        if not url:
            raise ValueError("URL cannot be empty")
        
        logger.info(f"Fetching TikTok metadata for URL: {url}")
        
        # Use the same yt-dlp configuration as download_video for consistency
        ydl_opts = {
            "quiet": True,
            "no_warnings": False,
            "user_agent": (
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
            ),
            "extractor_args": {
                "tiktok": [
                    "api_hostname=api16-normal-c-useast1a.tiktokv.com",
                    "app_name=musical_ly",
                    "app_version=30.0.0",
                    "manifest_app_version=30.0.0",
                    "iid=7318518857994389254",
                    "device_id=7318517321748022273",
                ]
            },
            "http_headers": {
                "Referer": "https://www.tiktok.com/",
                "Origin": "https://www.tiktok.com",
            },
        }
        
        try:
            with YoutubeDL(ydl_opts) as ydl:
                # Extract metadata without downloading
                logger.info("TikTokHandler.fetch_metadata: invoking yt-dlp extract_info")
                info = ydl.extract_info(url, download=False)
                
                if not info:
                    raise RuntimeError("yt-dlp returned no metadata for TikTok video")
                
                # Extract video URL from info
                video_url = None
                
                # First try direct URL
                if 'url' in info:
                    video_url = info['url']
                    logger.info("Found direct TikTok video URL")
                
                # If not found, search formats
                elif 'formats' in info and len(info['formats']) > 0:
                    formats = info['formats']
                    
                    # Prefer formats with both video and audio
                    video_audio_formats = [
                        f for f in formats 
                        if f.get('vcodec') != 'none' and f.get('acodec') != 'none'
                    ]
                    
                    if video_audio_formats:
                        video_audio_formats.sort(key=lambda x: x.get('height', 0) or 0, reverse=True)
                        video_url = video_audio_formats[0].get('url')
                        logger.info("Found TikTok video format with audio stream")
                    else:
                        # Fallback to video-only formats
                        video_formats = [f for f in formats if f.get('vcodec') != 'none']
                        if video_formats:
                            video_formats.sort(key=lambda x: x.get('height', 0) or 0, reverse=True)
                            video_url = video_formats[0].get('url')
                            logger.warning("TikTok video format found but may not have audio stream")
                
                if not video_url:
                    raise RuntimeError("Could not extract video URL from TikTok metadata")
                
                # Extract additional metadata
                title = info.get('title', 'TikTok Video')
                duration = info.get('duration', 0)
                
                logger.info(f"Successfully fetched TikTok metadata. Duration: {duration}s")
                
                return {
                    'video_url': video_url,
                    'title': title,
                    'duration': duration,
                    'metadata': info
                }
                
        except Exception as e:
            error_msg = str(e).lower()
            logger.error(f"TikTokHandler.fetch_metadata: yt-dlp failed: {e}")
            
            # Provide helpful error messages based on error type
            if "private" in error_msg or "not available" in error_msg:
                raise ValueError(
                    "This TikTok video is private or unavailable. "
                    "Please ensure the video is public and the URL is correct."
                )
            elif "rate limit" in error_msg or "429" in error_msg:
                raise RuntimeError(
                    "Rate limited by TikTok. Please wait a few minutes and try again."
                )
            elif "sign in" in error_msg or "login" in error_msg:
                raise ValueError(
                    "TikTok requires authentication for this content. "
                    "The tool works best with public videos."
                )
            else:
                # Generic error with original message
                raise RuntimeError(f"Failed to fetch TikTok video metadata: {str(e)}")
    
    def get_platform_name(self) -> str:
        """Get platform name."""
        return "TikTok"

    def download_video(self, url: str, output_path: str, metadata: Optional[Dict] = None) -> str:
        """
        Download TikTok video using yt-dlp Python API to preserve session context.

        Args:
            url: Original TikTok URL (e.g., https://www.tiktok.com/@user/video/ID)
            output_path: Base path to store the downloaded video (may be adjusted by handler)

        Returns:
            Actual file path written on disk
        """
        logger.info("TikTokHandler.download_video: starting download via yt-dlp API")

        # yt-dlp writes extensions automatically; strip any suffix before passing
        output_base = output_path.rsplit('.', 1)[0] if '.' in output_path else output_path

        ydl_opts = {
            "outtmpl": f"{output_base}.%(ext)s",
            "quiet": True,
            "no_warnings": False,
            "user_agent": (
                "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) "
                "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
            ),
            "extractor_args": {
                "tiktok": [
                    "api_hostname=api16-normal-c-useast1a.tiktokv.com",
                    "app_name=musical_ly",
                    "app_version=30.0.0",
                    "manifest_app_version=30.0.0",
                    "iid=7318518857994389254",
                    "device_id=7318517321748022273",
                ]
            },
            "http_headers": {
                "Referer": "https://www.tiktok.com/",
                "Origin": "https://www.tiktok.com",
            },
            # Prefer combined formats to avoid muxing complexity
            "format": "bv*+ba/best",
        }

        try:
            with YoutubeDL(ydl_opts) as ydl:
                logger.info("TikTokHandler.download_video: invoking yt-dlp extract_info (no download)")
                info = ydl.extract_info(url, download=False)

                download_url = info.get('url')
                if not download_url:
                    raise RuntimeError("TikTok download failed: extractor did not return download URL")

                ext = info.get('ext', 'mp4')
                target_path = f"{output_base}.{ext}"

                logger.info("TikTokHandler.download_video: streaming download via YoutubeDL.urlopen")
                download_stream = ydl.urlopen(download_url)
                with open(target_path, 'wb') as f:
                    shutil.copyfileobj(download_stream, f)

            file_size = os.path.getsize(target_path)
            logger.info("TikTokHandler.download_video: downloaded file %s (%d bytes)", target_path, file_size)

            if file_size == 0:
                raise RuntimeError("TikTok download failed: file is empty (blocked by TikTok?)")

            return target_path
        except Exception as exc:
            logger.error("TikTokHandler.download_video: yt-dlp failed: %s", exc)
            raise RuntimeError(f"TikTok download failed: {exc}") from exc

