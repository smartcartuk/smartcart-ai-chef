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
    const { userPreferences, conversationHistory = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('AI Meal Planner called with preferences:', userPreferences);

    const systemPrompt = `You are an expert meal planning assistant for SmartCart. 
Your role is to create personalized weekly meal plans based on user preferences.

User Profile:
- Dietary Preferences: ${userPreferences.dietaryPreferences?.join(', ') || 'None'}
- Allergies: ${userPreferences.allergies?.join(', ') || 'None'}
- Household Size: ${userPreferences.householdSize || 2}
- Weekly Budget: £${userPreferences.weeklyBudget || 50}
- Connected Stores: ${userPreferences.connectedStores?.map(s => s.name).join(', ') || 'Tesco, Sainsbury\'s'}

CRITICAL RULES:
1. ALWAYS respect dietary preferences (vegetarian = no meat, vegan = no animal products)
2. NEVER include allergens in any recipe
3. Keep total weekly cost within budget
4. Generate exactly 7 meals (one per day)
5. Provide detailed ingredients with quantities scaled for household size
6. Include prep time, difficulty, and nutritional info

Response format (use tool calling):
- Generate a complete week of meals
- Each meal must have: name, description, ingredients (with quantities), instructions, prep_time, difficulty, calories, estimated_cost, tags
- Ensure variety and nutritional balance`;

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
                              name: { type: 'string' },
                              amount: { type: 'string' },
                              category: { type: 'string' }
                            },
                            required: ['name', 'amount', 'category']
                          }
                        },
                        instructions: { type: 'array', items: { type: 'string' } },
                        prep_time: { type: 'string' },
                        difficulty: { type: 'string', enum: ['Easy', 'Medium', 'Hard'] },
                        calories: { type: 'number' },
                        estimated_cost: { type: 'number' },
                        tags: { type: 'array', items: { type: 'string' } }
                      },
                      required: ['day', 'name', 'description', 'ingredients', 'instructions', 'prep_time', 'difficulty', 'calories', 'estimated_cost', 'tags']
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
    const mealsWithImages = await Promise.all(
      mealPlan.meals.map(async (meal, index) => {
        try {
          const imagePrompt = `Food photography of ${meal.name}, ${meal.description}, professional food styling, appetizing, high quality, 16:9 aspect ratio`;
          
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
            return { ...meal, id: index + 1, image: imageUrl || '/placeholder.svg' };
          }
        } catch (error) {
          console.error(`Error generating image for ${meal.name}:`, error);
        }
        
        return { ...meal, id: index + 1, image: '/placeholder.svg' };
      })
    );

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
