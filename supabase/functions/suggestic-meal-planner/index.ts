import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggesticMealPlanRequest {
  action: 'generate' | 'search' | 'shopping-list' | 'add-to-shopping-list';
  dietaryPreferences?: string[];
  allergies?: string[];
  householdSize?: number;
  maxPrepTime?: number;
  weekStart?: string;
  searchQuery?: string;
  calorieTarget?: number;
  recipeIds?: string[];
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
    const { action, dietaryPreferences = [], allergies = [], householdSize = 2, maxPrepTime = 45, searchQuery, calorieTarget, recipeIds } = requestBody;

    console.log(`Suggestic API request - Action: ${action}, User: ${user.id}`);

    // Map dietary preferences to Suggestic tags
    const dietaryTags = mapDietaryPreferences(dietaryPreferences);
    
    // Helper to get user's JWT token
    const getUserJWT = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('suggestic_jwt_token, suggestic_jwt_expires_at')
        .eq('id', user.id)
        .single();

      if (!profile?.suggestic_jwt_token) {
        throw new Error('No Suggestic authentication. Please refresh your meal plan to authenticate.');
      }

      if (profile.suggestic_jwt_expires_at && new Date(profile.suggestic_jwt_expires_at) < new Date()) {
        throw new Error('Suggestic authentication expired. Please refresh your meal plan.');
      }

      return profile.suggestic_jwt_token;
    };
    
    if (action === 'search' && searchQuery) {
      // Search for specific recipes
      const recipes = await searchRecipes(SUGGESTIC_API_KEY, searchQuery, dietaryTags, maxPrepTime, householdSize);
      
      return new Response(
        JSON.stringify({ success: true, recipes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'shopping-list') {
      // Get shopping list from Suggestic (requires JWT)
      const jwt = await getUserJWT();
      const shoppingList = await getShoppingList(jwt);
      
      return new Response(
        JSON.stringify({ success: true, shoppingList }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'add-to-shopping-list') {
      // Add recipes to shopping list (requires JWT)
      if (!recipeIds || recipeIds.length === 0) {
        throw new Error('No recipe IDs provided');
      }
      
      const jwt = await getUserJWT();
      const result = await addRecipesToShoppingList(jwt, recipeIds);
      
      return new Response(
        JSON.stringify({ success: true, ...result }),
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
      
      // Note: Shopping list addition requires JWT auth and should be done separately
      // after user has been authenticated with Suggestic
      console.log('✓ Meal plan generated successfully. Use add-to-shopping-list action to add recipes to shopping list.');
      
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
  console.log(`Searching recipes with query: "${query}", tags: ${dietaryTags.join(', ')}`);
  
  // Progressive search: try with tags first, then without if no results
  const searchStrategies = [
    { tags: dietaryTags, label: 'all dietary tags' },
    { tags: dietaryTags.slice(0, 1), label: 'primary tag only' },
    { tags: [], label: 'no tags (broadest)' }
  ];

  for (const strategy of searchStrategies) {
    const graphqlQuery = `
      query RecipeSearch($query: String!, $tags: [String!]) {
        recipeSearch(query: $query, tags: $tags, first: 10) {
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
      ...(strategy.tags.length > 0 && { tags: strategy.tags })
    };

    try {
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
        continue;
      }

      const data = await response.json();
      
      if (data.errors) {
        console.error('GraphQL errors:', data.errors);
        continue;
      }

      const recipes = data.data?.recipeSearch?.edges?.map((edge: any) => formatRecipe(edge.node, servings)) || [];
      
      if (recipes.length > 0) {
        console.log(`✓ Found ${recipes.length} recipes with ${strategy.label}`);
        return recipes;
      }
      
      console.log(`⚠️ No results with ${strategy.label}, trying next strategy...`);
    } catch (error) {
      console.error(`Error with ${strategy.label}:`, error);
      continue;
    }
  }

  console.log(`❌ No recipes found for "${query}" after all search strategies`);
  return [];
}

async function addRecipesToShoppingList(jwt: string, recipeIds: string[]): Promise<any> {
  console.log(`Adding ${recipeIds.length} recipes to shopping list with JWT auth`);

  const graphqlQuery = `
    mutation AddRecipesToShoppingList($recipeIds: [String]!) {
      addRecipesToShoppingList(recipeIds: $recipeIds) {
        success
        message
      }
    }
  `;

  const variables = {
    recipeIds
  };

  const response = await fetch('https://production.suggestic.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
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
    console.error('GraphQL errors:', JSON.stringify(data.errors));
    throw new Error('Failed to add recipes to shopping list: ' + JSON.stringify(data.errors));
  }

  const result = data.data?.addRecipesToShoppingList;
  
  if (!result?.success) {
    throw new Error(result?.message || 'Failed to add recipes to shopping list');
  }
  
  console.log(`✅ Successfully added recipes to shopping list: ${result.message}`);
  return result;
}

async function getShoppingList(jwt: string): Promise<any> {
  console.log('Fetching shopping list from Suggestic with JWT auth');

  const graphqlQuery = `
    query GetShoppingList {
      shoppingListAggregate {
        edges {
          node {
            databaseId
            ingredient
            aisleName
            quantity
            unit
            grams
            isDone
          }
        }
      }
    }
  `;

  const response = await fetch('https://production.suggestic.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${jwt}`,
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
    throw new Error('Failed to fetch shopping list: ' + JSON.stringify(data.errors));
  }

  const items = data.data?.shoppingListAggregate?.edges?.map((edge: any) => edge.node) || [];
  
  console.log(`✓ Fetched ${items.length} shopping list items`);
  return items;
}

async function generateWeeklyMealPlan(
  apiKey: string,
  dietaryTags: string[],
  servings: number,
  calorieTarget?: number
): Promise<any> {
  console.log('Generating weekly meal plan using recipe search with dietary preferences:', dietaryTags);

  // Diverse, specific meal queries optimized for pescatarian and flexible diets
  // More specific queries yield better results than generic terms
  const mealTypes = [
    'grilled salmon',
    'shrimp pasta',
    'baked cod lemon',
    'tuna bowl',
    'fish tacos',
    'seafood risotto',
    'vegetable curry'
  ];

  const days = [];
  const today = new Date();

  // Generate 7 days of meals
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + i);
    
    // Pick a meal type for this day (cycle through them)
    const searchQuery = mealTypes[i % mealTypes.length];
    
    try {
      console.log(`Day ${i + 1}: Searching Suggestic for "${searchQuery}" with tags:`, dietaryTags);
      
      // Search for a recipe for this day with dietary preferences
      const recipes = await searchRecipes(apiKey, searchQuery, dietaryTags, 45, servings);
      
      if (recipes.length > 0) {
        // Pick the first recipe from search results
        const recipe = recipes[0];
        
        console.log(`✓ Day ${i + 1}: Found recipe "${recipe.title}" from Suggestic`);
        
        days.push({
          date: currentDate.toISOString().split('T')[0],
          dayNumber: i + 1,
          calories: recipe.nutrition?.calories || 0,
          meals: {
            meal: [recipe]
          }
        });
      } else {
        console.warn(`⚠️ Day ${i + 1}: No recipes found for "${searchQuery}" with dietary tags ${dietaryTags.join(', ')}`);
      }
    } catch (error) {
      console.error(`❌ Day ${i + 1}: Error fetching recipe for "${searchQuery}":`, error);
      // Continue to next day even if one fails
    }
  }

  if (days.length === 0) {
    throw new Error('Failed to generate any meals from Suggestic. This could be due to: 1) Limited recipe database access on your Suggestic plan, 2) Dietary restrictions being too specific, or 3) API key permissions. Please check your Suggestic plan tier and API key permissions.');
  }

  const formattedMealPlan = {
    id: `plan-${Date.now()}`,
    name: 'Weekly Meal Plan',
    days
  };
  
  console.log(`✅ Generated meal plan with ${formattedMealPlan.days.length}/7 days from Suggestic recipe search`);
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
