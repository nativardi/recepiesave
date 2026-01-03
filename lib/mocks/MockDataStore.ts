// Description: Singleton mock data store with localStorage persistence for dev mode

"use client";

import {
  Recipe,
  Ingredient,
  Instruction,
  Collection,
  CollectionItem,
  RecipeWithDetails,
  CollectionWithRecipes,
} from "@/lib/types/database";
import { mockRecipes, mockIngredients, mockInstructions } from "./recipes";
import { mockCollections, mockCollectionItems } from "./collections";

const STORAGE_KEY = "saveit_mock_data";
const STORAGE_VERSION = 1;

interface MockDataStorage {
  version: number;
  recipes: Recipe[];
  ingredients: Ingredient[];
  instructions: Instruction[];
  collections: Collection[];
  collectionItems: CollectionItem[];
  lastUpdated: string;
}

class MockDataStore {
  private recipes: Recipe[] = [];
  private ingredients: Ingredient[] = [];
  private instructions: Instruction[] = [];
  private collections: Collection[] = [];
  private collectionItems: CollectionItem[] = [];
  private initialized: boolean = false;

  constructor() {
    // Defer initialization to first access (client-side only)
  }

  private ensureInitialized(): void {
    if (this.initialized) return;

    // Only run on client side
    if (typeof window === "undefined") {
      this.loadDefaults();
      return;
    }

    this.loadFromStorage();
    this.initialized = true;
  }

