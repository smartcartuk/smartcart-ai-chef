-- Phase 1: Database Foundation for Budget-Aware Meal Planning

-- 1.1 Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS meal_types jsonb DEFAULT '["breakfast", "lunch", "dinner"]',
ADD COLUMN IF NOT EXISTS budget_tier text DEFAULT 'medium';

-- Add check constraint for budget tier
ALTER TABLE profiles 
ADD CONSTRAINT budget_tier_check 
CHECK (budget_tier IN ('low', 'medium', 'high'));

-- 1.2 Create meal_options table
CREATE TABLE IF NOT EXISTS meal_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  recipe_data jsonb NOT NULL,
  estimated_cost numeric(10,2),
  meal_type text,
  created_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_meal_options_user_week ON meal_options(user_id, week_start);

-- Enable RLS on meal_options
ALTER TABLE meal_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal_options
CREATE POLICY "Users can view their own meal options"
  ON meal_options FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal options"
  ON meal_options FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal options"
  ON meal_options FOR DELETE
  USING (auth.uid() = user_id);

-- 1.3 Update meal_plans table
ALTER TABLE meal_plans 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS meal_type text,
ADD COLUMN IF NOT EXISTS actual_cost numeric(10,2);

-- Add check constraint for status
ALTER TABLE meal_plans 
ADD CONSTRAINT meal_plan_status_check 
CHECK (status IN ('draft', 'confirmed', 'shopping_list_generated', 'prices_compared'));

-- 1.4 Create ingredient_price_history table
CREATE TABLE IF NOT EXISTS ingredient_price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_name text NOT NULL,
  normalized_name text NOT NULL,
  store_name text NOT NULL,
  price numeric(10,2) NOT NULL,
  unit text,
  recorded_at timestamptz DEFAULT now()
);

-- Add indexes for efficient price lookups
CREATE INDEX IF NOT EXISTS idx_ingredient_price_normalized ON ingredient_price_history(normalized_name, store_name);
CREATE INDEX IF NOT EXISTS idx_ingredient_price_recorded ON ingredient_price_history(recorded_at DESC);

-- Enable RLS (public read access for price history)
ALTER TABLE ingredient_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to ingredient price history"
  ON ingredient_price_history FOR SELECT
  USING (true);

-- System can insert price history
CREATE POLICY "System can insert ingredient price history"
  ON ingredient_price_history FOR INSERT
  WITH CHECK (true);