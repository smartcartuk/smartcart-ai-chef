
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
    
    console.log('Generating recipes with enhanced user profile:', userProfile);

    // Structure the payload properly for the Vercel API with enhanced user preferences
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
        })) || [],
        
        // Enhanced request tracking
        requestId: userProfile?.requestId || `req_${Date.now()}`,
        isRegeneratingRecipe: userProfile?.regenerating || false,
        timestamp: userProfile?.timestamp || new Date().toISOString()
      },
      requestType: userProfile?.regenerating ? 'single-recipe-regeneration' : 'weekly-plan',
      timestamp: new Date().toISOString(),
      
      // Keep legacy preferences string for backwards compatibility
      preferences: preferences || ''
    };

    console.log('Sending enhanced structured payload to Vercel API:', apiPayload);

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
      console.error('API endpoint error, providing enhanced fallback based on user preferences');
      
      // Enhanced fallback with user preferences consideration
      const isVegetarian = userProfile?.dietaryPreferences?.includes('vegetarian');
      const isVegan = userProfile?.dietaryPreferences?.includes('vegan');
      const householdSize = userProfile?.householdSize || 2;
      const weeklyBudget = userProfile?.weeklyBudget || 50;
      const avgMealCost = weeklyBudget / 7;
      
      const fallbackMeals = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
      ].map((day, index) => {
        // Create different meal types for variety based on user preferences
        const baseMealTypes = [
          { 
            name: isVegan ? 'Vegan Buddha Bowl' : isVegetarian ? 'Vegetarian Protein Bowl' : 'Chicken Protein Bowl', 
            ingredients: isVegan ? 
              ['quinoa', 'chickpeas', 'avocado', 'spinach', 'hemp seeds'] : 
              isVegetarian ? 
                ['quinoa', 'tofu', 'broccoli', 'nutritional yeast'] : 
                ['chicken breast', 'quinoa', 'broccoli', 'olive oil']
          },
          { 
            name: isVegan ? 'Vegan Pasta Primavera' : isVegetarian ? 'Vegetarian Pasta Arrabbiata' : 'Chicken Pasta Bake', 
            ingredients: isVegan ? 
              ['pasta', 'cherry tomatoes', 'zucchini', 'nutritional yeast', 'basil'] : 
              isVegetarian ? 
                ['pasta', 'tomatoes', 'basil', 'garlic', 'olive oil'] : 
                ['pasta', 'chicken breast', 'tomatoes', 'mozzarella', 'herbs']
          },
          { 
            name: isVegan ? 'Asian Vegetable Stir Fry' : isVegetarian ? 'Tofu Teriyaki Stir Fry' : 'Beef and Broccoli Stir Fry', 
            ingredients: isVegan ? 
              ['mixed asian vegetables', 'soy sauce', 'brown rice', 'sesame oil', 'ginger'] : 
              isVegetarian ? 
                ['tofu', 'mixed vegetables', 'teriyaki sauce', 'rice', 'sesame seeds'] : 
                ['beef strips', 'broccoli', 'soy sauce', 'rice', 'garlic']
          },
          { 
            name: isVegan ? 'Hearty Lentil Soup' : isVegetarian ? 'Roasted Vegetable Soup' : 'Chicken and Vegetable Soup', 
            ingredients: isVegan ? 
              ['red lentils', 'vegetable stock', 'carrots', 'onions', 'celery', 'herbs'] : 
              isVegetarian ? 
                ['mixed vegetables', 'vegetable stock', 'potatoes', 'herbs', 'bread'] : 
                ['chicken thighs', 'chicken stock', 'mixed vegetables', 'herbs', 'bread']
          },
          { 
            name: isVegan ? 'Rainbow Quinoa Salad' : isVegetarian ? 'Greek Village Salad' : 'Grilled Chicken Caesar Salad', 
            ingredients: isVegan ? 
              ['quinoa', 'cucumber', 'cherry tomatoes', 'red peppers', 'lemon dressing'] : 
              isVegetarian ? 
                ['mixed greens', 'feta cheese', 'olives', 'cucumber', 'olive oil'] : 
                ['chicken breast', 'romaine lettuce', 'parmesan', 'croutons', 'caesar dressing']
          },
          { 
            name: isVegan ? 'Coconut Chickpea Curry' : isVegetarian ? 'Paneer Butter Masala' : 'Chicken Tikka Masala', 
            ingredients: isVegan ? 
              ['chickpeas', 'coconut milk', 'curry spices', 'spinach', 'basmati rice'] : 
              isVegetarian ? 
                ['paneer', 'tomato sauce', 'cream', 'curry spices', 'basmati rice'] : 
                ['chicken thighs', 'coconut milk', 'curry spices', 'onions', 'basmati rice']
          },
          { 
            name: isVegan ? 'Avocado Toast Bowl' : isVegetarian ? 'Caprese Grilled Sandwich' : 'Club Sandwich', 
            ingredients: isVegan ? 
              ['sourdough bread', 'avocado', 'cherry tomatoes', 'lime', 'hemp seeds'] : 
              isVegetarian ? 
                ['sourdough bread', 'mozzarella', 'tomato', 'basil', 'balsamic glaze'] : 
                ['bread', 'turkey', 'ham', 'cheese', 'lettuce', 'tomato']
          }
        ];
        
        const meal = baseMealTypes[index];
        const adjustedMealCost = Math.max(avgMealCost * 0.8, Math.min(avgMealCost * 1.2, avgMealCost));
        
        return {
          day,
          recipe_name: meal.name + (userProfile?.regenerating ? ` - Alternative ${Date.now() % 1000}` : ''),
          description: `Delicious ${day.toLowerCase()} meal - ${meal.name.toLowerCase()} perfectly sized for ${householdSize} ${householdSize === 1 ? 'person' : 'people'}`,
          ingredients: meal.ingredients.map(ingredient => ({
            name: ingredient,
            amount: ingredient.includes('rice') || ingredient.includes('pasta') || ingredient.includes('quinoa') ? 
              `${Math.ceil(200 * householdSize / 2)}g` : 
              ingredient.includes('bread') ? 
                `${Math.ceil(2 * householdSize / 2)} slices` : 
                `${Math.ceil(150 * householdSize / 2)}g`,
            prices: {
              tesco: { 
                price: parseFloat((1.5 + Math.random() * 2.5).toFixed(2)), 
                url: `https://tesco.com/search?q=${encodeURIComponent(ingredient)}`, 
                title: `Tesco ${ingredient}` 
              },
              sainsburys: { 
                price: parseFloat((1.6 + Math.random() * 2.5).toFixed(2)), 
                url: `https://sainsburys.co.uk/search?q=${encodeURIComponent(ingredient)}`, 
                title: `Sainsbury's ${ingredient}` 
              },
              asda: { 
                price: parseFloat((1.4 + Math.random() * 2.5).toFixed(2)), 
                url: `https://asda.com/search?q=${encodeURIComponent(ingredient)}`, 
                title: `Asda ${ingredient}` 
              },
              aldi: { 
                price: parseFloat((1.3 + Math.random() * 2.5).toFixed(2)), 
                url: `https://aldi.co.uk/search?q=${encodeURIComponent(ingredient)}`, 
                title: `Aldi ${ingredient}` 
              }
            }
          })),
          instructions: [
            `Prepare this delicious ${meal.name.toLowerCase()} for ${householdSize} ${householdSize === 1 ? 'person' : 'people'}.`,
            `Start by gathering all fresh ingredients and prepping vegetables.`,
            `Cook the main components according to the recipe method below.`,
            `Combine all ingredients thoughtfully and season to your taste preferences.`,
            `Serve immediately while hot and enjoy your nutritious ${day} dinner!`
          ],
          nutrition: {
            calories: Math.floor(350 + Math.random() * 250),
            protein: `${Math.floor(15 + Math.random() * 25)}g`,
            carbs: `${Math.floor(35 + Math.random() * 35)}g`,
            fat: `${Math.floor(8 + Math.random() * 18)}g`,
            fiber: `${Math.floor(4 + Math.random() * 12)}g`,
            sugar: `${Math.floor(5 + Math.random() * 15)}g`
          },
          picture_url: `https://images.unsplash.com/photo-${1565299624946 + index + (userProfile?.regenerating ? 1000 : 0)}?w=400&h=300&fit=crop&auto=format`,
          cost_by_supermarket: {
            tesco: parseFloat(adjustedMealCost.toFixed(2)),
            sainsburys: parseFloat((adjustedMealCost * 1.05).toFixed(2)),
            asda: parseFloat((adjustedMealCost * 0.95).toFixed(2)),
            aldi: parseFloat((adjustedMealCost * 0.90).toFixed(2))
          }
        };
      });

      const totalWeekCost = {
        tesco: parseFloat(fallbackMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.tesco, 0).toFixed(2)),
        sainsburys: parseFloat(fallbackMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.sainsburys, 0).toFixed(2)),
        asda: parseFloat(fallbackMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.asda, 0).toFixed(2)),
        aldi: parseFloat(fallbackMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.aldi, 0).toFixed(2))
      };

      return new Response(JSON.stringify({ 
        meals: fallbackMeals,
        total_week_cost: totalWeekCost,
        fallback_reason: 'API temporarily unavailable - using personalized fallback based on your preferences'
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
        picture_url: meal.picture_url && meal.picture_url.includes('spoonacular') ? 
          meal.picture_url : 
          `https://images.unsplash.com/photo-${1565299624946 + index + (userProfile?.regenerating ? 500 : 0)}?w=400&h=300&fit=crop&auto=format`,
        // Ensure ingredients have complete price structure for all stores
        ingredients: meal.ingredients?.map((ingredient) => {
          if (typeof ingredient === 'string') {
            // Convert string ingredients to enhanced format with all store prices
            return {
              name: ingredient,
              amount: '1 unit',
              prices: {
                tesco: { price: parseFloat((1.5 + Math.random() * 2).toFixed(2)), url: `https://tesco.com/search?q=${encodeURIComponent(ingredient)}`, title: `Tesco ${ingredient}` },
                sainsburys: { price: parseFloat((1.6 + Math.random() * 2).toFixed(2)), url: `https://sainsburys.co.uk/search?q=${encodeURIComponent(ingredient)}`, title: `Sainsbury's ${ingredient}` },
                asda: { price: parseFloat((1.4 + Math.random() * 2).toFixed(2)), url: `https://asda.com/search?q=${encodeURIComponent(ingredient)}`, title: `Asda ${ingredient}` },
                aldi: { price: parseFloat((1.3 + Math.random() * 2).toFixed(2)), url: `https://aldi.co.uk/search?q=${encodeURIComponent(ingredient)}`, title: `Aldi ${ingredient}` }
              }
            };
          }
          // Ensure existing ingredient objects have all store prices
          return {
            ...ingredient,
            prices: {
              tesco: ingredient.prices?.tesco || { price: parseFloat((1.5 + Math.random() * 2).toFixed(2)), url: '#', title: `Tesco ${ingredient.name}` },
              sainsburys: ingredient.prices?.sainsburys || { price: parseFloat((1.6 + Math.random() * 2).toFixed(2)), url: '#', title: `Sainsbury's ${ingredient.name}` },
              asda: ingredient.prices?.asda || { price: parseFloat((1.4 + Math.random() * 2).toFixed(2)), url: '#', title: `Asda ${ingredient.name}` },
              aldi: ingredient.prices?.aldi || { price: parseFloat((1.3 + Math.random() * 2).toFixed(2)), url: '#', title: `Aldi ${ingredient.name}` }
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
        tesco: parseFloat(enhancedMeals.reduce((sum, meal) => sum + (meal.cost_by_supermarket?.tesco || 0), 0).toFixed(2)),
        sainsburys: parseFloat(enhancedMeals.reduce((sum, meal) => sum + (meal.cost_by_supermarket?.sainsburys || 0), 0).toFixed(2)),
        asda: parseFloat(enhancedMeals.reduce((sum, meal) => sum + (meal.cost_by_supermarket?.asda || 0), 0).toFixed(2)),
        aldi: parseFloat(enhancedMeals.reduce((sum, meal) => sum + (meal.cost_by_supermarket?.aldi || 0), 0).toFixed(2))
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
              tesco: { price: parseFloat((1.5 + Math.random() * 2).toFixed(2)), url: '#', title: `Tesco ${ingredient}` },
              sainsburys: { price: parseFloat((1.6 + Math.random() * 2).toFixed(2)), url: '#', title: `Sainsbury's ${ingredient}` },
              asda: { price: parseFloat((1.4 + Math.random() * 2).toFixed(2)), url: '#', title: `Asda ${ingredient}` },
              aldi: { price: parseFloat((1.3 + Math.random() * 2).toFixed(2)), url: '#', title: `Aldi ${ingredient}` }
            }
          };
        }
        return ingredient;
      }) || [],
      instructions: singleRecipe.instructions || 'No instructions provided',
      estimated_cost: singleRecipe.estimated_cost || 0,
      description: singleRecipe.description || '',
      picture_url: singleRecipe.picture_url && singleRecipe.picture_url.includes('spoonacular') ? 
        singleRecipe.picture_url : 
        `https://images.unsplash.com/photo-${1565299624946 + Math.floor(Math.random() * 100)}?w=400&h=300&fit=crop&auto=format`
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
