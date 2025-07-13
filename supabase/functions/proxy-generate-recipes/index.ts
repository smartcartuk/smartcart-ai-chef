import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { preferences, userProfile } = await req.json();
    
    console.log('Generating recipes with user profile:', userProfile);

    // Structure the payload properly for the Vercel API
    const apiPayload = {
      userProfile: {
        // Core preferences for meal generation
        dietaryPreferences: userProfile?.dietaryPreferences || [],
        allergies: userProfile?.allergies || [],
        householdSize: userProfile?.householdSize || 2,
        weeklyBudget: userProfile?.weeklyBudget || 50,
        
        // Additional context that might be useful
        name: userProfile?.name || '',
        address: userProfile?.address || {},
        connectedStores: userProfile?.connectedStores?.map(store => ({
          name: store.name,
          hasLoyaltyCard: Boolean(store.credentials?.loyaltyCard)
        })) || []
      },
      requestType: 'weekly-plan',
      timestamp: new Date().toISOString(),
      
      // Keep legacy preferences string for backwards compatibility
      preferences: preferences || ''
    };

    console.log('Sending structured payload to Vercel API:', apiPayload);

    // Call the Vercel API endpoint
    const response = await fetch('https://smartcart-operator.vercel.app/api/meal-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    console.log('API response status:', response.status);

    if (!response.ok) {
      console.error('API endpoint error, providing fallback with enhanced data structure');
      
      // Enhanced fallback with price comparison structure
      const fallbackMeals = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
      ].map(day => ({
        day,
        recipe_name: `${userProfile?.dietaryPreferences?.includes('vegetarian') ? 'Vegetarian' : 'Protein'} ${day} Meal`,
        description: `Healthy ${day.toLowerCase()} meal`,
        ingredients: [
          {
            name: userProfile?.dietaryPreferences?.includes('vegetarian') ? 'chickpeas' : 'chicken breast',
            amount: '200g',
            prices: {
              tesco: { price: 1.2, url: 'https://tesco.com/product' },
              sainsburys: { price: 1.3, url: 'https://sainsburys.co.uk/product' }
            }
          },
          {
            name: 'olive oil',
            amount: '2 tbsp',
            prices: {
              tesco: { price: 2.0, url: 'https://tesco.com/product/oil' },
              sainsburys: { price: 2.1, url: 'https://sainsburys.co.uk/product/oil' }
            }
          },
          {
            name: 'onion',
            amount: '1 medium',
            prices: {
              tesco: { price: 0.2, url: 'https://tesco.com/product/onion' },
              sainsburys: { price: 0.25, url: 'https://sainsburys.co.uk/product/onion' }
            }
          }
        ],
        instructions: [
          'Heat oil in a pan.',
          'Add onion, cook until soft.',
          'Add main ingredient and cook through.',
          'Season and serve hot.'
        ],
        nutrition: {
          calories: 350,
          protein: '12g',
          carbs: '45g',
          fat: '8g',
          fiber: '6g'
        },
        cost_by_supermarket: {
          tesco: 3.4,
          sainsburys: 3.65
        }
      }));

      return new Response(JSON.stringify({ 
        meals: fallbackMeals,
        total_week_cost: {
          tesco: 23.8,
          sainsburys: 25.55
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseText = await response.text();
    console.log('API raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse API response as JSON:', parseError);
      throw new Error('Invalid JSON response from API endpoint');
    }

    console.log('API parsed response:', data);

    // Check if we have the enhanced format with meals array and price data
    if (data.meals && Array.isArray(data.meals)) {
      console.log('Returning enhanced meals data with', data.meals.length, 'meals');
      
      // Ensure all meals have the required structure
      const enhancedMeals = data.meals.map(meal => ({
        ...meal,
        // Ensure ingredients have price structure
        ingredients: meal.ingredients?.map((ingredient: any) => {
          if (typeof ingredient === 'string') {
            // Convert string ingredients to enhanced format
            return {
              name: ingredient,
              amount: '1 unit',
              prices: {
                tesco: { price: 1.0, url: '#' },
                sainsburys: { price: 1.1, url: '#' }
              }
            };
          }
          return ingredient;
        }) || [],
        // Ensure cost structure exists
        cost_by_supermarket: meal.cost_by_supermarket || {
          tesco: 5.0,
          sainsburys: 5.5
        }
      }));

      return new Response(JSON.stringify({
        meals: enhancedMeals,
        total_week_cost: data.total_week_cost || {
          tesco: enhancedMeals.reduce((sum: number, meal: any) => sum + (meal.cost_by_supermarket?.tesco || 5), 0),
          sainsburys: enhancedMeals.reduce((sum: number, meal: any) => sum + (meal.cost_by_supermarket?.sainsburys || 5.5), 0)
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle single recipe response (convert to enhanced format)
    const singleRecipe = Array.isArray(data) ? data[0] : data;
    
    const enhancedSingleRecipe = {
      recipe_name: singleRecipe.recipe_name || singleRecipe.name || 'Generated Recipe',
      ingredients: singleRecipe.ingredients?.map((ingredient: any) => {
        if (typeof ingredient === 'string') {
          return {
            name: ingredient,
            amount: '1 unit',
            prices: {
              tesco: { price: 1.0, url: '#' },
              sainsburys: { price: 1.1, url: '#' }
            }
          };
        }
        return ingredient;
      }) || [],
      instructions: singleRecipe.instructions || 'No instructions provided',
      estimated_cost: singleRecipe.estimated_cost || 0,
      description: singleRecipe.description || '',
      picture_url: singleRecipe.picture_url || ''
    };

    console.log('Returning single enhanced recipe:', enhancedSingleRecipe);

    return new Response(JSON.stringify(enhancedSingleRecipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in proxy-generate-recipes function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Unable to generate recipe at the moment',
      details: error.message,
      suggestion: 'The API endpoint may be temporarily unavailable. Please try again in a moment.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
