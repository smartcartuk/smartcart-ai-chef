import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
    if (currentStep === 'generating' && mealOptions.length === 0) {
      generateOptions();
    }
  }, [currentStep, mealOptions.length, generateOptions]);

  const mealTypes = userProfile.meal_types || ['breakfast', 'lunch', 'dinner'];
  const targetCount = mealTypes.length * 7;

  // Show better empty state when no options loaded
  if (!isLoading && mealOptions.length === 0 && !error) {
    return (
      <Card className="p-8 text-center space-y-4">
        <div className="text-6xl">🍽️</div>
        <h3 className="text-xl font-semibold">No Meal Options Available</h3>
        <p className="text-muted-foreground">
          There was an issue loading meal options. Please try generating them again.
        </p>
        <Button onClick={generateOptions}>
          Regenerate Options
        </Button>
      </Card>
    );
  }

  if (isLoading && mealOptions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Generating personalized meal options...</p>
        <p className="text-sm text-muted-foreground">This may take a minute</p>
      </div>
    );
  }

  if (mealOptions.length === 0) {
    return (
      <Card className="p-8 text-center space-y-4">
        <div className="text-6xl">🍽️</div>
        <h3 className="text-xl font-semibold">No Meal Options Yet</h3>
        <p className="text-muted-foreground">
          Click the button below to generate personalized meal options based on your preferences.
        </p>
        <Button onClick={generateOptions} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Options...
            </>
          ) : (
            'Generate Meal Options'
          )}
        </Button>
      </Card>
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
      {mealOptions.length > 0 && (
        <BudgetTracker
          budgetTier={userProfile.budget_tier || 'medium'}
          currentTotal={calculateTotalCost()}
          selectedCount={selectedCount}
          targetCount={targetCount}
        />
      )}

      <MealOptionsGrid
        mealOptions={mealOptions}
        selectedIds={selectedMealIds}
        onToggleSelection={toggleMealSelection}
        onRegenerate={regenerateMeal}
        mealTypes={mealTypes}
      />

      {mealOptions.length > 0 && (
        <div className="flex justify-between items-center sticky bottom-4 bg-background/95 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
          <div className="text-sm text-muted-foreground">
            Selected {selectedCount} of {targetCount} meals
            {selectedCount > 0 && ` • Total: £${calculateTotalCost().toFixed(2)}`}
          </div>
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
      )}
    </div>
  );
};
