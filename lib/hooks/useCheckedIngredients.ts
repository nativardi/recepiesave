// Description: Hook for managing checked ingredients state with sessionStorage persistence

"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY_PREFIX = "recipe:checkedIngredients:";

/**
 * Hook to manage checked ingredients state with sessionStorage persistence.
 * Syncs state between recipe detail page and cook mode.
 */
export function useCheckedIngredients(recipeId: string) {
    const storageKey = `${STORAGE_KEY_PREFIX}${recipeId}`;

    // Initialize state from sessionStorage (after mount to avoid SSR mismatch)
    const [checkedIngredients, setCheckedIngredients] = useState<Set<string>>(
        new Set()
    );
    const [isInitialized, setIsInitialized] = useState(false);

    // Load from sessionStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const stored = sessionStorage.getItem(storageKey);
            if (stored) {
                const parsed = JSON.parse(stored) as string[];
                setCheckedIngredients(new Set(parsed));
            }
        } catch {
            // Ignore parsing errors, start with empty set
        }
        setIsInitialized(true);
    }, [storageKey]);

    // Persist to sessionStorage whenever state changes
    useEffect(() => {
        if (!isInitialized || typeof window === "undefined") return;

        try {
            const array = Array.from(checkedIngredients);
            sessionStorage.setItem(storageKey, JSON.stringify(array));
        } catch {
            // Ignore storage errors (quota exceeded, etc.)
        }
    }, [checkedIngredients, storageKey, isInitialized]);

    // Toggle a single ingredient
    const toggleIngredient = useCallback(
        (ingredientId: string, checked: boolean) => {
            setCheckedIngredients((prev) => {
                const next = new Set(prev);
                if (checked) {
                    next.add(ingredientId);
                } else {
                    next.delete(ingredientId);
                }
                return next;
            });
        },
        []
    );

    // Check if an ingredient is checked
    const isChecked = useCallback(
        (ingredientId: string) => checkedIngredients.has(ingredientId),
        [checkedIngredients]
    );

    // Clear all checked ingredients
    const clearAll = useCallback(() => {
        setCheckedIngredients(new Set());
    }, []);

    return {
        checkedIngredients,
        toggleIngredient,
        isChecked,
        clearAll,
        isInitialized,
    };
}
