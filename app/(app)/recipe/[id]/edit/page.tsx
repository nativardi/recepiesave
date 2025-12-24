// Description: Edit Recipe screen - allows editing recipe title, notes, and details

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { useUpdateRecipe } from "@/lib/hooks/useUpdateRecipe";
import { useToast } from "@/components/ui/toast";
import { RecipeWithDetails } from "@/lib/types/database";
import Image from "next/image";

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.id as string;
  const [recipe, setRecipe] = useState<RecipeWithDetails | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("");
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(true);

  const updateRecipe = useUpdateRecipe();
  const { showToast } = useToast();

  useEffect(() => {
    async function loadRecipe() {
      setIsLoadingRecipe(true);
      const recipeData = await recipeRepository.getByIdWithDetails(recipeId);
      if (recipeData) {
        setRecipe(recipeData);
        setTitle(recipeData.title);
        setNotes(recipeData.notes || "");
        setCuisine(recipeData.cuisine || "");
        setPrepTime(recipeData.prep_time_minutes?.toString() || "");
        setCookTime(recipeData.cook_time_minutes?.toString() || "");
        setServings(recipeData.servings?.toString() || "");
      }
      setIsLoadingRecipe(false);
    }
    loadRecipe();
  }, [recipeId]);

  const handleSave = () => {
    if (!recipe) return;

    updateRecipe.mutate(
      {
        recipeId,
        data: {
          title,
          notes: notes || null,
          cuisine: cuisine || null,
          prep_time_minutes: prepTime ? parseInt(prepTime) : null,
          cook_time_minutes: cookTime ? parseInt(cookTime) : null,
          servings: servings ? parseInt(servings) : null,
        },
      },
      {
        onSuccess: () => {
          showToast("Recipe updated");
          router.push(`/recipe/${recipeId}`);
        },
        onError: () => {
          showToast("Failed to update recipe", "error");
        },
      }
    );
  };

  if (isLoadingRecipe || !recipe) {
    return (
      <AppShell topBar={{ title: "Edit Recipe", showBack: true }}>
        <div className="p-4 space-y-4">
          <div className="w-full aspect-video rounded-xl bg-gray-200 animate-pulse" />
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          <div className="grid grid-cols-3 gap-4">
            <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-16 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell topBar={{ title: "Edit Recipe", showBack: true }}>
      <div className="p-4 space-y-6">
        {/* Thumbnail Preview */}
        {recipe.thumbnail_url && (
          <div className="relative w-full aspect-video rounded-xl overflow-hidden">
            <Image
              src={recipe.thumbnail_url}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">Title</label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe title"
            className="h-12"
          />
        </div>

        {/* AI Description (Read-only) */}
        {recipe.description && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm font-medium text-charcoal mb-2">AI Summary</p>
            <p className="text-sm text-muted">{recipe.description}</p>
          </div>
        )}

        {/* User Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">
            Your Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your personal notes (e.g., 'use less salt', 'double the garlic')..."
            className="flex w-full rounded-lg border border-gray-300 bg-surface px-4 py-3 text-base text-charcoal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-24"
          />
        </div>

        {/* Cuisine */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-charcoal">Cuisine</label>
          <Input
            type="text"
            value={cuisine}
            onChange={(e) => setCuisine(e.target.value)}
            placeholder="e.g., Italian, Mexican, Thai..."
            className="h-12"
          />
        </div>

        {/* Time & Servings */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-charcoal">
              Prep Time (min)
            </label>
            <Input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              placeholder="15"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-charcoal">
              Cook Time (min)
            </label>
            <Input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              placeholder="30"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-charcoal">Servings</label>
            <Input
              type="number"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="4"
            />
          </div>
        </div>

        {/* Original URL */}
        <div className="p-4 bg-gray-100 rounded-xl">
          <p className="text-sm text-muted mb-1">Original Source</p>
          <a
            href={recipe.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-sm hover:underline break-all"
          >
            {recipe.original_url}
          </a>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          variant="primary"
          size="lg"
          className="w-full h-14"
          disabled={updateRecipe.isPending}
        >
          {updateRecipe.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </AppShell>
  );
}
