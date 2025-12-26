# Description: Instagram platform handler
# Wraps existing Instagram functions without modifying them to maintain backward compatibility

from typing import Dict, Optional
from utils.audio_processor import download_video as download_video_from_url
from utils.platforms.base_handler import BasePlatformHandler
from utils.platforms.instagram_utils import fetch_instagram_metadata
from utils.url_parser import extract_reel_id, validate_reel_url


class InstagramHandler(BasePlatformHandler):
    """
    Instagram platform handler.
    
    Wraps existing Instagram functions to maintain backward compatibility
    while providing unified interface for platform routing.
    """
    
    def validate_url(self, url: str) -> bool:
        """Validate Instagram Reel URL using existing function."""
        return validate_reel_url(url)
    
    def extract_id(self, url: str) -> str:
        """Extract Instagram Reel ID using existing function."""
        return extract_reel_id(url)
    
    def fetch_metadata(self, url: str) -> Dict:
        """Fetch Instagram Reel metadata using existing function."""
        return fetch_instagram_metadata(url)
    
    def get_platform_name(self) -> str:
        """Get platform name."""
        return "Instagram"

    def download_video(self, url: str, output_path: str, metadata: Optional[Dict] = None) -> str:
        """
        Instagram downloads are handled via direct CDN URLs from metadata.
        This handler fetches the CDN link and streams the download via the shared audio processor.
        """
        metadata = metadata or self.fetch_metadata(url)
        video_url = metadata.get("video_url")
        if not video_url:
            raise RuntimeError("Instagram metadata did not contain a video URL.")

        download_video_from_url(video_url, output_path)
        return output_path

