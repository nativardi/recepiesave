# Description: Platform router for routing video download requests to appropriate platform handlers
# Maintains unified interface while delegating to platform-specific implementations

import logging
from typing import Dict

from utils.platform_detector import Platform, detect_platform
from utils.platforms.instagram_handler import InstagramHandler
from utils.platforms.tiktok_handler import TikTokHandler
from utils.platforms.youtube_handler import YouTubeHandler
from utils.platforms.facebook_handler import FacebookHandler

logger = logging.getLogger(__name__)


class PlatformRouter:
    """
    Router for handling multi-platform video downloads.
    
    Detects platform from URL and routes to appropriate handler
    while maintaining unified interface.
    """
    
    def __init__(self):
        """Initialize platform handlers."""
        self.handlers = {
            Platform.INSTAGRAM: InstagramHandler(),
            Platform.TIKTOK: TikTokHandler(),
            Platform.YOUTUBE: YouTubeHandler(),
            Platform.FACEBOOK: FacebookHandler(),
        }
    
    def get_handler(self, url: str):
        """
        Get the appropriate platform handler for a URL.
        
        Args:
            url: Video URL string
            
        Returns:
            Platform handler instance
            
        Raises:
            ValueError: If platform is not supported
        """
        platform = detect_platform(url)
        
        if platform == Platform.UNKNOWN:
            raise ValueError(
                "Unsupported platform. Please provide a URL from Instagram Reels, "
                "TikTok, YouTube Shorts, or Facebook Reels."
            )
        
        handler = self.handlers.get(platform)
        if not handler:
            raise ValueError(f"Handler not available for platform: {platform.value}")
        
        return handler
    
    def validate_url(self, url: str) -> bool:
        """
        Validate if URL is supported by any platform.
        
        Args:
            url: Video URL string
            
        Returns:
            True if URL is valid for any supported platform
        """
        try:
            handler = self.get_handler(url)
            return handler.validate_url(url)
        except ValueError:
            return False
    
    def fetch_metadata(self, url: str) -> Dict:
        """
        Fetch video metadata using appropriate platform handler.
        
        Args:
            url: Video URL string
            
        Returns:
            Dictionary containing video_url, title, duration, and metadata
            
        Raises:
            ValueError: If URL is invalid or platform is not supported
            RuntimeError: If fetching fails
        """
        handler = self.get_handler(url)
        platform_name = handler.get_platform_name()
        
        logger.info(f"Routing to {platform_name} handler for URL: {url}")
        
        # Validate URL with platform-specific handler
        if not handler.validate_url(url):
            raise ValueError(f"Invalid {platform_name} URL. Please provide a valid {platform_name} video URL.")
        
        # Fetch metadata using platform handler
        return handler.fetch_metadata(url)


