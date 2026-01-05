// Description: Recipe Detail view - displays full recipe with ingredients and instructions tabs

"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { IngredientChecklistRow } from "@/components/composites/IngredientChecklistRow";
import { InstructionStepCard } from "@/components/composites/InstructionStepCard";
import { ErrorState } from "@/components/composites/ErrorState";
import { useRecipeDetail } from "@/lib/hooks/useRecipeDetail";
import { useToggleFavorite } from "@/lib/hooks/useToggleFavorite";
import { useDeleteRecipe } from "@/lib/hooks/useDeleteRecipe";
import { useCheckedIngredients } from "@/lib/hooks/useCheckedIngredients";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import Image from "next/image";
import { Heart, Share, Play, Pencil, Trash2 } from "lucide-react";

// Skeleton for recipe detail page
function RecipeDetailSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Hero Image Skeleton */}
      <div className="relative w-full min-h-[30vh] bg-gray-200 animate-pulse rounded-xl mx-4 mt-4" />

      {/* Title and Meta Skeleton */}
      <div className="px-4 pt-6 space-y-4">
        <div className="h-10 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="flex gap-2 pb-4">
          <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
          <div className="h-8 w-20 bg-gray-200 rounded-full animate-pulse" />
        </div>
        <div className="h-14 bg-gray-200 rounded-full animate-pulse" />
      </div>

      {/* Tabs Skeleton */}
      <div className="px-4 py-6 space-y-4">
        <div className="h-12 bg-gray-200 rounded-full animate-pulse" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const { data: recipe, isLoading, error, refetch } = useRecipeDetail(recipeId);
  const [activeTab, setActiveTab] = useState("ingredients");
  const { checkedIngredients, toggleIngredient } = useCheckedIngredients(recipeId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const toggleFavorite = useToggleFavorite();
  const deleteRecipe = useDeleteRecipe();
  const { showToast } = useToast();

  const handleFavoriteClick = () => {
    if (!recipe) return;
    toggleFavorite.mutate(
      {
        recipeId: recipe.id,
        currentValue: recipe.is_favorite,
      },
      {
        onSuccess: () => {
          showToast(recipe.is_favorite ? "Removed from favorites" : "Added to favorites");
          refetch(); // Refetch to get updated data
        },
        onError: () => {
          showToast("Failed to update favorite", "error");
        },
      }
    );
  };

  const handleDeleteConfirm = () => {
    deleteRecipe.mutate(
      { recipeId },
      {
        onSuccess: () => {
          showToast("Recipe deleted");
          router.push("/dashboard");
        },
        onError: () => {
          showToast("Failed to delete recipe", "error");
        },
      }
    );
  };

  // Error state
  if (error) {
    return (
      <AppShell topBar={{ title: "Recipe", showBack: true }}>
        <ErrorState
          message={error instanceof Error ? error.message : "Failed to load this recipe. Please try again."}
          onRetry={() => refetch()}
        />
      </AppShell>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <AppShell topBar={{ title: "Recipe", showBack: true }}>
        <RecipeDetailSkeleton />
      </AppShell>
    );
  }

  // Recipe not found after loading
  if (!recipe) {
    return (
      <AppShell topBar={{ title: "Recipe", showBack: true }}>
        <ErrorState
          message="Recipe not found."
          onRetry={() => refetch()}
        />
      </AppShell>
    );
  }

  const handleIngredientToggle = (ingredientId: string, checked: boolean) => {
    toggleIngredient(ingredientId, checked);
  };

  const handleStartCooking = () => {
    router.push(`/recipe/${recipeId}/cook`);
  };

  return (
    <AppShell
      topBar={{
        showBack: true,
        rightAction: (
          <div className="flex items-center gap-2">
            <button
              onClick={handleFavoriteClick}
              className={cn(
                "flex items-center justify-center rounded-full h-12 w-12 transition-colors",
                recipe.is_favorite
                  ? "text-accent"
                  : "text-charcoal hover:bg-gray-100"
              )}
              aria-label={recipe.is_favorite ? "Remove from favorites" : "Add to favorites"}
              tabIndex={0}
            >
              <Heart
                size={24}
                className={cn(
                  "transition-transform duration-200",
                  recipe.is_favorite && "fill-current scale-110"
                )}
              />
            </button>
            <button
              className="flex items-center justify-center rounded-full h-12 w-12 text-charcoal hover:bg-gray-100 transition-colors"
              aria-label="Share recipe"
              tabIndex={0}
            >
              <Share size={24} />
            </button>
          </div>
        ),
      }}
    >
      <div className="flex flex-col">
        {/* Hero Image */}
        {recipe.thumbnail_url && (
          <div className="relative w-full min-h-[30vh] bg-center bg-cover bg-no-repeat rounded-xl overflow-hidden mx-4 mt-4">
            <Image
              src={recipe.thumbnail_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute bottom-4 right-8">
              <button
                className="flex items-center justify-center rounded-full h-14 w-14 bg-white/90 backdrop-blur text-primary shadow-lg hover:bg-white transition-colors"
                aria-label="Play video"
                tabIndex={0}
              >
                <Play size={28} className="ml-1" />
              </button>
            </div>
          </div>
        )}

        {/* Title and Meta */}
        <div className="px-4">
          <h1 className="text-4xl font-bold text-charcoal font-serif pt-6 pb-2">
            {recipe.title}
          </h1>

          {/* Creator Name */}
          {recipe.creator_name && (
            <p className="text-base text-muted pb-4">
              by {recipe.creator_name}
            </p>
          )}

          {/* Meta Tags */}
          <div className="flex gap-2 pb-6 overflow-x-auto scrollbar-hide">
            {recipe.prep_time_minutes && (
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-200 px-4">
                <p className="text-charcoal text-sm font-medium">
                  Prep: {recipe.prep_time_minutes} min
                </p>
              </div>
            )}
            {recipe.cook_time_minutes && (
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-200 px-4">
                <p className="text-charcoal text-sm font-medium">
                  Cook: {recipe.cook_time_minutes} min
                </p>
              </div>
            )}
            {recipe.servings && (
              <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-gray-200 px-4">
                <p className="text-charcoal text-sm font-medium">
                  Serves: {recipe.servings}
                </p>
              </div>
            )}
          </div>

          {/* Start Cooking Button */}
          <Button
            onClick={handleStartCooking}
            variant="primary"
            size="lg"
            className="w-full h-14 text-base font-bold shadow-md"
          >
            Start Cooking
          </Button>

          {/* Edit and Delete Buttons */}
          <div className="flex gap-3 mt-4">
            <Link href={`/recipe/${recipeId}/edit`} className="flex-1">
              <Button
                variant="ghost"
                size="lg"
                className="w-full h-12 text-sm font-medium"
              >
                <Pencil size={18} className="mr-2" />
                Edit Recipe
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 h-12 text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 size={18} className="mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full rounded-full bg-white p-1 shadow-sm">
              <TabsTrigger value="ingredients" className="flex-1">
                Ingredients
              </TabsTrigger>
              <TabsTrigger value="instructions" className="flex-1">
                Instructions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ingredients" className="mt-6 space-y-4">
              {recipe.ingredients.length > 0 ? (
                recipe.ingredients.map((ingredient) => (
                  <IngredientChecklistRow
                    key={ingredient.id}
                    ingredient={ingredient}
                    checked={checkedIngredients.has(ingredient.id)}
                    onToggle={(checked) =>
                      handleIngredientToggle(ingredient.id, checked)
                    }
                  />
                ))
              ) : (
                <p className="text-muted text-center py-8">
                  No ingredients available
                </p>
              )}
            </TabsContent>

            <TabsContent value="instructions" className="mt-6 space-y-4">
              {recipe.instructions.length > 0 ? (
                recipe.instructions.map((instruction) => (
                  <InstructionStepCard
                    key={instruction.id}
                    stepNumber={instruction.step_number}
                    text={instruction.text}
                  />
                ))
              ) : (
                <p className="text-muted text-center py-8">
                  No instructions available
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Recipe"
        description="This recipe will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteRecipe.isPending}
      />
    </AppShell>
  );
}
