import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MealPlanRequest {
  action: 'suggest' | 'compare-prices' | 'checkout';
  dietaryPreferences?: string[];
  allergies?: string[];
  householdSize?: number;
  weeklyBudget?: number;
  preferredSupermarkets?: string[];
  kgTokens?: string[];        // for compare-prices
  supermarketDomain?: string;  // for checkout
  query?: string;              // custom meal query
}

const PEPESTO_BASE = 'https://s.pepesto.com/api';

// Map user-friendly store names to Pepesto domains
const STORE_DOMAINS: Record<string, string> = {
  'tesco': 'tesco.com',
  'sainsburys': 'sainsburys.co.uk',
  'asda': 'asda.com',
  'waitrose': 'waitrose.com',
  'morrisons': 'groceries.morrisons.com',
};

async function pepestoRequest(endpoint: string, body: Record<string, unknown>, apiKey: string) {
  const res = await fetch(`${PEPESTO_BASE}/${endpoint}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Pepesto ${endpoint} error (${res.status}): ${errorText}`);
  }

  return await res.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PEPESTO_API_KEY = Deno.env.get('PEPESTO_API_KEY');
    if (!PEPESTO_API_KEY) {
      throw new Error('PEPESTO_API_KEY is not configured. Add it in Supabase Edge Function secrets.');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: MealPlanRequest = await req.json();
    const { action } = body;

    console.log(`[pepesto-meal-planner] Action: ${action}, User: ${user.id}`);

    // ─────────────────────────────────────────────
    // ACTION: suggest — Generate meal plan from Pepesto
    // ─────────────────────────────────────────────
    if (action === 'suggest') {
      const {
        dietaryPreferences = [],
        allergies = [],
        householdSize = 2,
        weeklyBudget = 50,
        query,
      } = body;

      // Build Pepesto query string from user preferences
      const dietParts: string[] = [];
      if (query) {
        dietParts.push(query);
      } else {
        dietParts.push('weekly dinner plan');
      }
      if (dietaryPreferences.length > 0) {
        dietParts.push(dietaryPreferences.join(', '));
      }
      if (allergies.length > 0) {
        dietParts.push(`no ${allergies.join(', ')}`);
      }
      dietParts.push(`for ${householdSize} people`);
      if (weeklyBudget > 0) {
        dietParts.push(`budget friendly under £${weeklyBudget}`);
      }

      const suggestQuery = dietParts.join(', ');
      console.log(`[pepesto] Suggest query: "${suggestQuery}"`);

      // Call Pepesto /suggest endpoint
      const suggestResult = await pepestoRequest('suggest', {
        query: suggestQuery,
        num_to_fetch: 7,
        personalization: {
          portions: householdSize,
          locale: 'en-UK',
        },
      }, PEPESTO_API_KEY);

      // Format recipes for frontend
      const recipes = (suggestResult.recipes || []).map((recipe: any, index: number) => ({
        day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index % 7],
        recipe_name: recipe.title || 'Untitled Recipe',
        description: recipe.description || '',
        ingredients: (recipe.ingredients || []).map((ing: any) => ({
          name: ing.name || ing,
          amount: ing.quantity || '',
          unit: ing.unit || '',
        })),
        instructions: recipe.instructions || [],
        nutrition: recipe.nutrition || null,
        image: recipe.image_url || recipe.image || '',
        servings: householdSize,
        kg_token: recipe.kg_token || null,
        prep_time: recipe.prep_time || null,
        cook_time: recipe.cook_time || null,
        allergens: recipe.allergens || [],
      }));

      // Collect kg_tokens for price matching
      const kgTokens = recipes
        .map((r: any) => r.kg_token)
        .filter(Boolean);

      return new Response(
        JSON.stringify({
          success: true,
          mealPlan: {
            recipes,
            kgTokens,
            query: suggestQuery,
            householdSize,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────
    // ACTION: compare-prices — Get prices across supermarkets
    // ─────────────────────────────────────────────
    if (action === 'compare-prices') {
      const {
        kgTokens = [],
        preferredSupermarkets = ['tesco', 'asda', 'sainsburys'],
      } = body;

      if (kgTokens.length === 0) {
        throw new Error('No kg_tokens provided for price comparison');
      }

      // Call Pepesto /products for each supermarket
      const priceResults: Record<string, any> = {};

      await Promise.all(
        preferredSupermarkets.map(async (store) => {
          const domain = STORE_DOMAINS[store] || store;
          try {
            const result = await pepestoRequest('products', {
              kg_tokens: kgTokens,
              supermarket_domain: domain,
            }, PEPESTO_API_KEY);

            const items = result.products || result.items || [];
            const totalPence = items.reduce((sum: number, item: any) => {
              return sum + (item.price || 0);
            }, 0);

            priceResults[store] = {
              domain,
              items,
              totalPence,
              totalPounds: (totalPence / 100).toFixed(2),
              itemCount: items.length,
              matchedCount: items.filter((i: any) => i.matched).length,
            };
          } catch (err) {
            console.error(`[pepesto] Price lookup failed for ${store}:`, err);
            priceResults[store] = {
              domain,
              items: [],
              totalPence: 0,
              totalPounds: '0.00',
              itemCount: 0,
              matchedCount: 0,
              error: (err as Error).message,
            };
          }
        })
      );

      // Find cheapest store
      const validStores = Object.entries(priceResults)
        .filter(([_, data]) => !data.error && data.totalPence > 0);
      
      const cheapestStore = validStores.length > 0
        ? validStores.reduce((a, b) => a[1].totalPence < b[1].totalPence ? a : b)[0]
        : null;

      return new Response(
        JSON.stringify({
          success: true,
          priceComparison: priceResults,
          cheapestStore,
          summary: Object.fromEntries(
            Object.entries(priceResults).map(([store, data]) => [store, `£${data.totalPounds}`])
          ),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─────────────────────────────────────────────
    // ACTION: checkout — Generate checkout redirect URL
    // ─────────────────────────────────────────────
    if (action === 'checkout') {
      const { kgTokens = [], supermarketDomain } = body;

      if (!supermarketDomain) {
        throw new Error('supermarketDomain is required for checkout');
      }
      if (kgTokens.length === 0) {
        throw new Error('No kg_tokens provided for checkout');
      }

      const domain = STORE_DOMAINS[supermarketDomain] || supermarketDomain;

      // Call Pepesto /oneshot to generate a checkout-ready cart
      const result = await pepestoRequest('oneshot', {
        kg_tokens: kgTokens,
        supermarket_domain: domain,
      }, PEPESTO_API_KEY);

      return new Response(
        JSON.stringify({
          success: true,
          checkoutUrl: result.redirect_url || result.checkout_url || null,
          matchedProducts: result.products || result.items || [],
          totalPounds: result.total ? (result.total / 100).toFixed(2) : null,
          supermarket: supermarketDomain,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (err) {
    console.error('[pepesto-meal-planner] Error:', err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
