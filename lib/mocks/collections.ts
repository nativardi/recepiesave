// Description: Mock collection/cookbook data for development and testing

import { Collection, CollectionWithRecipes } from "@/lib/types/database";
import { mockRecipes } from "./recipes";

export const mockCollections: Collection[] = [
  {
    id: "collection-1",
    user_id: "dev-user-uuid-12345",
    name: "Weeknight Dinners",
    description: "Quick and easy recipes for busy weeknights",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: "collection-2",
    user_id: "dev-user-uuid-12345",
    name: "Desserts",
    description: "Sweet treats and baked goods",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "collection-3",
    user_id: "dev-user-uuid-12345",
    name: "Holiday Recipes",
    description: "Special recipes for holidays and celebrations",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

// Mock collection items (which recipes belong to which collections)
export const mockCollectionItems: { collection_id: string; recipe_id: string; added_at: string }[] = [
  { collection_id: "collection-1", recipe_id: "recipe-1", added_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { collection_id: "collection-1", recipe_id: "recipe-3", added_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { collection_id: "collection-2", recipe_id: "recipe-2", added_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { collection_id: "collection-3", recipe_id: "recipe-1", added_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { collection_id: "collection-3", recipe_id: "recipe-2", added_at: new Date(Date.now() - 8 * 86400000).toISOString() },
];

export function getCollectionWithRecipes(collectionId: string): CollectionWithRecipes | null {
  const collection = mockCollections.find((c) => c.id === collectionId);
  if (!collection) return null;

  const recipeIds = mockCollectionItems
    .filter((item) => item.collection_id === collectionId)
    .map((item) => item.recipe_id);

  const recipes = mockRecipes.filter((r) => recipeIds.includes(r.id));

  return {
    ...collection,
    recipes,
    recipe_count: recipes.length,
  };
}

export function getAllCollectionsWithRecipes(): CollectionWithRecipes[] {
  return mockCollections.map((collection) => getCollectionWithRecipes(collection.id)!);
}
