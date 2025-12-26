<!-- Description: Complete guide for implementing new platform handlers to extend platform support -->

# Platform Handler Implementation Guide

This guide explains how to add support for new video platforms (e.g., Twitter/X, Snapchat, LinkedIn) by implementing the `BasePlatformHandler` interface.

## Overview

The platform handler system provides a unified interface for downloading videos from different platforms. Each platform has unique APIs, URL formats, and authentication requirements, but they all implement the same contract.

## BasePlatformHandler Interface

Located in `utils/platforms/base_handler.py`:

```python
from abc import ABC, abstractmethod
from typing import Dict, Optional

class BasePlatformHandler(ABC):
    """Abstract base class for platform-specific video handlers."""
    
    @abstractmethod
    def validate_url(self, url: str) -> bool:
        """
        Validate if the URL is valid for this platform.
        
        Args:
            url: Video URL string
            
        Returns:
            True if URL is valid, False otherwise
        """
        pass
    
    @abstractmethod
    def extract_id(self, url: str) -> str:
        """
        Extract the video ID from the URL.
        
        Args:
            url: Video URL string
            
        Returns:
            Video ID string
            
        Raises:
            ValueError: If URL is invalid
        """
        pass
    
    @abstractmethod
    def fetch_metadata(self, url: str) -> Dict:
        """
        Fetch video metadata and extract video URL.
        
        Args:
            url: Video URL string
            
        Returns:
            Dictionary containing:
            - video_url: Direct video file URL
            - title: Video title/description
            - duration: Video duration in seconds
            - metadata: Additional platform-specific metadata
            
        Raises:
            ValueError: If URL is invalid or video cannot be accessed
            RuntimeError: If fetching fails
        """
        pass
    
    @abstractmethod
    def download_video(self, url: str, output_path: str, metadata: Optional[Dict] = None) -> str:
        """
        Download the platform video to a local path.
        
        Args:
            url: Original platform URL (not a CDN link)
            output_path: Target file path (without extension)
            metadata: Optional pre-fetched metadata to avoid re-fetching
        
        Returns:
            Actual path written on disk (handlers may add extensions)
        
        Raises:
            RuntimeError: If the download fails
        """
        pass
    
    @abstractmethod
    def get_platform_name(self) -> str:
        """
        Get the platform name.
        
        Returns:
            Platform name string (e.g., "Instagram", "TikTok", "YouTube")
        """
        pass
```

## Step-by-Step Implementation

### 1. Create Handler File

Create a new file in `utils/platforms/` (e.g., `twitter_handler.py`):

```python
# Description: Twitter/X platform handler for video downloads
# Supports Twitter video URLs and embedded videos

import re
import logging
from typing import Dict, Optional
from utils.platforms.base_handler import BasePlatformHandler

logger = logging.getLogger(__name__)


class TwitterHandler(BasePlatformHandler):
    """Twitter/X platform handler for video metadata extraction."""
    
    def validate_url(self, url: str) -> bool:
        """Validate if URL is a valid Twitter/X video URL."""
        if not url or not isinstance(url, str):
            return False
        
        url = url.strip().lower()
        
        # Support both twitter.com and x.com domains
        patterns = [
            r'twitter\.com/.+/status/\d+',
            r'x\.com/.+/status/\d+',
        ]
        
        for pattern in patterns:
            if re.search(pattern, url):
                return True
        
        return False
    
    def extract_id(self, url: str) -> str:
        """Extract tweet ID from URL."""
        if not self.validate_url(url):
            raise ValueError("Invalid Twitter URL")
        
        # Extract ID from /status/ID format
        match = re.search(r'/status/(\d+)', url, re.IGNORECASE)
        if match:
            return match.group(1)
        
        raise ValueError("Could not extract tweet ID from URL")
    
    def fetch_metadata(self, url: str) -> Dict:
        """
        Fetch Twitter video metadata.
        
        This would typically use Twitter API v2 or a library like tweepy.
        For demonstration, showing the structure.
        """
        if not url:
            raise ValueError("URL cannot be empty")
        
        try:
            # Example: Using Twitter API or yt-dlp
            # In production, use proper Twitter API authentication
            
            # Placeholder implementation
            metadata = {
                'video_url': 'https://video.twimg.com/...',  # Direct video URL
                'title': 'Tweet text content',
                'duration': 30,
                'metadata': {
                    'author': 'username',
                    'likes': 1000,
                    'retweets': 500,
                }
            }
            
            logger.info(f"Fetched Twitter metadata. Duration: {metadata['duration']}s")
            return metadata
            
        except Exception as e:
            logger.error(f"Failed to fetch Twitter metadata: {e}")
            raise RuntimeError(f"Failed to fetch Twitter video metadata: {str(e)}")
    
    def download_video(self, url: str, output_path: str, metadata: Optional[Dict] = None) -> str:
        """
        Download Twitter video.
        
        Can use pre-fetched metadata to avoid API calls.
        """
        logger.info("TwitterHandler.download_video: starting download")
        
        # If metadata not provided, fetch it
        if not metadata:
            metadata = self.fetch_metadata(url)
        
        video_url = metadata['video_url']
        
        # Use shared audio_processor download utility
        from utils.audio_processor import download_video
        
        output_file = f"{output_path}.mp4"
        download_video(video_url, output_file)
        
        logger.info(f"Twitter video downloaded: {output_file}")
        return output_file
    
    def get_platform_name(self) -> str:
        """Get platform name."""
        return "Twitter"
```

