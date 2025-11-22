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

    // Map dietary preferences to Suggestic tags
    const dietaryTags = mapDietaryPreferences(dietaryPreferences);
    
    if (action === 'search' && searchQuery) {
      // Search for specific recipes
      const recipes = await searchRecipes(SUGGESTIC_API_KEY, searchQuery, dietaryTags, maxPrepTime, householdSize);
      
      return new Response(
        JSON.stringify({ success: true, recipes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'generate') {
      // Generate a full weekly meal plan
      const mealPlan = await generateWeeklyMealPlan(
        SUGGESTIC_API_KEY,
        dietaryTags,
        householdSize,
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
    'vegetarian': 'VEGETARIAN',
    'vegan': 'VEGAN',
    'gluten-free': 'GLUTEN_FREE',
    'dairy-free': 'DAIRY_FREE',
    'keto': 'KETO',
    'paleo': 'PALEO',
    'low-carb': 'LOW_CARB',
    'mediterranean': 'MEDITERRANEAN',
    'pescatarian': 'PESCATARIAN',
    'high-protein': 'PROTEIN_DENSE',
  };

  return preferences
    .map(pref => mapping[pref.toLowerCase()])
    .filter(Boolean);
}

async function searchRecipes(
  apiKey: string,
  query: string,
  dietaryTags: string[],
  maxPrepTime: number,
  servings: number
): Promise<any[]> {
  console.log(`Searching recipes for: ${query}`);

  const graphqlQuery = `
    query RecipeSearch($query: String!, $tags: [String!]) {
      recipeSearch(query: $query, first: 10) {
        edges {
          node {
            id
            databaseId
            name
            mainImage
            ingredientLines
            instructions
            numberOfServings
            totalTime
            cuisines
            author
            nutrientsPerServing {
              calories
              protein
              carbs
              fat
            }
          }
        }
      }
    }
  `;

  const variables = {
    query,
    tags: dietaryTags.length > 0 ? dietaryTags : undefined
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
    const errorText = await response.text();
    console.error('Suggestic API error:', response.status, errorText);
    throw new Error(`Suggestic API returned ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    console.error('GraphQL errors:', data.errors);
    throw new Error('Failed to search recipes: ' + JSON.stringify(data.errors));
  }

  const recipes = data.data?.recipeSearch?.edges?.map((edge: any) => formatRecipe(edge.node, servings)) || [];
  
  console.log(`Found ${recipes.length} recipes for query: ${query}`);
  return recipes;
}

async function generateWeeklyMealPlan(
  apiKey: string,
  dietaryTags: string[],
  servings: number,
  calorieTarget?: number
): Promise<any> {
  console.log('Generating weekly meal plan');

  // Calculate calorie target based on servings if not provided
  const dailyCalories = calorieTarget || (2000 * servings);

  // Suggestic mealPlan query - returns 7 days by default
  const graphqlQuery = `
    query GetMealPlan {
      mealPlan {
        date
        day
        calories
        protein
        carbs
        fat
        meals {
          id
          recipe {
            id
            databaseId
            name
            mainImage
            ingredientLines
            instructions
            numberOfServings
            totalTime
            cuisines
            author
            nutrientsPerServing {
              calories
              protein
              carbs
              fat
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://production.suggestic.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: graphqlQuery })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Suggestic API error:', response.status, errorText);
    throw new Error(`Suggestic API returned ${response.status}`);
  }

  const data = await response.json();
  
  if (data.errors) {
    console.error('GraphQL errors:', JSON.stringify(data.errors));
    throw new Error('Failed to generate meal plan: ' + JSON.stringify(data.errors));
  }

  const mealPlanDays = data.data?.mealPlan;
  
  if (!mealPlanDays || !Array.isArray(mealPlanDays)) {
    throw new Error('No meal plan returned from Suggestic');
  }

  // Format the meal plan to match our structure
  const formattedMealPlan = {
    id: `plan-${Date.now()}`,
    name: 'Weekly Meal Plan',
    days: mealPlanDays.map((day: any) => ({
      date: day.date,
      dayNumber: day.day,
      calories: day.calories,
      meals: day.meals
        .filter((meal: any) => meal.recipe)
        .reduce((acc: any, meal: any) => {
          // Group by meal time (breakfast, lunch, dinner, snack)
          const mealType = 'meal'; // Suggestic doesn't provide meal type in this query
          if (!acc[mealType]) {
            acc[mealType] = [];
          }
          acc[mealType].push(formatRecipe(meal.recipe, servings));
          return acc;
        }, {})
    }))
  };
  
  console.log(`Generated meal plan with ${formattedMealPlan.days.length} days`);
  return formattedMealPlan;
}

function formatRecipe(recipe: any, servings: number): any {
  // Parse total time (in minutes)
  const totalTime = recipe.totalTime || 30;
  const prepTime = Math.floor(totalTime / 2);
  const cookTime = Math.ceil(totalTime / 2);

  return {
    id: recipe.databaseId || recipe.id,
    title: recipe.name,
    description: recipe.author ? `by ${recipe.author}` : '',
    image: recipe.mainImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800',
    prepTime,
    cookTime,
    servings: servings,
    difficulty: totalTime > 60 ? 'Hard' : totalTime > 30 ? 'Medium' : 'Easy',
    ingredients: Array.isArray(recipe.ingredientLines) 
      ? recipe.ingredientLines.map((line: string, idx: number) => ({
          id: `ing-${idx}`,
          name: line,
          amount: '1',
          unit: 'unit'
        }))
      : [],
    instructions: Array.isArray(recipe.instructions)
      ? recipe.instructions.map((step: string, idx: number) => ({
          step: idx + 1,
          instruction: step
        }))
      : typeof recipe.instructions === 'string'
      ? recipe.instructions.split('\n').filter(Boolean).map((step: string, idx: number) => ({
          step: idx + 1,
          instruction: step
        }))
      : [],
    nutrition: {
      calories: Math.round(recipe.nutrientsPerServing?.calories || 0),
      protein: `${Math.round(recipe.nutrientsPerServing?.protein || 0)}g`,
      carbs: `${Math.round(recipe.nutrientsPerServing?.carbs || 0)}g`,
      fat: `${Math.round(recipe.nutrientsPerServing?.fat || 0)}g`,
    },
    cuisine: recipe.cuisines?.[0] || 'International',
    tags: [],
    source: 'suggestic'
  };
}
