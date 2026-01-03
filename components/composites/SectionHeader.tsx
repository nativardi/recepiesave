// Description: Section header component - title with optional "See All" action link
// Used in Dashboard for Recent Saves and Your Library sections

"use client";

import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function SectionHeader({
  title,
  actionLabel = "See All",
  actionHref,
  onAction,
  className,
}: SectionHeaderProps) {
  const showAction = actionHref || onAction;

  return (
    <div
      className={cn(
        "flex justify-between items-center px-4 pb-2 pt-4",
        className
      )}
    >
      <h3 className="text-xl font-bold text-charcoal font-serif">{title}</h3>
      {showAction && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="text-accent text-sm font-medium hover:underline"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="text-accent text-sm font-medium hover:underline"
              type="button"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}






