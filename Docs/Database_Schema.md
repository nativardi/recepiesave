# SaveIt: Recipe Edition - Database Schema

## 1. Overview
The database is built on **Supabase (PostgreSQL)**. It leverages relational data for structured queries (e.g., "Find recipes with Chicken") and JSONB for flexible metadata (e.g., AI analysis results). Vector embeddings are used for semantic search.

---

## 2. Tables

### `profiles` (Users)
Stores user account information and preferences.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, FK → auth.users | User's unique identifier |
| `email` | text | NOT NULL | User's email address |
| `full_name` | text | | User's display name |
| `avatar_url` | text | | Profile picture URL |
| `created_at` | timestamptz | DEFAULT now() | Account creation timestamp |
| `preferences` | jsonb | DEFAULT '{}' | User preferences (see below) |

**Preferences JSONB Structure:**
```json
{
  "metric_system": true,
  "notifications_enabled": true,
  "dietary_tags": ["vegetarian", "gluten-free"]
}
```

---

### `recipes`
Core table storing saved recipes from social media platforms.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Recipe unique identifier |
| `user_id` | uuid | FK → profiles.id, NOT NULL | Recipe owner |
| `original_url` | text | NOT NULL | Source link (TikTok/IG/YouTube/Facebook) |
| `platform` | text | NOT NULL | Platform: 'tiktok', 'instagram', 'youtube', 'facebook' |
| `title` | text | NOT NULL | Recipe title (AI-extracted or user-edited) |
| `description` | text | | AI-generated summary of the recipe |
| `notes` | text | | User's personal notes (e.g., "use less salt") |
| `thumbnail_url` | text | | Recipe preview image URL |
| `video_url` | text | | Downloaded/cached video link (optional) |
| `prep_time_minutes` | int | | Preparation time in minutes |
| `cook_time_minutes` | int | | Cooking time in minutes |
| `servings` | int | | Number of servings |
| `cuisine` | text | | Cuisine type (e.g., 'Italian', 'Mexican') |
| `is_favorite` | boolean | DEFAULT false | User's favorite/bookmarked recipes |
| `status` | text | NOT NULL, DEFAULT 'pending' | Processing status (see below) |
| `created_at` | timestamptz | DEFAULT now() | Recipe save timestamp |
| `updated_at` | timestamptz | DEFAULT now() | Last modification timestamp |
| `embedding` | vector(1536) | | OpenAI embedding for semantic search |

**Status Values:**
- `pending` - Recipe queued, awaiting processing
- `processing` - Currently extracting data from video
- `completed` - Successfully processed, ready to view
- `failed` - Processing failed (retry available)

**Platform Values:**
- `tiktok` - TikTok videos
- `instagram` - Instagram Reels
- `youtube` - YouTube Shorts
- `facebook` - Facebook Reels

---

### `ingredients`
Stores recipe ingredients with normalization for powerful "Pantry Search".

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Ingredient unique identifier |
| `recipe_id` | uuid | FK → recipes.id, NOT NULL, ON DELETE CASCADE | Parent recipe |
| `raw_text` | text | NOT NULL | Original text (e.g., "2 cups of diced onions") |
| `item` | text | | Normalized ingredient name (e.g., "onion") |
| `quantity` | float | | Numeric quantity (e.g., 2) |
| `unit` | text | | Unit of measurement (e.g., "cups") |
| `order_index` | int | NOT NULL, DEFAULT 0 | Display order in recipe |

---

### `instructions`
Stores step-by-step cooking instructions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Instruction unique identifier |
| `recipe_id` | uuid | FK → recipes.id, NOT NULL, ON DELETE CASCADE | Parent recipe |
| `step_number` | int | NOT NULL | Step order (1, 2, 3...) |
| `text` | text | NOT NULL | Instruction text |

---

