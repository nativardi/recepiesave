// Description: Recipe card component - displays recipe in grid view with thumbnail, title, and cook time

"use client";

import { Recipe } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import { useToggleFavorite } from "@/lib/hooks/useToggleFavorite";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Video, Timer, Heart, Utensils } from "lucide-react";
import { memo, useCallback } from "react";
import { ProcessingRecipeCard } from "./ProcessingRecipeCard";

// Generic gray placeholder for blur effect
const BLUR_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
}

function RecipeCardComponent({ recipe, className }: RecipeCardProps) {
  const toggleFavorite = useToggleFavorite();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  // Prefetch recipe details on hover - masks ~300ms latency
  const handlePrefetch = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: ["recipe", recipe.id],
      queryFn: () => recipeRepository.getByIdWithDetails(recipe.id),
      staleTime: 5 * 60 * 1000, // Match global staleTime
    });
  }, [queryClient, recipe.id]);

  const getCookTime = () => {
    if (recipe.prep_time_minutes && recipe.cook_time_minutes) {
      return `${recipe.prep_time_minutes + recipe.cook_time_minutes}M`;
    }
    if (recipe.cook_time_minutes) {
      return `${recipe.cook_time_minutes}M`;
    }
    return null;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate(
      {
        recipeId: recipe.id,
        currentValue: recipe.is_favorite,
      },
      {
        onSuccess: () => {
          showToast(
            recipe.is_favorite ? "Removed from favorites" : "Added to favorites"
          );
        },
        onError: () => {
          showToast("Failed to update favorite", "error");
        },
      }
    );
  };

  // Show premium processing card for pending/processing recipes
  if (
    recipe.status === "pending" ||
    recipe.status === "processing" ||
    recipe.title === "Processing..."
  ) {
    return <ProcessingRecipeCard className={className} />;
  }

  const cookTime = getCookTime();

  return (
    <Link
      href={`/recipe/${recipe.id}`}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
      className={cn(
        "group flex flex-col bg-surface rounded-2xl p-2 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer",
        className
      )}
      aria-label={`View recipe: ${recipe.title}`}
    >
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
        {recipe.thumbnail_url ? (
          <>
            <Image
              src={recipe.thumbnail_url}
              alt={recipe.title}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 33vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              loading="lazy"
            />
            {/* Contrast Gradients */}
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <Utensils size={32} className="text-gray-400" />
          </div>
        )}

        {/* Favorite button */}
        <motion.button
          onClick={handleFavoriteClick}
          whileTap={{ scale: 0.85 }}
          className={cn(
            "absolute top-2 left-2 rounded-full p-1.5 flex items-center justify-center shadow-sm transition-all duration-200 z-10",
            recipe.is_favorite
              ? "bg-accent text-white"
              : "bg-black/30 backdrop-blur-md text-white hover:bg-accent/80"
          )}
          aria-label={recipe.is_favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <motion.div
            animate={
              recipe.is_favorite
                ? { scale: [1, 1.4, 0.9, 1.1, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <Heart
              size={18}
              className={cn(
                "transition-colors duration-200",
                recipe.is_favorite && "fill-current"
              )}
            />
          </motion.div>
        </motion.button>

        {/* Video indicator */}
        <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-md rounded-full p-1.5 flex items-center justify-center shadow-sm z-10">
          <Video size={18} className="text-white" />
        </div>
      </div>

      <div className="px-1 pt-3 pb-1 space-y-1">
        <h3
          className="text-charcoal text-sm font-bold leading-tight line-clamp-2"
          dir="auto"
        >
          {recipe.title}
        </h3>
        {recipe.creator_name && (
          <p className="text-xs text-muted truncate">
            {recipe.creator_name}
          </p>
        )}
      </div>
    </Link>
  );
}

// Memoize to prevent unnecessary re-renders
export const RecipeCard = memo(RecipeCardComponent);
