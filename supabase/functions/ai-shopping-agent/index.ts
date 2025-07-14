import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const basketApiUrl = 'https://smartcart-operator.vercel.app/api/add-to-basket';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Ingredient {
  name: string;
  amount: string;
  prices: Array<{
    store: string;
    price: number;
    url?: string;
    title?: string;
  }>;
}

interface Store {
  name: string;
}

interface ShoppingRecommendation {
  store: string;
  items: Array<{
    name: string;
    amount: string;
    price: number;
  }>;
  totalCost: number;
  estimatedSavings: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ingredients, connectedStores, store, items, credentials } = await req.json();

    if (action === 'analyze') {
      // AI Analysis Phase
      console.log('AI Agent analyzing shopping data:', { ingredientCount: ingredients?.length, storeCount: connectedStores?.length });

      if (!openAIApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      // Prepare data for AI analysis
      const ingredientSummary = ingredients.map((ing: Ingredient) => ({
        name: ing.name,
        amount: ing.amount,
        storePrices: ing.prices.map(p => ({ store: p.store, price: p.price }))
      }));

      const prompt = `You are an AI shopping optimization agent. Analyze this shopping list and recommend the best strategy:

INGREDIENTS AND PRICES:
${JSON.stringify(ingredientSummary, null, 2)}

CONNECTED STORES:
${connectedStores.map((s: Store) => s.name).join(', ')}

TASK: Create an optimal shopping strategy that:
1. Minimizes total cost across all ingredients
2. Considers delivery fees and minimum order requirements
3. Balances convenience vs savings
4. Recommends which items to buy from which stores

Return a JSON response with this structure:
{
  "recommendations": [
    {
      "store": "store_name",
      "items": [
        {"name": "ingredient_name", "amount": "quantity", "price": 0.00}
      ],
      "totalCost": 0.00,
      "estimatedSavings": 0.00,
      "reasoning": "Why this allocation makes sense"
    }
  ],
  "totalSavings": 0.00,
  "strategy": "Brief explanation of the overall strategy"
}

Focus on practical recommendations that a real shopper would make.`;

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert shopping optimization AI. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
        }),
      });

      const aiData = await aiResponse.json();
      const aiContent = aiData.choices[0].message.content;
      
      let recommendations;
      try {
        recommendations = JSON.parse(aiContent);
      } catch (parseError) {
        console.error('Failed to parse AI response:', aiContent);
        // Fallback: create basic recommendations
        recommendations = createFallbackRecommendations(ingredients, connectedStores);
      }

      console.log('AI recommendations generated:', recommendations);

      return new Response(JSON.stringify(recommendations), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'execute') {
      // Shopping Execution Phase
      console.log('Executing shopping for store:', store);

      const shoppingItems = items.map((item: any) => ({
        name: item.name,
        quantity: item.amount || '1'
      }));

      const basketResponse = await fetch(basketApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supermarket: store.toLowerCase(),
          credentials,
          items: shoppingItems
        }),
      });

      if (!basketResponse.ok) {
        throw new Error(`Basket API error: ${basketResponse.status}`);
      }

      const basketData = await basketResponse.json();
      
      if (!basketData.success) {
        throw new Error(basketData.error || 'Failed to add items to basket');
      }

      console.log('Shopping execution completed for', store);

      return new Response(JSON.stringify({
        success: true,
        basketUrl: basketData.basketUrl,
        itemsAdded: basketData.items?.length || shoppingItems.length,
        message: basketData.message
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      throw new Error('Invalid action specified');
    }

  } catch (error) {
    console.error('AI Shopping Agent error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function createFallbackRecommendations(ingredients: Ingredient[], connectedStores: Store[]): any {
  const recommendations: ShoppingRecommendation[] = [];
  
  // Simple fallback: group items by cheapest store
  const storeItems: { [storeName: string]: any[] } = {};
  
  ingredients.forEach(ingredient => {
    if (ingredient.prices.length === 0) return;
    
    // Find cheapest price among connected stores
    const availablePrices = ingredient.prices.filter(p => 
      connectedStores.some(s => s.name.toLowerCase() === p.store.toLowerCase())
    );
    
    if (availablePrices.length === 0) return;
    
    const cheapestPrice = availablePrices.reduce((min, current) => 
      current.price < min.price ? current : min
    );
    
    const storeName = cheapestPrice.store;
    if (!storeItems[storeName]) {
      storeItems[storeName] = [];
    }
    
    storeItems[storeName].push({
      name: ingredient.name,
      amount: ingredient.amount,
      price: cheapestPrice.price
    });
  });
  
  // Convert to recommendations format
  Object.entries(storeItems).forEach(([storeName, items]) => {
    const totalCost = items.reduce((sum, item) => sum + item.price, 0);
    recommendations.push({
      store: storeName,
      items,
      totalCost,
      estimatedSavings: 0, // Could calculate vs most expensive option
      reasoning: `Cheapest option for ${items.length} items`
    });
  });
  
  return {
    recommendations,
    totalSavings: 0,
    strategy: "Basic cost optimization - buy each item from the cheapest available store"
  };
}