### `collections` (Cookbooks)
User-created recipe collections/cookbooks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Collection unique identifier |
| `user_id` | uuid | FK → profiles.id, NOT NULL | Collection owner |
| `name` | text | NOT NULL | Collection name (e.g., "Holiday Dinner") |
| `description` | text | | Collection description |
| `created_at` | timestamptz | DEFAULT now() | Creation timestamp |

---

### `collection_items`
Junction table linking recipes to collections (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `collection_id` | uuid | FK → collections.id, ON DELETE CASCADE | Parent collection |
| `recipe_id` | uuid | FK → recipes.id, ON DELETE CASCADE | Recipe in collection |
| `added_at` | timestamptz | DEFAULT now() | When recipe was added to collection |

**Primary Key:** (collection_id, recipe_id)

---

### `tags` (Smart Tags)
Predefined and auto-generated tags for recipe categorization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PK, DEFAULT gen_random_uuid() | Tag unique identifier |
| `name` | text | NOT NULL, UNIQUE | Tag name (e.g., "Gluten-Free", "Spicy") |

---

### `recipe_tags`
Junction table linking recipes to tags (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `recipe_id` | uuid | FK → recipes.id, ON DELETE CASCADE | Tagged recipe |
| `tag_id` | uuid | FK → tags.id, ON DELETE CASCADE | Applied tag |

**Primary Key:** (recipe_id, tag_id)

---

## 3. Relationships

```
profiles (1) ──────< (many) recipes
profiles (1) ──────< (many) collections

recipes (1) ──────< (many) ingredients
recipes (1) ──────< (many) instructions

recipes (many) >────< (many) collections  [via collection_items]
recipes (many) >────< (many) tags         [via recipe_tags]
```

- **One User** has **Many Recipes**
- **One User** has **Many Collections**
- **One Recipe** has **Many Ingredients**
- **One Recipe** has **Many Instructions**
- **Many-to-Many** between **Recipes** and **Collections** (via `collection_items`)
- **Many-to-Many** between **Recipes** and **Tags** (via `recipe_tags`)

---

## 4. Row Level Security (RLS)

All tables enforce user isolation via RLS policies:

```sql
-- Example: recipes table policies
CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own recipes" ON recipes
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (user_id = auth.uid());
```

**Policy Summary:**
- Users can only SELECT, INSERT, UPDATE, DELETE their own data
- All queries automatically filtered by `user_id = auth.uid()`
- No cross-user data access possible

---

## 5. Indexes (Recommended)

```sql
-- Performance indexes
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_recipes_status ON recipes(status);
CREATE INDEX idx_recipes_platform ON recipes(platform);
CREATE INDEX idx_recipes_is_favorite ON recipes(is_favorite);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);

CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_ingredients_item ON ingredients(item);

CREATE INDEX idx_instructions_recipe_id ON instructions(recipe_id);

CREATE INDEX idx_collections_user_id ON collections(user_id);

CREATE INDEX idx_collection_items_recipe_id ON collection_items(recipe_id);
CREATE INDEX idx_collection_items_added_at ON collection_items(added_at DESC);
```

---

## 6. Triggers (Recommended)

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## 7. Future Considerations (V2)

The following fields are deferred to V2 but may be added later:

| Table | Field | Type | Purpose |
|-------|-------|------|---------|
| `recipes` | `difficulty` | text | Recipe difficulty level ('easy', 'medium', 'hard') |
| `recipes` | `video_duration_seconds` | int | Original video length for filtering |
| `tags` | `type` | text | Tag categorization ('dietary', 'cuisine', 'difficulty') |

---

## 8. Migration Notes

When creating the schema in Supabase:

1. Enable the `pgvector` extension for embeddings:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

2. Create tables in dependency order:
   - profiles → recipes → ingredients, instructions
   - profiles → collections → collection_items
   - tags → recipe_tags

3. Enable RLS on all tables:
   ```sql
   ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
   -- Repeat for all tables
   ```

4. Create storage bucket for images (if self-hosting thumbnails):
   ```sql
   INSERT INTO storage.buckets (id, name, public)
   VALUES ('recipe-images', 'recipe-images', true);
   ```
