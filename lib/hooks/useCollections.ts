// Description: React Query hook for fetching collections/cookbooks list

"use client";

import { useQuery } from "@tanstack/react-query";
import { collectionRepository } from "@/lib/repositories/CollectionRepository";
import { useCurrentUser } from "./useCurrentUser";
import { CollectionWithRecipes } from "@/lib/types/database";

export function useCollections() {
  const { data: user } = useCurrentUser();

  return useQuery<CollectionWithRecipes[], Error>({
    queryKey: ["collections", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");
      return collectionRepository.getAllWithRecipes(user.id);
    },
    enabled: !!user, // Only run query when user is available
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
