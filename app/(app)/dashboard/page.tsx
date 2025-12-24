// Description: Dashboard/Home screen - main entry point with hero, URL input, recent saves, and library feed

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { UrlCapture } from "@/components/composites/UrlCapture";
import { SectionHeader } from "@/components/composites/SectionHeader";
import { RecipeCarousel } from "@/components/composites/RecipeCarousel";
import { RecipeGrid } from "@/components/composites/RecipeGrid";
import { RecipeGridSkeleton } from "@/components/composites/RecipeGridSkeleton";
import { ErrorState } from "@/components/composites/ErrorState";
import { getCurrentUser } from "@/lib/auth/get-user";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { Recipe } from "@/lib/types/database";
import { cn } from "@/lib/utils/cn";
import { User, Heart } from "lucide-react";

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
  const [user, setUser] = useState<{ full_name: string | null; id: string } | null>(null);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [filterView, setFilterView] = useState<FilterView>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      const userRecipes = await recipeRepository.getAll(currentUser.id);
      setRecipes(
        [...userRecipes].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (err) {
      console.error("Failed to load recipes:", err);
      setError("Failed to load your recipes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitUrl = async (url: string) => {
    if (!user) return;

    setIsCreating(true);
    setCreateError(null);
    try {
      const platform = detectPlatform(url);

      // Direct client-side creation for immediate feedback
      const newRecipe = await recipeRepository.create({
        user_id: user.id,
        original_url: url,
        platform,
        status: "processing", // Start as processing
      });

      // Update local state immediately
      setRecipes((prev) => [newRecipe, ...prev]);

      // Simulate processing completion after 2 seconds
      setTimeout(async () => {
        await recipeRepository.updateStatus(newRecipe.id, "completed");
      }, 2000);
    } catch (err) {
      console.error("Failed to add recipe:", err);
      setCreateError("Failed to save recipe. Please try again.");
    } finally {
      setIsCreating(false);
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
          title: "SaveIt",
          rightAction: (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={24} className="text-charcoal" />
            </div>
          ),
        }}
      >
        <ErrorState
          message={error}
          onRetry={loadData}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      topBar={{
        title: "SaveIt",
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
            isLoading={isCreating}
            placeholder="Paste a recipe link to save..."
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

              {/* Filter Tabs */}
              <div className="px-4 pb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterView("all")}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                      filterView === "all"
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-charcoal hover:bg-gray-200"
                    )}
                  >
                    All ({recipes.length})
                  </button>
                  <button
                    onClick={() => setFilterView("favorites")}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5",
                      filterView === "favorites"
                        ? "bg-accent text-white"
                        : "bg-gray-100 text-charcoal hover:bg-gray-200"
                    )}
                  >
                    <Heart size={14} className={filterView === "favorites" ? "fill-current" : ""} />
                    Favorites ({favoriteCount})
                  </button>
                </div>
              </div>

              {/* Platform Filter Chips */}
              <div className="px-4 pb-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-2">
                  {(["all", "tiktok", "instagram", "youtube", "facebook"] as const).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setPlatformFilter(platform)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
                        platformFilter === platform
                          ? "bg-charcoal text-white"
                          : "bg-gray-100 text-muted hover:bg-gray-200"
                      )}
                    >
                      {platform === "all" ? "All Platforms" : platform.charAt(0).toUpperCase() + platform.slice(1)}
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
