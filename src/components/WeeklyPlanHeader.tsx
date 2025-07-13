
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WeeklyPlanHeaderProps {
  userProfile: any;
  selectedIngredientsCount: number;
  onRegeneratePlan: () => void;
  onClearSelection: () => void;
  recipes?: any[];
  totalWeeklyCosts?: any;
}

export const WeeklyPlanHeader: React.FC<WeeklyPlanHeaderProps> = ({
  userProfile,
  selectedIngredientsCount,
  onRegeneratePlan,
  onClearSelection,
  recipes = [],
  totalWeeklyCosts
}) => {
  const getPreferencesText = () => {
    const parts = [];
    if (userProfile?.dietaryPreferences?.length > 0) {
      parts.push(userProfile.dietaryPreferences.join(', '));
    }
    if (userProfile?.householdSize) {
      parts.push(`${userProfile.householdSize} people`);
    }
    if (userProfile?.weeklyBudget) {
      parts.push(`£${userProfile.weeklyBudget}/week budget`);
    }
    return parts.length > 0 ? parts.join(' • ') : 'Personalized recipes';
  };

  // Find the cheapest supermarket and its cost
  const getCheapestCost = () => {
    if (totalWeeklyCosts) {
      const costs = Object.entries(totalWeeklyCosts) as [string, number][];
      const cheapest = costs.reduce((min, [store, cost]) => {
        return cost < min.cost ? { store, cost } : min;
      }, { store: costs[0][0], cost: costs[0][1] });
      
      return {
        cost: cheapest.cost,
        store: cheapest.store.charAt(0).toUpperCase() + cheapest.store.slice(1)
      };
    }
    
    // Fallback calculation from individual recipes
    const totalCost = recipes.reduce((total, recipe) => {
      const recipeCost = recipe.estimated_cost || recipe.cost_per_meal || recipe.estimated_price || 0;
      return total + recipeCost;
    }, 0);
    
    return { cost: totalCost, store: 'Estimated' };
  };

  const { cost: displayCost, store: cheapestStore } = getCheapestCost();

  return (
    <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your AI-Generated Weekly Meal Plan</h2>
          <p className="text-gray-600 mt-1">
            {getPreferencesText()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            ✨ Automatically generated based on your onboarding preferences • Live pricing from Spoonacular & SerpApi
          </p>
          {recipes.length > 0 && displayCost > 0 && (
            <div className="mt-2">
              <span className="text-lg font-semibold text-green-700">
                Total Weekly Cost: £{displayCost.toFixed(2)}
                <span className="text-sm text-gray-600 ml-2">
                  ({cheapestStore} - Best Price)
                </span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={onRegeneratePlan} variant="outline">
            Regenerate All Meals
          </Button>
          {selectedIngredientsCount > 0 && (
            <Button onClick={onClearSelection} variant="outline">
              Clear Selection ({selectedIngredientsCount} ingredients)
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
