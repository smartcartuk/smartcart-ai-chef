import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggesticMealPlanRequest {
  action: 'generate' | 'search' | 'shopping-list' | 'add-to-shopping-list' | 'generate-meal-options';
  dietaryPreferences?: string[];
  allergies?: string[];
  householdSize?: number;
  maxPrepTime?: number;
  weekStart?: string;
  searchQuery?: string;
  calorieTarget?: number;
  recipeIds?: string[];
  mealTypes?: string[];
  budgetTier?: 'low' | 'medium' | 'high';
  selectedRecipeIds?: string[];
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
    const { 
      action, 
      dietaryPreferences = [], 
      allergies = [], 
      householdSize = 2, 
      maxPrepTime = 45, 
      searchQuery, 
      calorieTarget, 
      recipeIds,
      mealTypes = ['breakfast', 'lunch', 'dinner'],
      budgetTier = 'medium',
      selectedRecipeIds
    } = requestBody;

    console.log(`Suggestic API request - Action: ${action}, User: ${user.id}`);

    // Map dietary preferences to Suggestic tags
    const dietaryTags = mapDietaryPreferences(dietaryPreferences);
    
    // Helper to get user's Suggestic user ID
    const getSuggesticUserId = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('suggestic_user_id')
        .eq('id', user.id)
        .single();

      if (!profile?.suggestic_user_id) {
        throw new Error('No Suggestic user ID configured. Please complete Suggestic setup first.');
      }

      return profile.suggestic_user_id as string;
    };
    
    if (action === 'search' && searchQuery) {
      // Search for specific recipes
      const recipes = await searchRecipes(SUGGESTIC_API_KEY, searchQuery, dietaryTags, maxPrepTime, householdSize);
      
      return new Response(
        JSON.stringify({ success: true, recipes }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'generate-meal-options') {
      // Generate meal options with cost estimates for user to select from
      console.log(`🎯 Generating meal options - Budget: ${budgetTier}, Meal types: ${mealTypes.join(', ')}`);
      
      const mealOptions = await generateMealOptionsWithCosts(
        SUGGESTIC_API_KEY,
        supabase,
        user.id,
        mealTypes,
        budgetTier,
        householdSize,
        dietaryTags,
        allergies,
        maxPrepTime
      );
      
      console.log(`✓ Generated ${mealOptions.length} meal options`);
      
      return new Response(
        JSON.stringify({ success: true, mealOptions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'shopping-list') {
      // Get shopping list from Suggestic using API key + user ID
      const suggesticUserId = await getSuggesticUserId();
      const shoppingList = await getShoppingList(SUGGESTIC_API_KEY, suggesticUserId);
      
      return new Response(
        JSON.stringify({ success: true, shoppingList }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'add-to-shopping-list') {
      // Add recipes to shopping list
      if (!recipeIds || recipeIds.length === 0) {
        throw new Error('No recipe IDs provided');
      }
      
      const suggesticUserId = await getSuggesticUserId();
      const result = await addRecipesToShoppingList(SUGGESTIC_API_KEY, suggesticUserId, recipeIds);
      
      return new Response(
        JSON.stringify({ success: true, ...result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'generate') {
      // Generate a full weekly meal plan from selected meal options
      console.log(`📅 Confirming meal plan with ${selectedRecipeIds?.length || 0} selected recipes`);
      
      if (selectedRecipeIds && selectedRecipeIds.length > 0) {
        // User has pre-selected recipes from meal options
        const suggesticUserId = await getSuggesticUserId();
        
        // Add selected recipes to shopping list
        await addRecipesToShoppingList(SUGGESTIC_API_KEY, suggesticUserId, selectedRecipeIds);
        
        // Retrieve the selected recipes to return
        const mealPlan = await retrieveSelectedRecipes(supabase, user.id, selectedRecipeIds);
        
        console.log('✓ Meal plan confirmed with selected recipes and shopping list updated.');
        
        return new Response(
          JSON.stringify({ success: true, mealPlan }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Legacy: Generate a full weekly meal plan using Suggestic's AI (old flow)
        const suggesticUserId = await getSuggesticUserId();
        const mealPlan = await generateWeeklyMealPlan(
          SUGGESTIC_API_KEY,
          suggesticUserId,
          householdSize
        );
        
        console.log('✓ Meal plan generated successfully with automatic shopping list population.');
        
        return new Response(
          JSON.stringify({ success: true, mealPlan }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
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

async function addRecipesToShoppingList(apiKey: string, suggesticUserId: string, recipeIds: string[]): Promise<any> {
  console.log(`Adding ${recipeIds.length} recipes to shopping list for Suggestic user ${suggesticUserId}`);

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
      'Authorization': `Token ${apiKey}`,
      'sg-user': suggesticUserId,
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

async function getShoppingList(apiKey: string, suggesticUserId: string): Promise<any> {
  console.log('Fetching shopping list from Suggestic for user', suggesticUserId);

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
      'Authorization': `Token ${apiKey}`,
      'sg-user': suggesticUserId,
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
  console.log('📋 Suggestic shoppingListAggregate response:', JSON.stringify(data, null, 2));
  
  if (data.errors) {
    console.error('❌ Shopping list query errors:', data.errors);
    throw new Error('Failed to fetch shopping list: ' + JSON.stringify(data.errors));
  }

  const items = data.data?.shoppingListAggregate?.edges?.map((edge: any) => edge.node) || [];
  
  console.log(`✓ Fetched ${items.length} shopping list items`);
  return items;
}

async function generateWeeklyMealPlan(
  apiKey: string,
  suggesticUserId: string,
  servings: number
): Promise<any> {
  console.log('Generating AI-driven weekly meal plan for Suggestic user:', suggesticUserId);

  // Step 1: Generate meal plan using Suggestic's AI
  const generateMutation = `
    mutation {
      generateSimpleMealPlan(ignoreLock: true) {
        success
        message
      }
    }
  `;
  
  const generateResponse = await fetch('https://production.suggestic.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'sg-user': suggesticUserId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: generateMutation })
  });
  
  if (!generateResponse.ok) {
    const errorText = await generateResponse.text();
    console.error('Failed to generate meal plan:', generateResponse.status, errorText);
    throw new Error(`Suggestic API returned ${generateResponse.status}`);
  }
  
  const generateData = await generateResponse.json();
  console.log('📋 Suggestic generateSimpleMealPlan response:', JSON.stringify(generateData, null, 2));
  
  if (generateData.errors) {
    console.error('GraphQL errors during generation:', generateData.errors);
    throw new Error('Failed to generate meal plan: ' + JSON.stringify(generateData.errors));
  }
  
  if (!generateData.data?.generateSimpleMealPlan?.success) {
    const message = generateData.data?.generateSimpleMealPlan?.message || 'Unknown error';
    throw new Error('Failed to generate meal plan: ' + message);
  }
  
  console.log('✓ Meal plan generated by Suggestic AI');
  
  // Step 2: Query the generated meal plan
  const mealPlanQuery = `
    query {
      mealPlan {
        date
        day
        calories
        protein
        carbs
        fat
        meals {
          id
          numOfServings
          recipe {
            id
            databaseId
            name
            mainImage
            author
            totalTime
            ingredientLines
            instructions
            numberOfServings
            nutrientsPerServing {
              calories
              protein
              carbs
              fat
            }
            cuisines
          }
        }
      }
    }
  `;
  
  const mealPlanResponse = await fetch('https://production.suggestic.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'sg-user': suggesticUserId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: mealPlanQuery })
  });
  
  if (!mealPlanResponse.ok) {
    const errorText = await mealPlanResponse.text();
    console.error('Failed to fetch meal plan:', mealPlanResponse.status, errorText);
    throw new Error(`Suggestic API returned ${mealPlanResponse.status}`);
  }
  
  const mealPlanData = await mealPlanResponse.json();
  console.log('📋 Suggestic mealPlan query response:', JSON.stringify(mealPlanData, null, 2));
  
  if (mealPlanData.errors) {
    console.error('GraphQL errors fetching meal plan:', mealPlanData.errors);
    throw new Error('Failed to fetch meal plan: ' + JSON.stringify(mealPlanData.errors));
  }
  
  const days = mealPlanData.data?.mealPlan || [];
  
  if (days.length === 0) {
    console.warn('⚠️ Suggestic returned empty meal plan on first attempt, retrying...');
    
    // Retry once more after a short delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const retryResponse = await fetch('https://production.suggestic.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'sg-user': suggesticUserId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mealPlanQuery })
    });
    
    const retryData = await retryResponse.json();
    console.log('📋 Suggestic mealPlan retry response:', JSON.stringify(retryData, null, 2));
    const retryDays = retryData.data?.mealPlan || [];
    
    if (retryDays.length === 0) {
      throw new Error('Suggestic generated an empty meal plan after retry. This may be due to very restrictive dietary settings or program not being properly configured. Try adjusting your preferences or regenerating.');
    }
    
    days.length = 0;
    days.push(...retryDays);
    console.log(`✓ Retry successful - retrieved ${days.length}-day meal plan`);
  } else {
    console.log(`✓ Retrieved ${days.length}-day meal plan from Suggestic`);
  }
  
  // Step 3: Add recipes to shopping list
  console.log('🛒 Adding recipes to shopping list...');
  
  // Extract all recipe IDs and servings from the meal plan
  const recipesToAdd: Array<{ recipeId: string; servings: number }> = [];
  for (const day of days) {
    for (const meal of day.meals || []) {
      if (meal.recipe?.databaseId) {
        recipesToAdd.push({
          recipeId: meal.recipe.databaseId,
          servings: meal.numOfServings || servings
        });
      }
    }
  }
  
  console.log(`📦 Found ${recipesToAdd.length} recipes to add to shopping list`);
  
  // Add each recipe to shopping list with delays to avoid rate limiting
  let addedCount = 0;
  let failedCount = 0;
  
  for (let i = 0; i < recipesToAdd.length; i++) {
    const { recipeId, servings: recipeServings } = recipesToAdd[i];
    
    try {
      const addToShoppingListMutation = `
        mutation AddToShoppingList($recipeId: String!, $servings: Int) {
          addToShoppingList(recipeId: $recipeId, servings: $servings) {
            success
            message
          }
        }
      `;
      
      const addResponse = await fetch('https://production.suggestic.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'sg-user': suggesticUserId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          query: addToShoppingListMutation,
          variables: { recipeId, servings: recipeServings }
        })
      });
      
      const addData = await addResponse.json();
      
      if (addData.data?.addToShoppingList?.success) {
        addedCount++;
        console.log(`✓ Added recipe ${recipeId} to shopping list (${addedCount}/${recipesToAdd.length})`);
      } else {
        failedCount++;
        console.warn(`⚠️ Failed to add recipe ${recipeId}:`, addData.data?.addToShoppingList?.message || addData.errors);
      }
      
      // Add delay between requests to avoid rate limiting (skip delay after last recipe)
      if (i < recipesToAdd.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      failedCount++;
      console.error(`❌ Error adding recipe ${recipeId}:`, error);
    }
  }
  
  console.log(`✅ Shopping list update complete: ${addedCount} recipes added, ${failedCount} failed`);
  
  // Step 4: Format for frontend
  const formattedMealPlan = {
    id: `plan-${Date.now()}`,
    name: 'Weekly Meal Plan',
    days: days.map((day: any) => ({
      date: day.date,
      dayNumber: day.day,
      calories: day.calories || 0,
      protein: day.protein || 0,
      carbs: day.carbs || 0,
      fat: day.fat || 0,
      meals: {
        meal: day.meals.map((meal: any) => formatRecipe(meal.recipe, servings))
      }
    }))
  };
  
  console.log(`✅ Generated complete ${formattedMealPlan.days.length}-day meal plan with AI (shopping list auto-populated)`);
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

// ============= Cost Estimation Functions =============

const BASE_INGREDIENT_COSTS: Record<string, number> = {
  'chicken breast': 2.50, 'chicken thigh': 2.00, 'beef mince': 2.80, 'beef steak': 4.50,
  'pork chop': 2.20, 'salmon fillet': 3.50, 'cod fillet': 3.00, 'tuna': 1.50,
  'prawns': 3.00, 'eggs': 0.20, 'tofu': 1.80, 'milk': 0.50, 'cheese': 1.80,
  'cheddar cheese': 2.00, 'mozzarella': 1.50, 'butter': 1.50, 'cream': 1.20,
  'yogurt': 1.00, 'tomatoes': 0.40, 'onions': 0.15, 'garlic': 0.10, 'peppers': 0.60,
  'carrots': 0.30, 'broccoli': 0.80, 'cauliflower': 1.00, 'spinach': 0.70,
  'lettuce': 0.60, 'cucumber': 0.50, 'potatoes': 0.40, 'sweet potato': 0.60,
  'courgette': 0.50, 'aubergine': 0.80, 'rice': 0.50, 'pasta': 0.60,
  'flour': 0.40, 'sugar': 0.30, 'salt': 0.05, 'pepper': 0.10,
  'olive oil': 0.30, 'vegetable oil': 0.20, 'soy sauce': 0.15,
  'tinned tomatoes': 0.50, 'coconut milk': 0.80, 'chickpeas': 0.50,
  'black beans': 0.50, 'kidney beans': 0.50, 'unknown': 0.50
};

function normalizeIngredientName(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .replace(/\d+/g, '')
    .replace(/\s*(g|kg|ml|l|oz|lb|cup|tbsp|tsp)\s*/gi, '')
    .replace(/\s*(fresh|dried|frozen|canned|tinned)\s*/gi, '')
    .replace(/[^a-z\s]/g, '')
    .trim();
}

function estimateRecipeCost(ingredients: string[], householdSize: number): number {
  let totalCost = 0;
  
  for (const ingredient of ingredients) {
    const normalized = normalizeIngredientName(ingredient);
    const matchingKey = Object.keys(BASE_INGREDIENT_COSTS).find(key => 
      normalized.includes(key) || key.includes(normalized)
    );
    
    const ingredientCost = matchingKey ? BASE_INGREDIENT_COSTS[matchingKey] : BASE_INGREDIENT_COSTS['unknown'];
    totalCost += ingredientCost;
  }
  
  const householdMultiplier = householdSize / 2;
  totalCost *= householdMultiplier;
  
  return Math.round(totalCost * 100) / 100;
}

// ============= New Action Functions =============

async function generateMealOptionsWithCosts(
  apiKey: string,
  supabase: any,
  userId: string,
  mealTypes: string[],
  budgetTier: 'low' | 'medium' | 'high',
  householdSize: number,
  dietaryTags: string[],
  allergies: string[],
  maxPrepTime: number
): Promise<any[]> {
  const mealsPerDay = mealTypes.length;
  const totalMealsNeeded = mealsPerDay * 7;
  const mealsToGenerate = totalMealsNeeded * 2; // Generate 2x for choice
  
  console.log(`🔍 Generating ${mealsToGenerate} recipes (${totalMealsNeeded} needed * 2)`);
  
  // Get budget range
  const budgetRanges = {
    low: { min: 70, max: 90 },
    medium: { min: 90, max: 120 },
    high: { min: 120, max: 150 }
  };
  const budget = budgetRanges[budgetTier];
  const avgMealBudget = budget.max / totalMealsNeeded;
  
  // Search for recipes from Suggestic
  const allRecipes: any[] = [];
  
  // Search for each meal type
  for (const mealType of mealTypes) {
    const recipesNeeded = Math.ceil(mealsToGenerate / mealTypes.length);
    const searchQuery = mealType === 'breakfast' ? 'breakfast' : 
                       mealType === 'lunch' ? 'lunch' :
                       'dinner';
    
    const recipes = await searchRecipes(apiKey, searchQuery, dietaryTags, maxPrepTime, householdSize);
    
    // Add meal type to each recipe
    recipes.forEach(recipe => {
      recipe.mealType = mealType;
    });
    
    allRecipes.push(...recipes.slice(0, recipesNeeded));
  }
  
  console.log(`📊 Found ${allRecipes.length} recipes, estimating costs...`);
  
  // Estimate cost for each recipe
  const recipesWithCosts = allRecipes.map(recipe => {
    const estimatedCost = estimateRecipeCost(recipe.ingredients.map((i: any) => i.name), householdSize);
    return {
      ...recipe,
      estimatedCost,
      costDifference: Math.abs(estimatedCost - avgMealBudget)
    };
  });
  
  // Sort by how close to budget (prefer slightly under)
  recipesWithCosts.sort((a, b) => a.costDifference - b.costDifference);
  
  // Take the best matches (within reasonable budget range)
  const selectedRecipes = recipesWithCosts
    .filter(r => r.estimatedCost <= avgMealBudget * 1.3) // Allow 30% over
    .slice(0, mealsToGenerate);
  
  console.log(`💾 Saving ${selectedRecipes.length} meal options to database...`);
  
  // Save to meal_options table
  const weekStart = new Date().toISOString().split('T')[0];
  
  // Delete old options for this week
  await supabase
    .from('meal_options')
    .delete()
    .eq('user_id', userId)
    .eq('week_start', weekStart);
  
  // Insert new options
  const mealOptionsData = selectedRecipes.map(recipe => ({
    user_id: userId,
    week_start: weekStart,
    recipe_data: recipe,
    estimated_cost: recipe.estimatedCost,
    meal_type: recipe.mealType
  }));
  
  const { error } = await supabase
    .from('meal_options')
    .insert(mealOptionsData);
  
  if (error) {
    console.error('Error saving meal options:', error);
  } else {
    console.log(`✅ Saved ${selectedRecipes.length} meal options`);
  }
  
  return selectedRecipes;
}

async function retrieveSelectedRecipes(
  supabase: any,
  userId: string,
  selectedRecipeIds: string[]
): Promise<any> {
  const weekStart = new Date().toISOString().split('T')[0];
  
  // Retrieve selected meal options
  const { data: selectedOptions, error } = await supabase
    .from('meal_options')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .in('recipe_data->>id', selectedRecipeIds);
  
  if (error) {
    console.error('Error retrieving selected recipes:', error);
    return { recipes: [], totalCost: 0 };
  }
  
  const recipes = selectedOptions.map(option => option.recipe_data);
  const totalCost = selectedOptions.reduce((sum, opt) => sum + (opt.estimated_cost || 0), 0);
  
  return {
    recipes,
    totalCost,
    weekStart
  };
}
