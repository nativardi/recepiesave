// Description: ListRow component - reusable row with thumbnail, title, meta, and optional right action

"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";

interface ListRowProps {
  thumbnail?: string | null;
  title: string;
  meta?: string;
  rightAction?: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ListRow({
  thumbnail,
  title,
  meta,
  rightAction,
  onClick,
  className,
}: ListRowProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-xl hover:bg-gray-50 transition-colors text-left",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        className
      )}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {thumbnail && (
        <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-charcoal truncate">{title}</h3>
        {meta && <p className="text-sm text-muted truncate">{meta}</p>}
      </div>
      {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
    </Component>
  );
}
