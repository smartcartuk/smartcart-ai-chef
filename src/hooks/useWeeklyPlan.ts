
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildPreferencesString, generateRecipeImage, DAYS_OF_WEEK } from '@/utils/recipeHelpers';
import { usePriceCalculation } from './usePriceCalculation';

interface Recipe {
  day: string;
  recipe_name: string;
  ingredients: string[];
  instructions: string;
  estimated_price?: number;
  image?: string;
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
      image: generateRecipeImage(day)
    };
  };

  const fetchWeeklyRecipes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const preferences = buildPreferencesString(userProfile);
      console.log('Generating recipes with user preferences:', preferences);
      
      const weeklyRecipes: Recipe[] = [];
      
      // Fetch 7 recipes based on user onboarding data
      for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
        const day = DAYS_OF_WEEK[i];
        const recipe = await fetchSingleRecipe(day, preferences);
        weeklyRecipes.push(recipe);
      }
      
      setRecipes(weeklyRecipes);
    } catch (err) {
      console.error('Error fetching weekly recipes:', err);
      setError('Failed to fetch weekly recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
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
