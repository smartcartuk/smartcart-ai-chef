import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type FlowStep = 'generating' | 'selecting' | 'shopping-list' | 'price-comparison';

interface MealOption {
  id: string;
  name: string;
  image: string;
  estimatedCost: number;
  mealType: string;
  ingredients: any[];
  prepTime: string;
  servings: number;
}

export const useMealSelectionFlow = (userProfile: any) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('generating');
  const [mealOptions, setMealOptions] = useState<MealOption[]>([]);
  const [selectedMealIds, setSelectedMealIds] = useState<string[]>([]);
  const [confirmedPlan, setConfirmedPlan] = useState<any>(null);
  const [shoppingList, setShoppingList] = useState<any>(null);
  const [priceComparison, setPriceComparison] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Step 1: Generate meal options
  const generateOptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setCurrentStep('generating');
    
    try {
      console.log('🎯 Generating meal options...');
      
      const { data, error: functionError } = await supabase.functions.invoke('suggestic-meal-planner', {
        body: {
          action: 'generate-meal-options',
          mealTypes: userProfile.meal_types || ['breakfast', 'lunch', 'dinner'],
          budgetTier: userProfile.budget_tier || 'medium',
          householdSize: userProfile.household_size || 2,
          dietaryPreferences: userProfile.dietary_preferences || [],
          allergies: userProfile.allergies || [],
          maxPrepTime: 45
        }
      });

      if (functionError) throw functionError;

      if (data?.mealOptions) {
        setMealOptions(data.mealOptions);
        setCurrentStep('selecting');
        
        const mealsPerDay = userProfile.meal_types?.length || 3;
        const totalMealsNeeded = mealsPerDay * 7;
        
        if (data.mealOptions.length < totalMealsNeeded) {
          toast({
            title: "Limited Options Available",
            description: `Generated ${data.mealOptions.length} options (${totalMealsNeeded} recommended). Some dietary preferences may have limited recipe availability.`,
            variant: "default"
          });
        } else {
          toast({
            title: "Meal Options Ready!",
            description: `Generated ${data.mealOptions.length} meal options for you to choose from.`,
          });
        }
      } else {
        throw new Error('No meal options returned');
      }
    } catch (err: any) {
      console.error('Error generating options:', err);
      const errorMessage = err.message || 'Failed to generate meal options';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage.includes('dietary preferences') 
          ? "Try adjusting your dietary preferences for more options."
          : errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, toast]);

  // Step 2: Confirm meal selection
  const confirmSelection = useCallback(async () => {
    if (selectedMealIds.length === 0) {
      toast({
        title: "No Meals Selected",
        description: "Please select at least one meal to continue",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`📅 Confirming ${selectedMealIds.length} meals...`);
      
      const { data, error: functionError } = await supabase.functions.invoke('suggestic-meal-planner', {
        body: {
          action: 'generate',
          selectedRecipeIds: selectedMealIds,
          householdSize: userProfile.household_size || 2
        }
      });

      if (functionError) throw functionError;

      if (data?.mealPlan) {
        setConfirmedPlan(data.mealPlan);
        setCurrentStep('shopping-list');
        
        // Auto-load shopping list
        await loadShoppingList();
        
        toast({
          title: "Meals Confirmed!",
          description: "Your meal plan has been created. Loading shopping list...",
        });
      }
    } catch (err: any) {
      console.error('Error confirming selection:', err);
      setError(err.message || 'Failed to confirm meal selection');
      toast({
        title: "Confirmation Failed",
        description: err.message || 'Failed to confirm meal selection',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedMealIds, userProfile, toast]);

  // Step 3: Load shopping list
  const loadShoppingList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🛒 Loading shopping list...');
      
      const { data, error: functionError } = await supabase.functions.invoke('suggestic-meal-planner', {
        body: {
          action: 'shopping-list'
        }
      });

      if (functionError) throw functionError;

      if (data?.shoppingList) {
        setShoppingList(data.shoppingList);
        
        toast({
          title: "Shopping List Ready!",
          description: `Found ${data.shoppingList?.items?.length || 0} ingredients`,
        });
      }
    } catch (err: any) {
      console.error('Error loading shopping list:', err);
      setError(err.message || 'Failed to load shopping list');
      toast({
        title: "Loading Failed",
        description: err.message || 'Failed to load shopping list',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Step 4: Compare prices
  const comparePrices = useCallback(async (selectedIngredients: string[]) => {
    setIsLoading(true);
    setError(null);
    setCurrentStep('price-comparison');
    
    try {
      console.log('💰 Comparing prices...');
      
      // This would call unified-price-lookup or similar
      // For now, just set the step
      toast({
        title: "Comparing Prices",
        description: `Checking prices for ${selectedIngredients.length} ingredients...`,
      });
      
      // TODO: Implement actual price comparison logic
      setPriceComparison({ ingredients: selectedIngredients });
    } catch (err: any) {
      console.error('Error comparing prices:', err);
      setError(err.message || 'Failed to compare prices');
      toast({
        title: "Comparison Failed",
        description: err.message || 'Failed to compare prices',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Helper: Toggle meal selection
  const toggleMealSelection = useCallback((mealId: string) => {
    setSelectedMealIds(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  }, []);

  // Regenerate a single meal option
  const regenerateMeal = useCallback(async (mealId: string, mealType: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Regenerating ${mealType} meal...`);
      
      const { data, error: functionError } = await supabase.functions.invoke('suggestic-meal-planner', {
        body: {
          action: 'generate-meal-options',
          mealTypes: [mealType],
          budgetTier: userProfile.budget_tier || 'medium',
          householdSize: userProfile.household_size || 2,
          dietaryPreferences: userProfile.dietary_preferences || [],
          allergies: userProfile.allergies || [],
          maxPrepTime: 45,
          count: 1 // Only generate 1 replacement meal
        }
      });

      if (functionError) throw functionError;

      if (data?.mealOptions && data.mealOptions.length > 0) {
        const newMeal = data.mealOptions[0];
        
        // Replace the old meal with the new one
        setMealOptions(prev => prev.map(meal => 
          meal.id === mealId ? newMeal : meal
        ));
        
        // If the meal was selected, update selection with new ID
        setSelectedMealIds(prev => 
          prev.includes(mealId) 
            ? prev.map(id => id === mealId ? newMeal.id : id)
            : prev
        );
        
        toast({
          title: "Meal Regenerated!",
          description: `New ${mealType} option: ${newMeal.name}`,
        });
      } else {
        throw new Error('No replacement meal generated');
      }
    } catch (err: any) {
      console.error('Error regenerating meal:', err);
      toast({
        title: "Regeneration Failed",
        description: err.message || 'Failed to regenerate meal',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [userProfile, toast]);

  // Helper: Calculate total cost of selected meals
  const calculateTotalCost = useCallback(() => {
    return selectedMealIds.reduce((total, mealId) => {
      const meal = mealOptions.find(m => m.id === mealId);
      return total + (meal?.estimatedCost || 0);
    }, 0);
  }, [selectedMealIds, mealOptions]);

  return {
    // State
    currentStep,
    mealOptions,
    selectedMealIds,
    confirmedPlan,
    shoppingList,
    priceComparison,
    isLoading,
    error,
    
    // Actions
    generateOptions,
    confirmSelection,
    loadShoppingList,
    comparePrices,
    toggleMealSelection,
    regenerateMeal,
    setSelectedMealIds,
    
    // Helpers
    calculateTotalCost,
    selectedCount: selectedMealIds.length,
  };
};
