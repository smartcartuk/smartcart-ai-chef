
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

    // Call the correct n8n webhook URL with -test
    const response = await fetch('https://proj3cts.app.n8n.cloud/webhook-test/generate-recipes', {
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
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch recipe from n8n webhook',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
