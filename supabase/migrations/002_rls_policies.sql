-- Description: Row Level Security policies for SaveIt Recipe Edition
-- Users can only access their own data

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
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Recipes policies
CREATE POLICY "Users can view own recipes" ON recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes" ON recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes" ON recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes" ON recipes
  FOR DELETE USING (auth.uid() = user_id);

-- Ingredients policies (based on recipe ownership)
CREATE POLICY "Users can view ingredients for own recipes" ON ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert ingredients for own recipes" ON ingredients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update ingredients for own recipes" ON ingredients
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete ingredients for own recipes" ON ingredients
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = ingredients.recipe_id AND recipes.user_id = auth.uid()
    )
  );

-- Instructions policies (based on recipe ownership)
CREATE POLICY "Users can view instructions for own recipes" ON instructions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = instructions.recipe_id AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert instructions for own recipes" ON instructions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = instructions.recipe_id AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update instructions for own recipes" ON instructions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = instructions.recipe_id AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete instructions for own recipes" ON instructions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = instructions.recipe_id AND recipes.user_id = auth.uid()
    )
  );

-- Collections policies
CREATE POLICY "Users can view own collections" ON collections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collections" ON collections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON collections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON collections
  FOR DELETE USING (auth.uid() = user_id);

-- Collection items policies (based on collection ownership)
CREATE POLICY "Users can view items in own collections" ON collection_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add items to own collections" ON collection_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove items from own collections" ON collection_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM collections WHERE collections.id = collection_items.collection_id AND collections.user_id = auth.uid()
    )
  );

-- Tags are public (read-only for all authenticated users)
CREATE POLICY "Anyone can view tags" ON tags
  FOR SELECT USING (true);

-- Recipe tags policies (based on recipe ownership)
CREATE POLICY "Users can view tags for own recipes" ON recipe_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = recipe_tags.recipe_id AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add tags to own recipes" ON recipe_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = recipe_tags.recipe_id AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove tags from own recipes" ON recipe_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM recipes WHERE recipes.id = recipe_tags.recipe_id AND recipes.user_id = auth.uid()
    )
  );
