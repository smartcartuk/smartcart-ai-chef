import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // max 60 requests/min per IP
const requestHistory = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const timestamps = (requestHistory.get(key) || []).filter((t) => t > windowStart);
  timestamps.push(now);
  requestHistory.set(key, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

// Ingredient name normalization
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\d+\s*(large|small|medium|kg|g|lb|oz|ml|l|cup|tbsp|tsp|piece|pieces)\s*/g, '')
    .replace(/\s*\(.*?\)\s*/g, '') // Remove content in parentheses
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, ' '); // Normalize spaces
}

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = `${ip}:unified-price-lookup`;
    if (isRateLimited(key)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { 
        status: 429, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { ingredientName, quantity = '1', stores = ['tesco', 'sainsburys', 'asda', 'aldi'] } = await req.json();
    
    if (!ingredientName) {
      return new Response(JSON.stringify({ error: 'ingredientName is required' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const normalizedName = normalizeIngredientName(ingredientName);
    console.log(`Looking up prices for: ${ingredientName} (normalized: ${normalizedName})`);

    // First, check if we have recent prices in the database
    const { data: existingPrices, error: dbError } = await supabase
      .from('prices')
      .select('*')
      .eq('ingredient_name', normalizedName)
      .in('store_name', stores)
      .gte('last_updated', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // 5 minutes

    if (dbError) {
      console.error('Database error:', dbError);
    } else if (existingPrices && existingPrices.length > 0) {
      console.log(`Found ${existingPrices.length} recent prices in database`);
      const results = existingPrices.map(price => ({
        store: price.store_name,
        price: Number(price.price),
        url: price.product_url,
        title: price.product_title,
        image: price.product_image
      }));
      
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // If no recent prices, fetch from external API
    const OPERATOR_URL = 'https://smartcart-operator.vercel.app/api/ingredient-prices';
    const results: any[] = [];

    try {
      const promises = stores.map(async (store) => {
        const response = await fetch(`${OPERATOR_URL}?ingredient=${encodeURIComponent(normalizedName)}&store=${store}&quantity=${encodeURIComponent(quantity)}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.price && data.price > 0) {
            const priceData = {
              store,
              price: Number(data.price),
              url: data.url || `https://${store}.com/search?q=${encodeURIComponent(ingredientName)}`,
              title: data.title || `${store} ${ingredientName}`,
              image: data.image
            };
            
            // Store in database for future use
            await supabase
              .from('prices')
              .upsert({
                ingredient_name: normalizedName,
                store_name: store,
                price: priceData.price,
                product_url: priceData.url,
                product_title: priceData.title,
                product_image: priceData.image,
                quantity: quantity,
                last_updated: new Date().toISOString()
              }, {
                onConflict: 'ingredient_name,store_name,quantity'
              });
            
            return priceData;
          }
        }
        return null;
      });

      const priceResults = await Promise.all(promises);
      results.push(...priceResults.filter(Boolean));

    } catch (error) {
      console.error('Error fetching from external API:', error);
    }

    // Fallback to mock data if no results from external API
    if (results.length === 0) {
      console.log('Using fallback mock prices');
      const mockResults = stores.map(store => {
        const basePrice = 1.5 + Math.random() * 3;
        const storeMultiplier = {
          'tesco': 1.0,
          'sainsburys': 1.05,
          'asda': 0.95,
          'aldi': 0.90,
          'morrisons': 0.98,
          'lidl': 0.88,
          'waitrose': 1.15,
          'iceland': 0.92,
          'coop': 1.08,
          'ocado': 1.12
        }[store] || 1.0;

        const finalPrice = Number((basePrice * storeMultiplier).toFixed(2));
        
        return {
          store,
          price: finalPrice,
          url: `https://${store}.com/search?q=${encodeURIComponent(ingredientName)}`,
          title: `${store} ${ingredientName}`,
          image: null
        };
      });
      
      // Store mock prices in database
      for (const mockPrice of mockResults) {
        await supabase
          .from('prices')
          .upsert({
            ingredient_name: normalizedName,
            store_name: mockPrice.store,
            price: mockPrice.price,
            product_url: mockPrice.url,
            product_title: mockPrice.title,
            quantity: quantity,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'ingredient_name,store_name,quantity'
          });
      }
      
      results.push(...mockResults);
    }

    console.log(`Returning ${results.length} price results for ${ingredientName}`);
    
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in unified-price-lookup function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', results: [] }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});