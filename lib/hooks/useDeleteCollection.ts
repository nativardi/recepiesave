// Description: React Query mutation hook for deleting collections

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionRepository } from "@/lib/repositories/CollectionRepository";

interface DeleteCollectionInput {
  collectionId: string;
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, DeleteCollectionInput>({
    mutationFn: async ({ collectionId }) => {
      return collectionRepository.delete(collectionId);
    },
    onSuccess: () => {
      // Invalidate collections list
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
