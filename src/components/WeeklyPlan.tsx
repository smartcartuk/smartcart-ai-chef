
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
  onAddToPlan?: (recipe: any) => void;
  onWeeklyCostsChange?: (costs: any) => void;
}

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({ 
  userProfile, 
  generatedData,
  onRecipesChange,
  onAddToPlan,
  onWeeklyCostsChange
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
    totalWeeklyCosts,
    fetchWeeklyRecipes,
    regenerateSingleRecipe,
    toggleRecipeDetails,
    addToPlan,
    compareSelectedPrices,
    clearSelection
  } = useWeeklyPlan(userProfile);

  React.useEffect(() => {
    if (onRecipesChange && recipes.length > 0) {
      onRecipesChange(recipes);
    }
  }, [recipes, onRecipesChange]);

  // Pass weekly costs to parent component
  React.useEffect(() => {
    if (onWeeklyCostsChange && totalWeeklyCosts) {
      onWeeklyCostsChange(totalWeeklyCosts);
    }
  }, [totalWeeklyCosts, onWeeklyCostsChange]);

  const handleAddToPlan = (recipe: any) => {
    addToPlan(recipe);
    if (onAddToPlan) {
      onAddToPlan(recipe);
    }
  };

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
        title: "Price comparison temporarily unavailable",
        description: "The price comparison service is currently unavailable. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleRegenerateSingleRecipe = async (index: number) => {
    try {
      await regenerateSingleRecipe(index);
      toast({
        title: "Recipe regenerated!",
        description: "A new recipe has been generated for this day.",
      });
    } catch (error) {
      toast({
        title: "Failed to regenerate recipe",
        description: "Please try again in a moment.",
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
        totalWeeklyCosts={totalWeeklyCosts}
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
        onRegenerateSingleRecipe={handleRegenerateSingleRecipe}
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
