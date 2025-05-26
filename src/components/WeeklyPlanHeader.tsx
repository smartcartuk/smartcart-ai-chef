
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
  return (
    <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI-Generated Weekly Meal Plan</h2>
          <p className="text-gray-600 mt-1">
            Personalized recipes for {userProfile?.householdSize || 2} people
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={onRegeneratePlan} variant="outline">
            Regenerate Plan
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
