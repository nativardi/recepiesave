// Description: TypeScript types aligned to Supabase database schema from Database_Schema.md

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  preferences?: {
    metric_system?: boolean;
    notifications_enabled?: boolean;
    dietary_tags?: string[];
  };
};

export type RecipeStatus = "processing" | "completed" | "failed" | "pending";

export type Recipe = {
  id: string;
  user_id: string;
  original_url: string;
  platform: "tiktok" | "instagram" | "youtube" | "facebook";
  title: string;
  description: string | null;
  notes: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  servings: number | null;
  cuisine: string | null;
  is_favorite: boolean;
  status: RecipeStatus;
  created_at: string;
  updated_at: string;
};

export type Ingredient = {
  id: string;
  recipe_id: string;
  raw_text: string;
  item: string | null;
  quantity: number | null;
  unit: string | null;
  order_index: number;
};

export type Instruction = {
  id: string;
  recipe_id: string;
  step_number: number;
  text: string;
};

export type Collection = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CollectionItem = {
  collection_id: string;
  recipe_id: string;
  added_at: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type RecipeTag = {
  recipe_id: string;
  tag_id: string;
};

// Extended types for UI
export type RecipeWithDetails = Recipe & {
  ingredients: Ingredient[];
  instructions: Instruction[];
  tags?: Tag[];
};

export type CollectionWithRecipes = Collection & {
  recipes: Recipe[];
  recipe_count: number;
};
