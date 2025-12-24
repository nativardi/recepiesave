// Description: React Query mutation hook for toggling recipe favorite status

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { Recipe } from "@/lib/types/database";

interface ToggleFavoriteInput {
  recipeId: string;
  currentValue: boolean;
}

interface ToggleFavoriteContext {
  previousRecipes?: Recipe[];
  previousRecipe?: Recipe;
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation<Recipe | null, Error, ToggleFavoriteInput, ToggleFavoriteContext>({
    mutationFn: async ({ recipeId, currentValue }) => {
      return recipeRepository.update(recipeId, { is_favorite: !currentValue });
    },
    onMutate: async ({ recipeId, currentValue }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["recipes"] });
      await queryClient.cancelQueries({ queryKey: ["recipe", recipeId] });

      // Snapshot previous values
      const previousRecipes = queryClient.getQueryData<Recipe[]>(["recipes"]);
      const previousRecipe = queryClient.getQueryData<Recipe>(["recipe", recipeId]);

      // Optimistically update recipes list
      if (previousRecipes) {
        queryClient.setQueryData<Recipe[]>(["recipes"], (old) =>
          old?.map((r) =>
            r.id === recipeId ? { ...r, is_favorite: !currentValue } : r
          )
        );
      }

      // Optimistically update single recipe
      if (previousRecipe) {
        queryClient.setQueryData(["recipe", recipeId], {
          ...previousRecipe,
          is_favorite: !currentValue,
        });
      }

      return { previousRecipes, previousRecipe };
    },
    onError: (_err, { recipeId }, context) => {
      // Rollback on error
      if (context?.previousRecipes) {
        queryClient.setQueryData(["recipes"], context.previousRecipes);
      }
      if (context?.previousRecipe) {
        queryClient.setQueryData(["recipe", recipeId], context.previousRecipe);
      }
    },
    onSettled: (_, __, { recipeId }) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      queryClient.invalidateQueries({ queryKey: ["recipe", recipeId] });
    },
  });
}
