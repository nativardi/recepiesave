// Description: Dashboard/Home screen - main entry point with hero, URL input, recent saves, and library feed

"use client";

import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { UrlCapture } from "@/components/composites/UrlCapture";
import { SectionHeader } from "@/components/composites/SectionHeader";
import { RecipeCarousel } from "@/components/composites/RecipeCarousel";
import { RecipeGrid } from "@/components/composites/RecipeGrid";
import { RecipeGridSkeleton } from "@/components/composites/RecipeGridSkeleton";
import { ErrorState } from "@/components/composites/ErrorState";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useRecipes } from "@/lib/hooks/useRecipes";
import { useRecipeProcessing } from "@/lib/hooks/useRecipeProcessing";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { mockDataStore } from "@/lib/mocks/MockDataStore";
import { Recipe } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import { User, Heart } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

type FilterView = "all" | "favorites";
type PlatformFilter = "all" | "tiktok" | "instagram" | "youtube" | "facebook";

// Helper to detect platform (simplified for client)
function detectPlatform(url: string): Recipe["platform"] {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  if (url.includes("facebook.com")) return "facebook";
  return "tiktok"; // Default/Fallback
}

export default function DashboardPage() {
  const { data: user, isLoading: userLoading, error: userError } = useCurrentUser();
  const { data: recipesData, isLoading: recipesLoading, error: recipesError, refetch } = useRecipes();
  const [createError, setCreateError] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<FilterView>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const queryClient = useQueryClient();

  // Processing state management
  const { processingState, startProcessing, setError: setProcessingError } = useRecipeProcessing({
    onComplete: async () => {
      // Refetch recipes when processing completes
      await refetch();

      // Refetch again after a short delay to ensure MockDataStore updates are visible
      setTimeout(() => {
        refetch();
      }, 500);
    },
    onError: (error) => {
      setCreateError(error);
    },
  });

  const isLoading = userLoading || recipesLoading;
  const error = userError || recipesError;

  // Sort recipes by creation date (most recent first)
  const recipes = useMemo(() => {
    if (!recipesData) return [];
    return [...recipesData].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [recipesData]);

  // Auto-prefetch first 6 recipes (visible in viewport)
  useEffect(() => {
    if (!recipes || recipes.length === 0) return;

    // Prefetch top 6 recipes
    const visibleRecipes = recipes.slice(0, 6);

    visibleRecipes.forEach((recipe) => {
      queryClient.prefetchQuery({
        queryKey: ["recipe", recipe.id],
        queryFn: () => recipeRepository.getByIdWithDetails(recipe.id),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    });
  }, [recipes, queryClient]);

  // Clean up stuck processing recipes on mount (dev mode only)
  useEffect(() => {
    const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";
    if (!isDevMode || !recipes || recipes.length === 0) return;

    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    recipes.forEach((recipe) => {
      // If recipe is stuck in pending/processing and was created more than 5 minutes ago, mark as failed
      if (
        (recipe.status === "pending" || recipe.status === "processing") &&
        new Date(recipe.created_at).getTime() < fiveMinutesAgo
      ) {
        console.warn(`Cleaning up stuck recipe: ${recipe.id}`);
        mockDataStore.updateRecipeStatus(recipe.id, "failed");
      }
    });
  }, [recipes]);

  const handleSubmitUrl = async (url: string) => {
    if (!user) {
      setCreateError("Please log in to save recipes.");
      return;
    }

    setCreateError(null);

    try {
      const platform = detectPlatform(url);
      const isDevMode = process.env.NEXT_PUBLIC_DEV_MODE === "true";

      // Create recipe (use "pending" - valid database status value)
      const recipe = await recipeRepository.create({
        user_id: user.id,
        original_url: url,
        platform,
        status: "pending",
      });

      // Start processing UI simulation
      startProcessing(recipe.id);

      // In dev mode, simulate processing (matching Add page behavior)
      if (isDevMode) {
        // Run simulation in background - will trigger refetch via onComplete
        mockDataStore.simulateRecipeProcessing(recipe.id, url);
      }

      // Refetch recipes to show the new pending recipe immediately
      await refetch();
    } catch (err) {
      console.error("Failed to add recipe:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to save recipe. Please try again.";
      setProcessingError(errorMessage);
    }
  };

  // Get recent saves (last 4 recipes)
  const recentSaves = recipes.slice(0, 4);

  // Filtered recipes based on current filters
  const filteredRecipes = useMemo(() => {
    let result = recipes;

    // Apply favorites filter
    if (filterView === "favorites") {
      result = result.filter((r) => r.is_favorite);
    }

    // Apply platform filter
    if (platformFilter !== "all") {
      result = result.filter((r) => r.platform === platformFilter);
    }

    return result;
  }, [recipes, filterView, platformFilter]);

  // Count favorites for the tab badge
  const favoriteCount = useMemo(
    () => recipes.filter((r) => r.is_favorite).length,
    [recipes]
  );

  // Platform counts for filter badges
  const platformCounts = useMemo(() => ({
    all: recipes.length,
    tiktok: recipes.filter((r) => r.platform === "tiktok").length,
    instagram: recipes.filter((r) => r.platform === "instagram").length,
    youtube: recipes.filter((r) => r.platform === "youtube").length,
    facebook: recipes.filter((r) => r.platform === "facebook").length,
  }), [recipes]);

  const userName = user?.full_name?.split(" ")[0] || "there";

  // Error state for initial load
  if (error) {
    return (
      <AppShell
        topBar={{
          logoSrc: "/logo.png",
          rightAction: (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={24} className="text-charcoal" />
            </div>
          ),
        }}
      >
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load your recipes. Please try again."}
          onRetry={() => refetch()}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      topBar={{
        title: "Savory",
        logoSrc: "/logo.png",
        rightAction: (
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <User size={24} className="text-charcoal" />
          </div>
        ),
      }}
    >
      <div className="flex flex-col gap-6">
        {/* Hero Section */}
        <div className="px-4">
          <h1 className="text-4xl font-bold text-charcoal font-serif pt-2 pb-4">
            Hello, {userName}!
          </h1>

          {/* URL Capture - inline variant */}
          <UrlCapture
            onSubmit={handleSubmitUrl}
            variant="inline"
            placeholder="Paste a recipe link to save..."
            processingState={processingState}
          />

          {/* Create error message */}
          {createError && (
            <p className="text-red-500 text-sm mt-2">{createError}</p>
          )}
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="px-4">
            <h3 className="text-xl font-bold text-charcoal font-serif pb-3 pt-4">
              Your Library
            </h3>
            <RecipeGridSkeleton count={4} />
          </div>
        ) : (
          <>
            {/* Recent Saves */}
            {recentSaves.length > 0 && (
              <div>
                <SectionHeader
                  title="Recent Saves"
                  actionLabel="See All"
                  actionHref="/dashboard"
                />
                <RecipeCarousel recipes={recentSaves} />
              </div>
            )}

            {/* Your Library */}
            <div>
              <h3 className="text-xl font-bold text-charcoal font-serif px-4 pb-3 pt-4">
                Your Library
              </h3>

              {/* Combined Filter Chips */}
              <div className="px-4 pb-4 overflow-x-auto scrollbar-hide [mask-image:linear-gradient(to_right,black_85%,transparent_100%)]">
                <div className="flex gap-2 min-w-max">
                  <button
                    onClick={() => {
                      setFilterView("all");
                      setPlatformFilter("all");
                    }}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                      filterView === "all" && platformFilter === "all"
                        ? "bg-primary text-white border-primary"
                        : "bg-surface text-charcoal border-muted/30 hover:bg-surface/80"
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterView(filterView === "favorites" ? "all" : "favorites")}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-colors border flex items-center gap-1.5",
                      filterView === "favorites"
                        ? "bg-accent text-white border-accent"
                        : "bg-surface text-charcoal border-muted/30 hover:bg-surface/80"
                    )}
                  >
                    <Heart size={14} className={filterView === "favorites" ? "fill-current" : ""} />
                    Favorites ({favoriteCount})
                  </button>

                  <div className="w-px h-8 bg-gray-200 mx-1" />

                  {(["tiktok", "instagram", "youtube", "facebook"] as const).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setPlatformFilter(platformFilter === platform ? "all" : platform)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-colors border whitespace-nowrap",
                        platformFilter === platform
                          ? "bg-primary text-white border-primary"
                          : "bg-surface text-charcoal border-muted/30 hover:bg-surface/80"
                      )}
                    >
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                      {platformCounts[platform] > 0 && ` (${platformCounts[platform]})`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="px-4">
                <RecipeGrid
                  recipes={filteredRecipes}
                  emptyMessage={
                    filterView === "favorites"
                      ? "No favorite recipes yet. Tap the heart on any recipe to add it here!"
                      : platformFilter !== "all"
                        ? `No ${platformFilter} recipes saved yet.`
                        : undefined
                  }
                  emptyActionLabel={filterView === "all" && platformFilter === "all" ? "Add Recipe" : undefined}
                  emptyActionHref={filterView === "all" && platformFilter === "all" ? "/add" : undefined}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
