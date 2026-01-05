// Description: Recipe carousel component - horizontal scrollable list of compact recipe cards
// Used in Dashboard for Recent Saves section

"use client";

import { Recipe } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import { useQueryClient } from "@tanstack/react-query";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { ProcessingRecipeCardCompact } from "./ProcessingRecipeCardCompact";

export interface RecipeCarouselProps {
  recipes: Recipe[];
  className?: string;
}

// Generic gray placeholder for blur effect
const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

export function RecipeCarousel({ recipes, className }: RecipeCarouselProps) {
  const queryClient = useQueryClient();

  // Prefetch recipe details on hover - masks ~300ms latency
  const handlePrefetch = useCallback((recipeId: string) => {
    queryClient.prefetchQuery({
      queryKey: ["recipe", recipeId],
      queryFn: () => recipeRepository.getByIdWithDetails(recipeId),
      staleTime: 5 * 60 * 1000, // Match global staleTime
    });
  }, [queryClient]);

  if (recipes.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex overflow-x-auto scrollbar-hide px-4 gap-4",
        className
      )}
    >
      {recipes.map((recipe) => {
        // Show compact processing card for pending/processing recipes
        if (
          recipe.status === "pending" ||
          recipe.status === "processing" ||
          recipe.title === "Processing..."
        ) {
          return <ProcessingRecipeCardCompact key={recipe.id} />;
        }

        return (
          <Link
            key={recipe.id}
            href={`/recipe/${recipe.id}`}
            onMouseEnter={() => handlePrefetch(recipe.id)}
            onFocus={() => handlePrefetch(recipe.id)}
            className="flex flex-col gap-2 w-40 shrink-0 bg-surface p-2 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            {recipe.thumbnail_url && (
              <div className="relative w-full aspect-square rounded-lg overflow-hidden">
                <Image
                  src={recipe.thumbnail_url}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                  sizes="160px"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  loading="lazy"
                />
              </div>
            )}
            <div>
              <p className="text-base font-medium text-charcoal truncate">
                {recipe.title}
              </p>
              {recipe.creator_name && (
                <p className="text-sm text-muted truncate">
                  {recipe.creator_name}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
