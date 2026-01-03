// Description: Add Recipe screen - URL paste flow to extract recipes from social media

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProcessingCard } from "@/components/composites/ProcessingCard";
import { getCurrentUser } from "@/lib/auth/get-user";
import { RecipeRepository } from "@/lib/repositories/RecipeRepository";
import { mockDataStore } from "@/lib/mocks/MockDataStore";

type PageState = "input" | "processing" | "error";

export default function AddRecipePage() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [pageState, setPageState] = useState<PageState>("input");
  const [errorMessage, setErrorMessage] = useState("");
  const [progress, setProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!urlInput.trim()) {
      setErrorMessage("Please enter a URL");
      setPageState("error");
      return;
    }

    setPageState("processing");
    setProgress(0);

    let progressInterval: NodeJS.Timeout | null = null;
    let navigationTimeout: NodeJS.Timeout | null = null;
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

    try {
      const user = await getCurrentUser();

      // Handle dev mode with MockDataStore
      if (isDevMode) {
        const recipeRepo = new RecipeRepository();

        // Detect platform from URL
        let platform: "tiktok" | "instagram" | "youtube" | "facebook" | null = null;
        const urlLower = urlInput.toLowerCase();
        if (urlLower.includes("tiktok.com") || urlLower.includes("vm.tiktok.com")) {
          platform = "tiktok";
        } else if (urlLower.includes("instagram.com")) {
          platform = "instagram";
        } else if (urlLower.includes("youtube.com") || urlLower.includes("youtu.be")) {
          platform = "youtube";
        } else if (urlLower.includes("facebook.com") || urlLower.includes("fb.watch")) {
          platform = "facebook";
        }

        if (!platform) {
          setErrorMessage("Unsupported platform. Only TikTok, Instagram, YouTube, and Facebook are supported.");
          setPageState("error");
          return;
        }

        // Create recipe in MockDataStore
        const recipe = await recipeRepo.create({
          user_id: user.id,
          original_url: urlInput.trim(),
          platform,
        });

        // Start simulated processing asynchronously
        mockDataStore.simulateRecipeProcessing(recipe.id, urlInput.trim());

        // Simulate progress UI
        progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              if (progressInterval) clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 500);

        // Navigate after simulated processing completes (~4 seconds)
        navigationTimeout = setTimeout(() => {
          if (progressInterval) clearInterval(progressInterval);
          setProgress(100);
          router.push("/dashboard");
        }, 4500);

        return;
      }

      // Production mode: use API endpoint
      const response = await fetch("/api/recipes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: urlInput.trim(),
          user_id: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to extract recipe");
        setPageState("error");
        return;
      }

      // Simulate progress
      progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            if (progressInterval) clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Wait a bit then navigate to dashboard
      navigationTimeout = setTimeout(() => {
        if (progressInterval) clearInterval(progressInterval);
        setProgress(100);
        router.push("/dashboard");
      }, 3000);
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Something went wrong. Please try again.");
      setPageState("error");
      // Cleanup intervals on error
      if (progressInterval) clearInterval(progressInterval);
      if (navigationTimeout) clearTimeout(navigationTimeout);
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
            <UserCircle className="w-6 h-6 text-charcoal" />
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

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="flex w-full max-w-sm flex-col gap-4"
          >
            <Input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a TikTok or Instagram link..."
              className="h-14"
            />

            {pageState === "error" && errorMessage && (
              <p className="text-accent text-sm text-center">{errorMessage}</p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="h-14 w-full"
            >
              Extract Recipe
            </Button>

            {pageState === "error" && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleRetry}
                className="w-full"
              >
                Try Again
              </Button>
            )}
          </form>

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