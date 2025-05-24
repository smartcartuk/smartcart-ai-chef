
import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';

interface DietaryPreferencesStepProps {
  profile: any;
  onTogglePreference: (item: string, type: 'dietary' | 'allergies') => void;
}

export const DietaryPreferencesStep: React.FC<DietaryPreferencesStepProps> = ({
  profile,
  onTogglePreference
}) => {
  const [customAllergy, setCustomAllergy] = useState('');

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 
    'Dairy-Free', 'Keto', 'Low-Carb', 'Paleo', 'Mediterranean',
    'High-Protein', 'Low-Sodium', 'Halal', 'Kosher'
  ];

  const allergyOptions = [
    'Nuts', 'Shellfish', 'Eggs', 'Dairy', 'Soy', 'Gluten', 'Fish',
    'Sesame', 'Celery', 'Mustard', 'Sulphites', 'Lupin'
  ];

  const handleAddCustomAllergy = () => {
    if (customAllergy.trim() && !profile.allergies.includes(customAllergy.trim())) {
      onTogglePreference(customAllergy.trim(), 'allergies');
      setCustomAllergy('');
    }
  };

  const handleRemoveCustomAllergy = (allergy: string) => {
    if (!allergyOptions.includes(allergy)) {
      onTogglePreference(allergy, 'allergies');
    }
  };

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

        {/* Custom allergies */}
        <div className="space-y-3">
          <h4 className="text-md font-medium">Add custom ingredients to avoid:</h4>
          <div className="flex gap-2">
            <Input
              placeholder="e.g., coconut, avocado..."
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomAllergy();
                }
              }}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomAllergy}
              disabled={!customAllergy.trim()}
            >
              <Plus size={16} />
            </Button>
          </div>

          {/* Display custom allergies */}
          {profile.allergies.filter(allergy => !allergyOptions.includes(allergy)).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Your custom ingredients to avoid:</p>
              <div className="flex flex-wrap gap-2">
                {profile.allergies
                  .filter(allergy => !allergyOptions.includes(allergy))
                  .map((allergy) => (
                    <Badge
                      key={allergy}
                      variant="secondary"
                      className="bg-yellow-100 text-yellow-700 border-yellow-300 cursor-pointer hover:bg-yellow-200 flex items-center gap-1"
                      onClick={() => handleRemoveCustomAllergy(allergy)}
                    >
                      {allergy}
                      <X size={12} />
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          💡 You can always update your dietary preferences later in your profile settings.
        </p>
      </div>
    </div>
  );
};
