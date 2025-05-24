
import React from 'react';

export const WeeklyPlanOverviewStep: React.FC = () => {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Weekly Plan Overview</h2>
        <p className="text-gray-600">AI is creating your personalized meal plan</p>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-3">Your weekly plan will include:</h3>
          <div className="space-y-2 text-left">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              <span className="text-sm">7 personalized recipes matching your dietary preferences</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Consolidated shopping list with exact quantities</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Nutritional information and calorie counts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
