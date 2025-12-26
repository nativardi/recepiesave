# Description: Embedding generation service using OpenAI text-embedding-3-small
# Generates vector embeddings for semantic search and similarity matching

import logging
from typing import List
from openai import OpenAI
from utils.config import config
from utils.transcription_service import get_openai_client

logger = logging.getLogger(__name__)


def generate_embeddings(text: str) -> List[float]:
    """
    Generate embedding vector for text using OpenAI text-embedding-3-small.
    
    Creates a 1536-dimensional vector representation of the text
    for semantic search and similarity matching.
    
    Args:
        text: Text to generate embedding for (typically transcript + summary)
        
    Returns:
        List of floats representing the embedding vector (1536 dimensions)
    """
    try:
        logger.info(f"Generating embeddings for text (length: {len(text)} chars)")
        
        # Initialize OpenAI client
        client = get_openai_client()
        
        # Truncate text if too long (OpenAI has token limits)
        # text-embedding-3-small supports up to 8191 tokens (~32,000 chars)
        max_chars = 30000  # Leave some buffer
        if len(text) > max_chars:
            logger.warning(f"Text too long ({len(text)} chars), truncating to {max_chars} chars")
            text = text[:max_chars]
        
        # Call OpenAI Embeddings API
        logger.info("Sending text to OpenAI for embedding generation...")
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=text
        )
        
        # Extract embedding vector
        embedding_vector = response.data[0].embedding
        
        logger.info(f"Embedding generated. Vector dimension: {len(embedding_vector)}")
        
        return embedding_vector
        
    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        raise RuntimeError(f"Failed to generate embeddings: {str(e)}")


def generate_embeddings_for_content(transcript: str, summary: str) -> List[float]:
    """
    Generate embedding for audio content combining transcript and summary.
    
    Combines transcript and summary to create a comprehensive embedding
    that captures both detailed content and high-level summary.
    
    Args:
        transcript: Full transcript text
        summary: Content summary
        
    Returns:
        List of floats representing the embedding vector
    """
    try:
        # Combine transcript and summary for comprehensive embedding
        # Format: "Summary: {summary}\n\nTranscript: {transcript}"
        combined_text = f"Summary: {summary}\n\nTranscript: {transcript}"
        
        return generate_embeddings(combined_text)
        
    except Exception as e:
        logger.error(f"Failed to generate embeddings for content: {e}")
        raise RuntimeError(f"Failed to generate embeddings for content: {str(e)}")

