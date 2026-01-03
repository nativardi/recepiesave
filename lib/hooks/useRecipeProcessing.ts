// Description: Hook for managing recipe processing state and progress simulation

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  ProcessingState,
  ProcessingStage,
  PROCESSING_STAGES,
} from "@/lib/types/processing";

interface UseRecipeProcessingOptions {
  onComplete?: (recipeId: string) => void;
  onError?: (error: string) => void;
}

export function useRecipeProcessing(options: UseRecipeProcessingOptions = {}) {
  const [processingState, setProcessingState] = useState<ProcessingState>({
    status: "idle",
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Start processing simulation
  const startProcessing = useCallback(
    (recipeId: string) => {
      cleanup();

      const stages: ProcessingStage[] = [
        "downloading",
        "transcribing",
        "analyzing",
        "finalizing",
      ];

      let currentStageIndex = 0;
      let stageProgress = 0;

      setProcessingState({
        status: "processing",
        recipeId,
        stage: stages[0],
        progress: 0,
      });

      // Progress interval - updates every 100ms
      intervalRef.current = setInterval(() => {
        const currentStage = stages[currentStageIndex];
        const stageDuration = PROCESSING_STAGES[currentStage].duration;
        const progressIncrement = (100 / stageDuration) * 100; // Progress per 100ms

        stageProgress += progressIncrement;

        // Calculate overall progress (0-100 across all stages)
        const stageWeight = 100 / stages.length;
        const overallProgress =
          currentStageIndex * stageWeight + (stageProgress / 100) * stageWeight;

        if (stageProgress >= 100) {
          // Move to next stage
          currentStageIndex++;
          stageProgress = 0;

          if (currentStageIndex >= stages.length) {
            // Processing complete
            cleanup();
            setProcessingState({
              status: "success",
              recipeId,
            });

            // Call onComplete callback
            if (options.onComplete) {
              options.onComplete(recipeId);
            }

            // Auto-reset to idle after success message shows
            timeoutRef.current = setTimeout(() => {
              setProcessingState({ status: "idle" });
            }, 2000);

            return;
          }

          // Update to next stage
          setProcessingState({
            status: "processing",
            recipeId,
            stage: stages[currentStageIndex],
            progress: Math.min(overallProgress, 100),
          });
        } else {
          // Update progress within current stage
          setProcessingState({
            status: "processing",
            recipeId,
            stage: stages[currentStageIndex],
            progress: Math.min(overallProgress, 100),
          });
        }
      }, 100);
    },
    [cleanup, options]
  );

  // Set error state
  const setError = useCallback(
    (message: string) => {
      cleanup();
      setProcessingState({
        status: "error",
        message,
      });

      if (options.onError) {
        options.onError(message);
      }

      // Auto-reset to idle after error message shows
      timeoutRef.current = setTimeout(() => {
        setProcessingState({ status: "idle" });
      }, 3000);
    },
    [cleanup, options]
  );

  // Reset to idle
  const reset = useCallback(() => {
    cleanup();
    setProcessingState({ status: "idle" });
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    processingState,
    startProcessing,
    setError,
    reset,
    isProcessing: processingState.status === "processing",
    isIdle: processingState.status === "idle",
    isSuccess: processingState.status === "success",
    isError: processingState.status === "error",
  };
}
