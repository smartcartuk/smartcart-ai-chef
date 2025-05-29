
import React from 'react';
import { Loader2 } from 'lucide-react';

export const WeeklyPlanLoading: React.FC = () => {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      <span className="ml-3 text-lg">Generating your personalized weekly meal plan...</span>
    </div>
  );
};
