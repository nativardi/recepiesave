// Description: React Query mutation hook for deleting recipes

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";

interface DeleteRecipeInput {
  recipeId: string;
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, DeleteRecipeInput>({
    mutationFn: async ({ recipeId }) => {
      return recipeRepository.delete(recipeId);
    },
    onSuccess: (_, { recipeId }) => {
      // Invalidate recipes list
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      // Remove specific recipe from cache
      queryClient.removeQueries({ queryKey: ["recipe", recipeId] });
      // Invalidate collections (recipe might be in collections)
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
