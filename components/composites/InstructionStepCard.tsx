// Description: Instruction step card component - numbered step for recipe instructions

"use client";

import { cn } from "@/lib/utils/cn";

interface InstructionStepCardProps {
  stepNumber: number;
  text: string;
  className?: string;
}

export function InstructionStepCard({
  stepNumber,
  text,
  className,
}: InstructionStepCardProps) {
  return (
    <div
      className={cn(
        "flex gap-4 rounded-lg p-4 bg-surface shadow-sm",
        className
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-white font-bold text-sm">
        {stepNumber}
      </div>
      <p className="flex-1 text-base text-charcoal leading-relaxed">{text}</p>
    </div>
  );
}
