# Description: URL parser module for validating Instagram Reel URLs and extracting Reel IDs
# Handles various Instagram URL formats and validates that the URL is a Reel

import re
from typing import Optional


def extract_reel_id(url: str) -> Optional[str]:
    """
    Extract the Reel ID (shortcode) from an Instagram Reel URL.
    
    Supports various Instagram URL formats:
    - https://www.instagram.com/reel/ABC123xyz/
    - https://instagram.com/reel/ABC123xyz/
    - https://www.instagram.com/reel/ABC123xyz
    - https://instagram.com/reel/ABC123xyz
    
    Args:
        url: Instagram Reel URL string
        
    Returns:
        Reel ID (shortcode) if valid, None otherwise
        
    Raises:
        ValueError: If URL is not a valid Instagram Reel URL
    """
    if not url or not isinstance(url, str):
        raise ValueError("URL must be a non-empty string")
    
    # Normalize URL: remove whitespace, trailing slashes, and query parameters/fragments
    url = url.strip().rstrip('/')
    # Remove query parameters and fragments (everything after ? or #)
    url = url.split('?')[0].split('#')[0].rstrip('/')
    
    # Pattern to match Instagram Reel URLs
    # Matches: instagram.com/reel/SHORTCODE, instagram.com/reels/SHORTCODE, or www.instagram.com/reel/SHORTCODE
    # Also handles URLs with query parameters (removed above)
    # Note: Instagram uses both /reel/ (singular) and /reels/ (plural) formats
    patterns = [
        r'(?:https?://)?(?:www\.)?instagram\.com/reels/([A-Za-z0-9_-]+)',  # /reels/ (plural) format
        r'(?:https?://)?(?:www\.)?instagram\.com/reel/([A-Za-z0-9_-]+)',   # /reel/ (singular) format
        r'(?:https?://)?(?:www\.)?instagram\.com/p/([A-Za-z0-9_-]+)',      # Some reels use /p/ format
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            reel_id = match.group(1)
            # Validate shortcode format (typically 11 characters, alphanumeric + underscore + hyphen)
            if reel_id and len(reel_id) >= 5:
                return reel_id
    
    raise ValueError("Invalid Instagram Reel URL. Please provide a valid Instagram Reel URL.")


def validate_reel_url(url: str) -> bool:
    """
    Validate if the provided URL is a valid Instagram Reel URL.
    
    Args:
        url: URL string to validate
        
    Returns:
        True if valid, False otherwise
    """
    try:
        extract_reel_id(url)
        return True
    except ValueError:
        return False

