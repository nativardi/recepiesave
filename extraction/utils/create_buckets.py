# Description: Helper script to create Supabase storage buckets
# Run this script after setting up your Supabase project
# Usage: python utils/create_buckets.py

import logging
from utils.config import config
from utils.supabase_client import get_supabase_client

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def create_buckets():
    """Create required storage buckets in Supabase."""
    try:
        client = get_supabase_client()
        
        buckets_config = [
            {
                "name": "temp-audio",
                "public": False,
                "file_size_limit": 104857600,  # 100MB in bytes
                "allowed_mime_types": ["audio/mpeg", "audio/mp3"]
            },
            {
                "name": "thumbnails",
                "public": True,
                "file_size_limit": 5242880,  # 5MB in bytes
                "allowed_mime_types": ["image/jpeg", "image/jpg", "image/png"]
            }
        ]
        
        logger.info("Creating storage buckets...")
        
        # Note: Supabase Python client doesn't directly support bucket creation
        # You'll need to create buckets via Supabase MCP or dashboard
        logger.warning(
            "Bucket creation via Python client is not directly supported. "
            "Please create buckets using one of these methods:\n"
            "1. Use Supabase Dashboard: Storage > New Bucket\n"
            "2. Use Supabase MCP: Create buckets manually\n"
        )
        
        print("\n" + "="*60)
        print("Required Storage Buckets:")
        print("="*60)
        for bucket in buckets_config:
            print(f"\nBucket: {bucket['name']}")
            print(f"  Public: {bucket['public']}")
            print(f"  File Size Limit: {bucket['file_size_limit'] / 1024 / 1024}MB")
            print(f"  Allowed MIME Types: {', '.join(bucket['allowed_mime_types'])}")
        print("="*60)
        print("\nCreate these buckets in your Supabase Dashboard:")
        print("Storage > New Bucket")
        print("="*60)
        
    except Exception as e:
        logger.error(f"Error creating buckets: {e}")
        raise


if __name__ == "__main__":
    create_buckets()

