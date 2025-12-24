// Description: Cook mode navigation controls - prev/next step buttons

"use client";

import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ArrowRight } from "lucide-react";

interface CookModeControlsProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
}

export function CookModeControls({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
}: CookModeControlsProps) {
  return (
    <div className="grid grid-cols-5 gap-4 h-20 mt-6">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label="Previous Step"
        className={cn(
          "col-span-1 flex items-center justify-center rounded-2xl bg-surface border border-gray-200 shadow-sm transition-colors",
          canGoPrevious
            ? "hover:bg-gray-50 active:bg-gray-100 text-charcoal"
            : "opacity-50 cursor-not-allowed text-muted"
        )}
        tabIndex={canGoPrevious ? 0 : -1}
      >
        <ChevronLeft size={32} />
      </button>
      <Button
        onClick={onNext}
        disabled={!canGoNext}
        variant="primary"
        size="lg"
        className="col-span-4 h-20 text-xl font-bold shadow-lg"
        tabIndex={canGoNext ? 0 : -1}
      >
        <span>Next Step</span>
        <ArrowRight size={24} className="ml-2" />
      </Button>
    </div>
  );
}
