import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userPreferences, conversationHistory = [], action, query } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Handle search action for recipe search
    if (action === 'search') {
      console.log('AI Meal Planner search called with query:', query);
      
      const searchSystemPrompt = `You are a recipe search assistant. Generate 3-5 REAL recipe suggestions based on the search query.
      
User Search: "${query}"
Dietary Preferences: ${userPreferences.dietaryPreferences?.join(', ') || 'None'}
Allergies: ${userPreferences.allergies?.join(', ') || 'None'}
Household Size: ${userPreferences.householdSize || 2} people
Budget per meal: £${((userPreferences.weeklyBudget || 50) / 7).toFixed(2)}

REQUIREMENTS:
1. Generate authentic recipes matching the search query
2. STRICTLY respect dietary preferences and allergies
3. Scale ingredients for ${userPreferences.householdSize || 2} people
4. Provide realistic UK supermarket prices
5. Include detailed nutritional information`;

      const searchResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: searchSystemPrompt },
            { role: 'user', content: `Find me recipes for: ${query}` }
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'search_recipes',
              description: 'Search for recipe suggestions',
              parameters: {
                type: 'object',
                properties: {
                  recipes: {
                    type: 'array',
                    minItems: 3,
                    maxItems: 5,
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        description: { type: 'string' },
                        ingredients: { type: 'array', items: { type: 'object' } },
                        instructions: { type: 'array', items: { type: 'string' } },
                        prepTime: { type: 'string' },
                        cookTime: { type: 'string' },
                        servings: { type: 'number' },
                        estimatedCost: { type: 'number' },
                        calories: { type: 'number' }
                      }
                    }
                  }
                }
              }
            }
          }],
          tool_choice: { type: 'function', function: { name: 'search_recipes' } }
        }),
      });

      if (!searchResponse.ok) {
        throw new Error(`Search AI error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const searchToolCall = searchData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (!searchToolCall) {
        throw new Error('No search results generated');
      }

      const searchResults = JSON.parse(searchToolCall.function.arguments);
      
      // Generate images for search results
      const recipesWithImages = await Promise.all(
        searchResults.recipes.map(async (recipe: any) => {
          try {
            const imagePrompt = `Professional food photography: ${recipe.name}, plated beautifully, natural lighting, appetizing, restaurant quality, 16:9 aspect ratio, ultra high resolution`;
            
            const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash-image-preview',
                messages: [{ role: 'user', content: imagePrompt }],
                modalities: ['image', 'text']
              }),
            });

            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
              return { ...recipe, image: imageUrl || '/placeholder.svg' };
            }
          } catch (error) {
            console.error(`Error generating image for ${recipe.name}:`, error);
          }
          
          return { ...recipe, image: '/placeholder.svg' };
        })
      );

      return new Response(
        JSON.stringify({
          success: true,
          recipes: recipesWithImages
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('AI Meal Planner called with preferences:', userPreferences);

    const systemPrompt = `You are an expert meal planning assistant for SmartCart. 
Your role is to create REAL, AUTHENTIC, and DELICIOUS meal plans.

User Profile:
- Dietary Preferences: ${userPreferences.dietaryPreferences?.join(', ') || 'None'}
- Allergies: ${userPreferences.allergies?.join(', ') || 'None'}
- Household Size: ${userPreferences.householdSize || 2} people
- Weekly Budget: £${userPreferences.weeklyBudget || 50}
- Connected Stores: ${userPreferences.connectedStores?.map(s => s.name).join(', ') || 'Tesco, Sainsbury\'s'}

CRITICAL REQUIREMENTS:
1. Generate 7 REAL recipes from established cuisines (Italian, Indian, Chinese, Mediterranean, etc.)
2. STRICTLY respect dietary preferences:
   - Vegetarian = NO meat, poultry, or fish (dairy/eggs OK)
   - Vegan = NO animal products at all (no meat, dairy, eggs, honey)
3. NEVER include allergens listed above
4. Scale all ingredient quantities for ${userPreferences.householdSize || 2} people
5. Provide step-by-step cooking instructions (5-8 steps)
6. Calculate realistic costs based on UK supermarket prices
7. Include prep time, cook time, and difficulty level
8. Ensure nutritional balance across the week
9. Vary cuisines and cooking methods throughout the week

Budget Considerations:
- Total weekly cost should be around £${userPreferences.weeklyBudget || 50}
- Cost per meal: £${((userPreferences.weeklyBudget || 50) / 7).toFixed(2)}
- Include both budget-friendly and slightly premium meals

IMPORTANT: Generate authentic, tried-and-tested recipes that real people cook, not generic or made-up dishes.`;

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
          ...conversationHistory,
          { 
            role: 'user', 
            content: conversationHistory.length === 0 
              ? 'Create a complete weekly meal plan for me based on my preferences.'
              : conversationHistory[conversationHistory.length - 1].content
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_meal_plan',
              description: 'Generate a complete weekly meal plan',
              parameters: {
                type: 'object',
                properties: {
                  meals: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        day: { type: 'string', enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        ingredients: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              name: { type: 'string', description: 'Ingredient name' },
                              amount: { type: 'string', description: 'Quantity with unit (e.g., "200g", "2 cups", "1 large")' },
                              category: { type: 'string', description: 'Food category (e.g., "Proteins", "Vegetables", "Dairy")' }
                            },
                            required: ['name', 'amount', 'category']
                          },
                          description: 'Complete list of ingredients with precise quantities'
                        },
                        instructions: { 
                          type: 'array', 
                          items: { type: 'string' },
                          description: 'Step-by-step cooking instructions (5-8 steps)'
                        },
                        prep_time: { type: 'string', description: 'Preparation time (e.g., "15 mins")' },
                        cook_time: { type: 'string', description: 'Cooking time (e.g., "30 mins")' },
                        difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
                        calories: { type: 'number', description: 'Calories per serving' },
                        protein: { type: 'number', description: 'Protein in grams' },
                        carbs: { type: 'number', description: 'Carbohydrates in grams' },
                        fat: { type: 'number', description: 'Fat in grams' },
                        estimated_cost: { type: 'number', description: 'Cost in GBP for the household size' },
                        tags: { type: 'array', items: { type: 'string' }, description: 'Tags like "Quick", "Healthy", "Family-friendly"' },
                        cuisine: { type: 'string', description: 'Cuisine type (e.g., "Italian", "Indian")' }
                      },
                      required: ['day', 'name', 'description', 'ingredients', 'instructions', 'prep_time', 'cook_time', 'difficulty', 'calories', 'estimated_cost', 'tags', 'cuisine']
                    }
                  }
                },
                required: ['meals'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_meal_plan' } }
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No meal plan generated');
    }

    const mealPlan = JSON.parse(toolCall.function.arguments);
    
    // Generate images for meals using AI
    console.log('Generating food images for meals...');
    const mealsWithImages = await Promise.all(
      mealPlan.meals.map(async (meal, index) => {
        try {
          const imagePrompt = `Professional food photography: ${meal.name}, ${meal.cuisine} cuisine, ${meal.description}. Plated beautifully on a white dish, natural lighting, appetizing, restaurant quality, overhead angle, 16:9 aspect ratio, ultra high resolution`;
          
          console.log(`Generating image for: ${meal.name}`);
          
          const imageResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash-image-preview',
              messages: [{ role: 'user', content: imagePrompt }],
              modalities: ['image', 'text']
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            console.log(`Image generated successfully for ${meal.name}`);
            return { 
              ...meal, 
              id: index + 1, 
              image: imageUrl || '/placeholder.svg',
              recipe_name: meal.name
            };
          } else {
            console.error(`Image generation failed for ${meal.name}: ${imageResponse.status}`);
          }
        } catch (error) {
          console.error(`Error generating image for ${meal.name}:`, error);
        }
        
        return { 
          ...meal, 
          id: index + 1, 
          image: '/placeholder.svg',
          recipe_name: meal.name
        };
      })
    );

    console.log(`Generated ${mealsWithImages.length} meals with images`);

    return new Response(
      JSON.stringify({
        success: true,
        meals: mealsWithImages,
        totalCost: mealsWithImages.reduce((sum, m) => sum + m.estimated_cost, 0),
        message: data.choices?.[0]?.message?.content || 'Meal plan generated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-meal-planner:', error);
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