### 2. Add Platform Enum

Update `utils/platform_detector.py`:

```python
from enum import Enum

class Platform(str, Enum):
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    FACEBOOK = "facebook"
    TWITTER = "twitter"  # Add new platform
    UNKNOWN = "unknown"


def detect_platform(url: str) -> Platform:
    """Detect platform from URL."""
    if not url:
        return Platform.UNKNOWN
    
    url_lower = url.lower()
    
    # Instagram
    if 'instagram.com' in url_lower and ('/reel/' in url_lower or '/reels/' in url_lower):
        return Platform.INSTAGRAM
    
    # TikTok
    if 'tiktok.com' in url_lower or 'vm.tiktok.com' in url_lower or 'vt.tiktok.com' in url_lower:
        return Platform.TIKTOK
    
    # YouTube
    if 'youtube.com/shorts' in url_lower or 'youtu.be' in url_lower:
        return Platform.YOUTUBE
    
    # Facebook
    if 'facebook.com' in url_lower or 'fb.watch' in url_lower:
        return Platform.FACEBOOK
    
    # Twitter/X
    if ('twitter.com' in url_lower or 'x.com' in url_lower) and '/status/' in url_lower:
        return Platform.TWITTER
    
    return Platform.UNKNOWN
```

### 3. Register in Router

Update `utils/platform_router.py`:

```python
from utils.platforms.twitter_handler import TwitterHandler

class PlatformRouter:
    """Router for handling multi-platform video downloads."""
    
    def __init__(self):
        """Initialize platform handlers."""
        self.handlers = {
            Platform.INSTAGRAM: InstagramHandler(),
            Platform.TIKTOK: TikTokHandler(),
            Platform.YOUTUBE: YouTubeHandler(),
            Platform.FACEBOOK: FacebookHandler(),
            Platform.TWITTER: TwitterHandler(),  # Register new handler
        }
```

### 4. Test Your Handler

Create tests in `test_pipeline.py` or a new test file:

```python
def test_twitter_handler():
    """Test Twitter handler implementation."""
    handler = TwitterHandler()
    
    # Test URL validation
    assert handler.validate_url("https://twitter.com/user/status/123456")
    assert handler.validate_url("https://x.com/user/status/123456")
    assert not handler.validate_url("https://example.com")
    
    # Test ID extraction
    tweet_id = handler.extract_id("https://twitter.com/user/status/123456")
    assert tweet_id == "123456"
    
    # Test metadata fetching (requires API credentials)
    # metadata = handler.fetch_metadata("https://twitter.com/user/status/123456")
    # assert 'video_url' in metadata
    # assert 'title' in metadata
```

## Common Patterns & Best Practices

### Pattern 1: Using yt-dlp Python API (Recommended)

**Important:** Always use the yt-dlp Python API, not CLI subprocess. This ensures session context is preserved and provides better error handling.

Many platforms can be handled by yt-dlp:

```python
def fetch_metadata(self, url: str) -> Dict:
    """Fetch metadata using yt-dlp Python API."""
    from yt_dlp import YoutubeDL
    
    ydl_opts = {
        "quiet": True,
        "no_warnings": False,
        # Add platform-specific options if needed
        # "user_agent": "Mozilla/5.0 ...",
        # "extractor_args": {"platform": [...]},
    }
    
    try:
        with YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if not info:
                raise RuntimeError("yt-dlp returned no metadata")
            
            # Extract video URL
            video_url = info.get('url')
            if not video_url and 'formats' in info:
                # Prefer formats with both video and audio
                formats = info['formats']
                video_audio_formats = [
                    f for f in formats 
                    if f.get('vcodec') != 'none' and f.get('acodec') != 'none'
                ]
                if video_audio_formats:
                    video_audio_formats.sort(key=lambda x: x.get('height', 0) or 0, reverse=True)
                    video_url = video_audio_formats[0].get('url')
            
            if not video_url:
                raise RuntimeError("Could not extract video URL from metadata")
            
            return {
                'video_url': video_url,
                'title': info.get('title', 'Video'),
                'duration': info.get('duration', 0),
                'metadata': info
            }
    except Exception as e:
        raise RuntimeError(f"Failed to fetch metadata: {str(e)}")
```

