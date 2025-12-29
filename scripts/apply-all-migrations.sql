-- ============================================
-- SaveIt Recipe Edition - Complete Database Setup
-- ============================================
-- This file consolidates all migrations for easy execution
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/vrmcsskflsvxcujunevm/editor/sql
--
-- Execution order:
-- 1. Initial schema (tables, indexes, triggers)
-- 2. RLS policies
-- 3. Storage buckets and policies
-- 4. Phase 2 schema updates (recipe fields)
-- 5. Phase 2 schema updates (collections, indexes)
-- 6. Recipe status enum update
-- ============================================


-- ============================================
-- MIGRATION 001: Initial Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'facebook')),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  servings INTEGER,
  cuisine TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  embedding vector(1536)
);

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  raw_text TEXT NOT NULL,
  item TEXT,
  quantity FLOAT,
  unit TEXT,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Instructions table
CREATE TABLE IF NOT EXISTS instructions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  text TEXT NOT NULL
);

-- Collections (Cookbooks) table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection items junction table
CREATE TABLE IF NOT EXISTS collection_items (
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (collection_id, recipe_id)
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE
);

-- Recipe tags junction table
CREATE TABLE IF NOT EXISTS recipe_tags (
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (recipe_id, tag_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_status ON recipes(status);
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_instructions_recipe_id ON instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_recipe_id ON collection_items(recipe_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================
-- MIGRATION 002: RLS Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructions ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Recipes policies
DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
CREATE POLICY "Users can insert own recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;
CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Ingredients policies (based on recipe ownership)
DROP POLICY IF EXISTS "Users can view ingredients for own recipes" ON ingredients;
CREATE POLICY "Users can view ingredients for own recipes" ON ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert ingredients for own recipes" ON ingredients;
CREATE POLICY "Users can insert ingredients for own recipes" ON ingredients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update ingredients for own recipes" ON ingredients;
CREATE POLICY "Users can update ingredients for own recipes" ON ingredients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete ingredients for own recipes" ON ingredients;
CREATE POLICY "Users can delete ingredients for own recipes" ON ingredients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid()
    )
  );

-- Instructions policies (based on recipe ownership)
DROP POLICY IF EXISTS "Users can view instructions for own recipes" ON instructions;
CREATE POLICY "Users can view instructions for own recipes" ON instructions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = instructions.recipe_id AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert instructions for own recipes" ON instructions;
CREATE POLICY "Users can insert instructions for own recipes" ON instructions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = instructions.recipe_id AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update instructions for own recipes" ON instructions;
CREATE POLICY "Users can update instructions for own recipes" ON instructions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = instructions.recipe_id AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete instructions for own recipes" ON instructions;
CREATE POLICY "Users can delete instructions for own recipes" ON instructions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = instructions.recipe_id AND recipes.user_id = auth.uid()
    )
  );

-- Collections policies
DROP POLICY IF EXISTS "Users can view own collections" ON collections;
CREATE POLICY "Users can view own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own collections" ON collections;
CREATE POLICY "Users can insert own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own collections" ON collections;
CREATE POLICY "Users can update own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collections" ON collections;
CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- Collection items policies (based on collection ownership)
DROP POLICY IF EXISTS "Users can view items in own collections" ON collection_items;
CREATE POLICY "Users can view items in own collections" ON collection_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add items to own collections" ON collection_items;
CREATE POLICY "Users can add items to own collections" ON collection_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can remove items from own collections" ON collection_items;
CREATE POLICY "Users can remove items from own collections" ON collection_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid()
    )
  );

-- Tags are public (read-only for all authenticated users)
DROP POLICY IF EXISTS "Anyone can view tags" ON tags;
CREATE POLICY "Anyone can view tags" ON tags
  FOR SELECT USING (true);

-- Recipe tags policies (based on recipe ownership)
DROP POLICY IF EXISTS "Users can view tags for own recipes" ON recipe_tags;
CREATE POLICY "Users can view tags for own recipes" ON recipe_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = recipe_tags.recipe_id AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can add tags to own recipes" ON recipe_tags;
CREATE POLICY "Users can add tags to own recipes" ON recipe_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = recipe_tags.recipe_id AND recipes.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can remove tags from own recipes" ON recipe_tags;
CREATE POLICY "Users can remove tags from own recipes" ON recipe_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = recipe_tags.recipe_id AND recipes.user_id = auth.uid()
    )
  );


