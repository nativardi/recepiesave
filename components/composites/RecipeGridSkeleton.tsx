// Description: Skeleton loader for recipe grid - displays grid of animated placeholders during loading

"use client";

import { RecipeCardSkeleton } from "@/components/composites/RecipeCardSkeleton";
import { cn } from "@/lib/utils/cn";

interface RecipeGridSkeletonProps {
  count?: number;
  className?: string;
}

export function RecipeGridSkeleton({
  count = 4,
  className,
}: RecipeGridSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", className)}>
      {Array.from({ length: count }).map((_, index) => (
        <RecipeCardSkeleton key={index} />
      ))}
    </div>
  );
}
