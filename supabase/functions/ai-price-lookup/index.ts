import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ingredients, stores = ['Tesco', 'Sainsbury\'s', 'Asda', 'Aldi', 'Morrisons', 'Lidl'] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`AI Price Lookup - ${ingredients.length} ingredients across ${stores.length} stores`);

    const systemPrompt = `You are an expert UK supermarket pricing analyst with real-time knowledge of grocery prices.

Your task is to provide accurate, current prices for groceries across major UK supermarkets.

IMPORTANT PRICING GUIDELINES:
1. Provide REALISTIC UK supermarket prices (as of 2025)
2. Consider typical price ranges:
   - Budget stores (Aldi, Lidl): Generally 10-20% cheaper
   - Mid-range (Tesco, Asda, Morrisons): Average pricing
   - Premium (Sainsbury's, Waitrose): 5-15% more expensive
3. Account for typical product sizes (e.g., 500g pasta, 1kg rice, 400g tin)
4. Include price variations for quality levels (value, standard, premium)
5. Consider current market trends (inflation, seasonal availability)
6. Provide per-unit pricing when relevant

Available Stores: ${stores.join(', ')}

Return accurate price estimates based on typical UK supermarket pricing.`;

    const ingredientsList = ingredients.map((ing: any) => 
      typeof ing === 'string' ? ing : ing.name || ing
    ).join(', ');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Provide current prices for these ingredients: ${ingredientsList}. For each ingredient, give prices at each store: ${stores.join(', ')}.` 
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'provide_ingredient_prices',
              description: 'Provide price information for groceries',
              parameters: {
                type: 'object',
                properties: {
                  prices: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        ingredient: { type: 'string', description: 'Ingredient name' },
                        typical_size: { type: 'string', description: 'Typical package size' },
                        stores: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              store: { type: 'string' },
                              price: { type: 'number', description: 'Price in GBP' },
                              unit: { type: 'string', description: 'Price unit (e.g., per kg, per pack)' },
                              availability: { type: 'string', enum: ['In Stock', 'Limited', 'Out of Stock'] }
                            },
                            required: ['store', 'price', 'unit', 'availability']
                          }
                        }
                      },
                      required: ['ingredient', 'typical_size', 'stores']
                    }
                  }
                },
                required: ['prices'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'provide_ingredient_prices' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      throw new Error('No price data generated');
    }

    const priceData = JSON.parse(toolCall.function.arguments);
    console.log(`Generated prices for ${priceData.prices.length} ingredients`);

    return new Response(
      JSON.stringify({
        success: true,
        prices: priceData.prices,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-price-lookup:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
