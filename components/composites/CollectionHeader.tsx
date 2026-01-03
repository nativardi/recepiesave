// Description: Collection header component - displays collection title, meta info, and description
// Uses Lucide SVG icons

"use client";

import { cn } from "@/lib/utils/cn";
import { ChefHat } from "lucide-react";

export interface CollectionHeaderProps {
  name: string;
  recipeCount: number;
  createdAt: string;
  description?: string;
  className?: string;
}

export function CollectionHeader({
  name,
  recipeCount,
  createdAt,
  description,
  className,
}: CollectionHeaderProps) {
  // Format date
  const createdDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className={cn("px-5 pt-2 pb-6", className)}>
      {/* Title */}
      <h1 className="text-4xl font-bold text-charcoal leading-tight pb-3">
        {name}
      </h1>

      {/* Meta */}
      <div className="flex items-center gap-2 mb-3">
        <span className="flex items-center justify-center gap-1 bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">
          <ChefHat size={14} />
          {recipeCount} {recipeCount === 1 ? "Recipe" : "Recipes"}
        </span>
        <p className="text-muted text-sm font-medium">Created {createdDate}</p>
      </div>

      {/* Description */}
      {description && (
        <p className="text-charcoal/80 text-base font-normal leading-relaxed max-w-md">
          {description}
        </p>
      )}
    </div>
  );
}






