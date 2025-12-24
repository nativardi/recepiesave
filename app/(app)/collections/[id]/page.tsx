// Description: Cookbook Details screen - displays collection with recipe grid and filter chips

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CollectionHeader } from "@/components/composites/CollectionHeader";
import { RecipeGrid } from "@/components/composites/RecipeGrid";
import { RecipeGridSkeleton } from "@/components/composites/RecipeGridSkeleton";
import { ErrorState } from "@/components/composites/ErrorState";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Chip } from "@/components/primitives/Chip";
import { collectionRepository } from "@/lib/repositories/CollectionRepository";
import { useDeleteCollection } from "@/lib/hooks/useDeleteCollection";
import { CollectionWithRecipes } from "@/lib/types/database";
import { MoreHorizontal, Plus, Pencil, Trash2 } from "lucide-react";

type FilterOption = "all" | "newest" | "favorites";

// Skeleton for collection header
function CollectionHeaderSkeleton() {
  return (
    <div className="px-5 pt-2 pb-6 space-y-3">
      <div className="h-10 bg-gray-200 rounded animate-pulse w-3/4" />
      <div className="flex items-center gap-2">
        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-24" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
      </div>
      <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
    </div>
  );
}

export default function CollectionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const [collection, setCollection] = useState<CollectionWithRecipes | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const deleteCollection = useDeleteCollection();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleEdit = () => {
    setIsMenuOpen(false);
    router.push(`/collections/${collectionId}/edit`);
  };

  const handleDeleteClick = () => {
    setIsMenuOpen(false);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    deleteCollection.mutate(
      { collectionId },
      {
        onSuccess: () => {
          router.push("/collections");
        },
      }
    );
  };

  const loadCollection = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const collectionData = await collectionRepository.getByIdWithRecipes(
        collectionId
      );
      if (!collectionData) {
        setError("Cookbook not found.");
      } else {
        setCollection(collectionData);
      }
    } catch (err) {
      console.error("Failed to load collection:", err);
      setError("Failed to load this cookbook. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [collectionId]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  // Error state
  if (error) {
    return (
      <AppShell topBar={{ title: "Cookbook", showBack: true }}>
        <ErrorState
          message={error}
          onRetry={loadCollection}
        />
      </AppShell>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <AppShell topBar={{ title: "Cookbook", showBack: true }}>
        <CollectionHeaderSkeleton />
        <div className="px-5 pb-32">
          <RecipeGridSkeleton count={4} />
        </div>
      </AppShell>
    );
  }

  // If collection is null after loading (shouldn't happen but type safety)
  if (!collection) {
    return (
      <AppShell topBar={{ title: "Cookbook", showBack: true }}>
        <ErrorState
          message="Cookbook not found."
          onRetry={loadCollection}
        />
      </AppShell>
    );
  }

  const handleAddRecipe = () => {
    router.push(`/collections/${collectionId}/add-recipes`);
  };

  return (
    <AppShell
      topBar={{
        showBack: true,
        rightAction: (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center rounded-full h-12 w-12 text-charcoal hover:bg-gray-100 transition-colors"
              aria-label="More options"
              tabIndex={0}
            >
              <MoreHorizontal size={24} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-2 bg-surface rounded-xl shadow-lg border border-gray-200 py-2 min-w-[160px] z-50">
                <button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-charcoal hover:bg-gray-100 transition-colors"
                >
                  <Pencil size={18} />
                  <span className="font-medium">Edit</span>
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-accent hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={18} />
                  <span className="font-medium">Delete</span>
                </button>
              </div>
            )}
          </div>
        ),
      }}
    >
      <div className="flex flex-col">
        {/* Collection Header */}
        <CollectionHeader
          name={collection.name}
          recipeCount={collection.recipe_count}
          createdAt={collection.created_at}
          description={collection.description ?? undefined}
        />

        {/* Filter Chips */}
        <div className="sticky top-14 z-40 bg-gradient-to-b from-background via-background to-transparent w-full pb-4 pt-1">
          <div className="flex gap-2.5 px-5 overflow-x-auto scrollbar-hide">
            <Chip
              selected={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
            >
              All
            </Chip>
            <Chip
              selected={activeFilter === "newest"}
              onClick={() => setActiveFilter("newest")}
            >
              Newest
            </Chip>
            <Chip
              selected={activeFilter === "favorites"}
              onClick={() => setActiveFilter("favorites")}
            >
              Favorites
            </Chip>
          </div>
        </div>

        {/* Recipe Grid */}
        <div className="px-5 pb-32">
          <RecipeGrid
            recipes={(() => {
              let filtered = collection.recipes;

              // Filter by favorites
              if (activeFilter === "favorites") {
                filtered = filtered.filter((recipe) => recipe.is_favorite);
              }

              // Sort by newest (created_at descending)
              if (activeFilter === "newest") {
                filtered = [...filtered].sort((a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );
              }

              return filtered;
            })()}
            emptyMessage={
              activeFilter === "favorites"
                ? "No favorite recipes in this cookbook yet."
                : "No recipes in this cookbook yet."
            }
          />
        </div>

        {/* FAB - Add Recipe */}
        <div className="fixed bottom-24 right-6 z-50">
          <button
            onClick={handleAddRecipe}
            className="flex items-center justify-center gap-2 h-14 bg-primary hover:bg-primary-hover text-white rounded-full pl-5 pr-6 shadow-xl transition-all duration-300 active:scale-95 group"
            aria-label="Add Recipe"
            tabIndex={0}
          >
            <Plus
              size={20}
              className="group-hover:rotate-90 transition-transform duration-300"
            />
            <span className="font-bold text-sm tracking-wide">Add Recipe</span>
          </button>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Cookbook"
          description={`Are you sure you want to delete "${collection.name}"? This will not delete the recipes inside.`}
          confirmLabel="Delete"
          isLoading={deleteCollection.isPending}
        />
      </div>
    </AppShell>
  );
}
