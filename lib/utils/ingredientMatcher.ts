// Description: Utility to match ingredients in instruction text and format with quantities

import { Ingredient } from "@/lib/types/database";

export interface MatchedIngredient {
    ingredient: Ingredient;
    matchedText: string;
}

/**
 * Finds ingredients mentioned in instruction text using fuzzy matching.
 * Handles plurals, partial matches, and common variations.
 */
export function findIngredientsInInstruction(
    instructionText: string,
    ingredients: Ingredient[]
): MatchedIngredient[] {
    const matched: MatchedIngredient[] = [];
    const textLower = instructionText.toLowerCase();

    for (const ingredient of ingredients) {
        // Use the parsed item name if available, otherwise extract from raw_text
        const itemName = ingredient.item || extractItemName(ingredient.raw_text);
        if (!itemName) continue;

        const itemLower = itemName.toLowerCase();

        // Check for various forms of the ingredient name
        const variations = getIngredientVariations(itemLower);

        for (const variation of variations) {
            // Use word boundary matching to avoid partial word matches
            const regex = new RegExp(`\\b${escapeRegex(variation)}\\b`, "i");
            const match = textLower.match(regex);

            if (match) {
                // Check if this ingredient is already matched
                if (!matched.some((m) => m.ingredient.id === ingredient.id)) {
                    matched.push({
                        ingredient,
                        matchedText: match[0],
                    });
                }
                break;
            }
        }
    }

    return matched;
}

/**
 * Formats a quantity with its unit for display.
 * Examples: "2 cups", "1/2 tsp", "3"
 */
export function formatQuantity(ingredient: Ingredient): string {
    const parts: string[] = [];

    if (ingredient.quantity !== null && ingredient.quantity !== undefined) {
        // Format fractions nicely
        parts.push(formatNumber(ingredient.quantity));
    }

    if (ingredient.unit) {
        parts.push(ingredient.unit);
    }

    return parts.join(" ");
}

/**
 * Augments instruction text by highlighting ingredient quantities.
 * Returns React-safe segments for rendering with bold quantities.
 */
export function augmentInstructionWithQuantities(
    instructionText: string,
    matchedIngredients: MatchedIngredient[]
): { text: string; isBold: boolean }[] {
    if (matchedIngredients.length === 0) {
        return [{ text: instructionText, isBold: false }];
    }

    const segments: { text: string; isBold: boolean }[] = [];
    let remainingText = instructionText;
    let lastIndex = 0;

    // Sort matches by their position in the text
    const sortedMatches = matchedIngredients
        .map((match) => {
            const regex = new RegExp(`\\b${escapeRegex(match.matchedText)}\\b`, "i");
            const matchResult = instructionText.match(regex);
            return {
                ...match,
                index: matchResult?.index ?? -1,
            };
        })
        .filter((m) => m.index >= 0)
        .sort((a, b) => a.index - b.index);

    for (const match of sortedMatches) {
        const { ingredient, matchedText, index } = match;
        const quantity = formatQuantity(ingredient);

        if (!quantity) continue;

        // Add text before this match
        if (index > lastIndex) {
            segments.push({
                text: instructionText.slice(lastIndex, index),
                isBold: false,
            });
        }

        // Add the quantity (bold) + ingredient name
        segments.push({
            text: `${quantity} `,
            isBold: true,
        });
        segments.push({
            text: matchedText,
            isBold: false,
        });

        lastIndex = index + matchedText.length;
    }

    // Add remaining text
    if (lastIndex < instructionText.length) {
        segments.push({
            text: instructionText.slice(lastIndex),
            isBold: false,
        });
    }

    return segments.length > 0 ? segments : [{ text: instructionText, isBold: false }];
}

// Helper: Extract item name from raw_text (e.g., "2 cups flour" -> "flour")
function extractItemName(rawText: string): string {
    // Remove quantity and unit patterns from the start
    const cleaned = rawText
        .replace(/^[\d./\s]+/, "") // Remove leading numbers/fractions
        .replace(/^(cups?|tbsp?|tsp?|oz|lb|g|kg|ml|l|tablespoons?|teaspoons?|ounces?|pounds?|grams?|kilograms?|liters?|milliliters?)\s*/i, "")
        .trim();
    return cleaned;
}

// Helper: Get variations of an ingredient name (singular, plural, common forms)
function getIngredientVariations(itemName: string): string[] {
    const variations = [itemName];

    // Add singular/plural variations
    if (itemName.endsWith("s")) {
        variations.push(itemName.slice(0, -1)); // Remove 's'
    } else {
        variations.push(itemName + "s"); // Add 's'
    }

    // Handle -es plural (e.g., tomatoes -> tomato)
    if (itemName.endsWith("es")) {
        variations.push(itemName.slice(0, -2));
    }

    // Handle -ies plural (e.g., berries -> berry)
    if (itemName.endsWith("ies")) {
        variations.push(itemName.slice(0, -3) + "y");
    }

    return variations;
}

// Helper: Escape special regex characters
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Helper: Format numbers, converting decimals to fractions where sensible
function formatNumber(num: number): string {
    // Handle common fractions
    const fractions: { [key: number]: string } = {
        0.25: "¼",
        0.33: "⅓",
        0.5: "½",
        0.67: "⅔",
        0.75: "¾",
    };

    const decimal = num % 1;
    const whole = Math.floor(num);

    // Check if the decimal part matches a common fraction
    for (const [value, symbol] of Object.entries(fractions)) {
        if (Math.abs(decimal - parseFloat(value)) < 0.05) {
            return whole > 0 ? `${whole}${symbol}` : symbol;
        }
    }

    // Otherwise return the number as-is
    return num.toString();
}
