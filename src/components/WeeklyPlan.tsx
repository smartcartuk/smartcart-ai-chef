
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { RecipeCard } from '@/components/RecipeCard';
import { WeeklyPlanHeader } from '@/components/WeeklyPlanHeader';
import { PriceComparisonSection } from '@/components/PriceComparisonSection';
import { WebhookResponse } from '@/utils/webhookService';

interface WeeklyPlanProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
}

interface Recipe {
  day: string;
  recipe_name: string;
  ingredients: string[];
  instructions: string;
  image?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({ userProfile, generatedData }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());
  const [isComparingPrices, setIsComparingPrices] = useState(false);
  const [priceComparisonResult, setPriceComparisonResult] = useState<any>(null);

  const fetchWeeklyRecipes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const weeklyRecipes: Recipe[] = [];
      
      // Fetch 7 recipes, one for each day
      for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
        const day = DAYS_OF_WEEK[i];
        const response = await fetch('https://proj3cts.app.n8n.cloud/webhook-test/generate-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            preferences: `Recipe for ${day}`,
            userProfile: userProfile 
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch recipe for ${day}`);
        }

        const recipeData = await response.json();
        weeklyRecipes.push({
          day,
          recipe_name: recipeData.recipe_name,
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions,
          image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop' // Placeholder food image
        });
      }
      
      setRecipes(weeklyRecipes);
    } catch (err) {
      console.error('Error fetching weekly recipes:', err);
      setError('Failed to fetch weekly recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
        <span className="ml-3 text-lg">Generating your weekly meal plan...</span>
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
          <RecipeCard
            key={index}
            recipe={recipe}
            index={index}
            isExpanded={expandedRecipes.has(index)}
            onToggleDetails={toggleRecipeDetails}
            onAddToPlan={addToPlan}
          />
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
