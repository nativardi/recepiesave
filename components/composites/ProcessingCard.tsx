// Description: Processing card component - shows extraction progress for recipes being processed

"use client";

import { ProgressBar } from "@/components/primitives/ProgressBar";
import { cn } from "@/lib/utils/cn";

interface ProcessingCardProps {
  title?: string;
  message?: string;
  progress?: number;
  className?: string;
}

export function ProcessingCard({
  title = "Sous Chef at Work...",
  message = "Extracting ingredients & instructions...",
  progress = 50,
  className,
}: ProcessingCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-6 p-6 text-center",
        className
      )}
    >
      {/* Spinner */}
      <div className="w-14 h-14 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />

      {/* Text */}
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl font-bold text-accent">{title}</h2>
        <p className="text-muted">{message}</p>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-sm">
        <ProgressBar value={progress} showLabel />
      </div>
    </div>
  );
}
