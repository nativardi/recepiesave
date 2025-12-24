// Description: Add Recipe screen - URL paste flow to extract recipes from social media

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ProcessingCard } from "@/components/composites/ProcessingCard";
import { UrlCapture } from "@/components/composites/UrlCapture";
import { getCurrentUser } from "@/lib/auth/get-user";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { mockDataStore } from "@/lib/mocks/MockDataStore";
import { Recipe } from "@/lib/types/database";
import { User } from "lucide-react";

const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

type PageState = "input" | "processing" | "error";

// Helper to detect platform
function detectPlatform(url: string): Recipe["platform"] {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("facebook.com")) return "facebook";
  return "tiktok"; // Default
}

export default function AddRecipePage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("input");
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (url: string) => {
    if (!url) {
      setErrorMessage("Please enter a URL");
      setPageState("error");
      return;
    }

    setPageState("processing");
    setProgress(0);

    try {
      const user = await getCurrentUser();
      const platform = detectPlatform(url);

      // Create recipe with pending status
      const newRecipe = await recipeRepository.create({
        user_id: user.id,
        original_url: url,
        platform: platform,
        status: "pending",
      });

      if (isDevMode) {
        // Dev mode: Use mock processing simulation
        // Start progress animation
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 95) {
              clearInterval(progressInterval);
              return 95;
            }
            return prev + 15;
          });
        }, 500);

        // Simulate processing in background (non-blocking navigation)
        mockDataStore.simulateRecipeProcessing(newRecipe.id, url);

        // Wait for processing simulation to complete, then navigate
        setTimeout(() => {
          clearInterval(progressInterval);
          setProgress(100);
          router.push("/dashboard");
        }, 4500); // Matches total simulation time (1000 + 1500 + 1500 + buffer)
      } else {
        // Production mode: Call API route which calls external service
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 300);

        // TODO: In production, call API endpoint
        // const response = await fetch('/api/recipes/extract', {
        //   method: 'POST',
        //   body: JSON.stringify({ url }),
        //   headers: { 'Content-Type': 'application/json' },
        // });

        setTimeout(() => {
          clearInterval(progressInterval);
          setProgress(100);
          router.push("/dashboard");
        }, 2500);
      }
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setPageState("error");
    }
  };

  const handleRetry = () => {
    setPageState("input");
    setErrorMessage("");
    setProgress(0);
  };

  if (pageState === "processing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ProcessingCard progress={progress} />
      </div>
    );
  }

  return (
    <AppShell
      topBar={{
        title: "Add New Recipe",
        rightAction: (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={24} className="text-charcoal" />
          </div>
        ),
      }}
    >
      <main className="flex flex-1 flex-col justify-center px-4 py-8">
        <div className="flex w-full flex-col items-center gap-6">
          {/* Header */}
          <div className="flex w-full max-w-sm flex-col gap-2 text-center">
            <h2 className="text-4xl font-bold font-serif text-charcoal">
              Save from a link
            </h2>
            <p className="text-muted">
              Paste a link from social media to instantly save the recipe.
            </p>
          </div>

          {/* URL Capture - standalone variant */}
          <UrlCapture
            onSubmit={handleSubmit}
            variant="standalone"
            placeholder="Paste a TikTok or Instagram link..."
            buttonLabel="Extract Recipe"
            isLoading={false}
          />

          {/* Error State */}
          {pageState === "error" && errorMessage && (
            <div className="w-full max-w-sm flex flex-col gap-4">
              <p className="text-accent text-sm text-center">{errorMessage}</p>
              <Button
                type="button"
                variant="ghost"
                onClick={handleRetry}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Supported platforms */}
          <div className="flex flex-col items-center gap-2 text-muted text-sm">
            <p>Supported platforms:</p>
            <div className="flex gap-4">
              <span>TikTok</span>
              <span>Instagram</span>
              <span>YouTube</span>
              <span>Facebook</span>
            </div>
          </div>
        </div>
      </main>
    </AppShell>
  );
}
