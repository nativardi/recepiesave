// Description: React Query hook for fetching recipes list

"use client";

import { useQuery } from "@tanstack/react-query";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { getCurrentUser } from "@/lib/auth/get-user";
import { Recipe } from "@/lib/types/database";

export function useRecipes() {
  return useQuery<Recipe[], Error>({
    queryKey: ["recipes"],
    queryFn: async () => {
      const user = await getCurrentUser();
      return recipeRepository.getAll(user.id);
    },
  });
}
