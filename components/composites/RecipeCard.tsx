// Description: Recipe card component - displays recipe in grid view with thumbnail, title, and cook time

"use client";

import { Recipe } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import { useToggleFavorite } from "@/lib/hooks/useToggleFavorite";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Video, Timer, Heart, Utensils } from "lucide-react";
import { memo } from "react";

interface RecipeCardProps {
  recipe: Recipe;
  className?: string;
}

function RecipeCardComponent({ recipe, className }: RecipeCardProps) {
  const toggleFavorite = useToggleFavorite();
  const { showToast } = useToast();

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

  const cookTime = getCookTime();

  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className={cn(
        "group flex flex-col bg-surface rounded-2xl p-2 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer",
        className
      )}
      aria-label={`View recipe: ${recipe.title}`}
    >
      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-gray-100">
        {recipe.thumbnail_url ? (
          <Image
            src={recipe.thumbnail_url}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
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
            "absolute top-2 left-2 rounded-full p-1.5 flex items-center justify-center shadow-sm transition-all duration-200",
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
        <div className="absolute top-2 right-2 bg-black/30 backdrop-blur-md rounded-full p-1.5 flex items-center justify-center shadow-sm">
          <Video size={18} className="text-white" />
        </div>

        {/* Cook time badge */}
        {cookTime && (
          <div className="absolute bottom-2 left-2 bg-black/30 backdrop-blur-md rounded-full px-2 py-1 flex items-center gap-1 shadow-sm">
            <Timer size={12} className="text-white" />
            <span className="text-white text-xs font-bold tracking-wide">
              {cookTime}
            </span>
          </div>
        )}
      </div>

      <div className="px-1 pt-3 pb-1">
        <h3 className="text-charcoal text-sm font-bold leading-tight line-clamp-2">
          {recipe.title}
        </h3>
      </div>
    </Link>
  );
}

// Memoize to prevent unnecessary re-renders
export const RecipeCard = memo(RecipeCardComponent);
