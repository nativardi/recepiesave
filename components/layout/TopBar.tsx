// Description: Reusable top bar component that varies by screen
// Uses Lucide SVG icons for reliable rendering

"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { ArrowLeft } from "lucide-react";

import Image from "next/image";

interface TopBarProps {
  title?: string;
  logoSrc?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  className?: string;
}

export function TopBar({
  title,
  logoSrc,
  showBack = false,
  rightAction,
  className,
}: TopBarProps) {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-surface border-b border-gray-200",
        className
      )}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 flex-1">
          {showBack && (
            <button
              onClick={handleBack}
              className="p-1 -ml-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Go back"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleBack();
                }
              }}
            >
              <ArrowLeft size={24} className="text-charcoal" />
            </button>
          )}
          {logoSrc ? (
            <div className="relative h-10 w-40">
              <Image
                src={logoSrc}
                alt="App Logo"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          ) : title ? (
            <h1 className="text-lg font-semibold text-charcoal">{title}</h1>
          ) : null}
        </div>
        {rightAction && <div className="flex items-center">{rightAction}</div>}
      </div>
    </header>
  );
}
