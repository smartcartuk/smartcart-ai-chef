-- Phase 1: Add encrypted credentials to connected_stores
ALTER TABLE public.connected_stores
ADD COLUMN IF NOT EXISTS credentials JSONB;

-- Add basket_urls to shopping_lists (Phase 3)
ALTER TABLE public.shopping_lists
ADD COLUMN IF NOT EXISTS basket_urls JSONB;

-- Create recipe_favorites table (Phase 5)
CREATE TABLE IF NOT EXISTS public.recipe_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recipe_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create unique index for recipe favorites
CREATE UNIQUE INDEX IF NOT EXISTS recipe_favorites_user_recipe_idx 
ON public.recipe_favorites(user_id, ((recipe_data->>'name')));

ALTER TABLE public.recipe_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own favorites" ON public.recipe_favorites;
CREATE POLICY "Users can manage their own favorites"
ON public.recipe_favorites
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create order_history table (Phase 4)
CREATE TABLE IF NOT EXISTS public.order_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  meal_plan_data JSONB NOT NULL,
  basket_urls JSONB,
  total_cost NUMERIC,
  ordered_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own orders" ON public.order_history;
CREATE POLICY "Users can view their own orders"
ON public.order_history
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own orders" ON public.order_history;
CREATE POLICY "Users can create their own orders"
ON public.order_history
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);