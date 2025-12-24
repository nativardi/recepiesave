// Description: Cook Mode overlay - full-screen step-by-step cooking interface

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProgressBar } from "@/components/primitives/ProgressBar";
import { CookModeControls } from "@/components/composites/CookModeControls";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { RecipeWithDetails } from "@/lib/types/database";
import Image from "next/image";
import { Sun, X } from "lucide-react";

export default function CookModePage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    async function loadRecipe() {
      const recipeData = await recipeRepository.getByIdWithDetails(recipeId);
      setRecipe(recipeData);
    }
    loadRecipe();
  }, [recipeId]);

  if (!recipe) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted">Loading recipe...</p>
      </div>
    );
  }

  const instructions = recipe.instructions;
  const currentStep = instructions[currentStepIndex];
  const totalSteps = instructions.length;
  const progress =
    totalSteps > 0 ? ((currentStepIndex + 1) / totalSteps) * 100 : 0;

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Completed - could navigate back or show completion message
      router.push(`/recipe/${recipeId}`);
    }
  };

  const handleExit = () => {
    router.push(`/recipe/${recipeId}`);
  };

  if (instructions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-muted mb-4">
            No instructions available for this recipe.
          </p>
          <button
            onClick={handleExit}
            className="px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary-hover transition-colors"
          >
            Back to Recipe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between p-6 pt-12 pb-2 bg-background z-20">
        <div className="flex items-center gap-2 text-primary">
          <Sun size={20} />
          <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
            Screen Awake
          </span>
        </div>
        <button
          onClick={handleExit}
          className="group flex items-center gap-2 bg-surface px-4 py-2 rounded-full shadow-sm border border-gray-200 active:scale-95 transition-transform hover:bg-gray-50"
          aria-label="Exit Cook Mode"
          tabIndex={0}
        >
          <span className="text-sm font-bold text-charcoal">Exit Cook Mode</span>
          <X size={20} className="text-gray-500" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-6 pb-6 pt-4 relative z-10 overflow-y-auto">
        {/* Progress Bar */}
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold text-charcoal">
              Step {currentStepIndex + 1}{" "}
              <span className="text-muted text-lg font-medium">
                of {totalSteps}
              </span>
            </h2>
            <span className="text-primary font-medium text-sm">
              {currentStepIndex < totalSteps / 2 ? "Preparation" : "Cooking"}
            </span>
          </div>
          <ProgressBar value={progress} showLabel={false} />
        </div>

        {/* Active Instruction Card */}
        <div className="flex-1 flex flex-col justify-between">
          <div className="bg-surface rounded-2xl shadow-lg p-1 overflow-hidden flex flex-col h-full max-h-[60vh]">
            {/* Image Area (if recipe has thumbnail) */}
            {recipe.thumbnail_url && (
              <div className="relative h-48 shrink-0 w-full overflow-hidden rounded-xl bg-gray-100">
                <Image
                  src={recipe.thumbnail_url}
                  alt={recipe.title}
                  fill
                  className="object-cover"
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
            )}

            {/* Text Content */}
            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              <h3 className="text-2xl font-bold text-charcoal leading-tight">
                {currentStep.text.split(".")[0]}
              </h3>
              <p className="text-xl text-charcoal/80 leading-relaxed">
                {currentStep.text}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <CookModeControls
          currentStep={currentStepIndex + 1}
          totalSteps={totalSteps}
          onPrevious={handlePrevious}
          onNext={handleNext}
          canGoPrevious={currentStepIndex > 0}
          canGoNext={currentStepIndex < totalSteps - 1}
        />
      </main>
    </div>
  );
}
