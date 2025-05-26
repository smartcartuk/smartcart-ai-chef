import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { RecipeCard } from '@/components/RecipeCard';
import { WeeklyPlanHeader } from '@/components/WeeklyPlanHeader';
import { PriceComparisonSection } from '@/components/PriceComparisonSection';
import { WebhookResponse } from '@/utils/webhookService';
import { supabase } from '@/integrations/supabase/client';

interface WeeklyPlanProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
}

interface Recipe {
  day: string;
  recipe_name: string;
  ingredients: string[];
  instructions: string;
  estimated_price?: number;
  image?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({ userProfile, generatedData }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());
  const [isComparingPrices, setIsComparingPrices] = useState(false);
  const [priceComparisonResult, setPriceComparisonResult] = useState<any>(null);

  const calculateEstimatedPrice = async (ingredients: string[]): Promise<number> => {
    try {
      // Query the ingredient_prices table for cached prices
      const { data: priceData, error } = await supabase
        .from('ingredient_prices')
        .select('ingredient_name, average_price')
        .in('ingredient_name', ingredients);

      if (error) {
        console.warn('Could not fetch ingredient prices:', error);
        return 0;
      }

      let totalPrice = 0;
      ingredients.forEach(ingredient => {
        const priceInfo = priceData?.find(p => 
          p.ingredient_name.toLowerCase().includes(ingredient.toLowerCase()) ||
          ingredient.toLowerCase().includes(p.ingredient_name.toLowerCase())
        );
        totalPrice += priceInfo?.average_price || 2.50; // Default price if not found
      });

      return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
    } catch (err) {
      console.warn('Error calculating estimated price:', err);
      return 0;
    }
  };

  const buildPreferencesString = () => {
    const dietary = userProfile?.dietaryPreferences?.length > 0 
      ? `dietary preferences: ${userProfile.dietaryPreferences.join(', ')}` 
      : '';
    
    const allergies = userProfile?.allergies?.length > 0 
      ? `avoid: ${userProfile.allergies.join(', ')}` 
      : '';
    
    const household = `serves ${userProfile?.householdSize || 2} people`;
    const budget = `budget-friendly (weekly budget: £${userProfile?.weeklyBudget || 50})`;
    
    return [dietary, allergies, household, budget].filter(Boolean).join(', ');
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
      image: `https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop&seed=${day}` 
    };
  };

  const fetchWeeklyRecipes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const preferences = buildPreferencesString();
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
      const preferences = buildPreferencesString();
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

  useEffect(() => {
    // Automatically generate recipes on component mount using onboarding data
    fetchWeeklyRecipes();
  }, [userProfile]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-lg">Generating your personalized weekly meal plan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <WeeklyPlanHeader
        userProfile={userProfile}
        selectedIngredientsCount={selectedIngredients.length}
        onRegeneratePlan={fetchWeeklyRecipes}
        onClearSelection={clearSelection}
      />

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">⚠️ {error}</p>
        </Card>
      )}

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe, index) => (
          <div key={index} className="relative">
            <RecipeCard
              recipe={recipe}
              index={index}
              isExpanded={expandedRecipes.has(index)}
              onToggleDetails={toggleRecipeDetails}
              onAddToPlan={addToPlan}
              estimatedPrice={recipe.estimated_price}
            />
            <div className="absolute top-2 right-2">
              <Button
                onClick={() => regenerateSingleRecipe(index)}
                disabled={regeneratingIndex === index}
                size="sm"
                variant="outline"
                className="bg-white/90 hover:bg-white"
              >
                {regeneratingIndex === index ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <PriceComparisonSection
        selectedIngredientsCount={selectedIngredients.length}
        isComparingPrices={isComparingPrices}
        priceComparisonResult={priceComparisonResult}
        onCompareSelectedPrices={compareSelectedPrices}
      />
    </div>
  );
};
