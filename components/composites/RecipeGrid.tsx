// Description: Recipe grid component - displays recipes in a 2-column grid layout
// Used in Dashboard (library), Collection details, and Search results

"use client";

import { Recipe } from "@/lib/types/database";
import { RecipeCard } from "@/components/composites/RecipeCard";
import { EmptyState } from "@/components/composites/EmptyState";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils/cn";

export interface RecipeGridProps {
  recipes: Recipe[];
  emptyMessage?: string;
  emptyActionLabel?: string;
  emptyActionHref?: string;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

export function RecipeGrid({
  recipes,
  emptyMessage,
  emptyActionLabel,
  emptyActionHref,
  className,
}: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <EmptyState
        variant="recipes"
        message={emptyMessage}
        actionLabel={emptyActionLabel}
        actionHref={emptyActionHref}
        className={className}
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn("grid grid-cols-2 gap-4", className)}
    >
      {recipes.map((recipe) => (
        <motion.div key={recipe.id} variants={itemVariants}>
          <RecipeCard recipe={recipe} />
        </motion.div>
      ))}
    </motion.div>
  );
}



