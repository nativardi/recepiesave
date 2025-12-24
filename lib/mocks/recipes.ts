// Description: Mock recipe data for development and testing

import { Recipe, Ingredient, Instruction, RecipeWithDetails } from "@/lib/types/database";

export const mockRecipes: Recipe[] = [
  {
    id: "recipe-1",
    user_id: "dev-user-uuid-12345",
    original_url: "https://www.tiktok.com/@chef/video/123456",
    platform: "tiktok",
    title: "Spicy Rigatoni Vodka",
    description: "Creamy pasta with a kick of spice",
    notes: null,
    thumbnail_url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400",
    video_url: null,
    prep_time_minutes: 10,
    cook_time_minutes: 20,
    servings: 4,
    cuisine: "Italian",
    is_favorite: true,
    status: "completed",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "recipe-2",
    user_id: "dev-user-uuid-12345",
    original_url: "https://www.instagram.com/reel/ABC123/",
    platform: "instagram",
    title: "Chocolate Chip Cookies",
    description: "Classic homemade cookies",
    notes: "Use dark chocolate chips for richer flavor",
    thumbnail_url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400",
    video_url: null,
    prep_time_minutes: 15,
    cook_time_minutes: 12,
    servings: 24,
    cuisine: "American",
    is_favorite: false,
    status: "completed",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "recipe-3",
    user_id: "dev-user-uuid-12345",
    original_url: "https://www.youtube.com/shorts/xyz789",
    platform: "youtube",
    title: "Thai Green Curry",
    description: "Authentic Thai curry with coconut milk",
    notes: null,
    thumbnail_url: "https://images.unsplash.com/photo-1559314809-0c8c4a549b36?w=400",
    video_url: null,
    prep_time_minutes: 15,
    cook_time_minutes: 25,
    servings: 4,
    cuisine: "Thai",
    is_favorite: true,
    status: "processing",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export const mockIngredients: Ingredient[] = [
  // Recipe 1 ingredients
  { id: "ing-1", recipe_id: "recipe-1", raw_text: "1 lb rigatoni pasta", item: "rigatoni pasta", quantity: 1, unit: "lb", order_index: 0 },
  { id: "ing-2", recipe_id: "recipe-1", raw_text: "2 cups heavy cream", item: "heavy cream", quantity: 2, unit: "cups", order_index: 1 },
  { id: "ing-3", recipe_id: "recipe-1", raw_text: "1/2 cup vodka", item: "vodka", quantity: 0.5, unit: "cup", order_index: 2 },
  { id: "ing-4", recipe_id: "recipe-1", raw_text: "1 can crushed tomatoes", item: "crushed tomatoes", quantity: 1, unit: "can", order_index: 3 },
  { id: "ing-5", recipe_id: "recipe-1", raw_text: "1 tsp red pepper flakes", item: "red pepper flakes", quantity: 1, unit: "tsp", order_index: 4 },
  // Recipe 2 ingredients
  { id: "ing-6", recipe_id: "recipe-2", raw_text: "2 1/4 cups all-purpose flour", item: "all-purpose flour", quantity: 2.25, unit: "cups", order_index: 0 },
  { id: "ing-7", recipe_id: "recipe-2", raw_text: "1 cup butter, softened", item: "butter", quantity: 1, unit: "cup", order_index: 1 },
  { id: "ing-8", recipe_id: "recipe-2", raw_text: "3/4 cup brown sugar", item: "brown sugar", quantity: 0.75, unit: "cup", order_index: 2 },
  { id: "ing-9", recipe_id: "recipe-2", raw_text: "2 cups chocolate chips", item: "chocolate chips", quantity: 2, unit: "cups", order_index: 3 },
];

export const mockInstructions: Instruction[] = [
  // Recipe 1 instructions
  { id: "inst-1", recipe_id: "recipe-1", step_number: 1, text: "Bring a large pot of salted water to a boil. Add rigatoni and cook according to package directions until al dente." },
  { id: "inst-2", recipe_id: "recipe-1", step_number: 2, text: "In a large skillet, heat olive oil over medium heat. Add garlic and red pepper flakes, cook for 1 minute." },
  { id: "inst-3", recipe_id: "recipe-1", step_number: 3, text: "Add vodka and let it reduce by half, about 2 minutes." },
  { id: "inst-4", recipe_id: "recipe-1", step_number: 4, text: "Stir in crushed tomatoes and heavy cream. Simmer for 5 minutes until sauce thickens." },
  { id: "inst-5", recipe_id: "recipe-1", step_number: 5, text: "Toss cooked pasta with sauce. Serve immediately with grated parmesan." },
  // Recipe 2 instructions
  { id: "inst-6", recipe_id: "recipe-2", step_number: 1, text: "Preheat oven to 375°F (190°C)." },
  { id: "inst-7", recipe_id: "recipe-2", step_number: 2, text: "In a large bowl, cream together butter, brown sugar, and white sugar until smooth." },
  { id: "inst-8", recipe_id: "recipe-2", step_number: 3, text: "Beat in eggs one at a time, then stir in vanilla." },
  { id: "inst-9", recipe_id: "recipe-2", step_number: 4, text: "Gradually blend in flour mixture. Stir in chocolate chips." },
  { id: "inst-10", recipe_id: "recipe-2", step_number: 5, text: "Drop rounded tablespoons onto ungreased cookie sheets. Bake 9-11 minutes until golden brown." },
];

export function getRecipeWithDetails(recipeId: string): RecipeWithDetails | null {
  const recipe = mockRecipes.find((r) => r.id === recipeId);
  if (!recipe) return null;

  return {
    ...recipe,
    ingredients: mockIngredients
      .filter((ing) => ing.recipe_id === recipeId)
      .sort((a, b) => a.order_index - b.order_index),
    instructions: mockInstructions
      .filter((inst) => inst.recipe_id === recipeId)
      .sort((a, b) => a.step_number - b.step_number),
  };
}

export function getAllRecipesWithDetails(): RecipeWithDetails[] {
  return mockRecipes.map((recipe) => getRecipeWithDetails(recipe.id)!);
}
