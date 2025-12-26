# Description: Platform detector module for identifying video platform from URL
# Detects Instagram, TikTok, YouTube Shorts, and Facebook Reels URLs and returns platform identifier

import re
from enum import Enum
from typing import Optional


class Platform(Enum):
    """Supported video platforms."""
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    YOUTUBE = "youtube"
    FACEBOOK = "facebook"
    UNKNOWN = "unknown"


def detect_platform(url: str) -> Platform:
    """
    Detect the platform from a video URL.
    
    Supports:
    - Instagram: instagram.com/reel/, instagram.com/reels/, instagram.com/p/
    - TikTok: tiktok.com/@user/video/, vm.tiktok.com/
    - YouTube Shorts: youtube.com/shorts/, youtu.be/ (if short video)
    - Facebook Reels: facebook.com/reel/, facebook.com/watch/, fb.watch short links
    
    Args:
        url: Video URL string
        
    Returns:
        Platform enum value (INSTAGRAM, TIKTOK, YOUTUBE, or UNKNOWN)
    """
    if not url or not isinstance(url, str):
        return Platform.UNKNOWN
    
    url = url.strip().lower()
    
    # Instagram patterns
    instagram_patterns = [
        r'instagram\.com/reel/',
        r'instagram\.com/reels/',
        r'instagram\.com/p/',  # Some reels use /p/ format
    ]
    for pattern in instagram_patterns:
        if re.search(pattern, url):
            return Platform.INSTAGRAM
    
    # TikTok patterns
    tiktok_patterns = [
        r'tiktok\.com/@[\w.-]+/video/',
        r'vm\.tiktok\.com/',
        r'vt\.tiktok\.com/',
        r'tiktok\.com/t/',
    ]
    for pattern in tiktok_patterns:
        if re.search(pattern, url):
            return Platform.TIKTOK
    
    # YouTube Shorts patterns
    youtube_patterns = [
        r'youtube\.com/shorts/',
        r'youtu\.be/',  # Short links - will need to check if it's a short
    ]
    for pattern in youtube_patterns:
        if re.search(pattern, url):
            return Platform.YOUTUBE

    # Facebook / Facebook Reels patterns
    facebook_patterns = [
        r'facebook\.com/reel/',
        r'facebook\.com/reels/',
        r'facebook\.com/watch/',
        r'fb\.watch/',
        r'm\.facebook\.com/story\.php',
    ]
    for pattern in facebook_patterns:
        if re.search(pattern, url):
            return Platform.FACEBOOK
    
    return Platform.UNKNOWN


def is_valid_platform_url(url: str, platform: Optional[Platform] = None) -> bool:
    """
    Check if URL is valid for a specific platform (or any supported platform).
    
    Args:
        url: Video URL string
        platform: Optional platform to check against. If None, checks all platforms.
        
    Returns:
        True if URL is valid for the platform(s), False otherwise
    """
    if platform is None:
        detected = detect_platform(url)
        return detected != Platform.UNKNOWN
    
    return detect_platform(url) == platform


