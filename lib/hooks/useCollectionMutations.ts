// Description: React Query mutation hooks for collection operations (add/remove recipes)

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionRepository } from "@/lib/repositories/CollectionRepository";

interface AddRecipeToCollectionInput {
  collectionId: string;
  recipeId: string;
}

export function useAddRecipeToCollection() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, AddRecipeToCollectionInput>({
    mutationFn: async ({ collectionId, recipeId }) => {
      return collectionRepository.addRecipe(collectionId, recipeId);
    },
    onSuccess: (_, variables) => {
      // Invalidate specific collection
      queryClient.invalidateQueries({
        queryKey: ["collection", variables.collectionId],
      });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

export function useRemoveRecipeFromCollection() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, AddRecipeToCollectionInput>({
    mutationFn: async ({ collectionId, recipeId }) => {
      return collectionRepository.removeRecipe(collectionId, recipeId);
    },
    onSuccess: (_, variables) => {
      // Invalidate specific collection
      queryClient.invalidateQueries({
        queryKey: ["collection", variables.collectionId],
      });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
