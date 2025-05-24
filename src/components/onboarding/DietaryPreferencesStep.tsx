
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

interface DietaryPreferencesStepProps {
  profile: any;
  onTogglePreference: (item: string, type: 'dietary' | 'allergies') => void;
}

export const DietaryPreferencesStep: React.FC<DietaryPreferencesStepProps> = ({
  profile,
  onTogglePreference
}) => {
  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 
    'Dairy-Free', 'Keto', 'Low-Carb', 'Halal', 'Kosher'
  ];

  const allergyOptions = [
    'Nuts', 'Shellfish', 'Eggs', 'Dairy', 'Soy', 'Gluten', 'Fish'
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Dietary Preferences</h2>
        <p className="text-gray-600">Select any that apply to your household</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {dietaryOptions.map((option) => (
          <div
            key={option}
            onClick={() => onTogglePreference(option, 'dietary')}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              profile.dietaryPreferences.includes(option)
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Checkbox 
                checked={profile.dietaryPreferences.includes(option)}
                disabled={true}
              />
              <span className="font-medium">{option}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Any allergies or ingredients to avoid?</h3>
        <div className="flex flex-wrap gap-2">
          {allergyOptions.map((allergy) => (
            <Badge
              key={allergy}
              variant={profile.allergies.includes(allergy) ? "default" : "outline"}
              className={`cursor-pointer ${
                profile.allergies.includes(allergy) 
                  ? 'bg-red-100 text-red-700 border-red-300' 
                  : 'hover:bg-red-50'
              }`}
              onClick={() => onTogglePreference(allergy, 'allergies')}
            >
              {allergy}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
