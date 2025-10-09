import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userPreferences, action, query, day } = await req.json();
    const SPOONACULAR_API_KEY = Deno.env.get('SPOONACULAR_API_KEY');
    
    if (!SPOONACULAR_API_KEY) {
      throw new Error('SPOONACULAR_API_KEY not configured');
    }

    // Handle single recipe regeneration
    if (action === 'regenerate' && day) {
      console.log('🔄 Regenerating single recipe from Spoonacular for:', day);
      console.log('User preferences:', userPreferences);

      // Build diet parameter based on user dietary preferences
      let diet = '';
      if (userPreferences.dietaryPreferences) {
        const prefs = userPreferences.dietaryPreferences.map(p => p.toLowerCase());
        if (prefs.includes('vegan')) diet = 'vegan';
        else if (prefs.includes('vegetarian')) diet = 'vegetarian';
        else if (prefs.includes('gluten free')) diet = 'gluten free';
        else if (prefs.includes('ketogenic')) diet = 'ketogenic';
        else if (prefs.includes('paleo')) diet = 'paleo';
      }
      
      // Build exclusion list from allergies
      const exclude = userPreferences.allergies?.join(',') || '';
      
      // Calculate target calories based on household size
      const targetCalories = 2000 * (userPreferences.householdSize || 2);

      // Search for recipes matching user preferences using complex search
      const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?number=10&addRecipeInformation=true&fillIngredients=true&addRecipeNutrition=true&sort=random${diet ? `&diet=${diet}` : ''}${exclude ? `&excludeIngredients=${exclude}` : ''}&maxCalories=${targetCalories}&apiKey=${SPOONACULAR_API_KEY}`;
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`Spoonacular search error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      
      // Pick a random recipe from the results that match user preferences
      const recipes = searchData.results;
      if (!recipes || recipes.length === 0) {
        throw new Error('No recipes found matching your preferences');
      }
      
      const recipe = recipes[Math.floor(Math.random() * recipes.length)];
      console.log(`📖 Found recipe matching preferences: ${recipe.title}`);

      // Get analyzed instructions
      const instructionsUrl = `https://api.spoonacular.com/recipes/${recipe.id}/analyzedInstructions?apiKey=${SPOONACULAR_API_KEY}`;
      const instructionsResponse = await fetch(instructionsUrl);
      const instructionsData = await instructionsResponse.json();
      
      const instructions = instructionsData[0]?.steps.map(step => step.step) || 
                          ['Follow the cooking instructions on the original recipe'];

      // Format ingredients with amounts
      const ingredients = recipe.extendedIngredients.map(ing => ({
        name: ing.name,
        amount: `${ing.amount} ${ing.unit}`,
        category: ing.aisle || 'Other'
      }));

      // Extract nutrition info
      const nutrition = recipe.nutrition || {};
      const nutrients = nutrition.nutrients || [];
      const calories = nutrients.find(n => n.name === 'Calories')?.amount || 0;
      const protein = nutrients.find(n => n.name === 'Protein')?.amount || 0;
      const carbs = nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0;
      const fat = nutrients.find(n => n.name === 'Fat')?.amount || 0;

      // Estimate cost based on ingredients
      const estimatedCost = ingredients.length * 1.5 * (userPreferences.householdSize || 2);

      const meal = {
        day,
        name: recipe.title,
        recipe_name: recipe.title,
        description: recipe.summary?.replace(/<[^>]*>/g, '').substring(0, 150) || 'Delicious meal from Spoonacular',
        ingredients,
        instructions,
        prep_time: `${recipe.preparationMinutes || 15} mins`,
        cook_time: `${recipe.cookingMinutes || 30} mins`,
        difficulty: recipe.preparationMinutes < 20 ? 'Easy' : recipe.preparationMinutes < 40 ? 'Medium' : 'Hard',
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        estimated_cost: parseFloat(estimatedCost.toFixed(2)),
        estimated_price: parseFloat(estimatedCost.toFixed(2)),
        cost_per_meal: parseFloat(estimatedCost.toFixed(2)),
        image: recipe.image,
        picture_url: recipe.image,
        tags: [...(recipe.dishTypes || []), ...(recipe.diets || [])],
        cuisine: recipe.cuisines?.[0] || 'International',
        servings: recipe.servings || userPreferences.householdSize || 2,
        cost_by_supermarket: {
          tesco: parseFloat(estimatedCost.toFixed(2)),
          sainsburys: parseFloat((estimatedCost * 1.05).toFixed(2)),
          asda: parseFloat((estimatedCost * 0.95).toFixed(2)),
          aldi: parseFloat((estimatedCost * 0.90).toFixed(2))
        }
      };

      console.log(`✅ Regenerated recipe from Spoonacular: ${meal.name}`);

      return new Response(
        JSON.stringify({
          success: true,
          meals: [meal],
          source: 'Spoonacular Food API'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle search action for recipe search
    if (action === 'search' && query) {
      console.log('🔍 Searching Spoonacular for:', query);

      // Build diet and exclusion parameters
      let diet = '';
      if (userPreferences.dietaryPreferences) {
        const prefs = userPreferences.dietaryPreferences.map(p => p.toLowerCase());
        if (prefs.includes('vegetarian')) diet = 'vegetarian';
        if (prefs.includes('vegan')) diet = 'vegan';
      }
      const exclude = userPreferences.allergies?.join(',') || '';

      // Search for recipes using Spoonacular Complex Search
      const searchUrl = `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(query)}&number=5&addRecipeInformation=true&fillIngredients=true&addRecipeNutrition=true${diet ? `&diet=${diet}` : ''}${exclude ? `&excludeIngredients=${exclude}` : ''}&apiKey=${SPOONACULAR_API_KEY}`;
      
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) {
        throw new Error(`Spoonacular search error: ${searchResponse.status}`);
      }

      const searchData = await searchResponse.json();
      const recipes = searchData.results.map(recipe => {
        const nutrients = recipe.nutrition?.nutrients || [];
        const calories = nutrients.find(n => n.name === 'Calories')?.amount || 0;
        
        return {
          name: recipe.title,
          description: recipe.summary?.replace(/<[^>]*>/g, '').substring(0, 150) || 'Delicious recipe from Spoonacular',
          image: recipe.image,
          prepTime: recipe.preparationMinutes || 15,
          cookTime: recipe.cookingMinutes || 30,
          estimatedCost: parseFloat((recipe.pricePerServing / 100 * (userPreferences.householdSize || 2)).toFixed(2)),
          servings: recipe.servings,
          id: recipe.id,
          calories: Math.round(calories)
        };
      });

      console.log(`✅ Found ${recipes.length} recipes from Spoonacular`);

      return new Response(
        JSON.stringify({
          success: true,
          recipes
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🍽️ Fetching meal plan from Spoonacular API');
    console.log('User preferences:', userPreferences);

    // Build diet query parameter
    let diet = '';
    if (userPreferences.dietaryPreferences) {
      const prefs = userPreferences.dietaryPreferences.map(p => p.toLowerCase());
      if (prefs.includes('vegetarian')) diet = 'vegetarian';
      if (prefs.includes('vegan')) diet = 'vegan';
      if (prefs.includes('gluten free')) diet = 'gluten free';
      if (prefs.includes('ketogenic')) diet = 'ketogenic';
    }

    // Build exclude parameter for allergies
    const exclude = userPreferences.allergies?.join(',') || '';

    // Calculate target calories (rough estimate: 2000 per day for household)
    const targetCalories = 2000 * (userPreferences.householdSize || 2);
    
    // Generate weekly meal plan using Spoonacular
    const mealPlanUrl = `https://api.spoonacular.com/mealplanner/generate?timeFrame=week&targetCalories=${targetCalories}${diet ? `&diet=${diet}` : ''}${exclude ? `&exclude=${exclude}` : ''}&apiKey=${SPOONACULAR_API_KEY}`;
    
    const mealPlanResponse = await fetch(mealPlanUrl);
    
    if (!mealPlanResponse.ok) {
      throw new Error(`Spoonacular API error: ${mealPlanResponse.status}`);
    }

    const mealPlanData = await mealPlanResponse.json();
    console.log('✅ Received meal plan from Spoonacular');

    // Extract recipe IDs and fetch detailed information
    const meals = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    for (let i = 0; i < mealPlanData.week.length && i < 7; i++) {
      const dayPlan = mealPlanData.week[Object.keys(mealPlanData.week)[i]];
      const dinner = dayPlan.meals.find(m => m.id) || dayPlan.meals[0];
      
      if (!dinner || !dinner.id) continue;

      // Fetch detailed recipe information
      const recipeUrl = `https://api.spoonacular.com/recipes/${dinner.id}/information?includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`;
      const recipeResponse = await fetch(recipeUrl);
      
      if (!recipeResponse.ok) continue;
      
      const recipe = await recipeResponse.json();
      console.log(`📖 Fetched recipe: ${recipe.title}`);

      // Get analyzed instructions
      const instructionsUrl = `https://api.spoonacular.com/recipes/${dinner.id}/analyzedInstructions?apiKey=${SPOONACULAR_API_KEY}`;
      const instructionsResponse = await fetch(instructionsUrl);
      const instructionsData = await instructionsResponse.json();
      
      const instructions = instructionsData[0]?.steps.map(step => step.step) || 
                          ['Follow the cooking instructions on the original recipe'];

      // Format ingredients with amounts
      const ingredients = recipe.extendedIngredients.map(ing => ({
        name: ing.name,
        amount: `${ing.amount} ${ing.unit}`,
        category: ing.aisle || 'Other'
      }));

      // Extract nutrition info
      const nutrition = recipe.nutrition || {};
      const nutrients = nutrition.nutrients || [];
      const calories = nutrients.find(n => n.name === 'Calories')?.amount || 0;
      const protein = nutrients.find(n => n.name === 'Protein')?.amount || 0;
      const carbs = nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0;
      const fat = nutrients.find(n => n.name === 'Fat')?.amount || 0;

      // Estimate cost based on ingredients (rough UK price estimate)
      const estimatedCost = ingredients.length * 1.5 * (userPreferences.householdSize || 2);

      meals.push({
        id: i + 1,
        day: days[i],
        name: recipe.title,
        recipe_name: recipe.title,
        description: recipe.summary?.replace(/<[^>]*>/g, '').substring(0, 150) || 'Delicious meal from Spoonacular',
        ingredients,
        instructions,
        prep_time: `${recipe.preparationMinutes || 15} mins`,
        cook_time: `${recipe.cookingMinutes || 30} mins`,
        difficulty: recipe.preparationMinutes < 20 ? 'Easy' : recipe.preparationMinutes < 40 ? 'Medium' : 'Hard',
        calories: Math.round(calories),
        protein: Math.round(protein),
        carbs: Math.round(carbs),
        fat: Math.round(fat),
        estimated_cost: parseFloat(estimatedCost.toFixed(2)),
        cost_per_meal: parseFloat(estimatedCost.toFixed(2)),
        image: recipe.image,
        picture_url: recipe.image,
        tags: [...(recipe.dishTypes || []), ...(recipe.diets || [])],
        cuisine: recipe.cuisines?.[0] || 'International',
        servings: recipe.servings || userPreferences.householdSize || 2
      });
    }

    console.log(`✅ Generated ${meals.length} meals from Spoonacular with real data and images`);

    const totalCost = meals.reduce((sum, meal) => sum + meal.estimated_cost, 0);

    return new Response(
      JSON.stringify({
        success: true,
        meals,
        totalCost: parseFloat(totalCost.toFixed(2)),
        message: 'Weekly meal plan generated from Spoonacular',
        source: 'Spoonacular Food API'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error in spoonacular-meal-planner:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Failed to fetch from Spoonacular API. Please check your API key.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
