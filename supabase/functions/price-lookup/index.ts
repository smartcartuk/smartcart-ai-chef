import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple per-IP rate limiting
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

interface PriceLookupResult {
  store: string;
  price: number;
  url?: string;
  title?: string;
  image?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const key = `${ip}:price-lookup`;
    if (isRateLimited(key)) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { ingredientName, quantity = '1', supermarkets = ['tesco', 'sainsburys', 'asda', 'aldi'] } = await req.json();
    if (!ingredientName) {
      return new Response(JSON.stringify({ error: 'ingredientName is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // NOTE: For demo purposes only. Replace with secure per-user creds when available.
    const defaultCredentials = { username: 'price_lookup@example.com', password: 'lookup123' };
    const OPERATOR_URL = 'https://smartcart-operator.vercel.app/api/add-to-basket';

    const results: PriceLookupResult[] = [];

    const calls = await Promise.allSettled(supermarkets.map(async (store: string) => {
      const body = {
        supermarket: store.toLowerCase(),
        credentials: defaultCredentials,
        items: [{ name: ingredientName, quantity }]
      };

      const resp = await fetch(OPERATOR_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();

      const item = data?.items?.[0];
      const mp = item?.matched_product;
      let price = 2.5;
      let title: string | undefined = undefined;
      let url: string | undefined = undefined;
      let image: string | undefined = undefined;

      if (mp) {
        const parsed = parseFloat(String(mp.price).replace(/[^0-9.]/g, ''));
        price = isNaN(parsed) ? 2.5 : parsed;
        title = mp.title;
        url = mp.url;
        image = mp.image;
      } else {
        title = `${ingredientName} (No Match)`;
      }

      results.push({ store, price, title, url, image });
    }));

    const failed = calls.filter((c) => c.status === 'rejected').length;
    console.log(`price-lookup: ${ingredientName} -> ${results.length} ok, ${failed} failed`);

    return new Response(JSON.stringify({ prices: results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('price-lookup error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
