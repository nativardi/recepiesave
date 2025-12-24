// Description: Recipe repository pattern - Supabase implementation with dev mode branching (client-side usage)

"use client";

import {
  Recipe,
  RecipeWithDetails,
  Ingredient,
  Instruction,
} from "@/lib/types/database";
import { createClient } from "@/lib/supabase/client";
import { mockDataStore } from "@/lib/mocks/MockDataStore";

export class RecipeRepository {
  private useMockData(): boolean {
    return process.env.NEXT_PUBLIC_DEV_MODE === "true";
  }
  // Get all recipes for a user
  async getAll(userId: string): Promise<Recipe[]> {
    if (this.useMockData()) {
      return mockDataStore.getRecipes(userId);
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recipes:", error);
      throw new Error(`Failed to fetch recipes: ${error.message}`);
    }

    return (data || []) as Recipe[];
  }

  // Get a single recipe by ID
  async getById(recipeId: string): Promise<Recipe | null> {
    if (this.useMockData()) {
      return mockDataStore.getRecipe(recipeId);
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("id", recipeId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return null;
      }
      console.error("Error fetching recipe:", error);
      throw new Error(`Failed to fetch recipe: ${error.message}`);
    }

    return data as Recipe;
  }

  // Get recipe with full details (ingredients + instructions)
  async getByIdWithDetails(recipeId: string): Promise<RecipeWithDetails | null> {
    if (this.useMockData()) {
      return mockDataStore.getRecipeWithDetails(recipeId);
    }

    const supabase = createClient();

    // Fetch recipe
    const recipe = await this.getById(recipeId);
    if (!recipe) return null;

    // Fetch ingredients
    const { data: ingredients, error: ingredientsError } = await supabase
      .from("ingredients")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("order_index", { ascending: true });

    if (ingredientsError) {
      console.error("Error fetching ingredients:", ingredientsError);
      throw new Error(`Failed to fetch ingredients: ${ingredientsError.message}`);
    }

    // Fetch instructions
    const { data: instructions, error: instructionsError } = await supabase
      .from("instructions")
      .select("*")
      .eq("recipe_id", recipeId)
      .order("step_number", { ascending: true });

    if (instructionsError) {
      console.error("Error fetching instructions:", instructionsError);
      throw new Error(`Failed to fetch instructions: ${instructionsError.message}`);
    }

    return {
      ...recipe,
      ingredients: (ingredients || []) as Ingredient[],
      instructions: (instructions || []) as Instruction[],
    };
  }

  // Get all recipes with details for a user
  async getAllWithDetails(userId: string): Promise<RecipeWithDetails[]> {
    if (this.useMockData()) {
      return mockDataStore.getAllRecipesWithDetails(userId);
    }

    const supabase = createClient();

    // Fetch all recipes for user
    const recipes = await this.getAll(userId);

    // Fetch ingredients and instructions for all recipes in parallel
    const recipesWithDetails = await Promise.all(
      recipes.map(async (recipe) => {
        const { data: ingredients } = await supabase
          .from("ingredients")
          .select("*")
          .eq("recipe_id", recipe.id)
          .order("order_index", { ascending: true });

        const { data: instructions } = await supabase
          .from("instructions")
          .select("*")
          .eq("recipe_id", recipe.id)
          .order("step_number", { ascending: true });

        return {
          ...recipe,
          ingredients: (ingredients || []) as Ingredient[],
          instructions: (instructions || []) as Instruction[],
        };
      })
    );

    return recipesWithDetails;
  }

  // Create a new recipe (from URL paste)
  async create(data: {
    user_id: string;
    original_url: string;
    platform: Recipe["platform"];
    status?: Recipe["status"];
  }): Promise<Recipe> {
    if (this.useMockData()) {
      return mockDataStore.createRecipe(data);
    }

    const supabase = createClient();

    const { data: newRecipe, error } = await supabase
      .from("recipes")
      .insert({
        user_id: data.user_id,
        original_url: data.original_url,
        platform: data.platform,
        title: "Processing...",
        status: data.status || "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating recipe:", error);
      throw new Error(`Failed to create recipe: ${error.message}`);
    }

    return newRecipe as Recipe;
  }

  // Update recipe status
  async updateStatus(
    recipeId: string,
    status: Recipe["status"]
  ): Promise<Recipe | null> {
    if (this.useMockData()) {
      return mockDataStore.updateRecipeStatus(recipeId, status);
    }

    const supabase = createClient();

    const { data, error } = await supabase
      .from("recipes")
      .update({ status })
      .eq("id", recipeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating recipe status:", error);
      throw new Error(`Failed to update recipe status: ${error.message}`);
    }

    return data as Recipe;
  }

  // Update recipe details
  async update(
    recipeId: string,
    data: Partial<Recipe>
  ): Promise<Recipe | null> {
    if (this.useMockData()) {
      return mockDataStore.updateRecipe(recipeId, data);
    }

    const supabase = createClient();

    // Remove id and user_id from update data (shouldn't be updated)
    const { id, user_id, ...updateData } = data;

    const { data: updatedRecipe, error } = await supabase
      .from("recipes")
      .update(updateData)
      .eq("id", recipeId)
      .select()
      .single();

    if (error) {
      console.error("Error updating recipe:", error);
      throw new Error(`Failed to update recipe: ${error.message}`);
    }

    return updatedRecipe as Recipe;
  }

  // Delete a recipe (cascade will handle ingredients and instructions)
  async delete(recipeId: string): Promise<boolean> {
    if (this.useMockData()) {
      return mockDataStore.deleteRecipe(recipeId);
    }

    const supabase = createClient();

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (error) {
      console.error("Error deleting recipe:", error);
      throw new Error(`Failed to delete recipe: ${error.message}`);
    }

    return true;
  }
}

// Singleton instance
export const recipeRepository = new RecipeRepository();
