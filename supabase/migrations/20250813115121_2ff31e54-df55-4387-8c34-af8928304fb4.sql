-- Fix security issues: Add SET search_path to functions
-- Update the track_price_changes function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update get_latest_prices_by_store function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update get_price_trends function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';