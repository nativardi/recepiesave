// Description: Optimized image component with lazy loading and blur placeholder

"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils/cn";

interface OptimizedImageProps extends Omit<ImageProps, "onLoad"> {
  fallback?: string;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback = "/placeholder-recipe.jpg",
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <Image
        src={error ? fallback : src}
        alt={alt}
        className={cn(
          "transition-all duration-300",
          isLoading && "blur-sm scale-105",
          className
        )}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setError(true);
          setIsLoading(false);
        }}
        {...props}
      />
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
    </div>
  );
}
