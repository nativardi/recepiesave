// Description: Add Recipes to Cookbook screen - select recipes to add to collection

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RecipeSelectList } from "@/components/composites/RecipeSelectList";
import { getCurrentUser } from "@/lib/auth/get-user";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { collectionRepository } from "@/lib/repositories/CollectionRepository";
import { Recipe } from "@/lib/types/database";

export default function AddRecipesToCookbookPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadRecipes() {
      const user = await getCurrentUser();
      const userRecipes = await recipeRepository.getAll(user.id);
      setRecipes(userRecipes);
    }
    loadRecipes();
  }, []);

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleRecipe = (recipeId: string) => {
    setSelectedRecipes((prev) => {
      const next = new Set(prev);
      if (next.has(recipeId)) {
        next.delete(recipeId);
      } else {
        next.add(recipeId);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (selectedRecipes.size === 0) return;

    setIsLoading(true);
    try {
      for (const recipeId of selectedRecipes) {
        await collectionRepository.addRecipe(collectionId, recipeId);
      }
      router.push(`/collections/${collectionId}`);
    } catch (error) {
      console.error("Error adding recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell topBar={{ title: "Add Recipes", showBack: true }}>
      <div className="flex flex-col h-full">
        {/* Search */}
        <div className="px-4 py-3 sticky top-14 bg-background z-10">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search recipes..."
            className="h-12"
          />
        </div>

        {/* Recipe List */}
        <div className="flex-1 px-4 pb-32">
          <RecipeSelectList
            recipes={filteredRecipes}
            selectedIds={selectedRecipes}
            onToggle={handleToggleRecipe}
            emptyMessage={
              searchQuery
                ? `No recipes found for "${searchQuery}"`
                : "No recipes available"
            }
          />
        </div>

        {/* Fixed Bottom Action */}
        {selectedRecipes.size > 0 && (
          <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t border-gray-200">
            <Button
              onClick={handleAddSelected}
              variant="primary"
              size="lg"
              className="w-full h-14"
              disabled={isLoading}
            >
              {isLoading
                ? "Adding..."
                : `Add ${selectedRecipes.size} Recipe${
                    selectedRecipes.size > 1 ? "s" : ""
                  }`}
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