  private loadDefaults(): void {
    this.recipes = [...mockRecipes];
    this.ingredients = [...mockIngredients];
    this.instructions = [...mockInstructions];
    this.collections = [...mockCollections];
    this.collectionItems = mockCollectionItems.map((item) => ({
      collection_id: item.collection_id,
      recipe_id: item.recipe_id,
      added_at: item.added_at,
    }));
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: MockDataStorage = JSON.parse(stored);
        if (data.version === STORAGE_VERSION) {
          this.recipes = data.recipes;
          this.ingredients = data.ingredients;
          this.instructions = data.instructions;
          this.collections = data.collections;
          this.collectionItems = data.collectionItems;
          return;
        }
      }
    } catch (error) {
      console.warn("Failed to load mock data from localStorage:", error);
    }

    // Fall back to defaults
    this.loadDefaults();
    this.saveToStorage();
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const data: MockDataStorage = {
        version: STORAGE_VERSION,
        recipes: this.recipes,
        ingredients: this.ingredients,
        instructions: this.instructions,
        collections: this.collections,
        collectionItems: this.collectionItems,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save mock data to localStorage:", error);
    }
  }

  // ==================== Recipe Operations ====================

  getRecipes(userId: string): Recipe[] {
    this.ensureInitialized();
    return this.recipes
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getRecipe(recipeId: string): Recipe | null {
    this.ensureInitialized();
    return this.recipes.find((r) => r.id === recipeId) || null;
  }

  getRecipeWithDetails(recipeId: string): RecipeWithDetails | null {
    this.ensureInitialized();
    const recipe = this.getRecipe(recipeId);
    if (!recipe) return null;

    return {
      ...recipe,
      ingredients: this.ingredients
        .filter((i) => i.recipe_id === recipeId)
        .sort((a, b) => a.order_index - b.order_index),
      instructions: this.instructions
        .filter((i) => i.recipe_id === recipeId)
        .sort((a, b) => a.step_number - b.step_number),
    };
  }

  getAllRecipesWithDetails(userId: string): RecipeWithDetails[] {
    this.ensureInitialized();
    const userRecipes = this.getRecipes(userId);
    return userRecipes.map((recipe) => ({
      ...recipe,
      ingredients: this.ingredients
        .filter((i) => i.recipe_id === recipe.id)
        .sort((a, b) => a.order_index - b.order_index),
      instructions: this.instructions
        .filter((i) => i.recipe_id === recipe.id)
        .sort((a, b) => a.step_number - b.step_number),
    }));
  }

  getRecipesByIds(recipeIds: string[]): Recipe[] {
    this.ensureInitialized();
    return this.recipes.filter((r) => recipeIds.includes(r.id));
  }

  createRecipe(data: {
    user_id: string;
    original_url: string;
    platform: Recipe["platform"];
    status?: Recipe["status"];
  }): Recipe {
    this.ensureInitialized();
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      original_url: data.original_url,
      platform: data.platform,
      creator_name: null,
      title: "Processing...",
      description: null,
      notes: null,
      thumbnail_url: null,
      video_url: null,
      prep_time_minutes: null,
      cook_time_minutes: null,
      servings: null,
      cuisine: null,
      is_favorite: false,
      status: data.status || "pending",
      created_at: now,
      updated_at: now,
    };

    this.recipes.push(recipe);
    this.saveToStorage();
    return recipe;
  }

  updateRecipe(recipeId: string, data: Partial<Recipe>): Recipe | null {
    this.ensureInitialized();
    const index = this.recipes.findIndex((r) => r.id === recipeId);
    if (index === -1) return null;

    // Don't update id or user_id
    const { id, user_id, ...updateData } = data;

    this.recipes[index] = {
      ...this.recipes[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    this.saveToStorage();
    return this.recipes[index];
  }

  updateRecipeStatus(recipeId: string, status: Recipe["status"]): Recipe | null {
    return this.updateRecipe(recipeId, { status });
  }

  deleteRecipe(recipeId: string): boolean {
    this.ensureInitialized();
    const index = this.recipes.findIndex((r) => r.id === recipeId);
    if (index === -1) return false;

    // Cascade delete
    this.ingredients = this.ingredients.filter((i) => i.recipe_id !== recipeId);
    this.instructions = this.instructions.filter((i) => i.recipe_id !== recipeId);
    this.collectionItems = this.collectionItems.filter((ci) => ci.recipe_id !== recipeId);

    this.recipes.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // ==================== Ingredient Operations ====================

  addIngredients(recipeId: string, ingredients: Omit<Ingredient, "id">[]): Ingredient[] {
    this.ensureInitialized();
    const newIngredients = ingredients.map((ing, index) => ({
      id: crypto.randomUUID(),
      recipe_id: recipeId,
      raw_text: ing.raw_text,
      item: ing.item,
      quantity: ing.quantity,
      unit: ing.unit,
      order_index: ing.order_index ?? index,
    }));

    this.ingredients.push(...newIngredients);
    this.saveToStorage();
    return newIngredients;
  }

  // ==================== Instruction Operations ====================

  addInstructions(recipeId: string, instructions: Omit<Instruction, "id">[]): Instruction[] {
    this.ensureInitialized();
    const newInstructions = instructions.map((inst, index) => ({
      id: crypto.randomUUID(),
      recipe_id: recipeId,
      step_number: inst.step_number ?? index + 1,
      text: inst.text,
    }));

    this.instructions.push(...newInstructions);
    this.saveToStorage();
    return newInstructions;
  }

  // ==================== Collection Operations ====================

  getCollections(userId: string): Collection[] {
    this.ensureInitialized();
    return this.collections
      .filter((c) => c.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getCollection(collectionId: string): Collection | null {
    this.ensureInitialized();
    return this.collections.find((c) => c.id === collectionId) || null;
  }

  getCollectionWithRecipes(collectionId: string): CollectionWithRecipes | null {
    this.ensureInitialized();
    const collection = this.getCollection(collectionId);
    if (!collection) return null;

    const recipeIds = this.collectionItems
      .filter((ci) => ci.collection_id === collectionId)
      .map((ci) => ci.recipe_id);

    const recipes = this.getRecipesByIds(recipeIds);

    return {
      ...collection,
      recipes,
      recipe_count: recipes.length,
    };
  }

  getAllCollectionsWithRecipes(userId: string): CollectionWithRecipes[] {
    this.ensureInitialized();
    const userCollections = this.getCollections(userId);
    return userCollections.map((collection) => {
      const recipeIds = this.collectionItems
        .filter((ci) => ci.collection_id === collection.id)
        .map((ci) => ci.recipe_id);

      const recipes = this.getRecipesByIds(recipeIds);

      return {
        ...collection,
        recipes,
        recipe_count: recipes.length,
      };
    });
  }

  getCollectionItems(collectionId: string): CollectionItem[] {
    this.ensureInitialized();
    return this.collectionItems.filter((ci) => ci.collection_id === collectionId);
  }

  createCollection(data: {
    user_id: string;
    name: string;
    description?: string | null;
  }): Collection {
    this.ensureInitialized();
    const now = new Date().toISOString();
    const collection: Collection = {
      id: crypto.randomUUID(),
      user_id: data.user_id,
      name: data.name,
      description: data.description || null,
      created_at: now,
      updated_at: now,
    };

    this.collections.push(collection);
    this.saveToStorage();
    return collection;
  }

  updateCollection(collectionId: string, data: Partial<Collection>): Collection | null {
    this.ensureInitialized();
    const index = this.collections.findIndex((c) => c.id === collectionId);
    if (index === -1) return null;

    // Don't update id or user_id
    const { id, user_id, ...updateData } = data;

    this.collections[index] = {
      ...this.collections[index],
      ...updateData,
      updated_at: new Date().toISOString(),
    };

    this.saveToStorage();
    return this.collections[index];
  }

  deleteCollection(collectionId: string): boolean {
    this.ensureInitialized();
    const index = this.collections.findIndex((c) => c.id === collectionId);
    if (index === -1) return false;

    // Remove collection items
    this.collectionItems = this.collectionItems.filter((ci) => ci.collection_id !== collectionId);

    this.collections.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  addRecipeToCollection(collectionId: string, recipeId: string): boolean {
    this.ensureInitialized();

    // Check if already exists (idempotent)
    const exists = this.collectionItems.some(
      (ci) => ci.collection_id === collectionId && ci.recipe_id === recipeId
    );
    if (exists) return true;

    this.collectionItems.push({
      collection_id: collectionId,
      recipe_id: recipeId,
      added_at: new Date().toISOString(),
    });

    this.saveToStorage();
    return true;
  }

  removeRecipeFromCollection(collectionId: string, recipeId: string): boolean {
    this.ensureInitialized();
    const index = this.collectionItems.findIndex(
      (ci) => ci.collection_id === collectionId && ci.recipe_id === recipeId
    );

    if (index === -1) return true; // Already removed

    this.collectionItems.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  // ==================== Mock Processing Simulation ====================

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async simulateRecipeProcessing(recipeId: string, url: string): Promise<void> {
    // Stage 1: Downloading (1 second)
    this.updateRecipe(recipeId, {
      status: "processing",
      title: "Downloading video...",
    });
    await this.sleep(1000);

    // Stage 2: Transcribing (1.5 seconds)
    this.updateRecipe(recipeId, {
      title: "Transcribing audio...",
    });
    await this.sleep(1500);

    // Stage 3: Analyzing (1.5 seconds)
    this.updateRecipe(recipeId, {
      title: "Analyzing recipe...",
    });
    await this.sleep(1500);

    // Stage 4: Complete - generate mock data
    const mockData = this.generateMockRecipeData(url);

    this.updateRecipe(recipeId, {
      status: "completed",
      title: mockData.title,
      description: mockData.description,
      cuisine: mockData.cuisine,
      prep_time_minutes: mockData.prep_time,
      cook_time_minutes: mockData.cook_time,
      servings: mockData.servings,
      thumbnail_url: mockData.thumbnail,
    });

    // Add ingredients
    this.addIngredients(
      recipeId,
      mockData.ingredients.map((ing, index) => ({
        recipe_id: recipeId,
        raw_text: ing.raw_text,
        item: ing.item,
        quantity: ing.quantity,
        unit: ing.unit,
        order_index: index,
      }))
    );

    // Add instructions
    this.addInstructions(
      recipeId,
      mockData.instructions.map((inst, index) => ({
        recipe_id: recipeId,
        step_number: index + 1,
        text: inst,
      }))
    );
  }

  private generateMockRecipeData(url: string): {
    title: string;
    description: string;
    cuisine: string;
    prep_time: number;
    cook_time: number;
    servings: number;
    thumbnail: string;
    ingredients: Array<{ raw_text: string; item: string; quantity: number; unit: string }>;
    instructions: string[];
  } {
    const templates = [
      {
        title: "Creamy Garlic Pasta",
        description: "A quick and delicious pasta with a rich garlic cream sauce",
        cuisine: "Italian",
        prep_time: 10,
        cook_time: 15,
        servings: 4,
        thumbnail: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400",
        ingredients: [
          { raw_text: "1 lb pasta", item: "pasta", quantity: 1, unit: "lb" },
          { raw_text: "1 cup heavy cream", item: "heavy cream", quantity: 1, unit: "cup" },
          { raw_text: "4 cloves garlic, minced", item: "garlic", quantity: 4, unit: "cloves" },
          { raw_text: "1/2 cup parmesan cheese", item: "parmesan cheese", quantity: 0.5, unit: "cup" },
          { raw_text: "2 tbsp butter", item: "butter", quantity: 2, unit: "tbsp" },
          { raw_text: "Salt and pepper to taste", item: "salt and pepper", quantity: 1, unit: "to taste" },
        ],
        instructions: [
          "Boil pasta according to package directions until al dente. Reserve 1 cup pasta water before draining.",
          "In a large pan, melt butter over medium heat. Add minced garlic and sauté for 1 minute.",
          "Pour in heavy cream and bring to a gentle simmer for 3-4 minutes.",
          "Add parmesan cheese and stir until melted and smooth.",
          "Toss in the cooked pasta, adding pasta water as needed to reach desired consistency.",
          "Season with salt and pepper. Serve immediately with extra parmesan on top.",
        ],
      },
      {
        title: "Honey Garlic Chicken",
        description: "Sweet and savory glazed chicken thighs with Asian-inspired flavors",
        cuisine: "Asian Fusion",
        prep_time: 15,
        cook_time: 25,
        servings: 4,
        thumbnail: "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400",
        ingredients: [
          { raw_text: "2 lbs chicken thighs", item: "chicken thighs", quantity: 2, unit: "lbs" },
          { raw_text: "1/3 cup honey", item: "honey", quantity: 0.33, unit: "cup" },
          { raw_text: "1/4 cup soy sauce", item: "soy sauce", quantity: 0.25, unit: "cup" },
          { raw_text: "4 cloves garlic, minced", item: "garlic", quantity: 4, unit: "cloves" },
          { raw_text: "1 tbsp sesame oil", item: "sesame oil", quantity: 1, unit: "tbsp" },
          { raw_text: "Green onions for garnish", item: "green onions", quantity: 2, unit: "stalks" },
        ],
        instructions: [
          "Pat chicken thighs dry with paper towels and season with salt and pepper.",
          "Heat sesame oil in a large skillet over medium-high heat.",
          "Sear chicken skin-side down for 5-6 minutes until golden and crispy.",
          "Flip chicken and cook for another 3 minutes.",
          "Mix honey, soy sauce, and garlic. Pour over chicken.",
          "Reduce heat and simmer for 10-12 minutes until chicken is cooked through and sauce is thickened.",
          "Garnish with sliced green onions and serve over rice.",
        ],
      },
      {
        title: "Easy Banana Pancakes",
        description: "Fluffy pancakes made with ripe bananas - perfect for weekend brunch",
        cuisine: "American",
        prep_time: 10,
        cook_time: 15,
        servings: 8,
        thumbnail: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400",
        ingredients: [
          { raw_text: "2 ripe bananas", item: "bananas", quantity: 2, unit: "whole" },
          { raw_text: "2 eggs", item: "eggs", quantity: 2, unit: "whole" },
          { raw_text: "1 cup flour", item: "flour", quantity: 1, unit: "cup" },
          { raw_text: "1/2 cup milk", item: "milk", quantity: 0.5, unit: "cup" },
          { raw_text: "1 tsp baking powder", item: "baking powder", quantity: 1, unit: "tsp" },
          { raw_text: "1 tbsp maple syrup", item: "maple syrup", quantity: 1, unit: "tbsp" },
        ],
        instructions: [
          "Mash bananas in a large bowl until smooth.",
          "Whisk in eggs, milk, and maple syrup until combined.",
          "Add flour and baking powder, stirring until just combined (some lumps are okay).",
          "Heat a non-stick pan or griddle over medium heat and lightly grease.",
          "Pour 1/4 cup batter for each pancake. Cook until bubbles form on surface.",
          "Flip and cook for another 1-2 minutes until golden brown.",
          "Serve warm with butter and extra maple syrup.",
        ],
      },
      {
        title: "Mediterranean Quinoa Bowl",
        description: "A healthy and colorful bowl packed with fresh vegetables and feta",
        cuisine: "Mediterranean",
        prep_time: 15,
        cook_time: 20,
        servings: 2,
        thumbnail: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400",
        ingredients: [
          { raw_text: "1 cup quinoa", item: "quinoa", quantity: 1, unit: "cup" },
          { raw_text: "1 cucumber, diced", item: "cucumber", quantity: 1, unit: "whole" },
          { raw_text: "1 cup cherry tomatoes, halved", item: "cherry tomatoes", quantity: 1, unit: "cup" },
          { raw_text: "1/2 cup feta cheese, crumbled", item: "feta cheese", quantity: 0.5, unit: "cup" },
          { raw_text: "1/4 cup kalamata olives", item: "kalamata olives", quantity: 0.25, unit: "cup" },
          { raw_text: "2 tbsp olive oil", item: "olive oil", quantity: 2, unit: "tbsp" },
          { raw_text: "1 tbsp lemon juice", item: "lemon juice", quantity: 1, unit: "tbsp" },
        ],
        instructions: [
          "Rinse quinoa and cook according to package directions. Let cool slightly.",
          "While quinoa cooks, prepare all vegetables - dice cucumber, halve tomatoes.",
          "Make dressing by whisking olive oil, lemon juice, salt, and pepper.",
          "In a large bowl, combine cooked quinoa with cucumber, tomatoes, and olives.",
          "Drizzle with dressing and toss gently to combine.",
          "Top with crumbled feta cheese and fresh herbs if desired.",
          "Serve at room temperature or chilled.",
        ],
      },
      {
        title: "Spicy Shrimp Tacos",
        description: "Quick and flavorful tacos with seasoned shrimp and fresh toppings",
        cuisine: "Mexican",
        prep_time: 15,
        cook_time: 10,
        servings: 4,
        thumbnail: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400",
        ingredients: [
          { raw_text: "1 lb large shrimp, peeled", item: "shrimp", quantity: 1, unit: "lb" },
          { raw_text: "8 small tortillas", item: "tortillas", quantity: 8, unit: "whole" },
          { raw_text: "1 tsp chili powder", item: "chili powder", quantity: 1, unit: "tsp" },
          { raw_text: "1/2 tsp cumin", item: "cumin", quantity: 0.5, unit: "tsp" },
          { raw_text: "1 cup shredded cabbage", item: "cabbage", quantity: 1, unit: "cup" },
          { raw_text: "1/2 cup sour cream", item: "sour cream", quantity: 0.5, unit: "cup" },
          { raw_text: "1 lime, cut into wedges", item: "lime", quantity: 1, unit: "whole" },
        ],
        instructions: [
          "Season shrimp with chili powder, cumin, salt, and pepper.",
          "Heat oil in a skillet over high heat.",
          "Cook shrimp for 2-3 minutes per side until pink and slightly charred.",
          "Warm tortillas in a dry pan or microwave.",
          "Mix sour cream with a squeeze of lime juice for the crema.",
          "Assemble tacos with shrimp, cabbage, and lime crema.",
          "Serve with lime wedges and your favorite hot sauce.",
        ],
      },
    ];

    // Use URL hash to deterministically pick a template (for consistent testing)
    const urlHash = url.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const templateIndex = urlHash % templates.length;

    return templates[templateIndex];
  }

  // ==================== Utility Operations ====================

  resetToDefaults(): void {
    this.loadDefaults();
    this.saveToStorage();
  }

  exportData(): MockDataStorage {
    this.ensureInitialized();
    return {
      version: STORAGE_VERSION,
      recipes: this.recipes,
      ingredients: this.ingredients,
      instructions: this.instructions,
      collections: this.collections,
      collectionItems: this.collectionItems,
      lastUpdated: new Date().toISOString(),
    };
  }

  importData(data: MockDataStorage): boolean {
    if (data.version !== STORAGE_VERSION) {
      console.error("Incompatible data version");
      return false;
    }

    this.recipes = data.recipes;
    this.ingredients = data.ingredients;
    this.instructions = data.instructions;
    this.collections = data.collections;
    this.collectionItems = data.collectionItems;
    this.saveToStorage();
    return true;
  }

  getStorageSize(): number {
    if (typeof window === "undefined") return 0;
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? new Blob([data]).size : 0;
  }
}

// Singleton instance
export const mockDataStore = new MockDataStore();
