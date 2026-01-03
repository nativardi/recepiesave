// Description: Modern empty state component with gradient backgrounds and illustrations
// Features: Animated icons, gradient cards, engaging micro-interactions

"use client";

import { cn } from "@/lib/utils/cn";
import { motion } from "framer-motion";
import { Utensils, FolderOpen, Search, Sparkles, ChefHat } from "lucide-react";
import Link from "next/link";

type EmptyStateVariant = "recipes" | "collections" | "search" | "default";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

const variantConfig: Record<
  EmptyStateVariant,
  { icon: typeof Utensils; defaultTitle: string; defaultMessage: string; gradient: string }
> = {
  recipes: {
    icon: ChefHat,
    defaultTitle: "Your kitchen awaits",
    defaultMessage: "Start your culinary journey by saving recipes from your favorite cooking videos.",
    gradient: "from-primary/10 via-accent/5 to-primary/10",
  },
  collections: {
    icon: FolderOpen,
    defaultTitle: "Create your first cookbook",
    defaultMessage: "Organize your recipes into beautiful collections and cookbooks.",
    gradient: "from-accent/10 via-primary/5 to-accent/10",
  },
  search: {
    icon: Search,
    defaultTitle: "No results found",
    defaultMessage: "Try a different search term or explore your saved recipes.",
    gradient: "from-stone-100 via-stone-50 to-stone-100",
  },
  default: {
    icon: Utensils,
    defaultTitle: "Nothing here yet",
    defaultMessage: "Start adding content to see it here.",
    gradient: "from-stone-100 via-white to-stone-100",
  },
};

export function EmptyState({
  variant = "default",
  title,
  message,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;
  const displayTitle = title || config.defaultTitle;
  const displayMessage = message || config.defaultMessage;

  return (
    <motion.div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Gradient card background */}
      <div
        className={cn(
          "relative max-w-sm w-full rounded-3xl p-8",
          "bg-gradient-to-br",
          config.gradient,
          "border border-stone-200/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
        )}
      >
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />

        {/* Content container */}
        <div className="relative z-10">
          {/* Animated icon with floating effect */}
          <motion.div
            className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center"
            initial={{ y: 0 }}
            animate={{ y: [-4, 4, -4] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {/* Glow background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-xl" />

            {/* Icon container */}
            <motion.div
              className="relative w-20 h-20 rounded-full bg-gradient-to-br from-white to-stone-50 flex items-center justify-center shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Icon size={36} className="text-primary" strokeWidth={1.5} />

              {/* Sparkle decoration */}
              {variant === "recipes" && (
                <motion.div
                  className="absolute -top-1 -right-1 text-accent"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring" }}
                >
                  <Sparkles size={16} fill="currentColor" />
                </motion.div>
              )}
            </motion.div>
          </motion.div>

          {/* Title */}
          <h3 className="text-xl font-bold text-charcoal mb-3">
            {displayTitle}
          </h3>

          {/* Message */}
          <p className="text-stone-600 text-sm leading-relaxed mb-6 max-w-xs mx-auto">
            {displayMessage}
          </p>

          {/* Action button */}
          {(actionLabel && (actionHref || onAction)) && (
            <>
              {actionHref ? (
                <Link href={actionHref}>
                  <motion.div
                    className={cn(
                      "inline-flex items-center gap-2 px-6 py-3",
                      "bg-gradient-to-r from-primary to-primary/90",
                      "text-white rounded-full font-semibold text-sm",
                      "shadow-lg shadow-primary/30",
                      "hover:shadow-xl hover:shadow-primary/40",
                      "transition-shadow duration-300"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Sparkles size={16} />
                    {actionLabel}
                  </motion.div>
                </Link>
              ) : (
                <motion.button
                  onClick={onAction}
                  className={cn(
                    "inline-flex items-center gap-2 px-6 py-3",
                    "bg-gradient-to-r from-primary to-primary/90",
                    "text-white rounded-full font-semibold text-sm",
                    "shadow-lg shadow-primary/30",
                    "hover:shadow-xl hover:shadow-primary/40",
                    "transition-shadow duration-300"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles size={16} />
                  {actionLabel}
                </motion.button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Subtle hint text */}
      {variant === "recipes" && !actionLabel && (
        <motion.p
          className="text-stone-400 text-xs mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Tip: Try pasting a link from TikTok, Instagram, or YouTube
        </motion.p>
      )}
    </motion.div>
  );
}
