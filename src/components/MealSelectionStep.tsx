import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BudgetTracker } from '@/components/BudgetTracker';
import { MealOptionsGrid } from '@/components/MealOptionsGrid';
import { useMealSelectionFlow } from '@/hooks/useMealSelectionFlow';
import { Loader2 } from 'lucide-react';

interface MealSelectionStepProps {
  userProfile: any;
  onComplete: () => void;
}

export const MealSelectionStep: React.FC<MealSelectionStepProps> = ({ userProfile, onComplete }) => {
  const {
    currentStep,
    mealOptions,
    selectedMealIds,
    isLoading,
    error,
    generateOptions,
    confirmSelection,
    toggleMealSelection,
    regenerateMeal,
    calculateTotalCost,
    selectedCount
  } = useMealSelectionFlow(userProfile);

  useEffect(() => {
    if (currentStep === 'generating') {
      generateOptions();
    }
  }, []);

  const mealTypes = userProfile.meal_types || ['breakfast', 'lunch', 'dinner'];
  const targetCount = mealTypes.length * 7;

  if (isLoading && mealOptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Generating personalized meal options...</p>
        <p className="text-sm text-muted-foreground">This may take a minute</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={generateOptions}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BudgetTracker
        budgetTier={userProfile.budget_tier || 'medium'}
        currentTotal={calculateTotalCost()}
        selectedCount={selectedCount}
        targetCount={targetCount}
      />

      <MealOptionsGrid
        mealOptions={mealOptions}
        selectedIds={selectedMealIds}
        onToggleSelection={toggleMealSelection}
        onRegenerate={regenerateMeal}
        mealTypes={mealTypes}
      />

      <div className="flex justify-end sticky bottom-4">
        <Button 
          size="lg"
          onClick={async () => {
            await confirmSelection();
            onComplete();
          }}
          disabled={selectedCount !== targetCount || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Confirming...
            </>
          ) : (
            `Confirm ${selectedCount} Meals`
          )}
        </Button>
      </div>
    </div>
  );
};
