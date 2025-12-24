// Description: React Query hook for fetching collections/cookbooks list

"use client";

import { useQuery } from "@tanstack/react-query";
import { collectionRepository } from "@/lib/repositories/CollectionRepository";
import { getCurrentUser } from "@/lib/auth/get-user";
import { CollectionWithRecipes } from "@/lib/types/database";

export function useCollections() {
  return useQuery<CollectionWithRecipes[], Error>({
    queryKey: ["collections"],
    queryFn: async () => {
      const user = await getCurrentUser();
      return collectionRepository.getAllWithRecipes(user.id);
    },
  });
}

export function useCollection(collectionId: string) {
  return useQuery<CollectionWithRecipes | null, Error>({
    queryKey: ["collection", collectionId],
    queryFn: async () => {
      return collectionRepository.getByIdWithRecipes(collectionId);
    },
    enabled: !!collectionId,
  });
}
