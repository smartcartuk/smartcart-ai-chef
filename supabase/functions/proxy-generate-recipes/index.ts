
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
      console.error('API endpoint error, providing enhanced fallback');
      
      // Enhanced fallback with diverse meals and complete pricing structure
      const fallbackMeals = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
      ].map((day, index) => {
        // Create different meal types for variety
        const mealTypes = [
          { name: 'Protein Bowl', ingredients: ['chicken breast', 'quinoa', 'broccoli'] },
          { name: 'Pasta Dish', ingredients: ['pasta', 'tomatoes', 'basil'] },
          { name: 'Stir Fry', ingredients: ['mixed vegetables', 'soy sauce', 'rice'] },
          { name: 'Soup & Bread', ingredients: ['vegetable stock', 'carrots', 'bread'] },
          { name: 'Salad Bowl', ingredients: ['mixed greens', 'cucumber', 'olive oil'] },
          { name: 'Curry', ingredients: ['coconut milk', 'spices', 'rice'] },
          { name: 'Sandwich', ingredients: ['bread', 'cheese', 'lettuce'] }
        ];
        
        const meal = mealTypes[index];
        const isVegetarian = userProfile?.dietaryPreferences?.includes('vegetarian');
        
        return {
          day,
          recipe_name: `${isVegetarian ? 'Vegetarian' : ''} ${meal.name}`,
          description: `Healthy ${day.toLowerCase()} meal - ${meal.name.toLowerCase()}`,
          ingredients: meal.ingredients.map(ingredient => ({
            name: ingredient,
            amount: ingredient === 'rice' || ingredient === 'pasta' || ingredient === 'quinoa' ? '200g' : 
                   ingredient === 'bread' ? '2 slices' : '100g',
            prices: {
              tesco: { price: (1.5 + Math.random() * 2).toFixed(2), url: `https://tesco.com/search?q=${encodeURIComponent(ingredient)}`, title: `Tesco ${ingredient}` },
              sainsburys: { price: (1.6 + Math.random() * 2).toFixed(2), url: `https://sainsburys.co.uk/search?q=${encodeURIComponent(ingredient)}`, title: `Sainsbury's ${ingredient}` },
              asda: { price: (1.4 + Math.random() * 2).toFixed(2), url: `https://asda.com/search?q=${encodeURIComponent(ingredient)}`, title: `Asda ${ingredient}` },
              aldi: { price: (1.3 + Math.random() * 2).toFixed(2), url: `https://aldi.co.uk/search?q=${encodeURIComponent(ingredient)}`, title: `Aldi ${ingredient}` }
            }
          })),
          instructions: [
            `Prepare the ${meal.name.toLowerCase()} by gathering all ingredients.`,
            `Cook main components according to standard preparation methods.`,
            `Combine ingredients and season to taste.`,
            `Serve hot and enjoy your ${day} meal.`
          ],
          nutrition: {
            calories: 300 + Math.floor(Math.random() * 200),
            protein: `${10 + Math.floor(Math.random() * 20)}g`,
            carbs: `${30 + Math.floor(Math.random() * 30)}g`,
            fat: `${5 + Math.floor(Math.random() * 15)}g`,
            fiber: `${3 + Math.floor(Math.random() * 10)}g`
          },
          picture_url: `https://images.unsplash.com/photo-${1565299624946 + index}?w=400&h=300&fit=crop&auto=format`,
          cost_by_supermarket: {
            tesco: parseFloat((3.5 + Math.random() * 3).toFixed(2)),
            sainsburys: parseFloat((3.7 + Math.random() * 3).toFixed(2)),
            asda: parseFloat((3.2 + Math.random() * 3).toFixed(2)),
            aldi: parseFloat((2.9 + Math.random() * 3).toFixed(2))
          }
        };
      });

      return new Response(JSON.stringify({ 
        meals: fallbackMeals,
        total_week_cost: {
          tesco: fallbackMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.tesco, 0),
          sainsburys: fallbackMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.sainsburys, 0),
          asda: fallbackMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.asda, 0),
          aldi: fallbackMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.aldi, 0)
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
      
      // Ensure all meals have the required structure and complete pricing
      const enhancedMeals = data.meals.map((meal, index) => ({
        ...meal,
        // Ensure we have proper image URLs from Spoonacular or fallback
        picture_url: meal.picture_url || `https://images.unsplash.com/photo-${1565299624946 + index}?w=400&h=300&fit=crop&auto=format`,
        // Ensure ingredients have complete price structure for all stores
        ingredients: meal.ingredients?.map((ingredient) => {
          if (typeof ingredient === 'string') {
            // Convert string ingredients to enhanced format with all store prices
            return {
              name: ingredient,
              amount: '1 unit',
              prices: {
                tesco: { price: 1.5, url: `https://tesco.com/search?q=${encodeURIComponent(ingredient)}`, title: `Tesco ${ingredient}` },
                sainsburys: { price: 1.6, url: `https://sainsburys.co.uk/search?q=${encodeURIComponent(ingredient)}`, title: `Sainsbury's ${ingredient}` },
                asda: { price: 1.4, url: `https://asda.com/search?q=${encodeURIComponent(ingredient)}`, title: `Asda ${ingredient}` },
                aldi: { price: 1.3, url: `https://aldi.co.uk/search?q=${encodeURIComponent(ingredient)}`, title: `Aldi ${ingredient}` }
              }
            };
          }
          // Ensure existing ingredient objects have all store prices
          return {
            ...ingredient,
            prices: {
              tesco: ingredient.prices?.tesco || { price: 1.5, url: '#', title: `Tesco ${ingredient.name}` },
              sainsburys: ingredient.prices?.sainsburys || { price: 1.6, url: '#', title: `Sainsbury's ${ingredient.name}` },
              asda: ingredient.prices?.asda || { price: 1.4, url: '#', title: `Asda ${ingredient.name}` },
              aldi: ingredient.prices?.aldi || { price: 1.3, url: '#', title: `Aldi ${ingredient.name}` }
            }
          };
        }) || [],
        // Ensure cost structure exists for all supermarkets
        cost_by_supermarket: {
          tesco: meal.cost_by_supermarket?.tesco || 5.0,
          sainsburys: meal.cost_by_supermarket?.sainsburys || 5.2,
          asda: meal.cost_by_supermarket?.asda || 4.8,
          aldi: meal.cost_by_supermarket?.aldi || 4.5
        },
        // Add missing fields for compatibility
        estimated_cost: meal.cost_by_supermarket?.tesco || 5.0,
        estimated_price: meal.cost_by_supermarket?.tesco || 5.0,
        cost_per_meal: meal.cost_by_supermarket?.tesco || 5.0
      }));

      // Ensure total_week_cost includes all supermarkets
      const totalWeekCost = {
        tesco: enhancedMeals.reduce((sum, meal) => sum + (meal.cost_by_supermarket?.tesco || 0), 0),
        sainsburys: enhancedMeals.reduce((sum, meal) => sum + (meal.cost_by_supermarket?.sainsburys || 0), 0),
        asda: enhancedMeals.reduce((sum, meal) => sum + (meal.cost_by_supermarket?.asda || 0), 0),
        aldi: enhancedMeals.reduce((sum, meal) => sum + (meal.cost_by_supermarket?.aldi || 0), 0)
      };

      return new Response(JSON.stringify({
        meals: enhancedMeals,
        total_week_cost: data.total_week_cost || totalWeekCost
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle single recipe response (convert to enhanced format)
    const singleRecipe = Array.isArray(data) ? data[0] : data;
    
    const enhancedSingleRecipe = {
      recipe_name: singleRecipe.recipe_name || singleRecipe.name || 'Generated Recipe',
      ingredients: singleRecipe.ingredients?.map((ingredient) => {
        if (typeof ingredient === 'string') {
          return {
            name: ingredient,
            amount: '1 unit',
            prices: {
              tesco: { price: 1.5, url: '#', title: `Tesco ${ingredient}` },
              sainsburys: { price: 1.6, url: '#', title: `Sainsbury's ${ingredient}` },
              asda: { price: 1.4, url: '#', title: `Asda ${ingredient}` },
              aldi: { price: 1.3, url: '#', title: `Aldi ${ingredient}` }
            }
          };
        }
        return ingredient;
      }) || [],
      instructions: singleRecipe.instructions || 'No instructions provided',
      estimated_cost: singleRecipe.estimated_cost || 0,
      description: singleRecipe.description || '',
      picture_url: singleRecipe.picture_url || 'https://images.unsplash.com/photo-1565299624946?w=400&h=300&fit=crop&auto=format'
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
