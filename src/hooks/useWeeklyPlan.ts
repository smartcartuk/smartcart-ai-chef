
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildPreferencesString, DAYS_OF_WEEK } from '@/utils/recipeHelpers';
import { generateMealImage } from '@/utils/recipeImageGenerator';
import { useUnifiedPriceCalculation } from './useUnifiedPriceCalculation';

interface Ingredient {
  name: string;
  amount: string;
  prices?: {
    [key: string]: {
      price: number;
      url?: string;
      title?: string;
    };
  };
}

interface Recipe {
  day: string;
  recipe_name: string;
  ingredients: string[] | Ingredient[];
  instructions: string | string[];
  estimated_price?: number;
  estimated_cost?: number;
  cost_per_meal?: number;
  image?: string;
  picture_url?: string;
  description?: string;
  nutritional_info?: any;
  nutrition?: any;
  cost_by_supermarket?: {
    [key: string]: number;
  };
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
  const [totalWeeklyCosts, setTotalWeeklyCosts] = useState<any>(null);

  const { calculateEstimatedPrice } = useUnifiedPriceCalculation();

  const fetchWeeklyRecipes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const preferences = buildPreferencesString(userProfile);
      console.log('🔄 Generating weekly recipes with user preferences:', preferences);
      
      const { data, error } = await supabase.functions.invoke('proxy-generate-recipes', {
        body: { 
          preferences: preferences,
          userProfile: userProfile 
        }
      });

      if (error) {
        throw new Error(`Failed to fetch weekly recipes: ${error.message}`);
      }

      console.log('📊 Operator API response:', data);

      let weeklyRecipes: Recipe[] = [];

      if (data.meals && Array.isArray(data.meals)) {
        console.log('✅ Processing meals array from Operator API:', data.meals.length, 'meals');
        
        weeklyRecipes = data.meals.map((meal: any, index: number) => {
          // Use the cost structure from the API response
          let estimatedPrice = meal.estimated_cost || meal.cost_per_meal || meal.estimated_price;
          
          if (!estimatedPrice && meal.cost_by_supermarket) {
            const prices = Object.values(meal.cost_by_supermarket) as number[];
            estimatedPrice = Math.min(...prices);
          }
          
          estimatedPrice = estimatedPrice || 5.00;
          
          const recipeName = meal.recipe_name || meal.name || 'Generated Recipe';
          
          // Enhanced image URL handling - prioritize Spoonacular images
          let imageUrl = meal.picture_url || meal.image;
          
          // Check if we have a valid Spoonacular image URL
          if (!imageUrl || 
              imageUrl.includes('unsplash') || 
              imageUrl === 'https://images.unsplash.com/photo-1565299624946?w=400&h=300&fit=crop&auto=format' ||
              !imageUrl.includes('spoonacular')) {
            // Generate a more relevant fallback image
            imageUrl = generateMealImage(recipeName);
          }
          
          console.log(`🖼️ Image for ${recipeName}:`, imageUrl);
          
          return {
            day: meal.day || DAYS_OF_WEEK[index],
            recipe_name: recipeName,
            ingredients: meal.ingredients || [],
            instructions: meal.instructions || 'No instructions provided',
            estimated_cost: estimatedPrice,
            estimated_price: estimatedPrice,
            cost_per_meal: estimatedPrice,
            image: imageUrl,
            picture_url: imageUrl,
            description: meal.description || '',
            nutritional_info: meal.nutritional_info || meal.nutrition || null,
            nutrition: meal.nutrition || meal.nutritional_info || null,
            cost_by_supermarket: meal.cost_by_supermarket || {
              tesco: estimatedPrice,
              sainsburys: estimatedPrice * 1.05,
              asda: estimatedPrice * 0.95,
              aldi: estimatedPrice * 0.90
            }
          };
        });

        // Store the total weekly costs from the API response
        if (data.total_week_cost) {
          setTotalWeeklyCosts(data.total_week_cost);
          console.log('💰 Total weekly costs from API:', data.total_week_cost);
        }
      } else {
        // Fallback: if we got a single recipe, create 7 different ones
        console.log('⚠️ Single recipe response, generating 7 variations');
        
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

          const estimatedPrice = dayData.ingredients 
            ? await calculateEstimatedPrice(dayData.ingredients)
            : 5.00;
          const recipeName = dayData.recipe_name || dayData.name || 'Generated Recipe';

          // Enhanced image handling for single recipes too
          let imageUrl = dayData.picture_url || dayData.image;
          if (!imageUrl || 
              imageUrl.includes('unsplash') || 
              !imageUrl.includes('spoonacular')) {
            imageUrl = generateMealImage(recipeName);
          }

          weeklyRecipes.push({
            day,
            recipe_name: recipeName,
            ingredients: dayData.ingredients || [],
            instructions: dayData.instructions || 'No instructions provided',
            estimated_price: estimatedPrice,
            estimated_cost: estimatedPrice,
            cost_per_meal: estimatedPrice,
            image: imageUrl,
            picture_url: imageUrl,
            description: dayData.description || '',
            nutritional_info: dayData.nutritional_info || null,
            nutrition: dayData.nutrition || null,
            cost_by_supermarket: dayData.cost_by_supermarket || {
              tesco: estimatedPrice,
              sainsburys: estimatedPrice * 1.05,
              asda: estimatedPrice * 0.95,
              aldi: estimatedPrice * 0.90
            }
          });
        }
      }
      
      console.log('🎯 Final weekly recipes with enhanced data:', weeklyRecipes);
      setRecipes(weeklyRecipes);
    } catch (err) {
      console.error('❌ Error fetching weekly recipes:', err);
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

    const estimatedPrice = data.ingredients 
      ? await calculateEstimatedPrice(data.ingredients)
      : 5.00;
    const recipeName = data.recipe_name || 'Generated Recipe';

    // Enhanced image handling for regenerated recipes
    let imageUrl = data.picture_url || data.image;
    if (!imageUrl || 
        imageUrl.includes('unsplash') || 
        !imageUrl.includes('spoonacular')) {
      imageUrl = generateMealImage(recipeName);
    }

    return {
      day,
      recipe_name: recipeName,
      ingredients: data.ingredients,
      instructions: data.instructions,
      estimated_price: estimatedPrice,
      estimated_cost: estimatedPrice,
      cost_per_meal: estimatedPrice,
      image: imageUrl,
      picture_url: imageUrl,
      description: data.description || '',
      nutritional_info: data.nutritional_info || null,
      nutrition: data.nutrition || null,
      cost_by_supermarket: data.cost_by_supermarket || {
        tesco: estimatedPrice,
        sainsburys: estimatedPrice * 1.05,
        asda: estimatedPrice * 0.95,
        aldi: estimatedPrice * 0.90
      }
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
    // Extract ingredient names properly
    const ingredientNames = recipe.ingredients.map((ingredient: any) => {
      return typeof ingredient === 'string' ? ingredient : ingredient?.name || ingredient;
    }).filter(Boolean);
    
    setSelectedIngredients(prev => [...prev, ...ingredientNames]);
    console.log(`${recipe.recipe_name} added to plan with ingredients:`, ingredientNames);
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
    totalWeeklyCosts,
    fetchWeeklyRecipes,
    regenerateSingleRecipe,
    toggleRecipeDetails,
    addToPlan,
    compareSelectedPrices,
    clearSelection
  };
};
