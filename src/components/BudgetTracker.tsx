import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { getBudgetRange } from '@/utils/costEstimationService';

interface BudgetTrackerProps {
  budgetTier: 'low' | 'medium' | 'high';
  currentTotal: number;
  selectedCount: number;
  targetCount: number;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({
  budgetTier,
  currentTotal,
  selectedCount,
  targetCount
}) => {
  const budget = getBudgetRange(budgetTier);
  const percentage = (currentTotal / budget.max) * 100;
  
  // Determine color based on budget usage
  const getStatusColor = () => {
    if (percentage <= 85) return 'text-green-600';
    if (percentage <= 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = () => {
    if (percentage <= 85) return 'bg-green-500';
    if (percentage <= 100) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusMessage = () => {
    if (percentage <= 85) return 'Under budget ✓';
    if (percentage <= 100) return 'Close to budget';
    return 'Over budget!';
  };

  return (
    <Card className="p-6 mb-6 bg-gradient-to-br from-background to-muted/20">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Weekly Budget Tracker</h3>
            <p className="text-sm text-muted-foreground">
              {selectedCount} of {targetCount} meals selected
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getStatusColor()}`}>
              £{currentTotal.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">
              of £{budget.max} budget
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className={getStatusColor()}>{getStatusMessage()}</span>
            <span className="text-muted-foreground">{Math.round(percentage)}%</span>
          </div>
          <Progress 
            value={Math.min(percentage, 100)} 
            className={`h-3 ${getProgressColor()}`}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>£{budget.min}</span>
            <span>£{budget.max}</span>
          </div>
        </div>

        {percentage > 100 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            ⚠️ Your selection is over budget by £{(currentTotal - budget.max).toFixed(2)}. 
            Consider removing some meals or choosing cheaper alternatives.
          </div>
        )}

        {selectedCount < targetCount && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            💡 You need to select {targetCount - selectedCount} more meal{targetCount - selectedCount !== 1 ? 's' : ''} 
            to complete your weekly plan.
          </div>
        )}
      </div>
    </Card>
  );
};