-- ============================================
-- MIGRATION 003: Storage Buckets
-- ============================================

-- Create storage buckets for thumbnails and audio
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-thumbnails', 'recipe-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-audio', 'recipe-audio', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for thumbnails bucket (public read, authenticated write)
DROP POLICY IF EXISTS "Anyone can view thumbnails" ON storage.objects;
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-thumbnails');

DROP POLICY IF EXISTS "Authenticated users can upload thumbnails" ON storage.objects;
CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-thumbnails'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can update own thumbnails" ON storage.objects;
CREATE POLICY "Users can update own thumbnails"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'recipe-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete own thumbnails" ON storage.objects;
CREATE POLICY "Users can delete own thumbnails"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipe-thumbnails'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for audio bucket (authenticated access only)
DROP POLICY IF EXISTS "Users can view own audio" ON storage.objects;
CREATE POLICY "Users can view own audio"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'recipe-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Authenticated users can upload audio" ON storage.objects;
CREATE POLICY "Authenticated users can upload audio"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-audio'
  AND auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Users can delete own audio" ON storage.objects;
CREATE POLICY "Users can delete own audio"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'recipe-audio'
  AND auth.uid()::text = (storage.foldername(name))[1]
);


-- ============================================
-- MIGRATION 003b: Add Recipe Fields
-- ============================================

-- Add new columns to recipes table
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Set NOT NULL constraint after ensuring all rows have a value
UPDATE recipes SET is_favorite = false WHERE is_favorite IS NULL;
ALTER TABLE recipes
  ALTER COLUMN is_favorite SET NOT NULL,
  ALTER COLUMN is_favorite SET DEFAULT false;

ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Set updated_at = created_at for all existing recipes
UPDATE recipes
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Now set NOT NULL and default
ALTER TABLE recipes
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now();

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call update_updated_at() before any recipe update
DROP TRIGGER IF EXISTS recipes_updated_at ON recipes;
CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION update_updated_at();

-- Create indexes for new queryable fields
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON recipes(is_favorite)
  WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_collection_items_added_at ON collection_items(added_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON recipes(updated_at DESC);


-- ============================================
-- MIGRATION 004: Phase 2 Schema Updates
-- ============================================

-- Add updated_at to collections
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

UPDATE collections
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE collections
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT now();

-- Create trigger for auto-updating collections.updated_at
DROP TRIGGER IF EXISTS collections_updated_at ON collections;
CREATE TRIGGER collections_updated_at
  BEFORE UPDATE ON collections
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION update_updated_at();

CREATE INDEX IF NOT EXISTS idx_collections_updated_at ON collections(updated_at DESC);

-- Add platform index for filtering
CREATE INDEX IF NOT EXISTS idx_recipes_platform ON recipes(platform);
CREATE INDEX IF NOT EXISTS idx_recipes_user_platform ON recipes(user_id, platform);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_recipes_title_search ON recipes USING gin(to_tsvector('english', title));

-- Service role access comments
COMMENT ON TABLE ingredients IS 'Service role can insert via recipe processing. RLS bypassed.';
COMMENT ON TABLE instructions IS 'Service role can insert via recipe processing. RLS bypassed.';

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_recipes_user_favorites ON recipes(user_id, is_favorite)
  WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_recipes_user_created ON recipes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_user_created ON collections(user_id, created_at DESC);


-- ============================================
-- MIGRATION 004b: Update Recipe Status Enum
-- ============================================

-- Drop the old constraint
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_status_check;

-- Add the new constraint with all status values
ALTER TABLE recipes
  ADD CONSTRAINT recipes_status_check
  CHECK (status IN (
    'pending',
    'downloading',
    'extracting_audio',
    'transcribing',
    'analyzing',
    'completed',
    'failed'
  ));

-- Update any 'processing' status to 'pending' (if any exist)
UPDATE recipes
SET status = 'pending'
WHERE status = 'processing';


-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- All tables, policies, indexes, and triggers have been created.
-- You can now verify the schema in the Supabase Table Editor.
-- ============================================
