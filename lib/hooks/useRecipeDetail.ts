// Description: React Query hook for fetching a single recipe with details

"use client";

import { useQuery } from "@tanstack/react-query";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { RecipeWithDetails } from "@/lib/types/database";

export function useRecipeDetail(recipeId: string) {
  return useQuery<RecipeWithDetails | null, Error>({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      if (!recipeId) return null;
      return recipeRepository.getByIdWithDetails(recipeId);
    },
    enabled: !!recipeId,
    staleTime: 2 * 60 * 1000, // 2 minutes - recipe details change less often
  });
}
