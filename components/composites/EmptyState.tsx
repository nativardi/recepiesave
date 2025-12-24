// Description: Empty state component - displays message when no content is available

"use client";

import { cn } from "@/lib/utils/cn";
import { Utensils, FolderOpen, Search } from "lucide-react";
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
  { icon: typeof Utensils; defaultTitle: string; defaultMessage: string }
> = {
  recipes: {
    icon: Utensils,
    defaultTitle: "No recipes yet",
    defaultMessage: "Start saving recipes by pasting a link from your favorite cooking videos.",
  },
  collections: {
    icon: FolderOpen,
    defaultTitle: "No cookbooks yet",
    defaultMessage: "Create your first cookbook to organize your saved recipes.",
  },
  search: {
    icon: Search,
    defaultTitle: "No results found",
    defaultMessage: "Try searching for something else or check your spelling.",
  },
  default: {
    icon: Utensils,
    defaultTitle: "Nothing here",
    defaultMessage: "There's nothing to show right now.",
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
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Icon size={32} className="text-primary" />
      </div>

      <h3 className="text-lg font-semibold text-charcoal mb-2">{displayTitle}</h3>
      <p className="text-muted text-sm max-w-xs mb-6">{displayMessage}</p>

      {(actionLabel && (actionHref || onAction)) && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium text-sm hover:bg-primary-hover transition-colors"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-full font-medium text-sm hover:bg-primary-hover transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
