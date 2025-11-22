import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggesticMealPlanRequest {
  action: 'generate' | 'search';
  dietaryPreferences?: string[];
  allergies?: string[];
  householdSize?: number;
  maxPrepTime?: number;
  weekStart?: string;
  searchQuery?: string;
  calorieTarget?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUGGESTIC_API_KEY = Deno.env.get('SUGGESTIC_API_KEY');
    if (!SUGGESTIC_API_KEY) {
      throw new Error('SUGGESTIC_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestBody: SuggesticMealPlanRequest = await req.json();
    const { action, dietaryPreferences = [], allergies = [], householdSize = 2, maxPrepTime = 45, searchQuery, calorieTarget } = requestBody;

    console.log(`Suggestic API request - Action: ${action}, User: ${user.id}`);

    // Map dietary preferences to Suggestic filters
    const dietaryTags = mapDietaryPreferences(dietaryPreferences);
    
    if (action === 'search' && searchQuery) {
      // Search for specific recipes
      const recipes = await searchRecipes(SUGGESTIC_API_KEY, searchQuery, dietaryTags, allergies, maxPrepTime, householdSize);
      
      return new Response(
        JSON.stringify({ success: true, recipes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'generate') {
      // Generate a full weekly meal plan
      const mealPlan = await generateWeeklyMealPlan(
        SUGGESTIC_API_KEY,
        dietaryTags,
        allergies,
        householdSize,
        maxPrepTime,
        calorieTarget
      );
      
      return new Response(
        JSON.stringify({ success: true, mealPlan }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Suggestic meal planner error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function mapDietaryPreferences(preferences: string[]): string[] {
  const mapping: { [key: string]: string } = {
    'vegetarian': 'vegetarian',
    'vegan': 'vegan',
    'gluten-free': 'gluten-free',
    'dairy-free': 'dairy-free',
    'keto': 'ketogenic',
    'paleo': 'paleo',
    'low-carb': 'low-carb',
    'mediterranean': 'mediterranean',
    'pescatarian': 'pescatarian',
    'high-protein': 'high-protein',
  };

  return preferences
    .map(pref => mapping[pref.toLowerCase()])
    .filter(Boolean);
}

async function searchRecipes(
  apiKey: string,
  query: string,
  dietaryTags: string[],
  allergies: string[],
  maxPrepTime: number,
  servings: number
): Promise<any[]> {
  console.log(`Searching recipes for: ${query}`);

  const graphqlQuery = `
    query SearchRecipes($query: String!, $tags: [String!], $maxTime: Int) {
      recipeSearch(query: $query, first: 10, filters: { tags: $tags, maxTotalTime: $maxTime }) {
        edges {
          node {
            id
            name
            description
            mainImage
            totalTime
            numberOfServings
            ingredientLines
            instructions
            nutrientsPerServing {
              calories
              protein
              carbs
              fat
            }
            cuisine
            tags
          }
        }
      }
    }
  `;

  const variables = {
    query,
    tags: dietaryTags,
    maxTime: maxPrepTime
  };

  const response = await fetch('https://production.suggestic.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: graphqlQuery, variables })
  });

  if (!response.ok) {
    console.error('Suggestic API error:', response.status, await response.text());
    throw new Error(`Suggestic API returned ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    throw new Error('Failed to search recipes');
  }

  const recipes = data.data?.recipeSearch?.edges?.map((edge: any) => formatRecipe(edge.node, servings)) || [];
  
  console.log(`Found ${recipes.length} recipes for query: ${query}`);
  return recipes;
}

async function generateWeeklyMealPlan(
  apiKey: string,
  dietaryTags: string[],
  allergies: string[],
  servings: number,
  maxPrepTime: number,
  calorieTarget?: number
): Promise<any> {
  console.log('Generating weekly meal plan');

  // Calculate calorie target based on servings if not provided
  const dailyCalories = calorieTarget || (2000 * servings);

  const graphqlQuery = `
    query GetMealPlan($tags: [String!], $maxTime: Int, $calories: Int) {
      mealPlan(filters: { tags: $tags, maxTotalTime: $maxTime, caloriesTarget: $calories }) {
        id
        name
        days {
          date
          meals {
            id
            type
            recipe {
              id
              name
              description
              mainImage
              totalTime
              numberOfServings
              ingredientLines
              instructions
              nutrientsPerServing {
                calories
                protein
                carbs
                fat
              }
              cuisine
              tags
            }
          }
        }
      }
    }
  `;

  const variables = {
    tags: dietaryTags,
    maxTime: maxPrepTime,
    calories: dailyCalories
  };

  const response = await fetch('https://production.suggestic.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: graphqlQuery, variables })
  });

  if (!response.ok) {
    console.error('Suggestic API error:', response.status, await response.text());
    throw new Error(`Suggestic API returned ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    throw new Error('Failed to generate meal plan');
  }

  const mealPlan = data.data?.mealPlan;
  
  if (!mealPlan) {
    throw new Error('No meal plan returned from Suggestic');
  }

  // Format the meal plan to match our structure
  const formattedMealPlan = formatMealPlan(mealPlan, servings);
  
  console.log(`Generated meal plan with ${formattedMealPlan.days.length} days`);
  return formattedMealPlan;
}

function formatRecipe(recipe: any, servings: number): any {
  return {
    id: recipe.id,
    title: recipe.name,
    description: recipe.description || '',
    image: recipe.mainImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    prepTime: Math.floor((recipe.totalTime || 30) / 2),
    cookTime: Math.ceil((recipe.totalTime || 30) / 2),
    servings: servings,
    difficulty: recipe.totalTime > 60 ? 'Hard' : recipe.totalTime > 30 ? 'Medium' : 'Easy',
    ingredients: Array.isArray(recipe.ingredientLines) 
      ? recipe.ingredientLines.map((line: string, idx: number) => ({
          id: `ing-${idx}`,
          name: line,
          amount: '1',
          unit: 'unit'
        }))
      : [],
    instructions: typeof recipe.instructions === 'string'
      ? recipe.instructions.split('\n').filter(Boolean).map((step: string, idx: number) => ({
          step: idx + 1,
          instruction: step
        }))
      : recipe.instructions?.map((step: any, idx: number) => ({
          step: idx + 1,
          instruction: typeof step === 'string' ? step : step.text || ''
        })) || [],
    nutrition: {
      calories: recipe.nutrientsPerServing?.calories || 0,
      protein: `${recipe.nutrientsPerServing?.protein || 0}g`,
      carbs: `${recipe.nutrientsPerServing?.carbs || 0}g`,
      fat: `${recipe.nutrientsPerServing?.fat || 0}g`,
    },
    cuisine: recipe.cuisine || 'International',
    tags: recipe.tags || [],
    source: 'suggestic'
  };
}

function formatMealPlan(mealPlan: any, servings: number): any {
  const days = mealPlan.days?.map((day: any) => {
    const meals: any = {};
    
    day.meals?.forEach((meal: any) => {
      const mealType = meal.type.toLowerCase();
      if (meal.recipe) {
        meals[mealType] = formatRecipe(meal.recipe, servings);
      }
    });
    
    return {
      date: day.date,
      meals
    };
  }) || [];

  return {
    id: mealPlan.id,
    name: mealPlan.name || 'Weekly Meal Plan',
    days
  };
}
