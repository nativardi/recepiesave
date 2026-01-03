# Description: Facebook platform handler for validating URLs and downloading Facebook Reels videos
# Provides yt-dlp powered metadata extraction and downloads tailored for Facebook Reels

import glob
import logging
import os
import re
from typing import Dict, Optional

from yt_dlp import YoutubeDL
from yt_dlp.utils import DownloadError

from utils.platforms.base_handler import BasePlatformHandler

logger = logging.getLogger(__name__)

FACEBOOK_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


class FacebookHandler(BasePlatformHandler):
    """
    Facebook / Facebook Reels handler.

    Uses yt-dlp's Python API so that metadata extraction and downloads happen inside
    the same session, which avoids signed URL expirations and keeps headers consistent.
    """

    def validate_url(self, url: str) -> bool:
        """Check if URL matches known Facebook video/Reel patterns."""
        if not url or not isinstance(url, str):
            return False

        url = url.strip().lower()
        patterns = [
            r'facebook\.com/reel/[\w-]+',
            r'facebook\.com/reels/[\w-]+',
            r'facebook\.com/watch/\?v=\d+',
            r'fb\.watch/[\w-]+',
            r'm\.facebook\.com/story\.php',
        ]
        return any(re.search(pattern, url) for pattern in patterns)

    def extract_id(self, url: str) -> str:
        """Extract a stable identifier for logging / debugging."""
        if not self.validate_url(url):
            raise ValueError("Invalid Facebook URL. Please provide a valid Facebook Reel.")

        url = url.strip()

        match = re.search(r'facebook\.com/(?:reel|reels)/([\w-]+)', url, re.IGNORECASE)
        if match:
            return match.group(1)

        match = re.search(r'watch/\?v=(\d+)', url, re.IGNORECASE)
        if match:
            return match.group(1)

        match = re.search(r'fb\.watch/([\w-]+)', url, re.IGNORECASE)
        if match:
            return match.group(1)

        match = re.search(r'story\.php\?.*?(?:story_fbid|video_id)=(\d+)', url, re.IGNORECASE)
        if match:
            return match.group(1)

        raise ValueError("Could not extract Facebook video identifier from URL")

    def _build_ydl_opts(self, download: bool, outtmpl: Optional[str] = None) -> Dict:
        """
        Construct yt-dlp options for Facebook interactions.

        Using a helper keeps fetch_metadata and download_video consistent.
        """
        http_headers = {
            "User-Agent": FACEBOOK_USER_AGENT,
            "Referer": "https://www.facebook.com/",
            "Origin": "https://www.facebook.com",
        }

        opts = {
            "quiet": True,
            "no_warnings": False,
            "noprogress": True,
            "skip_download": not download,
            "user_agent": FACEBOOK_USER_AGENT,
            "http_headers": http_headers,
            "format": "bv*+ba/best",
        }

        if outtmpl:
            opts["outtmpl"] = outtmpl

        return opts

    def fetch_metadata(self, url: str) -> Dict:
        """Use yt-dlp to collect metadata and return a direct stream URL if available."""
        if not url:
            raise ValueError("URL cannot be empty")

        ydl_opts = self._build_ydl_opts(download=False)

        try:
            with YoutubeDL(ydl_opts) as ydl:
                logger.info(f"Fetching Facebook metadata for URL: {url}")
                info = ydl.extract_info(url, download=False)

            video_url = info.get("url")
            if not video_url and info.get("formats"):
                formats = info["formats"]
                video_audio_formats = [
                    fmt for fmt in formats
                    if fmt.get("vcodec") != "none" and fmt.get("acodec") != "none"
                ]
                if video_audio_formats:
                    video_audio_formats.sort(key=lambda x: x.get("height", 0) or 0, reverse=True)
                    video_url = video_audio_formats[0].get("url")
                    logger.info("Facebook metadata: selected format with audio stream")

            if not video_url:
                raise RuntimeError("Could not extract direct Facebook video URL")

            return {
                "video_url": video_url,
                "title": info.get("title", "Facebook Reel"),
                "duration": info.get("duration", 0),
                "uploader": info.get("uploader") or info.get("channel", "Unknown"),
                "description": info.get("description") or "",
                "thumbnail_url": info.get("thumbnail"),
                "metadata": info,
            }
        except DownloadError as exc:
            error_msg = str(exc)
            logger.error("yt-dlp failed for Facebook: %s", error_msg)
            if "login_required" in error_msg.lower():
                raise RuntimeError("Facebook requires login for this reel. Please try another URL.")
            if "Private video" in error_msg or "not available" in error_msg.lower():
                raise ValueError("This Facebook video is private or unavailable")
            raise RuntimeError(f"Failed to fetch Facebook video metadata: {error_msg}")
        except Exception as exc:
            logger.error("Unexpected error fetching Facebook metadata: %s", exc)
            raise RuntimeError(f"Failed to fetch Facebook video metadata: {exc}")

    def get_platform_name(self) -> str:
        """Return human-readable platform name."""
        return "Facebook"

    def download_video(self, url: str, output_path: str, metadata: Optional[Dict] = None) -> str:
        """
        Download Facebook Reel via yt-dlp using the same configuration as metadata fetch.

        Args:
            url: Original Facebook URL
            output_path: Desired base file path (extension selected by yt-dlp)
        """
        logger.info("FacebookHandler.download_video: starting download via yt-dlp API")

        output_base = output_path.rsplit('.', 1)[0] if '.' in output_path else output_path
        outtmpl = f"{output_base}.%(ext)s"
        ydl_opts = self._build_ydl_opts(download=True, outtmpl=outtmpl)

        try:
            with YoutubeDL(ydl_opts) as ydl:
                logger.info("FacebookHandler.download_video: invoking yt-dlp download")
                info = ydl.extract_info(url, download=True)
                target_path = ydl.prepare_filename(info)

            if not target_path or not os.path.exists(target_path):
                # Fallback search in case yt-dlp remuxed to a new extension
                candidates = glob.glob(f"{output_base}.*")
                logger.info("FacebookHandler.download_video: fallback candidates %s", candidates)
                if not candidates:
                    raise RuntimeError("Facebook download failed: no file produced")
                target_path = max(candidates, key=os.path.getmtime)

            file_size = os.path.getsize(target_path)
            logger.info("FacebookHandler.download_video: downloaded file %s (%d bytes)", target_path, file_size)

            if file_size == 0:
                raise RuntimeError("Facebook download failed: file is empty")

            return target_path
        except Exception as exc:
            logger.error("FacebookHandler.download_video: yt-dlp failed: %s", exc)
            raise RuntimeError(f"Facebook download failed: {exc}") from exc


