# Description: Configuration management module
# Loads and validates environment variables for the Audio Processing Pipeline
# Provides centralized configuration access throughout the application

import os
from typing import Optional
from dotenv import load_dotenv
import logging

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)


class Config:
    """
    Configuration class for Audio Processing Pipeline.
    
    Loads and validates all required environment variables.
    Provides type-safe access to configuration values.
    """
    
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str
    SUPABASE_AUDIO_BUCKET: str
    SUPABASE_THUMBNAIL_BUCKET: str
    
    # OpenAI Configuration
    OPENAI_API_KEY: str
    
    # Redis Configuration
    REDIS_URL: str
    
    # Flask Configuration
    FLASK_ENV: str = "development"
    FLASK_DEBUG: bool = False
    
    def __init__(self):
        """Initialize configuration by loading environment variables."""
        # Supabase Configuration
        self.SUPABASE_URL = self._get_required_env("SUPABASE_URL")
        self.SUPABASE_ANON_KEY = self._get_required_env("SUPABASE_ANON_KEY")
        self.SUPABASE_SERVICE_ROLE_KEY = self._get_required_env("SUPABASE_SERVICE_ROLE_KEY")
        self.SUPABASE_AUDIO_BUCKET = self._get_optional_env("SUPABASE_AUDIO_BUCKET", "temp-audio")
        self.SUPABASE_THUMBNAIL_BUCKET = self._get_optional_env("SUPABASE_THUMBNAIL_BUCKET", "thumbnails")
        
        # OpenAI Configuration
        self.OPENAI_API_KEY = self._get_required_env("OPENAI_API_KEY")
        
        # Redis Configuration
        self.REDIS_URL = self._get_optional_env("REDIS_URL", "redis://localhost:6379/0")
        
        # Flask Configuration
        self.FLASK_ENV = self._get_optional_env("FLASK_ENV", "development")
        flask_debug_str = self._get_optional_env("FLASK_DEBUG", "False")
        self.FLASK_DEBUG = flask_debug_str.lower() in ("true", "1", "yes")
        
        # Validate configuration
        self._validate()
        
        logger.info("Configuration loaded successfully")
    
    def _get_required_env(self, key: str) -> str:
        """
        Get required environment variable.
        
        Args:
            key: Environment variable name
            
        Returns:
            Environment variable value
            
        Raises:
            ValueError: If environment variable is not set
        """
        value = os.getenv(key)
        if not value:
            raise ValueError(
                f"Required environment variable '{key}' is not set. "
                f"Please check your .env file or environment variables."
            )
        return value
    
    def _get_optional_env(self, key: str, default: str) -> str:
        """
        Get optional environment variable with default value.
        
        Args:
            key: Environment variable name
            default: Default value if not set
            
        Returns:
            Environment variable value or default
        """
        return os.getenv(key, default)
    
    def _validate(self) -> None:
        """
        Validate configuration values.
        
        Raises:
            ValueError: If configuration is invalid
        """
        # Validate Supabase URL format
        if not self.SUPABASE_URL.startswith("https://"):
            raise ValueError("SUPABASE_URL must start with https://")
        
        # Validate Redis URL format
        if not self.REDIS_URL.startswith(("redis://", "rediss://")):
            logger.warning(
                f"REDIS_URL '{self.REDIS_URL}' doesn't start with redis:// or rediss://. "
                f"Using as-is, but this may cause connection issues."
            )
        
        logger.debug("Configuration validation passed")


# Create singleton instance
config = Config()

