import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildPreferencesString, generateRecipeImage, DAYS_OF_WEEK } from '@/utils/recipeHelpers';
import { usePriceCalculation } from './usePriceCalculation';

interface Recipe {
  day: string;
  recipe_name: string;
  ingredients: string[] | any[];
  instructions: string | string[];
  estimated_price?: number;
  estimated_cost?: number;
  cost_per_meal?: number;
  image?: string;
  description?: string;
  nutritional_info?: any;
}

export const useWeeklyPlan = (userProfile: any) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());
  const [isComparingPrices, setIsComparingPrices] = useState(false);
  const [priceComparisonResult, setPriceComparisonResult] = useState<any>(null);

  const { calculateEstimatedPrice } = usePriceCalculation();

  const fetchWeeklyRecipes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const preferences = buildPreferencesString(userProfile);
      console.log('Generating weekly recipes with user preferences:', preferences);
      
      // Make a single API call to get all 7 meals
      const { data, error } = await supabase.functions.invoke('proxy-generate-recipes', {
        body: { 
          preferences: preferences,
          userProfile: userProfile 
        }
      });

      if (error) {
        throw new Error(`Failed to fetch weekly recipes: ${error.message}`);
      }

      console.log('Operator API response:', data);

      let weeklyRecipes: Recipe[] = [];

      // Check if we got a meals array from the Operator API
      if (data.meals && Array.isArray(data.meals)) {
        console.log('Processing meals array from Operator API:', data.meals.length, 'meals');
        
        // Map the meals array to our Recipe format
        weeklyRecipes = await Promise.all(
          data.meals.map(async (meal: any, index: number) => {
            // Use the cost from the API response, or calculate it as fallback
            let estimatedPrice = meal.estimated_cost || meal.cost_per_meal || meal.estimated_price;
            
            if (!estimatedPrice) {
              // Extract ingredient names for price calculation
              const ingredientNames = meal.ingredients?.map((ing: any) => 
                typeof ing === 'string' ? ing : ing.name || ing
              ) || [];
              estimatedPrice = await calculateEstimatedPrice(ingredientNames);
            }
            
            return {
              day: meal.day || DAYS_OF_WEEK[index],
              recipe_name: meal.recipe_name || meal.name || 'Generated Recipe',
              ingredients: meal.ingredients || [],
              instructions: meal.instructions || 'No instructions provided',
              estimated_cost: estimatedPrice,
              estimated_price: estimatedPrice,
              cost_per_meal: estimatedPrice,
              image: meal.picture_url || generateRecipeImage(meal.day || DAYS_OF_WEEK[index]),
              description: meal.description || '',
              nutritional_info: meal.nutritional_info || meal.nutrition || null
            };
          })
        );
      } else {
        // Fallback: if we got a single recipe, create 7 different ones
        console.log('Single recipe response, generating 7 variations');
        
        for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
          const day = DAYS_OF_WEEK[i];
          const daySpecificPreferences = `${preferences} - Recipe for ${day}`;
          
          const { data: dayData, error: dayError } = await supabase.functions.invoke('proxy-generate-recipes', {
            body: { 
              preferences: daySpecificPreferences,
              userProfile: userProfile 
            }
          });

          if (dayError) {
            console.error(`Error fetching recipe for ${day}:`, dayError);
            continue;
          }

          const estimatedPrice = await calculateEstimatedPrice(dayData.ingredients || []);

          weeklyRecipes.push({
            day,
            recipe_name: dayData.recipe_name || dayData.name || 'Generated Recipe',
            ingredients: dayData.ingredients || [],
            instructions: dayData.instructions || 'No instructions provided',
            estimated_price: estimatedPrice,
            estimated_cost: estimatedPrice,
            cost_per_meal: estimatedPrice,
            image: dayData.picture_url || generateRecipeImage(day),
            description: dayData.description || '',
            nutritional_info: dayData.nutritional_info || null
          });
        }
      }
      
      console.log('Final weekly recipes:', weeklyRecipes);
      setRecipes(weeklyRecipes);
    } catch (err) {
      console.error('Error fetching weekly recipes:', err);
      setError('Failed to fetch weekly recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSingleRecipe = async (day: string, preferences: string) => {
    const { data, error } = await supabase.functions.invoke('proxy-generate-recipes', {
      body: { 
        preferences: `${preferences} - Recipe for ${day}`,
        userProfile: userProfile 
      }
    });

    if (error) {
      throw new Error(`Failed to fetch recipe for ${day}: ${error.message}`);
    }

    const estimatedPrice = await calculateEstimatedPrice(data.ingredients || []);

    return {
      day,
      recipe_name: data.recipe_name,
      ingredients: data.ingredients,
      instructions: data.instructions,
      estimated_price: estimatedPrice,
      estimated_cost: estimatedPrice,
      cost_per_meal: estimatedPrice,
      image: generateRecipeImage(day),
      description: data.description || '',
      nutritional_info: data.nutritional_info || null
    };
  };

  const regenerateSingleRecipe = async (index: number) => {
    setRegeneratingIndex(index);
    setError(null);
    
    try {
      const preferences = buildPreferencesString(userProfile);
      const day = DAYS_OF_WEEK[index];
      const newRecipe = await fetchSingleRecipe(day, preferences);
      
      setRecipes(prev => {
        const updated = [...prev];
        updated[index] = newRecipe;
        return updated;
      });
    } catch (err) {
      console.error('Error regenerating recipe:', err);
      setError(`Failed to regenerate recipe for ${DAYS_OF_WEEK[index]}. Please try again.`);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const toggleRecipeDetails = (index: number) => {
    const newExpanded = new Set(expandedRecipes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRecipes(newExpanded);
  };

  const addToPlan = (recipe: Recipe) => {
    setSelectedIngredients(prev => [...prev, ...recipe.ingredients]);
    console.log(`${recipe.recipe_name} added to plan`);
  };

  const compareSelectedPrices = async () => {
    if (selectedIngredients.length === 0) {
      setError('No ingredients selected. Please add some recipes to your plan first.');
      return;
    }

    setIsComparingPrices(true);
    setError(null);

    try {
      const response = await fetch('https://proj3cts.app.n8n.cloud/webhook-test/compare-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: selectedIngredients })
      });

      if (!response.ok) {
        throw new Error('Failed to compare prices');
      }

      const priceData = await response.json();
      setPriceComparisonResult(priceData);
      console.log('Price comparison result:', priceData);
    } catch (err) {
      console.error('Error comparing prices:', err);
      setError('Failed to compare prices. Please try again.');
    } finally {
      setIsComparingPrices(false);
    }
  };

  const clearSelection = () => {
    setSelectedIngredients([]);
    setPriceComparisonResult(null);
  };

  useEffect(() => {
    // Automatically generate recipes on component mount using onboarding data
    fetchWeeklyRecipes();
  }, [userProfile]);

  return {
    recipes,
    isLoading,
    regeneratingIndex,
    error,
    selectedIngredients,
    expandedRecipes,
    isComparingPrices,
    priceComparisonResult,
    fetchWeeklyRecipes,
    regenerateSingleRecipe,
    toggleRecipeDetails,
    addToPlan,
    compareSelectedPrices,
    clearSelection
  };
};
