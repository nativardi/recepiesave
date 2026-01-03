// Description: React Query hook for fetching recipes list

"use client";

import { useQuery } from "@tanstack/react-query";
import { recipeRepository } from "@/lib/repositories/RecipeRepository";
import { useCurrentUser } from "./useCurrentUser";
import { Recipe } from "@/lib/types/database";

export function useRecipes() {
  const { data: user } = useCurrentUser();

  return useQuery<Recipe[], Error>({
    queryKey: ["recipes", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      return recipeRepository.getAll(user.id);
    },
    enabled: !!user, // Only run query when user is available
  });
}
