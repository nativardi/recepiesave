# Description: Abstract base class for platform-specific video handlers
# Defines unified interface that all platform handlers must implement

from abc import ABC, abstractmethod
from typing import Dict, Optional


class BasePlatformHandler(ABC):
    """
    Abstract base class for platform-specific video handlers.
    
    All platform handlers must implement these methods to ensure
    consistent behavior across different platforms.
    """
    
    @abstractmethod
    def validate_url(self, url: str) -> bool:
        """
        Validate if the URL is a valid URL for this platform.
        
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
    def get_platform_name(self) -> str:
        """
        Get the platform name.
        
        Returns:
            Platform name string (e.g., "Instagram", "TikTok", "YouTube")
        """
        pass

    @abstractmethod
    def download_video(self, url: str, output_path: str, metadata: Optional[Dict] = None) -> str:
        """
        Download the platform video to a local path.

        Args:
            url: Original platform URL (not a CDN link)
            output_path: Target file path (without extension) to write the video

        Returns:
            Actual path written on disk (handlers may add extensions)

        Raises:
            RuntimeError: If the download fails
        """
        pass

