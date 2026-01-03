-- Description: Add missing fields to recipes table and collection_items for Phase 2 UI features
-- Based on Schema_Review_Changes.md analysis
-- Adds: notes, is_favorite, updated_at to recipes
-- Adds: trigger for auto-updating updated_at
-- Adds: performance indexes for new queryable fields

-- 1. Add new columns to recipes table
-- Notes: nullable text field for user's personal modifications
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- is_favorite: boolean flag for favorites/bookmark functionality
-- Default to false for all existing and new recipes
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Set NOT NULL constraint after ensuring all rows have a value
UPDATE recipes SET is_favorite = false WHERE is_favorite IS NULL;
ALTER TABLE recipes
  ALTER COLUMN is_favorite SET NOT NULL,
  ALTER COLUMN is_favorite SET DEFAULT false;

-- updated_at: timestamp for tracking recipe modifications
-- Initialize with created_at for existing recipes, then set default
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

-- 2. Create function to auto-update updated_at timestamp
-- This function will automatically set updated_at to current timestamp on any UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create trigger to call update_updated_at() before any recipe update
-- Only updates updated_at if other fields actually changed (not just updated_at itself)
DROP TRIGGER IF EXISTS recipes_updated_at ON recipes;
CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)  -- Only fire if data actually changed
  EXECUTE FUNCTION update_updated_at();

-- 4. Create indexes for new queryable fields
-- Index for favorites filter (used in collection details page)
CREATE INDEX IF NOT EXISTS idx_recipes_is_favorite ON recipes(is_favorite) 
  WHERE is_favorite = true;  -- Partial index for better performance

-- Index for collection_items.added_at (already exists in 001, but ensure it's optimized)
-- Note: added_at column already exists from 001_initial_schema.sql
CREATE INDEX IF NOT EXISTS idx_collection_items_added_at ON collection_items(added_at DESC);

-- 5. Add index for updated_at for sorting/filtering by modification date
CREATE INDEX IF NOT EXISTS idx_recipes_updated_at ON recipes(updated_at DESC);