**Why Python API over CLI?**
- Session context preserved across calls
- Better error handling and control
- No subprocess overhead
- Consistent with `download_video()` method

### Pattern 2: Using Platform APIs

For platforms with official APIs:

```python
def fetch_metadata(self, url: str) -> Dict:
    """Fetch metadata using platform API."""
    import requests
    from utils.config import config
    
    video_id = self.extract_id(url)
    
    # Example: Platform API call
    response = requests.get(
        f"https://api.platform.com/v1/videos/{video_id}",
        headers={
            'Authorization': f'Bearer {config.PLATFORM_API_KEY}',
            'Accept': 'application/json'
        },
        timeout=30
    )
    
    response.raise_for_status()
    data = response.json()
    
    return {
        'video_url': data['video_url'],
        'title': data['title'],
        'duration': data['duration_seconds'],
        'metadata': data
    }
```

### Pattern 3: Direct CDN Download (Instagram-style)

If the platform provides direct video URLs:

```python
def download_video(self, url: str, output_path: str, metadata: Optional[Dict] = None) -> str:
    """Download via CDN URL."""
    from utils.audio_processor import download_video
    
    if not metadata:
        metadata = self.fetch_metadata(url)
    
    video_url = metadata['video_url']
    output_file = f"{output_path}.mp4"
    
    # Use shared download utility with platform-specific headers
    download_video(video_url, output_file)
    
    return output_file
```

### Pattern 4: Session-Based Download (TikTok/YouTube-style)

For platforms requiring session management, use the same yt-dlp Python API configuration in both `fetch_metadata()` and `download_video()`:

```python
def download_video(self, url: str, output_path: str, metadata: Optional[Dict] = None) -> str:
    """Download using yt-dlp with session preservation."""
    from yt_dlp import YoutubeDL
    
    output_base = output_path.rsplit('.', 1)[0] if '.' in output_path else output_path
    
    # Use same configuration as fetch_metadata() for consistency
    ydl_opts = {
        'outtmpl': f'{output_base}.%(ext)s',
        'quiet': True,
        'format': 'bv*+ba/best',  # Prefer combined formats
        # Add same headers/user-agent as fetch_metadata()
    }
    
    with YoutubeDL(ydl_opts) as ydl:
        # If metadata already fetched, can reuse it
        if metadata:
            download_url = metadata.get('video_url')
            if download_url:
                download_stream = ydl.urlopen(download_url)
                target_path = f"{output_base}.{metadata.get('ext', 'mp4')}"
                with open(target_path, 'wb') as f:
                    import shutil
                    shutil.copyfileobj(download_stream, f)
                return target_path
        
        # Otherwise, let yt-dlp handle the download
        info = ydl.extract_info(url, download=True)
        target_path = ydl.prepare_filename(info)
    
    return target_path
```

**Best Practice:** Keep `fetch_metadata()` and `download_video()` configuration consistent to preserve session context.

## Troubleshooting

### Common Issues

**Issue: "Handler not found"**
- Check that handler is registered in `PlatformRouter.__init__`
- Verify platform enum exists in `Platform`

**Issue: "Video URL extraction fails"**
- Add logging to see yt-dlp or API responses
- Check if platform changed their API/HTML structure
- Verify authentication/headers are correct

**Issue: "Download fails with 403/429"**
- Platform may be rate-limiting
- Add appropriate user-agent headers
- Consider implementing retry logic

**Issue: "Metadata incomplete"**
- Platform APIs vary in what they return
- Provide sensible defaults for missing fields
- Document any platform-specific limitations

## Examples in Codebase

Study these existing handlers as references:

- **InstagramHandler** (`utils/platforms/instagram_handler.py`) - CDN-based download, uses yt-dlp Python API for metadata
- **TikTokHandler** (`utils/platforms/tiktok_handler.py`) - yt-dlp Python API for both metadata and download (consistent session)
- **YouTubeHandler** (`utils/platforms/youtube_handler.py`) - yt-dlp Python API with validation

**Note:** All handlers use the yt-dlp Python API (not CLI subprocess) for consistency and reliability.

## Checklist

Before submitting a new handler:

- [ ] Implements all 5 abstract methods
- [ ] Handles errors gracefully (ValueError for invalid URLs, RuntimeError for failures)
- [ ] Logs appropriate messages at INFO and ERROR levels
- [ ] Added to `Platform` enum
- [ ] Registered in `PlatformRouter`
- [ ] URL validation covers all common URL formats
- [ ] Returns consistent metadata structure
- [ ] Tested with real URLs (if possible)
- [ ] Documented any platform-specific requirements (API keys, rate limits)
- [ ] Added comments explaining any non-obvious logic

