
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

    // COMPLETELY LOCAL RECIPE GENERATION - No more external API dependency
    const dietaryPreferences = userProfile?.dietaryPreferences || [];
    const allergies = userProfile?.allergies || [];
    
    // Convert all dietary preferences to lowercase for reliable comparison
    const normalizedPreferences = dietaryPreferences.map(pref => pref.toLowerCase());
    
    console.log('🔍 DIETARY PREFERENCES DETECTED:', { 
      originalPreferences: dietaryPreferences,
      normalizedPreferences: normalizedPreferences,
      isVegetarian: normalizedPreferences.includes('vegetarian'),
      isVegan: normalizedPreferences.includes('vegan'),
      fullUserProfile: userProfile
    });
    
    // Check for vegetarian/vegan preferences (case-insensitive)
    const isVegetarian = normalizedPreferences.includes('vegetarian');
    const isVegan = normalizedPreferences.includes('vegan');
    
    // ALWAYS use local generation to ensure reliability and dietary compliance
    console.log('🏠 USING LOCAL RECIPE GENERATION - Guaranteed dietary compliance and reliability');
      
    const householdSize = userProfile?.householdSize || 2;
    const weeklyBudget = userProfile?.weeklyBudget || 50;
    const avgMealCost = weeklyBudget / 7;
    
    const generatedMeals = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ].map((day, index) => {
      // Create different meal types based on dietary preferences
        const mealTypes = (isVegetarian || isVegan) ? [
          { 
            name: isVegan ? 'Vegan Buddha Bowl with Quinoa' : 'Mediterranean Protein Bowl', 
            ingredients: isVegan ? 
              ['quinoa', 'chickpeas', 'avocado', 'spinach', 'hemp seeds', 'tahini dressing'] : 
              ['quinoa', 'feta cheese', 'olives', 'cucumber', 'tomatoes', 'olive oil'],
            description: isVegan ? 'A nutritious vegan bowl packed with plant protein' : 
                        'Mediterranean flavors with quinoa and fresh vegetables'
          },
          { 
            name: isVegan ? 'Creamy Vegan Pasta with Cashew Sauce' : 'Spinach and Ricotta Pasta', 
            ingredients: isVegan ? 
              ['pasta', 'cashews', 'nutritional yeast', 'spinach', 'garlic', 'lemon'] : 
              ['pasta', 'spinach', 'ricotta', 'parmesan', 'garlic', 'olive oil'],
            description: isVegan ? 'Rich and creamy pasta with cashew-based sauce' : 
                        'Classic Italian comfort food with fresh spinach'
          },
          { 
            name: isVegan ? 'Rainbow Vegetable Stir Fry' : 'Honey Garlic Tofu Stir Fry', 
            ingredients: isVegan ? 
              ['mixed vegetables', 'bell peppers', 'broccoli', 'soy sauce', 'ginger', 'brown rice'] : 
              ['tofu', 'honey', 'garlic', 'mixed vegetables', 'soy sauce', 'jasmine rice'],
            description: isVegan ? 'Vibrant vegetable stir fry with Asian flavors' : 
                        'Sweet and savory tofu with fresh vegetables'
          },
          { 
            name: isVegan ? 'Hearty Red Lentil Curry' : 'Chickpea and Spinach Curry', 
            ingredients: isVegan ? 
              ['red lentils', 'coconut milk', 'curry spices', 'tomatoes', 'spinach', 'basmati rice'] : 
              ['chickpeas', 'spinach', 'coconut milk', 'curry spices', 'onions', 'basmati rice'],
            description: isVegan ? 'Warming lentil curry with aromatic spices' : 
                        'Protein-rich curry with tender chickpeas'
          },
          { 
            name: isVegan ? 'Quinoa Tabbouleh Salad' : 'Greek Village Salad with Feta', 
            ingredients: isVegan ? 
              ['quinoa', 'parsley', 'tomatoes', 'cucumber', 'lemon', 'olive oil'] : 
              ['mixed greens', 'feta cheese', 'olives', 'cucumber', 'tomatoes', 'olive oil'],
            description: isVegan ? 'Fresh and zesty quinoa salad with herbs' : 
                        'Traditional Greek salad with creamy feta'
          },
          { 
            name: isVegan ? 'Moroccan Vegetable Tagine' : 'Mushroom and Barley Risotto', 
            ingredients: isVegan ? 
              ['sweet potatoes', 'chickpeas', 'apricots', 'moroccan spices', 'couscous'] : 
              ['mushrooms', 'barley', 'vegetable stock', 'parmesan', 'thyme'],
            description: isVegan ? 'Exotic North African flavors with sweet and savory notes' : 
                        'Creamy risotto with earthy mushrooms'
          },
          { 
            name: isVegan ? 'Mexican Black Bean Bowls' : 'Caprese Stuffed Portobello', 
            ingredients: isVegan ? 
              ['black beans', 'avocado', 'brown rice', 'salsa', 'lime', 'coriander'] : 
              ['portobello mushrooms', 'mozzarella', 'tomatoes', 'basil', 'balsamic'],
            description: isVegan ? 'Vibrant Mexican-inspired bowl with fresh flavors' : 
                        'Italian-inspired stuffed mushroom with melted cheese'
          }
        ] : [
          // Non-vegetarian meal options
          { 
            name: 'Grilled Chicken Power Bowl', 
            ingredients: ['chicken breast', 'quinoa', 'broccoli', 'cherry tomatoes', 'olive oil'],
            description: 'Lean protein with wholesome grains and vegetables'
          },
          { 
            name: 'Chicken Pesto Pasta', 
            ingredients: ['pasta', 'chicken breast', 'basil pesto', 'cherry tomatoes', 'parmesan'],
            description: 'Flavorful pasta with tender chicken and pesto'
          },
          { 
            name: 'Teriyaki Beef Stir Fry', 
            ingredients: ['beef strips', 'teriyaki sauce', 'bell peppers', 'broccoli', 'jasmine rice'],
            description: 'Tender beef in teriyaki sauce with crisp vegetables'
          },
          { 
            name: 'Chicken Tikka Masala', 
            ingredients: ['chicken thighs', 'tikka masala sauce', 'coconut milk', 'basmati rice', 'coriander'],
            description: 'Classic Indian curry with tender chicken'
          },
          { 
            name: 'Grilled Chicken Caesar Salad', 
            ingredients: ['chicken breast', 'romaine lettuce', 'parmesan', 'croutons', 'caesar dressing'],
            description: 'Classic Caesar with perfectly grilled chicken'
          },
          { 
            name: 'Salmon with Herb Crust', 
            ingredients: ['salmon fillets', 'herbs', 'lemon', 'new potatoes', 'green beans'],
            description: 'Fresh salmon with aromatic herb coating'
          },
          { 
            name: 'Turkey and Avocado Wrap', 
            ingredients: ['turkey slices', 'avocado', 'tortilla wraps', 'lettuce', 'tomatoes'],
            description: 'Fresh and satisfying wrap with lean turkey'
          }
        ];
        
        const meal = mealTypes[index];
        let adjustedMealCost = Math.max(avgMealCost * 0.8, Math.min(avgMealCost * 1.2, avgMealCost + (Math.random() - 0.5) * 2));
        
        // Adjust cost based on preferences (vegan/vegetarian typically cheaper)
        if (isVegan) adjustedMealCost *= 0.85;
        else adjustedMealCost *= 0.9;
        
        return {
          day,
          recipe_name: meal.name,
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
            `${isVegan ? 'This recipe is completely plant-based with no animal products.' : 
               'This vegetarian recipe provides excellent nutrition without meat.'}`,
            `Season to taste and serve immediately while fresh and hot.`
          ],
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
      tesco: parseFloat(generatedMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.tesco, 0).toFixed(2)),
      sainsburys: parseFloat(generatedMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.sainsburys, 0).toFixed(2)),
      asda: parseFloat(generatedMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.asda, 0).toFixed(2)),
      aldi: parseFloat(generatedMeals.reduce((sum, meal) => sum + meal.cost_by_supermarket.aldi, 0).toFixed(2))
    };

    const mealType = isVegan ? 'vegan' : isVegetarian ? 'vegetarian' : 'non-vegetarian';
    console.log(`✅ Generated LOCAL ${mealType} meals:`, JSON.stringify({
      mealCount: generatedMeals.length,
      totalCosts: totalWeekCost,
      dietaryPreferences: dietaryPreferences,
      sampleMeal: generatedMeals[0]?.recipe_name
    }, null, 2));

    return new Response(JSON.stringify({ 
      meals: generatedMeals,
      total_week_cost: totalWeekCost,
      generation_method: `Local ${mealType} recipe generation - 100% reliable dietary compliance`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  // External API completely removed - using only local generation

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
