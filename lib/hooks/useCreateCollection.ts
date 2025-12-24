// Description: React Query mutation hook for creating collections/cookbooks

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { collectionRepository } from "@/lib/repositories/CollectionRepository";
import { Collection } from "@/lib/types/database";

interface CreateCollectionInput {
  user_id: string;
  name: string;
  description?: string | null;
}

export function useCreateCollection() {
  const queryClient = useQueryClient();

  return useMutation<Collection, Error, CreateCollectionInput>({
    mutationFn: async (data) => {
      return collectionRepository.create(data);
    },
    onSuccess: () => {
      // Invalidate collections query to refetch
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}
