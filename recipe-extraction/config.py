"""
Configuration for recipe extraction service.
"""
import os
import sys
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env.local in project root
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_file = os.path.join(project_root, '.env.local')
if os.path.exists(env_file):
    load_dotenv(env_file)
else:
    load_dotenv()  # Try default .env

# Supabase client singleton
_supabase_client = None


def get_supabase_client():
    """Get Supabase client with service role key."""
    global _supabase_client

    if _supabase_client is None:
        from supabase import create_client

        url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

        if not url or not key:
            raise ValueError(
                "SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY must be set"
            )

        _supabase_client = create_client(url, key)

    return _supabase_client


def get_redis_url() -> str:
    """Get Redis URL from environment."""
    return os.environ.get("REDIS_URL", "redis://localhost:6379")


def get_openai_api_key() -> str:
    """Get OpenAI API key from environment."""
    key = os.environ.get("OPENAI_API_KEY")
    if not key:
        raise ValueError("OPENAI_API_KEY must be set")
    return key


def get_supabase_url() -> str:
    """Get Supabase URL from environment."""
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
    if not url:
        raise ValueError("SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL must be set")
    return url


def get_thumbnail_bucket() -> str:
    """Get thumbnail bucket name."""
    return os.environ.get("SUPABASE_THUMBNAIL_BUCKET", "recipe-thumbnails")


def get_audio_bucket() -> str:
    """Get audio bucket name."""
    return os.environ.get("SUPABASE_AUDIO_BUCKET", "recipe-audio")
