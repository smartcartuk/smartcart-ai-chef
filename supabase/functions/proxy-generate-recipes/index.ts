
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
    
    console.log('Sending request to Operator endpoint with user profile:', userProfile);

    // Build the preferences string with user profile data
    const dietaryPreferences = userProfile?.dietaryPreferences?.join(', ') || 'No specific preferences';
    const allergies = userProfile?.allergies?.join(', ') || 'None';
    const householdSize = userProfile?.householdSize || 2;
    const weeklyBudget = userProfile?.weeklyBudget || 50;

    // Check if this is a request for a full weekly plan or a single recipe
    const isWeeklyPlanRequest = !preferences.includes('Recipe for');
    
    let preferencesString;
    if (isWeeklyPlanRequest) {
      // Request for full weekly plan (7 meals)
      preferencesString = `dietary preferences: ${dietaryPreferences}, avoid: ${allergies}, serves ${householdSize} people, budget-friendly (weekly budget: £${weeklyBudget}) - Generate 7 meals for the week`;
    } else {
      // Request for single recipe (specific day)
      preferencesString = `dietary preferences: ${dietaryPreferences}, avoid: ${allergies}, serves ${householdSize} people, budget-friendly (weekly budget: £${weeklyBudget}) - ${preferences.split(' - ')[1] || 'Recipe for Monday'}`;
    }

    // Call the Operator endpoint
    const response = await fetch('https://smartcart-operator.vercel.app/api/meal-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        preferences: preferencesString,
        userProfile: userProfile || {}
      }),
    });

    console.log('Operator endpoint response status:', response.status);
    console.log('Operator endpoint response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Operator endpoint error response:', errorText);
      
      // Return a fallback recipe when endpoint is not available
      console.log('Operator endpoint not available, returning fallback recipe(s)');
      
      if (isWeeklyPlanRequest) {
        // Return 7 fallback meals
        const fallbackMeals = [
          'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
        ].map(day => ({
          day,
          recipe_name: `${dietaryPreferences.includes('vegetarian') ? 'Vegetarian' : 'Protein'} ${day} Meal`,
          ingredients: [
            dietaryPreferences.includes('vegetarian') ? 'chickpeas' : 'chicken breast',
            'olive oil',
            'garlic',
            'onion',
            'tomatoes',
            'herbs and spices'
          ],
          instructions: 'Heat oil in a pan. Add garlic and onion, cook until fragrant. Add main ingredient and cook through. Add tomatoes and season. Serve hot.',
          picture_url: 'https://placehold.co/400x300'
        }));
        
        return new Response(JSON.stringify({ meals: fallbackMeals }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Return single fallback recipe
        const fallbackRecipe = {
          recipe_name: `Quick ${dietaryPreferences.includes('vegetarian') ? 'Vegetarian' : 'Protein'} Meal`,
          ingredients: [
            dietaryPreferences.includes('vegetarian') ? 'chickpeas' : 'chicken breast',
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
    }

    const responseText = await response.text();
    console.log('Operator endpoint raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Operator response as JSON:', parseError);
      console.error('Raw response was:', responseText);
      throw new Error('Invalid JSON response from Operator endpoint');
    }

    console.log('Operator endpoint parsed response:', data);

    // If we got a meals array, return it as-is (for weekly plan requests)
    if (data.meals && Array.isArray(data.meals)) {
      console.log('Returning meals array with', data.meals.length, 'meals');
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle single recipe response (for individual day requests)
    let recipeData;
    if (Array.isArray(data) && data.length > 0) {
      // If response is an array, take the first item
      recipeData = data[0];
    } else {
      // Assume the data itself is the recipe
      recipeData = data;
    }

    // Ensure we have the required fields for single recipe
    const result = {
      recipe_name: recipeData.recipe_name || recipeData.name || 'Generated Recipe',
      ingredients: recipeData.ingredients || [],
      instructions: recipeData.instructions || 'No instructions provided',
      estimated_cost: recipeData.estimated_cost || 0,
      description: recipeData.description || '',
      picture_url: recipeData.picture_url || ''
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
      suggestion: 'The Operator endpoint may be temporarily unavailable. Please try again in a moment.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
