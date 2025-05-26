
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WeeklyPlanHeaderProps {
  userProfile: any;
  selectedIngredientsCount: number;
  onRegeneratePlan: () => void;
  onClearSelection: () => void;
}

export const WeeklyPlanHeader: React.FC<WeeklyPlanHeaderProps> = ({
  userProfile,
  selectedIngredientsCount,
  onRegeneratePlan,
  onClearSelection
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

  return (
    <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your AI-Generated Weekly Meal Plan</h2>
          <p className="text-gray-600 mt-1">
            {getPreferencesText()}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            ✨ Automatically generated based on your onboarding preferences • Prices from cached ingredient data
          </p>
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
