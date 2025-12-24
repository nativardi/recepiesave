// Description: Recipe carousel component - horizontal scrollable list of compact recipe cards
// Used in Dashboard for Recent Saves section

"use client";

import { Recipe } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import Link from "next/link";

export interface RecipeCarouselProps {
  recipes: Recipe[];
  className?: string;
}

// Helper function to get platform label
const getPlatformLabel = (platform: Recipe["platform"]) => {
  const labels: Record<Recipe["platform"], string> = {
    tiktok: "From TikTok",
    instagram: "From Instagram",
    youtube: "From YouTube",
    facebook: "From Facebook",
  };
  return labels[platform] || "From Social Media";
};

export function RecipeCarousel({ recipes, className }: RecipeCarouselProps) {
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
      {recipes.map((recipe) => (
        <Link
          key={recipe.id}
          href={`/recipe/${recipe.id}`}
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
              />
            </div>
          )}
          <div>
            <p className="text-base font-medium text-charcoal truncate">
              {recipe.title}
            </p>
            <p className="text-sm text-muted">
              {getPlatformLabel(recipe.platform)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}



