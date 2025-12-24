-- Description: Schema updates for Phase 2 features
-- Addresses: collection updated_at, platform index, full-text search, service role access

-- ============================================
-- 1. Add updated_at to collections table
-- ============================================

-- Add updated_at column to collections
ALTER TABLE collections
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Initialize existing rows with created_at
UPDATE collections
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Set NOT NULL and default
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

-- Index for sorting collections by last modified
CREATE INDEX IF NOT EXISTS idx_collections_updated_at ON collections(updated_at DESC);


-- ============================================
-- 2. Add platform index for filtering
-- ============================================

-- Index for platform filtering (used heavily in dashboard)
CREATE INDEX IF NOT EXISTS idx_recipes_platform ON recipes(platform);

-- Composite index for user + platform queries
CREATE INDEX IF NOT EXISTS idx_recipes_user_platform ON recipes(user_id, platform);


-- ============================================
-- 3. Full-text search indexes
-- ============================================

-- Create GIN index for full-text search on recipe title and description
CREATE INDEX IF NOT EXISTS idx_recipes_title_search ON recipes USING gin(to_tsvector('english', title));

-- Composite search vector for title + description (optional, for broader search)
-- This requires a generated column or a separate approach
-- For now, we'll handle this in the query layer with:
-- WHERE to_tsvector('english', title || ' ' || COALESCE(description, '')) @@ plainto_tsquery('english', :search_term)


-- ============================================
-- 4. Service role access for recipe processing
-- ============================================

-- Allow service role to update recipes (for external processing service)
-- This bypasses RLS for the service role key
-- Note: Service role already bypasses RLS by default in Supabase
-- But we can add explicit policies if needed for specific scenarios

-- Add policy for service role to insert ingredients (processing service)
-- Service role bypasses RLS, but documenting the intent
COMMENT ON TABLE ingredients IS 'Service role can insert via recipe processing. RLS bypassed.';
COMMENT ON TABLE instructions IS 'Service role can insert via recipe processing. RLS bypassed.';


-- ============================================
-- 5. Add composite indexes for common queries
-- ============================================

-- Index for user's favorite recipes (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_recipes_user_favorites ON recipes(user_id, is_favorite)
  WHERE is_favorite = true;

-- Index for user's recipes by creation date (dashboard sorting)
CREATE INDEX IF NOT EXISTS idx_recipes_user_created ON recipes(user_id, created_at DESC);

-- Index for user's collections by creation date
CREATE INDEX IF NOT EXISTS idx_collections_user_created ON collections(user_id, created_at DESC);


-- ============================================
-- 6. Add constraint for valid platforms (defensive)
-- ============================================

-- The check constraint already exists, but ensure it's correct
-- ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_platform_check;
-- ALTER TABLE recipes ADD CONSTRAINT recipes_platform_check
--   CHECK (platform IN ('tiktok', 'instagram', 'youtube', 'facebook'));
-- (Already exists from 001_initial_schema.sql)
