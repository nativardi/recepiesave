# Description: Instagram-specific helper utilities shared by platform handlers
# Provides metadata extraction via yt-dlp for Instagram Reels without downloads

import json
import logging
import subprocess
from typing import Dict

logger = logging.getLogger(__name__)


def fetch_instagram_metadata(url: str) -> Dict:
    """
    Fetch Instagram Reel metadata using yt-dlp.

    Uses yt-dlp to extract video URL and metadata without downloading the video.
    Handles errors and rate limiting from Instagram.

    Args:
        url: Instagram Reel URL

    Returns:
        Dictionary containing:
        - video_url: Direct video file URL
        - title: Reel title/description
        - duration: Video duration in seconds
        - metadata: Additional metadata from Instagram

    Raises:
        ValueError: If URL is invalid or reel cannot be accessed
        RuntimeError: If yt-dlp fails or Instagram blocks the request
    """
    if not url:
        raise ValueError("URL cannot be empty")

    # Normalize URL: Convert /reels/ to /reel/ for yt-dlp compatibility
    url = url.replace('/reels/', '/reel/')

    try:
        cmd = [
            'yt-dlp',
            '--dump-json',
            '--no-warnings',
            '--quiet',
            '--user-agent',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
            '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            '--extractor-args',
            'instagram:skip_auth_warning=True',
            url
        ]

        logger.info(f"Fetching Instagram metadata for URL: {url}")

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=30
        )

        if result.returncode != 0:
            error_msg = result.stderr or result.stdout or "Unknown error"
            logger.error(f"yt-dlp failed: {error_msg}")

            lowered = error_msg.lower()
            if "private video" in error_msg or "sign in" in error_msg or "login required" in lowered:
                raise ValueError(
                    "This Reel requires authentication. Instagram may require you to be logged in to access this content."
                )
            if "video unavailable" in error_msg or "not found" in lowered or "not available" in lowered:
                raise ValueError("Reel not found or unavailable. The content might be deleted or private.")
            if "rate limit" in lowered or "429" in error_msg or "rate-limit" in lowered:
                raise RuntimeError("Rate limited by Instagram. Please wait and try again.")
            if "cookies" in lowered or "credentials" in lowered:
                raise ValueError(
                    "Instagram requires authentication for this content. The tool works best with public Reels."
                )

            raise RuntimeError(
                "Failed to fetch Reel. Instagram may be blocking requests or the content is not accessible."
            )

        try:
            metadata = json.loads(result.stdout)
        except json.JSONDecodeError as parse_error:
            logger.error(f"Failed to parse yt-dlp JSON output: {parse_error}")
            raise RuntimeError("Failed to parse Instagram metadata") from parse_error

        video_url = metadata.get('url')

        if not video_url and metadata.get('formats'):
            formats = metadata['formats']
            video_audio_formats = [
                fmt for fmt in formats if fmt.get('vcodec') != 'none' and fmt.get('acodec') != 'none'
            ]

            if video_audio_formats:
                video_audio_formats.sort(key=lambda fmt: fmt.get('height', 0) or 0, reverse=True)
                video_url = video_audio_formats[0].get('url')
                logger.info("Found Instagram format with audio stream")
            else:
                video_formats = [fmt for fmt in formats if fmt.get('vcodec') != 'none']
                if video_formats:
                    video_formats.sort(key=lambda fmt: fmt.get('height', 0) or 0, reverse=True)
                    video_url = video_formats[0].get('url')
                    logger.warning("Instagram format found without audio stream")

        if not video_url:
            raise RuntimeError("Could not extract video URL from Instagram metadata")

        title = metadata.get('title', 'Instagram Reel')
        duration = metadata.get('duration', 0)

        logger.info(f"Instagram metadata fetched. Duration: {duration}s")

        return {
            'video_url': video_url,
            'title': title,
            'duration': duration,
            'metadata': metadata
        }

    except subprocess.TimeoutExpired:
        logger.error("yt-dlp request timed out")
        raise RuntimeError("Request timed out. Instagram may be slow or unreachable.")
    except FileNotFoundError:
        logger.error("yt-dlp not found. Please install yt-dlp.")
        raise RuntimeError("yt-dlp is not installed. Please install it: pip install yt-dlp")
    except Exception as error:
        logger.error(f"Unexpected error fetching Instagram metadata: {error}")
        raise RuntimeError(f"Failed to fetch Reel metadata: {error}") from error

