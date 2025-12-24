// Description: Skeleton loader for recipe card - displays animated placeholder during loading

"use client";

import { cn } from "@/lib/utils/cn";

interface RecipeCardSkeletonProps {
  className?: string;
}

export function RecipeCardSkeleton({ className }: RecipeCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex flex-col bg-surface rounded-2xl p-2 shadow-sm",
        className
      )}
    >
      {/* Thumbnail skeleton */}
      <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden bg-gray-200 animate-pulse">
        {/* Video indicator placeholder */}
        <div className="absolute top-2 right-2 w-8 h-8 bg-gray-300 rounded-full" />
        {/* Cook time placeholder */}
        <div className="absolute bottom-2 left-2 w-14 h-6 bg-gray-300 rounded-full" />
      </div>

      {/* Title skeleton */}
      <div className="px-1 pt-3 pb-1 flex justify-between items-start gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
        </div>
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse shrink-0" />
      </div>
    </div>
  );
}
