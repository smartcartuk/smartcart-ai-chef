
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
  const [showSupermarketSelection, setShowSupermarketSelection] = useState(false);
  const [selectedSupermarket, setSelectedSupermarket] = useState<string | null>(null);

  const { calculateEstimatedPrice } = useUnifiedPriceCalculation();

  const fetchWeeklyRecipes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Generating weekly recipes from Spoonacular with user preferences:', {
        userProfile
      });
      
      const { data, error } = await supabase.functions.invoke('spoonacular-meal-planner', {
        body: { 
          userPreferences: {
            dietaryPreferences: userProfile?.dietaryPreferences || [],
            allergies: userProfile?.allergies || [],
            householdSize: userProfile?.householdSize || 2,
            weeklyBudget: userProfile?.weeklyBudget || 50,
            address: userProfile?.address
          }
        }
      });

      if (error) {
        console.error('❌ API Error:', error);
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
          
          // Enhanced image URL handling
          let imageUrl = meal.picture_url || meal.image;
          
          // Always try to get a better image using our generator
          if (!imageUrl || 
              imageUrl.includes('unsplash') || 
              imageUrl === 'https://images.unsplash.com/photo-1565299624946?w=400&h=300&fit=crop&auto=format' ||
              !imageUrl.includes('spoonacular')) {
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
        console.log('⚠️ Single recipe response or no meals array, using fallback approach');
        
        // Enhanced fallback that considers user preferences
        const fallbackRecipes = await generateFallbackRecipes(userProfile);
        weeklyRecipes = fallbackRecipes;
      }
      
      console.log('🎯 Final weekly recipes with enhanced data:', weeklyRecipes);
      setRecipes(weeklyRecipes);
      
      // Save meal plan to database
      if (weeklyRecipes.length > 0) {
        const { saveMealPlan } = await import('@/utils/mealPlanService');
        const saveResult = await saveMealPlan(weeklyRecipes);
        if (saveResult.success) {
          console.log('💾 Meal plan saved to database');
        } else {
          console.error('❌ Failed to save meal plan:', saveResult.error);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching weekly recipes:', err);
      setError('Generation failed. Using default meal plan. You can regenerate later.');
      
      // Generate fallback recipes that respect user preferences
      try {
        const fallbackRecipes = await generateFallbackRecipes(userProfile);
        setRecipes(fallbackRecipes);
      } catch (fallbackError) {
        console.error('❌ Fallback generation also failed:', fallbackError);
        setRecipes([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackRecipes = async (userProfile: any): Promise<Recipe[]> => {
    const isVegetarian = userProfile?.dietaryPreferences?.includes('vegetarian');
    const isVegan = userProfile?.dietaryPreferences?.includes('vegan');
    const householdSize = userProfile?.householdSize || 2;
    const budget = userProfile?.weeklyBudget || 50;
    const avgMealCost = budget / 7; // Budget per meal
    
    const mealTypes = [
      { 
        name: isVegan ? 'Vegan Buddha Bowl' : isVegetarian ? 'Vegetarian Protein Bowl' : 'Chicken Protein Bowl', 
        ingredients: isVegan ? ['quinoa', 'chickpeas', 'avocado', 'spinach'] : isVegetarian ? ['quinoa', 'tofu', 'broccoli', 'hemp seeds'] : ['chicken breast', 'quinoa', 'broccoli', 'olive oil'],
        category: 'protein-bowl'
      },
      { 
        name: isVegan ? 'Vegan Pasta Primavera' : isVegetarian ? 'Vegetarian Pasta' : 'Chicken Pasta', 
        ingredients: isVegan ? ['pasta', 'cherry tomatoes', 'zucchini', 'nutritional yeast'] : isVegetarian ? ['pasta', 'tomatoes', 'basil', 'mozzarella'] : ['pasta', 'chicken', 'tomatoes', 'garlic'],
        category: 'pasta'
      },
      { 
        name: isVegan ? 'Vegetable Stir Fry' : isVegetarian ? 'Tofu Stir Fry' : 'Beef Stir Fry', 
        ingredients: isVegan ? ['mixed vegetables', 'soy sauce', 'brown rice', 'sesame oil'] : isVegetarian ? ['tofu', 'mixed vegetables', 'soy sauce', 'rice'] : ['beef strips', 'mixed vegetables', 'soy sauce', 'rice'],
        category: 'stir-fry'
      },
      { 
        name: isVegan ? 'Lentil Soup' : isVegetarian ? 'Vegetable Soup' : 'Chicken Soup', 
        ingredients: isVegan ? ['red lentils', 'vegetable stock', 'carrots', 'onions'] : isVegetarian ? ['vegetable stock', 'carrots', 'celery', 'bread'] : ['chicken stock', 'carrots', 'celery', 'chicken'],
        category: 'soup'
      },
      { 
        name: isVegan ? 'Quinoa Salad Bowl' : isVegetarian ? 'Mediterranean Salad' : 'Chicken Caesar Salad', 
        ingredients: isVegan ? ['quinoa', 'cucumber', 'cherry tomatoes', 'olive oil'] : isVegetarian ? ['mixed greens', 'feta cheese', 'olives', 'olive oil'] : ['chicken breast', 'romaine lettuce', 'parmesan', 'caesar dressing'],
        category: 'salad'
      },
      { 
        name: isVegan ? 'Coconut Curry' : isVegetarian ? 'Vegetable Curry' : 'Chicken Curry', 
        ingredients: isVegan ? ['coconut milk', 'chickpeas', 'spinach', 'curry spices', 'rice'] : isVegetarian ? ['coconut milk', 'mixed vegetables', 'curry spices', 'rice'] : ['chicken thighs', 'coconut milk', 'curry spices', 'rice'],
        category: 'curry'
      },
      { 
        name: isVegan ? 'Avocado Toast' : isVegetarian ? 'Caprese Sandwich' : 'Turkey Sandwich', 
        ingredients: isVegan ? ['sourdough bread', 'avocado', 'tomato', 'lime'] : isVegetarian ? ['bread', 'mozzarella', 'tomato', 'basil'] : ['bread', 'turkey', 'cheese', 'lettuce'],
        category: 'sandwich'
      }
    ];
    
    return DAYS_OF_WEEK.map((day, index) => {
      const meal = mealTypes[index];
      const adjustedPrice = Math.max(avgMealCost * 0.8, Math.min(avgMealCost * 1.2, avgMealCost + (Math.random() - 0.5) * 2));
      
      return {
        day,
        recipe_name: meal.name,
        description: `Healthy ${day.toLowerCase()} meal - ${meal.name.toLowerCase()} for ${householdSize} people`,
        ingredients: meal.ingredients.map(ingredient => ({
          name: ingredient,
          amount: ingredient === 'rice' || ingredient === 'pasta' || ingredient === 'quinoa' ? `${Math.ceil(200 * householdSize / 2)}g` : 
                 ingredient === 'bread' ? `${Math.ceil(2 * householdSize / 2)} slices` : `${Math.ceil(100 * householdSize / 2)}g`,
          prices: {
            tesco: { price: parseFloat((1.5 + Math.random() * 2).toFixed(2)), url: `https://tesco.com/search?q=${encodeURIComponent(ingredient)}`, title: `Tesco ${ingredient}` },
            sainsburys: { price: parseFloat((1.6 + Math.random() * 2).toFixed(2)), url: `https://sainsburys.co.uk/search?q=${encodeURIComponent(ingredient)}`, title: `Sainsbury's ${ingredient}` },
            asda: { price: parseFloat((1.4 + Math.random() * 2).toFixed(2)), url: `https://asda.com/search?q=${encodeURIComponent(ingredient)}`, title: `Asda ${ingredient}` },
            aldi: { price: parseFloat((1.3 + Math.random() * 2).toFixed(2)), url: `https://aldi.co.uk/search?q=${encodeURIComponent(ingredient)}`, title: `Aldi ${ingredient}` }
          }
        })),
        instructions: [
          `Prepare the ${meal.name.toLowerCase()} by gathering all ingredients for ${householdSize} people.`,
          `Cook main components according to standard preparation methods.`,
          `Combine ingredients and season to taste.`,
          `Serve hot and enjoy your ${day} meal.`
        ],
        nutrition: {
          calories: Math.floor(300 + Math.random() * 200),
          protein: `${Math.floor(10 + Math.random() * 20)}g`,
          carbs: `${Math.floor(30 + Math.random() * 30)}g`,
          fat: `${Math.floor(5 + Math.random() * 15)}g`,
          fiber: `${Math.floor(3 + Math.random() * 10)}g`
        },
        picture_url: generateMealImage(meal.name),
        image: generateMealImage(meal.name),
        estimated_cost: adjustedPrice,
        estimated_price: adjustedPrice,
        cost_per_meal: adjustedPrice,
        cost_by_supermarket: {
          tesco: parseFloat(adjustedPrice.toFixed(2)),
          sainsburys: parseFloat((adjustedPrice * 1.05).toFixed(2)),
          asda: parseFloat((adjustedPrice * 0.95).toFixed(2)),
          aldi: parseFloat((adjustedPrice * 0.90).toFixed(2))
        }
      };
    });
  };

  const fetchSingleRecipe = async (day: string, preferences: string) => {
    const timestamp = new Date().toISOString();
    
    const { data, error } = await supabase.functions.invoke('spoonacular-meal-planner', {
      body: { 
        action: 'regenerate',
        day,
        userPreferences: {
          dietaryPreferences: userProfile?.dietary_preferences || [],
          allergies: userProfile?.allergies || [],
          householdSize: userProfile?.household_size || 2,
          weeklyBudget: userProfile?.weekly_budget || 50
        }
      }
    });

    if (error) {
      throw new Error(`Failed to fetch recipe for ${day}: ${error.message}`);
    }

    if (!data.success || !data.meals || data.meals.length === 0) {
      throw new Error('No recipe returned from Spoonacular');
    }

    const meal = data.meals[0];

    return {
      day,
      recipe_name: meal.recipe_name || meal.name,
      ingredients: meal.ingredients,
      instructions: meal.instructions,
      estimated_price: meal.estimated_cost || meal.estimated_price,
      estimated_cost: meal.estimated_cost || meal.estimated_price,
      cost_per_meal: meal.cost_per_meal || meal.estimated_cost,
      image: meal.image || meal.picture_url,
      picture_url: meal.picture_url || meal.image,
      description: meal.description || '',
      nutritional_info: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat
      },
      nutrition: meal.nutrition,
      cost_by_supermarket: meal.cost_by_supermarket || {
        tesco: meal.estimated_cost || 5,
        sainsburys: (meal.estimated_cost || 5) * 1.05,
        asda: (meal.estimated_cost || 5) * 0.95,
        aldi: (meal.estimated_cost || 5) * 0.90
      },
      tags: meal.tags,
      cuisine: meal.cuisine,
      prep_time: meal.prep_time,
      cook_time: meal.cook_time,
      difficulty: meal.difficulty
    };
  };

  const regenerateSingleRecipe = async (index: number) => {
    setRegeneratingIndex(index);
    setError(null);
    
    try {
      const preferences = buildPreferencesString(userProfile);
      const day = DAYS_OF_WEEK[index];
      
      console.log(`🔄 Regenerating recipe for ${day} with preferences:`, preferences);
      
      const newRecipe = await fetchSingleRecipe(day, preferences);
      
      console.log(`✅ Successfully regenerated recipe for ${day}:`, newRecipe);
      
      const updatedRecipes = [...recipes];
      updatedRecipes[index] = newRecipe;
      setRecipes(updatedRecipes);
      
      // Save updated meal plan to database
      const { saveMealPlan } = await import('@/utils/mealPlanService');
      const saveResult = await saveMealPlan(updatedRecipes);
      if (saveResult.success) {
        console.log('💾 Updated meal plan saved to database');
      } else {
        console.error('❌ Failed to save updated meal plan:', saveResult.error);
      }
    } catch (err) {
      console.error(`❌ Error regenerating recipe for ${DAYS_OF_WEEK[index]}:`, err);
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

  const addToPlan = async (recipe: Recipe) => {
    // Extract ingredient names properly
    const ingredientNames = recipe.ingredients.map((ingredient: any) => {
      return typeof ingredient === 'string' ? ingredient : ingredient?.name || ingredient;
    }).filter(Boolean);
    
    const updatedIngredients = [...selectedIngredients, ...ingredientNames];
    setSelectedIngredients(updatedIngredients);
    
    // Auto-save shopping list when meals are added
    try {
      const { saveShoppingList } = await import('@/utils/mealPlanService');
      const shoppingItems = updatedIngredients.map(name => ({
        name,
        quantity: '1',
        checked: false
      }));
      
      await saveShoppingList(shoppingItems);
      console.log(`✅ ${recipe.recipe_name} added to plan and shopping list saved with ${ingredientNames.length} ingredients`);
    } catch (error) {
      console.error('❌ Failed to save shopping list:', error);
    }
  };

  const compareSelectedPrices = async () => {
    if (selectedIngredients.length === 0) {
      setError('No ingredients selected. Please add some recipes to your plan first.');
      return;
    }

    setIsComparingPrices(true);
    setError(null);

    try {
      console.log('🔍 Comparing prices for ingredients:', selectedIngredients);
      
      // Call unified-price-lookup for each ingredient
      const stores = ['tesco', 'sainsburys', 'asda', 'aldi'];
      const priceResults: any = {};
      
      // Initialize store totals
      stores.forEach(store => {
        priceResults[store] = { items: [], total: 0, itemCount: 0 };
      });

      // Fetch prices for each ingredient
      for (const ingredient of selectedIngredients) {
        try {
          const { data, error } = await supabase.functions.invoke('unified-price-lookup', {
            body: {
              ingredientName: ingredient,
              quantity: 1,
              stores
            }
          });

          if (error) {
            console.error(`❌ Error fetching price for ${ingredient}:`, error);
            continue;
          }

          if (data?.results) {
            data.results.forEach((result: any) => {
              const storeName = result.store.toLowerCase();
              if (priceResults[storeName]) {
                priceResults[storeName].items.push({
                  ingredient,
                  price: result.price,
                  title: result.title,
                  url: result.url,
                  image: result.image
                });
                priceResults[storeName].total += result.price;
                priceResults[storeName].itemCount += 1;
              }
            });
          }
        } catch (err) {
          console.error(`❌ Error processing ingredient ${ingredient}:`, err);
        }
      }

      console.log('✅ Price comparison complete:', priceResults);
      setPriceComparisonResult(priceResults);
      
      // Show supermarket selection modal
      setShowSupermarketSelection(true);
    } catch (err) {
      console.error('❌ Error comparing prices:', err);
      setError('Failed to compare prices. Please try again.');
    } finally {
      setIsComparingPrices(false);
    }
  };

  const handleSupermarketSelection = (supermarket: string) => {
    setSelectedSupermarket(supermarket);
    setShowSupermarketSelection(false);
    console.log(`✅ User selected ${supermarket} for shopping`);
  };

  const clearSelection = () => {
    setSelectedIngredients([]);
    setPriceComparisonResult(null);
  };

  useEffect(() => {
    const loadOrGeneratePlan = async () => {
      if (!userProfile) return;

      // Check if meal plan exists for current week
      const today = new Date();
      const dayOfWeek = today.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(today);
      monday.setDate(today.getDate() + mondayOffset);

      console.log('📅 Checking for existing meal plan for week starting:', monday.toISOString().split('T')[0]);

      // Import mealPlanService dynamically to avoid circular deps
      const { getMealPlan } = await import('@/utils/mealPlanService');
      const result = await getMealPlan(monday);
      
      if (result.success && result.data?.data?.meals && result.data.data.meals.length > 0) {
        console.log('✅ Loading existing meal plan from database');
        setRecipes(result.data.data.meals);
        
        // Calculate weekly costs from existing recipes
        const costs = { tesco: 0, sainsburys: 0, asda: 0, aldi: 0 };
        result.data.data.meals.forEach((meal: any) => {
          if (meal.cost_by_supermarket) {
            Object.keys(costs).forEach(store => {
              costs[store] += meal.cost_by_supermarket[store] || 0;
            });
          }
        });
        setTotalWeeklyCosts(costs);
      } else {
        console.log('🆕 No existing meal plan found, generating new one...');
        await fetchWeeklyRecipes();
      }
    };

    loadOrGeneratePlan();
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
    showSupermarketSelection,
    selectedSupermarket,
    fetchWeeklyRecipes,
    regenerateSingleRecipe,
    replaceRecipe: async (index: number, newRecipe: Recipe) => {
      console.log(`Replacing recipe at index ${index} with:`, newRecipe);
      setRecipes(prev => {
        const updated = [...prev];
        updated[index] = {
          ...newRecipe,
          day: DAYS_OF_WEEK[index]
        };
        return updated;
      });
      
      // Save to database if needed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const weekStart = new Date().toISOString().split('T')[0];
        await supabase
          .from('meal_plans')
          .upsert([{
            user_id: user.id,
            week_start: weekStart,
            data: { meals: recipes } as any
          }]);
      }
    },
    toggleRecipeDetails,
    addToPlan,
    compareSelectedPrices,
    clearSelection,
    handleSupermarketSelection
  };
};
