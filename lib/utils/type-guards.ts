// Description: Type guards and runtime validation helpers for type safety

import { Recipe, RecipeStatus, Collection, Ingredient, Instruction, RecipeWithDetails } from "@/lib/types/database";

/**
 * Type guard to check if a value is a valid RecipeStatus
 */
export function isRecipeStatus(value: unknown): value is RecipeStatus {
  return (
    typeof value === "string" &&
    ["processing", "completed", "failed", "pending"].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid platform
 */
export function isPlatform(value: unknown): value is Recipe["platform"] {
  return (
    typeof value === "string" &&
    ["tiktok", "instagram", "youtube", "facebook"].includes(value)
  );
}

/**
 * Type guard to check if a value is a Recipe
 */
export function isRecipe(value: unknown): value is Recipe {
  if (typeof value !== "object" || value === null) return false;

  const recipe = value as Record<string, unknown>;

  return (
    typeof recipe.id === "string" &&
    typeof recipe.user_id === "string" &&
    typeof recipe.original_url === "string" &&
    isPlatform(recipe.platform) &&
    typeof recipe.title === "string" &&
    (recipe.description === null || typeof recipe.description === "string") &&
    (recipe.thumbnail_url === null || typeof recipe.thumbnail_url === "string") &&
    (recipe.video_url === null || typeof recipe.video_url === "string") &&
    (recipe.prep_time_minutes === null || typeof recipe.prep_time_minutes === "number") &&
    (recipe.cook_time_minutes === null || typeof recipe.cook_time_minutes === "number") &&
    (recipe.servings === null || typeof recipe.servings === "number") &&
    (recipe.cuisine === null || typeof recipe.cuisine === "string") &&
    isRecipeStatus(recipe.status) &&
    typeof recipe.created_at === "string"
  );
}

/**
 * Type guard to check if a value is an Ingredient
 */
export function isIngredient(value: unknown): value is Ingredient {
  if (typeof value !== "object" || value === null) return false;

  const ingredient = value as Record<string, unknown>;

  return (
    typeof ingredient.id === "string" &&
    typeof ingredient.recipe_id === "string" &&
    typeof ingredient.raw_text === "string" &&
    (ingredient.item === null || typeof ingredient.item === "string") &&
    (ingredient.quantity === null || typeof ingredient.quantity === "number") &&
    (ingredient.unit === null || typeof ingredient.unit === "string") &&
    typeof ingredient.order_index === "number"
  );
}

/**
 * Type guard to check if a value is an Instruction
 */
export function isInstruction(value: unknown): value is Instruction {
  if (typeof value !== "object" || value === null) return false;

  const instruction = value as Record<string, unknown>;

  return (
    typeof instruction.id === "string" &&
    typeof instruction.recipe_id === "string" &&
    typeof instruction.step_number === "number" &&
    typeof instruction.text === "string"
  );
}

/**
 * Type guard to check if a value is a Collection
 */
export function isCollection(value: unknown): value is Collection {
  if (typeof value !== "object" || value === null) return false;

  const collection = value as Record<string, unknown>;

  return (
    typeof collection.id === "string" &&
    typeof collection.user_id === "string" &&
    typeof collection.name === "string" &&
    (collection.description === null || typeof collection.description === "string") &&
    typeof collection.created_at === "string"
  );
}

/**
 * Type guard to check if a value is a RecipeWithDetails
 */
export function isRecipeWithDetails(value: unknown): value is RecipeWithDetails {
  if (!isRecipe(value)) return false;

  const recipe = value as Record<string, unknown>;

  return (
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.every(isIngredient) &&
    Array.isArray(recipe.instructions) &&
    recipe.instructions.every(isInstruction)
  );
}

/**
 * Type guard for non-null/undefined values
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for non-empty strings
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Type guard for valid URLs
 */
export function isValidUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard for positive numbers
 */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && value > 0 && !isNaN(value);
}

/**
 * Type guard for arrays of a specific type
 */
export function isArrayOf<T>(
  value: unknown,
  itemGuard: (item: unknown) => item is T
): value is T[] {
  return Array.isArray(value) && value.every(itemGuard);
}

/**
 * Validate recipe data and throw if invalid
 */
export function validateRecipe(value: unknown): asserts value is Recipe {
  if (!isRecipe(value)) {
    throw new Error("Invalid recipe data");
  }
}

/**
 * Validate collection data and throw if invalid
 */
export function validateCollection(value: unknown): asserts value is Collection {
  if (!isCollection(value)) {
    throw new Error("Invalid collection data");
  }
}

/**
 * Safe JSON parse with type guard
 */
export function parseJSON<T>(
  json: string,
  guard: (value: unknown) => value is T
): T | null {
  try {
    const parsed = JSON.parse(json);
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Filter array to only defined values (removes null/undefined)
 */
export function filterDefined<T>(array: (T | null | undefined)[]): T[] {
  return array.filter(isDefined);
}

/**
 * Check if value is an error object
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) return error.message;
  if (typeof error === "string") return error;
  return "An unknown error occurred";
}
