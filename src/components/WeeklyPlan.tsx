
import React from 'react';
import { Card } from '@/components/ui/card';
import { WeeklyPlanHeader } from '@/components/WeeklyPlanHeader';
import { PriceComparisonSection } from '@/components/PriceComparisonSection';
import { WeeklyPlanLoading } from '@/components/WeeklyPlanLoading';
import { RecipeGrid } from '@/components/RecipeGrid';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { WebhookResponse } from '@/utils/webhookService';
import { useToast } from '@/components/ui/use-toast';

interface WeeklyPlanProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
  onRecipesChange?: (recipes: any[]) => void;
}

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({ 
  userProfile, 
  generatedData,
  onRecipesChange 
}) => {
  const { toast } = useToast();
  const {
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
  } = useWeeklyPlan(userProfile);

  // Notify parent component when recipes change
  React.useEffect(() => {
    if (onRecipesChange && recipes.length > 0) {
      onRecipesChange(recipes);
    }
  }, [recipes, onRecipesChange]);

  // Enhanced addToPlan function with toast feedback
  const handleAddToPlan = (recipe: any) => {
    addToPlan(recipe);
    toast({
      title: "Added to Plan!",
      description: `${recipe.recipe_name} has been added to your meal plan.`,
    });
  };

  // Enhanced compareSelectedPrices with proper feedback
  const handleCompareSelectedPrices = async () => {
    if (selectedIngredients.length === 0) {
      toast({
        title: "No ingredients selected",
        description: "Please add some recipes to your plan first.",
        variant: "destructive"
      });
      return;
    }

    try {
      await compareSelectedPrices();
      toast({
        title: "Price comparison complete!",
        description: `Compared prices for ${selectedIngredients.length} ingredients.`,
      });
    } catch (error) {
      toast({
        title: "Error comparing prices",
        description: "Failed to compare prices. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <WeeklyPlanLoading />;
  }

  return (
    <div className="space-y-6">
      <WeeklyPlanHeader
        userProfile={userProfile}
        selectedIngredientsCount={selectedIngredients.length}
        onRegeneratePlan={fetchWeeklyRecipes}
        onClearSelection={clearSelection}
        recipes={recipes}
      />

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">⚠️ {error}</p>
        </Card>
      )}

      <RecipeGrid
        recipes={recipes}
        expandedRecipes={expandedRecipes}
        regeneratingIndex={regeneratingIndex}
        onToggleDetails={toggleRecipeDetails}
        onAddToPlan={handleAddToPlan}
        onRegenerateSingleRecipe={regenerateSingleRecipe}
      />

      <PriceComparisonSection
        selectedIngredientsCount={selectedIngredients.length}
        isComparingPrices={isComparingPrices}
        priceComparisonResult={priceComparisonResult}
        onCompareSelectedPrices={handleCompareSelectedPrices}
      />
    </div>
  );
};
