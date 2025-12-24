// Description: React Query mutation hook for updating recipes

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { Recipe } from "@/lib/types/database";

interface UpdateRecipeInput {
  recipeId: string;
  data: Partial<Recipe>;
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation<Recipe | null, Error, UpdateRecipeInput>({
    mutationFn: async ({ recipeId, data }) => {
      return recipeRepository.update(recipeId, data);
    },
    onSuccess: (_, variables) => {
      // Invalidate specific recipe and recipes list
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.recipeId] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
