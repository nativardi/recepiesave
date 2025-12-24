// Description: React Query mutation hook for creating recipes from URL

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Recipe } from "@/lib/types/database";

interface CreateRecipeInput {
  url: string;
  user_id: string;
}

interface CreateRecipeResponse {
  recipe_id: string;
  status: string;
  message: string;
}

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation<CreateRecipeResponse, Error, CreateRecipeInput>({
    mutationFn: async (data) => {
      const response = await fetch("/api/recipes/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create recipe");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate recipes query to refetch
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });
}
