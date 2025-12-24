// Description: React Query hook for fetching a single recipe with details

"use client";

import { useQuery } from "@tanstack/react-query";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { RecipeWithDetails } from "@/lib/types/database";

export function useRecipe(recipeId: string) {
  return useQuery<RecipeWithDetails | null, Error>({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      return recipeRepository.getByIdWithDetails(recipeId);
    },
    enabled: !!recipeId,
  });
}
