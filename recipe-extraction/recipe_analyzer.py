"""
Recipe-specific AI analyzer using GPT-4o-mini.
Extracts structured recipe data from transcripts.
"""
import json
import logging
import re
from typing import Dict, Optional
from openai import OpenAI

logger = logging.getLogger(__name__)


class NotARecipeError(Exception):
    """Raised when content is not a recipe"""
    pass


def classify_content(transcript: str) -> bool:
    """
    Quickly classify if transcript contains recipe content.
    Returns True if recipe, False otherwise.

    This is a lightweight pre-check to avoid expensive extraction
    on non-recipe content.
    """
    try:
        client = OpenAI()

        # Lightweight classification prompt
        prompt = f"""Is the following transcript from a cooking/recipe video?

Transcript:
{transcript[:1000]}  # Use first 1000 chars for speed

Respond with ONLY one word: "RECIPE" or "NOT_RECIPE"

Classification rules:
- RECIPE: Contains cooking instructions, ingredients, food preparation
- NOT_RECIPE: General food talk, restaurant reviews, eating videos, non-food content

Your response (one word only):"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a content classifier. Respond with only RECIPE or NOT_RECIPE."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,  # Deterministic
            max_tokens=10  # Just need one word
        )

        classification = response.choices[0].message.content.strip().upper()
        is_recipe = "RECIPE" in classification

        logger.info(f"Content classification: {'RECIPE' if is_recipe else 'NOT_RECIPE'}")
        return is_recipe

    except Exception as e:
        logger.warning(f"Classification failed, assuming recipe: {e}")
        return True  # Fail open - proceed if classification errors


def detect_transcript_language(text: str) -> str:
    """
    Simple language detection based on character sets.
    Returns language name for use in prompts.
    """
    # Hebrew
    if re.search(r'[\u0590-\u05FF]', text):
        return "Hebrew"
    # Arabic
    if re.search(r'[\u0600-\u06FF]', text):
        return "Arabic"
    # Chinese
    if re.search(r'[\u4E00-\u9FFF]', text):
        return "Chinese"
    # Japanese
    if re.search(r'[\u3040-\u309F\u30A0-\u30FF]', text):
        return "Japanese"
    # Korean
    if re.search(r'[\uAC00-\uD7AF]', text):
        return "Korean"
    # Cyrillic (Russian, Ukrainian, etc.)
    if re.search(r'[\u0400-\u04FF]', text):
        return "Russian"
    # Thai
    if re.search(r'[\u0E00-\u0E7F]', text):
        return "Thai"

    # Default to original language (English assumed for Latin script)
    return "the original language"


def extract_recipe_from_transcript(transcript: str, metadata: Optional[Dict] = None) -> Dict:
    """
    Extract recipe information from transcript using GPT-4o-mini.

    Args:
        transcript: Full transcript text from video
        metadata: Optional video metadata (title, description)

    Returns:
        {
            "title": str,
            "description": str,
            "ingredients": [
                {"item": str, "quantity": float, "unit": str, "raw_text": str}
            ],
            "instructions": [
                {"step": int, "text": str}
            ],
            "prep_time_minutes": int,
            "cook_time_minutes": int,
            "servings": int,
            "cuisine": str,
            "dietary_tags": [str]
        }
    """
    try:
        logger.info(f"Extracting recipe from transcript (length: {len(transcript)} chars)")

        # Step 1: Classify content - is this actually a recipe?
        if not classify_content(transcript):
            logger.warning("Content classified as NOT a recipe - aborting extraction")
            raise NotARecipeError(
                "This video does not contain recipe content. "
                "Please submit a video with cooking instructions and ingredients."
            )

        client = OpenAI()

        # Detect language from transcript
        detected_language = detect_transcript_language(transcript)
        logger.info(f"Detected transcript language: {detected_language}")

        # Build context from metadata if available
        context = ""
        if metadata:
            if metadata.get('title'):
                context += f"Video Title: {metadata['title']}\n"
            if metadata.get('description'):
                context += f"Description: {metadata['description']}\n"

        # Language preservation instruction
        language_instruction = f"""
CRITICAL - LANGUAGE PRESERVATION:
- The transcript is in {detected_language}
- Extract ALL text in {detected_language}: title, description, ingredients, instructions
- Fix any spelling or grammar errors while preserving {detected_language}
- Do NOT translate to English or any other language
- Keep ingredient names, measurements, and all text in {detected_language}
"""

        # Recipe extraction prompt
        prompt = f"""Extract recipe information from this cooking video transcript.

{context}
Transcript:
{transcript}

{language_instruction}

Please analyze the transcript and extract recipe information in JSON format with this exact structure:

{{
    "title": "Recipe name (create a descriptive title if not explicitly stated)",
    "description": "Brief 1-2 sentence description of the dish",
    "ingredients": [
        {{
            "item": "ingredient name (normalized, singular)",
            "quantity": 1.0,
            "unit": "cup",
            "raw_text": "1 cup flour"
        }}
    ],
    "instructions": [
        {{
            "step": 1,
            "text": "Detailed instruction text"
        }}
    ],
    "prep_time_minutes": 10,
    "cook_time_minutes": 20,
    "servings": 4,
    "cuisine": "Italian",
    "dietary_tags": ["vegetarian"]
}}

Guidelines:
- Extract ALL ingredients mentioned, preserving quantities and units
- If quantity/unit is unclear, set to null but include in raw_text
- Normalize ingredient names (e.g., "tomatoes" → "tomato")
- Number instructions sequentially starting from 1
- Be specific in instruction text (include timing, temperature, techniques)
- Estimate prep/cook time if not explicitly stated
- Cuisine should be one of: Italian, Mexican, Chinese, Japanese, Thai, Indian, French, American, Mediterranean, or "Other"
- Dietary tags: vegetarian, vegan, gluten-free, dairy-free, keto, paleo, etc.

Respond with ONLY valid JSON, no additional text."""

        # Call OpenAI API
        logger.info("Sending transcript to GPT-4o-mini for recipe analysis...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a multilingual culinary AI assistant specialized in extracting structured recipe data from video transcripts in any language. Preserve the original language, fix spelling errors, and always respond with valid JSON only."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,  # Lower temperature for consistent extraction
            max_tokens=2000
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

            recipe_data = json.loads(response_text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {response_text[:200]}")
            raise RuntimeError(f"Failed to parse recipe extraction response: {str(e)}")

        # Validate required fields
        required_fields = ['title', 'ingredients', 'instructions']
        for field in required_fields:
            if field not in recipe_data:
                logger.error(f"Missing required field '{field}' in AI response")
                raise ValueError(f"AI response missing required field: {field}")

        # Set defaults for optional fields
        recipe_data.setdefault('description', '')
        recipe_data.setdefault('prep_time_minutes', None)
        recipe_data.setdefault('cook_time_minutes', None)
        recipe_data.setdefault('servings', None)
        recipe_data.setdefault('cuisine', 'Other')
        recipe_data.setdefault('dietary_tags', [])

        logger.info(
            f"Recipe extraction complete. "
            f"Title: {recipe_data['title']}, "
            f"Ingredients: {len(recipe_data['ingredients'])}, "
            f"Steps: {len(recipe_data['instructions'])}"
        )

        return recipe_data

    except Exception as e:
        logger.error(f"Recipe extraction failed: {e}", exc_info=True)
        raise RuntimeError(f"Failed to extract recipe: {str(e)}")
