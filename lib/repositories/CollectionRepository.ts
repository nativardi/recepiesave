// Description: Collection repository pattern - Supabase implementation with dev mode branching (client-side usage)

"use client";

import {
  Collection,
  CollectionWithRecipes,
  Recipe,
} from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { mockDataStore } from "@/lib/mocks/MockDataStore";

export class CollectionRepository {
  private useMockData(): boolean {
    return process.env.NEXT_PUBLIC_DEV_MODE === "true";
  }
  // Get all collections for a user
  async getAll(userId: string): Promise<Collection[]> {
    if (this.useMockData()) {
      return mockDataStore.getCollections(userId);
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching collections:", error);
      throw new Error(`Failed to fetch collections: ${error.message}`);
    }

    return (data || []) as Collection[];
  }

  // Get a single collection by ID
  async getById(collectionId: string): Promise<Collection | null> {
    if (this.useMockData()) {
      return mockDataStore.getCollection(collectionId);
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("Error fetching collection:", error);
      throw new Error(`Failed to fetch collection: ${error.message}`);
    }

    return data as Collection;
  }

  // Get collection with recipes
  async getByIdWithRecipes(
    collectionId: string
  ): Promise<CollectionWithRecipes | null> {
    if (this.useMockData()) {
      return mockDataStore.getCollectionWithRecipes(collectionId);
    }

    const supabase = createClient();

    // Fetch collection
    const collection = await this.getById(collectionId);
    if (!collection) return null;

    // Fetch collection items with recipe details
    const { data: items, error: itemsError } = await supabase
      .from("collection_items")
      .select(`
        recipe_id,
        recipes (*)
      `)
      .eq("collection_id", collectionId);

    if (itemsError) {
      console.error("Error fetching collection items:", itemsError);
      throw new Error(`Failed to fetch collection items: ${itemsError.message}`);
    }

    // Extract recipes from items
    const recipes = (items || [])
      .map((item: any) => item.recipes)
      .filter((recipe: Recipe | null) => recipe !== null) as Recipe[];

    return {
      ...collection,
      recipes,
      recipe_count: recipes.length,
    };
  }

  // Get all collections with recipes for a user
  async getAllWithRecipes(
    userId: string
  ): Promise<CollectionWithRecipes[]> {
    if (this.useMockData()) {
      return mockDataStore.getAllCollectionsWithRecipes(userId);
    }

    const supabase = createClient();

    // Fetch all collections for user
    const collections = await this.getAll(userId);

    // Fetch recipes for each collection in parallel
    const collectionsWithRecipes = await Promise.all(
      collections.map(async (collection) => {
        const { data: items } = await supabase
          .from("collection_items")
          .select(`
            recipe_id,
            recipes (*)
          `)
          .eq("collection_id", collection.id);

        const recipes = (items || [])
          .map((item: any) => item.recipes)
          .filter((recipe: Recipe | null) => recipe !== null) as Recipe[];

        return {
          ...collection,
          recipes,
          recipe_count: recipes.length,
        };
      })
    );

    return collectionsWithRecipes;
  }

  // Create a new collection
  async create(data: {
    user_id: string;
    name: string;
    description?: string | null;
  }): Promise<Collection> {
    if (this.useMockData()) {
      return mockDataStore.createCollection(data);
    }

    const supabase = createClient();

    const { data: newCollection, error } = await supabase
      .from("collections")
      .insert({
        user_id: data.user_id,
        name: data.name,
        description: data.description || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating collection:", error);
      throw new Error(`Failed to create collection: ${error.message}`);
    }

    return newCollection as Collection;
  }

  // Update collection
  async update(
    collectionId: string,
    data: Partial<Collection>
  ): Promise<Collection | null> {
    if (this.useMockData()) {
      return mockDataStore.updateCollection(collectionId, data);
    }

    const supabase = createClient();

    // Remove id and user_id from update data (shouldn't be updated)
    const { id, user_id, ...updateData } = data;

    const { data: updatedCollection, error } = await supabase
      .from("collections")
      .update(updateData)
      .eq("id", collectionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating collection:", error);
      throw new Error(`Failed to update collection: ${error.message}`);
    }

    return updatedCollection as Collection;
  }

  // Delete a collection (cascade will handle collection_items)
  async delete(collectionId: string): Promise<boolean> {
    if (this.useMockData()) {
      return mockDataStore.deleteCollection(collectionId);
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", collectionId);

    if (error) {
      console.error("Error deleting collection:", error);
      throw new Error(`Failed to delete collection: ${error.message}`);
    }

    return true;
  }

  // Add recipe to collection
  async addRecipe(
    collectionId: string,
    recipeId: string
  ): Promise<boolean> {
    if (this.useMockData()) {
      return mockDataStore.addRecipeToCollection(collectionId, recipeId);
    }

    const supabase = createClient();

    // Check if already exists
    const { data: existing } = await supabase
      .from("collection_items")
      .select("collection_id, recipe_id")
      .eq("collection_id", collectionId)
      .eq("recipe_id", recipeId)
      .single();

    if (existing) {
      // Already exists, return true (idempotent)
      return true;
    }

    const { error } = await supabase
      .from("collection_items")
      .insert({
        collection_id: collectionId,
        recipe_id: recipeId,
      });

    if (error) {
      console.error("Error adding recipe to collection:", error);
      throw new Error(`Failed to add recipe to collection: ${error.message}`);
    }

    return true;
  }

  // Remove recipe from collection
  async removeRecipe(
    collectionId: string,
    recipeId: string
  ): Promise<boolean> {
    if (this.useMockData()) {
      return mockDataStore.removeRecipeFromCollection(collectionId, recipeId);
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", collectionId)
      .eq("recipe_id", recipeId);

    if (error) {
      console.error("Error removing recipe from collection:", error);
      throw new Error(`Failed to remove recipe from collection: ${error.message}`);
    }

    return true;
  }
}

// Singleton instance
export const collectionRepository = new CollectionRepository();
