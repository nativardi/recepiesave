// Description: Cookbooks List screen - displays all user collections/cookbooks

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { CollectionCard } from "@/components/composites/CollectionCard";
import { ErrorState } from "@/components/composites/ErrorState";
import { getCurrentUser } from "@/lib/auth/get-user";
import { collectionRepository } from "@/lib/repositories/CollectionRepository";
import { CollectionWithRecipes } from "@/lib/types/database";
import { EmptyState } from "@/components/composites/EmptyState";
import { Plus, User } from "lucide-react";

// Skeleton component for collection cards
function CollectionCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl bg-surface shadow-sm overflow-hidden">
      <div className="aspect-square bg-gray-200 animate-pulse" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </div>
  );
}

export default function CollectionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [collections, setCollections] = useState<CollectionWithRecipes[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      const userCollections = await collectionRepository.getAllWithRecipes(
        currentUser.id
      );
      setCollections(userCollections);
    } catch (err) {
      console.error("Failed to load collections:", err);
      setError("Failed to load your cookbooks. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateCookbook = () => {
    router.push("/collections/new");
  };

  return (
    <AppShell
      topBar={{
        title: "Cookbooks",
        rightAction: (
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User size={20} className="text-charcoal" />
            </div>
          </div>
        ),
      }}
    >
      <div className="flex flex-col gap-6 px-4 pt-2">
        {/* Hero Section */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-charcoal font-serif">
            Your Collections
          </h1>
          <p className="text-base text-muted">
            Organize your saved recipes into custom cookbooks.
          </p>
        </div>

        {/* Error State */}
        {error && (
          <ErrorState
            message={error}
            onRetry={loadData}
          />
        )}

        {/* Loading State */}
        {isLoading && !error && (
          <div className="grid grid-cols-2 gap-4 pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CollectionCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Collections Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-2 gap-4 pb-4">
            {/* Create Card - Always First */}
            <button
              onClick={handleCreateCookbook}
              className="relative flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 text-gray-400 transition-all group"
              aria-label="Create New Cookbook"
            >
              <div className="p-2 rounded-full bg-white group-hover:bg-orange-100 transition-colors">
                <Plus size={24} className="group-hover:text-orange-600 transition-colors" />
              </div>
              <span className="font-medium text-sm">New Cookbook</span>
            </button>

            {collections.length > 0 ? (
              collections.map((collection) => (
                <CollectionCard key={collection.id} collection={collection} />
              ))
            ) : (
              <div className="col-span-1">
                <EmptyState
                  variant="collections"
                  actionLabel="Create Cookbook"
                  actionHref="/collections/new"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
