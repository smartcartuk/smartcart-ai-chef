

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
    
    console.log('Proxying request to n8n webhook with preferences:', preferences);

    // Call the production n8n webhook URL
    const response = await fetch('https://proj3cts.app.n8n.cloud/webhook/generate-recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        preferences: preferences || 'healthy meal',
        userProfile: userProfile || {}
      }),
    });

    console.log('n8n webhook response status:', response.status);
    console.log('n8n webhook response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('n8n webhook error response:', errorText);
      
      // Check if it's a 404 webhook not registered error
      if (response.status === 404 && errorText.includes('not registered')) {
        console.log('Webhook not registered, returning fallback recipe');
        // Return a fallback recipe when webhook is not available
        const fallbackRecipe = {
          recipe_name: `Quick ${preferences.includes('vegetarian') ? 'Vegetarian' : 'Protein'} Meal`,
          ingredients: [
            preferences.includes('vegetarian') ? 'chickpeas' : 'chicken breast',
            'olive oil',
            'garlic',
            'onion',
            'tomatoes',
            'herbs and spices'
          ],
          instructions: 'Heat oil in a pan. Add garlic and onion, cook until fragrant. Add main ingredient and cook through. Add tomatoes and season. Serve hot.'
        };
        
        return new Response(JSON.stringify(fallbackRecipe), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`n8n webhook responded with status: ${response.status}, body: ${errorText}`);
    }

    const responseText = await response.text();
    console.log('n8n webhook raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse n8n response as JSON:', parseError);
      console.error('Raw response was:', responseText);
      throw new Error('Invalid JSON response from n8n webhook');
    }

    console.log('n8n webhook parsed response:', data);

    // Handle different response formats from n8n
    let recipeData;
    if (Array.isArray(data) && data.length > 0) {
      // If response is an array, take the first item
      recipeData = data[0];
    } else if (data.meals && Array.isArray(data.meals) && data.meals.length > 0) {
      // If response has meals array, take the first meal
      recipeData = data.meals[0];
    } else {
      // Assume the data itself is the recipe
      recipeData = data;
    }

    // Ensure we have the required fields
    const result = {
      recipe_name: recipeData.recipe_name || recipeData.name || 'Generated Recipe',
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || 'No instructions provided'
    };

    console.log('Final processed recipe data:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in proxy-generate-recipes function:', error);
    
    // Return a more user-friendly error with fallback suggestion
    return new Response(JSON.stringify({ 
      error: 'Unable to generate recipe at the moment',
      details: error.message,
      suggestion: 'The AI recipe generator may be temporarily unavailable. Please try again in a moment.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

