-- Enable Row Level Security on all price tables
-- These tables contain public pricing data that should be accessible to everyone

-- Enable RLS on all price tables
ALTER TABLE public.tesco_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sainsbury_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asda_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morrisons_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aldi_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lidl_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitrose_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iceland_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coop_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ocado_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amazon_prices ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public read access to price data
-- All users (authenticated and anonymous) can view pricing data

CREATE POLICY "Allow public read access to tesco prices" 
ON public.tesco_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to sainsbury prices" 
ON public.sainsbury_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to asda prices" 
ON public.asda_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to morrisons prices" 
ON public.morrisons_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to aldi prices" 
ON public.aldi_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to lidl prices" 
ON public.lidl_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to waitrose prices" 
ON public.waitrose_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to iceland prices" 
ON public.iceland_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to coop prices" 
ON public.coop_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to ocado prices" 
ON public.ocado_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public read access to amazon prices" 
ON public.amazon_prices 
FOR SELECT 
USING (true);