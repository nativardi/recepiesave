// Description: Hero card component - landing page hero with background image and preview card overlay
// Uses Lucide SVG icons

"use client";

import { cn } from "@/lib/utils/cn";
import { Utensils } from "lucide-react";

export interface HeroCardTag {
  label: string;
  variant?: "primary" | "default";
}

export interface HeroCardProps {
  backgroundImage: string;
  previewTitle: string;
  previewSource: string;
  tags?: HeroCardTag[];
  className?: string;
}

export function HeroCard({
  backgroundImage,
  previewTitle,
  previewSource,
  tags = [],
  className,
}: HeroCardProps) {
  return (
    <div className={cn("w-full relative", className)}>
      <div className="aspect-[4/5] w-full bg-surface rounded-3xl shadow-sm overflow-hidden border border-gray-200 relative p-4 flex flex-col">
        <div className="w-full h-full rounded-2xl bg-primary/5 overflow-hidden relative">
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-90"
            style={{
              backgroundImage: `url("${backgroundImage}")`,
            }}
          />

          {/* Preview Card Overlay */}
          <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              {/* Icon */}
              <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0 overflow-hidden">
                <div className="w-full h-full bg-primary/20 flex items-center justify-center">
                  <Utensils size={18} className="text-primary" />
                </div>
              </div>

              {/* Title and Source */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-charcoal text-sm truncate">
                  {previewTitle}
                </p>
                <p className="text-muted text-xs">{previewSource}</p>
              </div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="flex gap-2">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className={cn(
                      "text-xs px-2 py-1 rounded-full font-medium",
                      tag.variant === "primary"
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-100 text-charcoal"
                    )}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



