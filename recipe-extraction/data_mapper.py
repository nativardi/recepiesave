"""
Maps AI-extracted recipe data to RecipeSave database schema.
"""
import logging
from typing import Dict, List

logger = logging.getLogger(__name__)


def map_recipe_to_database(recipe_data: Dict, recipe_id: str, user_id: str) -> Dict:
    """
    Map AI-extracted recipe data to database insert format.

    Args:
        recipe_data: Output from recipe_analyzer.extract_recipe_from_transcript()
        recipe_id: UUID string of the recipe record
        user_id: UUID string of the user who created the recipe

    Returns:
        {
            "recipe_update": {...},
            "ingredients": [...],
            "instructions": [...]
        }
    """

    # Map recipe fields
    recipe_update = {
        "title": recipe_data.get("title", "Untitled Recipe"),
        "description": recipe_data.get("description", ""),
        "prep_time_minutes": recipe_data.get("prep_time_minutes"),
        "cook_time_minutes": recipe_data.get("cook_time_minutes"),
        "servings": recipe_data.get("servings"),
        "cuisine": recipe_data.get("cuisine", "Other"),
        "status": "completed"
    }

    # Map ingredients
    ingredients = []
    for idx, ing in enumerate(recipe_data.get("ingredients", [])):
        ingredients.append({
            "recipe_id": str(recipe_id),
            "raw_text": ing.get("raw_text", ""),
            "item": ing.get("item"),
            "quantity": ing.get("quantity"),
            "unit": ing.get("unit"),
            "order_index": idx
        })

    # Map instructions
    instructions = []
    for inst in recipe_data.get("instructions", []):
        instructions.append({
            "recipe_id": str(recipe_id),
            "step_number": inst.get("step", 0),
            "text": inst.get("text", "")
        })

    logger.info(
        f"Mapped recipe data: {len(ingredients)} ingredients, "
        f"{len(instructions)} instructions"
    )

    return {
        "recipe_update": recipe_update,
        "ingredients": ingredients,
        "instructions": instructions
    }
