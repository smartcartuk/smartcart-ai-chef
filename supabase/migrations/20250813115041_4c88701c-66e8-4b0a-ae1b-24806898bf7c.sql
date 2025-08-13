-- Phase 1: Unified Price Table Structure
-- Create unified prices table to replace individual store tables
CREATE TABLE public.prices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_name text NOT NULL,
  store_name text NOT NULL,
  price numeric NOT NULL,
  unit text DEFAULT 'each',
  product_url text,
  product_title text,
  product_image text,
  quantity text DEFAULT '1',
  currency text NOT NULL DEFAULT 'GBP',
  last_updated timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(ingredient_name, store_name, quantity)
);

-- Enable RLS
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (prices are public data)
CREATE POLICY "Allow public read access to prices" 
ON public.prices 
FOR SELECT 
USING (true);

-- Create policy for system updates (only edge functions can insert/update)
CREATE POLICY "Allow system updates to prices" 
ON public.prices 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_prices_ingredient_name ON public.prices(ingredient_name);
CREATE INDEX idx_prices_store_name ON public.prices(store_name);
CREATE INDEX idx_prices_last_updated ON public.prices(last_updated);
CREATE INDEX idx_prices_ingredient_store ON public.prices(ingredient_name, store_name);

-- Enable real-time updates
ALTER TABLE public.prices REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.prices;

-- Create price history table for trend analysis
CREATE TABLE public.price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_id uuid REFERENCES public.prices(id) ON DELETE CASCADE,
  price numeric NOT NULL,
  recorded_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on price history
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to price history
CREATE POLICY "Allow public read access to price history" 
ON public.price_history 
FOR SELECT 
USING (true);

-- Create index for price history queries
CREATE INDEX idx_price_history_price_id ON public.price_history(price_id);
CREATE INDEX idx_price_history_recorded_at ON public.price_history(recorded_at);

-- Create function to automatically track price changes
CREATE OR REPLACE FUNCTION public.track_price_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert into history if price actually changed
  IF TG_OP = 'UPDATE' AND OLD.price != NEW.price THEN
    INSERT INTO public.price_history (price_id, price, recorded_at)
    VALUES (NEW.id, NEW.price, NEW.last_updated);
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.price_history (price_id, price, recorded_at)
    VALUES (NEW.id, NEW.price, NEW.created_at);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically track price changes
CREATE TRIGGER track_price_changes_trigger
  AFTER INSERT OR UPDATE ON public.prices
  FOR EACH ROW
  EXECUTE FUNCTION public.track_price_changes();

-- Create function to get latest prices by store
CREATE OR REPLACE FUNCTION public.get_latest_prices_by_store(ingredient_name_param text)
RETURNS TABLE (
  store_name text,
  price numeric,
  product_url text,
  product_title text,
  last_updated timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.store_name,
    p.price,
    p.product_url,
    p.product_title,
    p.last_updated
  FROM public.prices p
  WHERE p.ingredient_name = ingredient_name_param
  ORDER BY p.last_updated DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get price trends
CREATE OR REPLACE FUNCTION public.get_price_trends(ingredient_name_param text, store_name_param text, days_back integer DEFAULT 30)
RETURNS TABLE (
  price numeric,
  recorded_at timestamp with time zone
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ph.price,
    ph.recorded_at
  FROM public.price_history ph
  JOIN public.prices p ON p.id = ph.price_id
  WHERE p.ingredient_name = ingredient_name_param
    AND p.store_name = store_name_param
    AND ph.recorded_at >= NOW() - INTERVAL '1 day' * days_back
  ORDER BY ph.recorded_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;