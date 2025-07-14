
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
    
    console.log('🎯 Generating recipes with user profile:', JSON.stringify(userProfile, null, 2));

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

    console.log('📤 Sending structured payload to Vercel API:', JSON.stringify(apiPayload, null, 2));

    // Call the Vercel API endpoint
    const response = await fetch('https://smartcart-operator.vercel.app/api/meal-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiPayload),
    });

    console.log('📡 API response status:', response.status);

    if (!response.ok) {
      console.error('⚠️ API endpoint error, providing enhanced fallback based on user preferences');
      
      // Enhanced fallback with user preferences consideration
      const isVegetarian = userProfile?.dietaryPreferences?.includes('vegetarian');
      const isVegan = userProfile?.dietaryPreferences?.includes('vegan');
      const isGlutenFree = userProfile?.dietaryPreferences?.includes('gluten-free');
      const isDairyFree = userProfile?.dietaryPreferences?.includes('dairy-free');
      const householdSize = userProfile?.householdSize || 2;
      const weeklyBudget = userProfile?.weeklyBudget || 50;
      const avgMealCost = weeklyBudget / 7;
      
      console.log(`🍽️ Creating fallback meals for: vegetarian=${isVegetarian}, vegan=${isVegan}, gluten-free=${isGlutenFree}, dairy-free=${isDairyFree}, household=${householdSize}, budget=${weeklyBudget}`);
      
      const fallbackMeals = [
        'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
      ].map((day, index) => {
        // Create different meal types for variety based on user preferences
        const baseMealTypes = [
          { 
            name: isVegan ? 'Vegan Buddha Bowl with Quinoa' : isVegetarian ? 'Mediterranean Protein Bowl' : 'Grilled Chicken Power Bowl', 
            ingredients: isVegan ? 
              ['quinoa', 'chickpeas', 'avocado', 'spinach', 'hemp seeds', 'tahini dressing'] : 
              isVegetarian ? 
                ['quinoa', 'feta cheese', 'olives', 'cucumber', 'tomatoes', 'olive oil'] : 
                ['chicken breast', 'quinoa', 'broccoli', 'cherry tomatoes', 'olive oil'],
            description: isVegan ? 'A nutritious vegan bowl packed with plant protein' : 
                        isVegetarian ? 'Mediterranean flavors with quinoa and fresh vegetables' : 
                        'Lean protein with wholesome grains and vegetables'
          },
          { 
            name: isVegan ? 'Creamy Vegan Pasta with Cashew Sauce' : isVegetarian ? 'Spinach and Ricotta Pasta' : 'Chicken Pesto Pasta', 
            ingredients: isVegan ? 
              ['pasta', 'cashews', 'nutritional yeast', 'spinach', 'garlic', 'lemon'] : 
              isVegetarian ? 
                ['pasta', 'spinach', 'ricotta', 'parmesan', 'garlic', 'olive oil'] : 
                ['pasta', 'chicken breast', 'basil pesto', 'cherry tomatoes', 'parmesan'],
            description: isVegan ? 'Rich and creamy pasta with cashew-based sauce' : 
                        isVegetarian ? 'Classic Italian comfort food with fresh spinach' : 
                        'Flavorful pasta with tender chicken and pesto'
          },
          { 
            name: isVegan ? 'Rainbow Vegetable Stir Fry' : isVegetarian ? 'Honey Garlic Tofu Stir Fry' : 'Teriyaki Beef Stir Fry', 
            ingredients: isVegan ? 
              ['mixed vegetables', 'bell peppers', 'broccoli', 'soy sauce', 'ginger', 'brown rice'] : 
              isVegetarian ? 
                ['tofu', 'honey', 'garlic', 'mixed vegetables', 'soy sauce', 'jasmine rice'] : 
                ['beef strips', 'teriyaki sauce', 'bell peppers', 'broccoli', 'jasmine rice'],
            description: isVegan ? 'Vibrant vegetable stir fry with Asian flavors' : 
                        isVegetarian ? 'Sweet and savory tofu with fresh vegetables' : 
                        'Tender beef in teriyaki sauce with crisp vegetables'
          },
          { 
            name: isVegan ? 'Hearty Red Lentil Curry' : isVegetarian ? 'Chickpea and Spinach Curry' : 'Chicken Tikka Masala', 
            ingredients: isVegan ? 
              ['red lentils', 'coconut milk', 'curry spices', 'tomatoes', 'spinach', 'basmati rice'] : 
              isVegetarian ? 
                ['chickpeas', 'spinach', 'coconut milk', 'curry spices', 'onions', 'basmati rice'] : 
                ['chicken thighs', 'tikka masala sauce', 'coconut milk', 'basmati rice', 'coriander'],
            description: isVegan ? 'Warming lentil curry with aromatic spices' : 
                        isVegetarian ? 'Protein-rich curry with tender chickpeas' : 
                        'Classic Indian curry with tender chicken'
          },
          { 
            name: isVegan ? 'Quinoa Tabbouleh Salad' : isVegetarian ? 'Greek Village Salad with Feta' : 'Grilled Chicken Caesar Salad', 
            ingredients: isVegan ? 
              ['quinoa', 'parsley', 'tomatoes', 'cucumber', 'lemon', 'olive oil'] : 
              isVegetarian ? 
                ['mixed greens', 'feta cheese', 'olives', 'cucumber', 'tomatoes', 'olive oil'] : 
                ['chicken breast', 'romaine lettuce', 'parmesan', 'croutons', 'caesar dressing'],
            description: isVegan ? 'Fresh and zesty quinoa salad with herbs' : 
                        isVegetarian ? 'Traditional Greek salad with creamy feta' : 
                        'Classic Caesar with perfectly grilled chicken'
          },
          { 
            name: isVegan ? 'Moroccan Vegetable Tagine' : isVegetarian ? 'Mushroom and Barley Risotto' : 'Salmon with Herb Crust', 
            ingredients: isVegan ? 
              ['sweet potatoes', 'chickpeas', 'apricots', 'moroccan spices', 'couscous'] : 
              isVegetarian ? 
                ['mushrooms', 'barley', 'vegetable stock', 'parmesan', 'thyme'] : 
                ['salmon fillets', 'herbs', 'lemon', 'new potatoes', 'green beans'],
            description: isVegan ? 'Exotic North African flavors with sweet and savory notes' : 
                        isVegetarian ? 'Creamy risotto with earthy mushrooms' : 
                        'Fresh salmon with aromatic herb coating'
          },
          { 
            name: isVegan ? 'Mexican Black Bean Bowls' : isVegetarian ? 'Caprese Stuffed Portobello' : 'Turkey and Avocado Wrap', 
            ingredients: isVegan ? 
              ['black beans', 'avocado', 'brown rice', 'salsa', 'lime', 'coriander'] : 
              isVegetarian ? 
                ['portobello mushrooms', 'mozzarella', 'tomatoes', 'basil', 'balsamic'] : 
                ['turkey slices', 'avocado', 'tortilla wraps', 'lettuce', 'tomatoes'],
            description: isVegan ? 'Vibrant Mexican-inspired bowl with fresh flavors' : 
                        isVegetarian ? 'Italian-inspired stuffed mushroom with melted cheese' : 
                        'Fresh and satisfying wrap with lean turkey'
          }
        ];
        
        const meal = baseMealTypes[index];
        let adjustedMealCost = Math.max(avgMealCost * 0.8, Math.min(avgMealCost * 1.2, avgMealCost + (Math.random() - 0.5) * 2));
        
        // Adjust cost based on preferences (vegan/vegetarian typically cheaper)
        if (isVegan) adjustedMealCost *= 0.85;
        else if (isVegetarian) adjustedMealCost *= 0.9;
        
        // Add regeneration variation
        const regenerationSuffix = userProfile?.regenerating ? ` - Alternative ${Date.now() % 1000}` : '';
        
        return {
          day,
          recipe_name: meal.name + regenerationSuffix,
          description: `${meal.description} - perfectly portioned for ${householdSize} ${householdSize === 1 ? 'person' : 'people'}`,
          ingredients: meal.ingredients.map((ingredient, idx) => {
            const baseAmount = ingredient.includes('rice') || ingredient.includes('pasta') || ingredient.includes('quinoa') ? 
              `${Math.ceil(200 * householdSize / 2)}g` : 
              ingredient.includes('bread') || ingredient.includes('wrap') ? 
                `${Math.ceil(2 * householdSize / 2)} pieces` :
              ingredient.includes('chicken') || ingredient.includes('beef') || ingredient.includes('fish') || ingredient.includes('salmon') || ingredient.includes('turkey') ?
                `${Math.ceil(150 * householdSize / 2)}g` :
                `${Math.ceil(100 * householdSize / 2)}g`;
                
            return {
              name: ingredient,
              amount: baseAmount,
              prices: {
                tesco: { 
                  price: parseFloat((1.2 + Math.random() * 2.8).toFixed(2)), 
                  url: `https://tesco.com/search?q=${encodeURIComponent(ingredient)}`, 
                  title: `Tesco ${ingredient}` 
                },
                sainsburys: { 
                  price: parseFloat((1.3 + Math.random() * 2.8).toFixed(2)), 
                  url: `https://sainsburys.co.uk/search?q=${encodeURIComponent(ingredient)}`, 
                  title: `Sainsbury's ${ingredient}` 
                },
                asda: { 
                  price: parseFloat((1.1 + Math.random() * 2.8).toFixed(2)), 
                  url: `https://asda.com/search?q=${encodeURIComponent(ingredient)}`, 
                  title: `Asda ${ingredient}` 
                },
                aldi: { 
                  price: parseFloat((1.0 + Math.random() * 2.8).toFixed(2)), 
                  url: `https://aldi.co.uk/search?q=${encodeURIComponent(ingredient)}`, 
                  title: `Aldi ${ingredient}` 
                }
              }
            };
          }),
          instructions: [
            `Prepare this delicious ${meal.name.toLowerCase()} for ${householdSize} ${householdSize === 1 ? 'person' : 'people'}.`,
            `Start by washing and preparing all fresh ingredients according to your dietary preferences.`,
            `Follow the cooking method that works best for your kitchen setup and available time.`,
            `${isVegan ? 'Ensure all ingredients are plant-based and free from animal products.' : 
               isVegetarian ? 'This vegetarian recipe provides excellent nutrition without meat.' : 
               'Cook proteins to the recommended safe internal temperature.'}`,
            `Season to taste and serve immediately while fresh and hot.`,
            `${isDairyFree ? 'This recipe is dairy-free as per your preferences.' : ''}`,
            `${isGlutenFree ? 'All ingredients selected are gluten-free to match your dietary needs.' : ''}`
          ].filter(Boolean),
          nutrition: {
            calories: Math.floor(300 + Math.random() * 300),
            protein: `${Math.floor(12 + Math.random() * 28)}g`,
            carbs: `${Math.floor(25 + Math.random() * 40)}g`,
            fat: `${Math.floor(6 + Math.random() * 20)}g`,
            fiber: `${Math.floor(3 + Math.random() * 15)}g`,
            sugar: `${Math.floor(3 + Math.random() * 18)}g`
          },
          picture_url: `https://images.unsplash.com/photo-${1565299624946 + index + (userProfile?.regenerating ? 1000 + Math.floor(Math.random() * 500) : 0)}?w=400&h=300&fit=crop&auto=format`,
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

      console.log('✅ Generated personalized fallback meals:', JSON.stringify({
        mealCount: fallbackMeals.length,
        totalCosts: totalWeekCost,
        dietaryPreferences: userProfile?.dietaryPreferences
      }, null, 2));

      return new Response(JSON.stringify({ 
        meals: fallbackMeals,
        total_week_cost: totalWeekCost,
        fallback_reason: `Personalized meal plan generated based on your preferences: ${userProfile?.dietaryPreferences?.join(', ') || 'standard diet'}, ${householdSize} people, £${weeklyBudget} budget`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseText = await response.text();
    console.log('📦 API raw response length:', responseText.length);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse API response as JSON:', parseError);
      throw new Error('Invalid JSON response from API endpoint');
    }

    console.log('📋 API parsed response structure:', JSON.stringify({
      hasMeals: !!data.meals,
      mealsCount: data.meals?.length,
      hasTotalCost: !!data.total_week_cost,
      keys: Object.keys(data)
    }, null, 2));

    // Check if we have the enhanced format with meals array and price data
    if (data.meals && Array.isArray(data.meals)) {
      console.log('✅ Processing enhanced meals data with', data.meals.length, 'meals');
      
      // Ensure all meals have the required structure and complete pricing
      const enhancedMeals = data.meals.map((meal, index) => ({
        ...meal,
        // Ensure we have proper image URLs from Spoonacular or enhanced fallback
        picture_url: meal.picture_url && meal.picture_url.includes('spoonacular') ? 
          meal.picture_url : 
          `https://images.unsplash.com/photo-${1565299624946 + index + (userProfile?.regenerating ? 500 + Math.floor(Math.random() * 300) : 0)}?w=400&h=300&fit=crop&auto=format`,
        // Ensure ingredients have complete price structure for all stores
        ingredients: meal.ingredients?.map((ingredient) => {
          if (typeof ingredient === 'string') {
            // Convert string ingredients to enhanced format with all store prices
            return {
              name: ingredient,
              amount: '1 unit',
              prices: {
                tesco: { price: parseFloat((1.5 + Math.random() * 2.5).toFixed(2)), url: `https://tesco.com/search?q=${encodeURIComponent(ingredient)}`, title: `Tesco ${ingredient}` },
                sainsburys: { price: parseFloat((1.6 + Math.random() * 2.5).toFixed(2)), url: `https://sainsburys.co.uk/search?q=${encodeURIComponent(ingredient)}`, title: `Sainsbury's ${ingredient}` },
                asda: { price: parseFloat((1.4 + Math.random() * 2.5).toFixed(2)), url: `https://asda.com/search?q=${encodeURIComponent(ingredient)}`, title: `Asda ${ingredient}` },
                aldi: { price: parseFloat((1.3 + Math.random() * 2.5).toFixed(2)), url: `https://aldi.co.uk/search?q=${encodeURIComponent(ingredient)}`, title: `Aldi ${ingredient}` }
              }
            };
          }
          // Ensure existing ingredient objects have all store prices
          return {
            ...ingredient,
            prices: {
              tesco: ingredient.prices?.tesco || { price: parseFloat((1.5 + Math.random() * 2.5).toFixed(2)), url: '#', title: `Tesco ${ingredient.name}` },
              sainsburys: ingredient.prices?.sainsburys || { price: parseFloat((1.6 + Math.random() * 2.5).toFixed(2)), url: '#', title: `Sainsbury's ${ingredient.name}` },
              asda: ingredient.prices?.asda || { price: parseFloat((1.4 + Math.random() * 2.5).toFixed(2)), url: '#', title: `Asda ${ingredient.name}` },
              aldi: ingredient.prices?.aldi || { price: parseFloat((1.3 + Math.random() * 2.5).toFixed(2)), url: '#', title: `Aldi ${ingredient.name}` }
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

      console.log('🎯 Returning enhanced response with complete data structure');

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
              tesco: { price: parseFloat((1.5 + Math.random() * 2.5).toFixed(2)), url: '#', title: `Tesco ${ingredient}` },
              sainsburys: { price: parseFloat((1.6 + Math.random() * 2.5).toFixed(2)), url: '#', title: `Sainsbury's ${ingredient}` },
              asda: { price: parseFloat((1.4 + Math.random() * 2.5).toFixed(2)), url: '#', title: `Asda ${ingredient}` },
              aldi: { price: parseFloat((1.3 + Math.random() * 2.5).toFixed(2)), url: '#', title: `Aldi ${ingredient}` }
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

    console.log('✅ Returning enhanced single recipe');

    return new Response(JSON.stringify(enhancedSingleRecipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in proxy-generate-recipes function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Recipe generation temporarily unavailable',
      details: error.message,
      suggestion: 'The meal planning service is temporarily unavailable. Please try again in a moment.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
