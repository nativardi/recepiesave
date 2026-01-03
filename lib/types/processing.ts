// Description: TypeScript types for recipe processing states

export type ProcessingStage =
  | "downloading"
  | "transcribing"
  | "analyzing"
  | "finalizing";

export type ProcessingState =
  | { status: "idle" }
  | {
      status: "processing";
      recipeId: string;
      stage: ProcessingStage;
      progress: number;
    }
  | {
      status: "success";
      recipeId: string;
    }
  | {
      status: "error";
      message: string;
    };

export interface ProcessingStageInfo {
  stage: ProcessingStage;
  label: string;
  description: string;
  icon: string;
  duration: number; // milliseconds
}

export const PROCESSING_STAGES: Record<ProcessingStage, ProcessingStageInfo> = {
  downloading: {
    stage: "downloading",
    label: "Gathering ingredients",
    description: "Collecting your recipe from the source",
    icon: "🌿",
    duration: 1000,
  },
  transcribing: {
    stage: "transcribing",
    label: "Preparing elements",
    description: "Transcribing audio and extracting content",
    icon: "📝",
    duration: 1500,
  },
  analyzing: {
    stage: "analyzing",
    label: "Analyzing recipe",
    description: "Extracting ingredients and instructions",
    icon: "👨‍🍳",
    duration: 1500,
  },
  finalizing: {
    stage: "finalizing",
    label: "Plating your recipe",
    description: "Adding final touches",
    icon: "✨",
    duration: 500,
  },
};
