# Description: AI content analysis service using GPT-4.1-mini
# Analyzes transcripts to extract summary, topics, sentiment, and category

import logging
import json
from typing import Dict, Optional, List
from openai import OpenAI
from utils.config import config
from utils.transcription_service import get_openai_client

logger = logging.getLogger(__name__)


def analyze_content(transcript: str) -> Dict:
    """
    Analyze audio transcript content using GPT-4.1-mini.
    
    Extracts:
    - Summary (1-2 sentences)
    - Key topics/tags (JSON array)
    - Sentiment (positive/neutral/negative)
    - Category (e.g., "tutorial", "entertainment", "news", "music", etc.)
    
    Args:
        transcript: Full transcript text to analyze
        
    Returns:
        Dictionary containing:
        - summary: Content summary (1-2 sentences)
        - topics: List of key topics/tags
        - sentiment: Sentiment analysis result
        - category: Content category
    """
    try:
        logger.info(f"Starting AI analysis for transcript (length: {len(transcript)} chars)")
        
        # Initialize OpenAI client
        client = get_openai_client()
        
        # Create analysis prompt
        prompt = f"""Analyze the following audio transcript and extract key information.

Transcript:
{transcript}

Please provide a JSON response with the following structure:
{{
    "summary": "A concise 1-2 sentence summary of the main content",
    "topics": ["topic1", "topic2", "topic3"],
    "sentiment": "positive|neutral|negative",
    "category": "tutorial|entertainment|news|music|education|comedy|business|technology|health|other"
}}

Guidelines:
- Summary should be 1-2 sentences capturing the main message
- Topics should be 3-7 relevant keywords or phrases
- Sentiment should reflect the overall tone (positive, neutral, or negative)
- Category should be the most appropriate content type

Respond with ONLY valid JSON, no additional text."""

        # Call OpenAI API
        logger.info("Sending transcript to GPT-4.1-mini for analysis...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Using gpt-4o-mini (latest lightweight model)
            messages=[
                {"role": "system", "content": "You are a content analysis assistant. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Lower temperature for more consistent results
            max_tokens=500
        )
        
        # Extract response
        response_text = response.choices[0].message.content.strip()
        
        # Parse JSON response
        try:
            # Remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            analysis_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {response_text}")
            raise RuntimeError(f"Failed to parse AI analysis response: {str(e)}")
        
        # Validate required fields
        required_fields = ['summary', 'topics', 'sentiment', 'category']
        for field in required_fields:
            if field not in analysis_data:
                logger.warning(f"Missing field '{field}' in AI response, using default")
                if field == 'summary':
                    analysis_data[field] = "No summary available"
                elif field == 'topics':
                    analysis_data[field] = []
                elif field == 'sentiment':
                    analysis_data[field] = "neutral"
                elif field == 'category':
                    analysis_data[field] = "other"
        
        # Validate sentiment value
        valid_sentiments = ['positive', 'neutral', 'negative']
        if analysis_data['sentiment'].lower() not in valid_sentiments:
            logger.warning(f"Invalid sentiment value: {analysis_data['sentiment']}, defaulting to neutral")
            analysis_data['sentiment'] = 'neutral'
        
        logger.info(f"AI analysis complete. Category: {analysis_data['category']}, Sentiment: {analysis_data['sentiment']}")
        
        return {
            'summary': analysis_data['summary'],
            'topics': analysis_data['topics'],
            'sentiment': analysis_data['sentiment'].lower(),
            'category': analysis_data['category'].lower()
        }
        
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        raise RuntimeError(f"Failed to analyze content: {str(e)}")

