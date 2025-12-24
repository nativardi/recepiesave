// Description: Collection card component - displays cookbook with thumbnail grid preview

"use client";

import { CollectionWithRecipes } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

interface CollectionCardProps {
  collection: CollectionWithRecipes;
  className?: string;
}

export function CollectionCard({ collection, className }: CollectionCardProps) {
  // Get up to 4 recipe thumbnails for the grid
  const thumbnails = collection.recipes
    .slice(0, 4)
    .map((r) => r.thumbnail_url)
    .filter((url): url is string => url !== null);

  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Link
        href={`/collections/${collection.id}`}
        className={cn(
          "group relative flex flex-col gap-3 rounded-xl bg-surface p-3 shadow-sm transition-shadow",
          className
        )}
      >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
        {thumbnails.length > 0 ? (
          <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
            {thumbnails.slice(0, 4).map((thumbnail, index) => (
              <div
                key={index}
                className="relative bg-cover bg-center"
                style={{ backgroundImage: `url(${thumbnail})` }}
              >
                <Image
                  src={thumbnail}
                  alt={`Recipe ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            ))}
            {collection.recipe_count > 4 && (
              <div className="bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                +{collection.recipe_count - 4}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <BookOpen size={32} className="text-gray-400" />
          </div>
        )}
      </div>
      <div className="flex flex-col px-1">
        <h3 className="text-base font-bold text-charcoal font-serif">
          {collection.name}
        </h3>
        <span className="text-sm text-muted">
          {collection.recipe_count}{" "}
          {collection.recipe_count === 1 ? "Recipe" : "Recipes"}
        </span>
      </div>
      </Link>
    </motion.div>
  );
}
