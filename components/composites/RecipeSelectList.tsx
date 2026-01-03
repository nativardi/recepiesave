// Description: Recipe select list component - selectable list of recipes with checkboxes
// Uses Lucide SVG icons

"use client";

import { Recipe } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import { Check } from "lucide-react";

export interface RecipeSelectListProps {
  recipes: Recipe[];
  selectedIds: Set<string>;
  onToggle: (recipeId: string) => void;
  emptyMessage?: string;
  className?: string;
}

export function RecipeSelectList({
  recipes,
  selectedIds,
  onToggle,
  emptyMessage = "No recipes available",
  className,
}: RecipeSelectListProps) {
  if (recipes.length === 0) {
    return (
      <p className={cn("text-center text-muted py-8", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {recipes.map((recipe) => {
        const isSelected = selectedIds.has(recipe.id);
        return (
          <button
            key={recipe.id}
            onClick={() => onToggle(recipe.id)}
            className={cn(
              "w-full flex items-center gap-4 p-3 rounded-xl transition-all",
              isSelected
                ? "bg-primary/10 border-2 border-primary"
                : "bg-surface shadow-sm border-2 border-transparent hover:border-gray-200"
            )}
            type="button"
          >
            {/* Thumbnail */}
            {recipe.thumbnail_url && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={recipe.thumbnail_url}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 text-left">
              <h3 className="font-medium text-charcoal">{recipe.title}</h3>
              <p className="text-sm text-muted">{recipe.cuisine || "Recipe"}</p>
            </div>

            {/* Checkbox */}
            <div
              className={cn(
                "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                isSelected
                  ? "bg-primary border-primary text-white"
                  : "border-gray-300"
              )}
            >
              {isSelected && <Check size={14} />}
            </div>
          </button>
        );
      })}
    </div>
  );
}






