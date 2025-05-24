
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface OnboardingWizardProps {
  onComplete: (profile: any) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    dietaryPreferences: [] as string[],
    allergies: [] as string[],
    householdSize: 2,
    weeklyBudget: 50,
    connectedStores: [] as string[]
  });
  const { toast } = useToast();

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 
    'Dairy-Free', 'Keto', 'Low-Carb', 'Halal', 'Kosher'
  ];

  const allergyOptions = [
    'Nuts', 'Shellfish', 'Eggs', 'Dairy', 'Soy', 'Gluten', 'Fish'
  ];

  const storeOptions = [
    { name: 'Tesco', logo: '🛒', description: 'Clubcard savings' },
    { name: 'Sainsbury\'s', logo: '🛍️', description: 'Nectar points' },
    { name: 'Asda', logo: '🏪', description: 'Everyday low prices' },
    { name: 'Morrisons', logo: '🥬', description: 'Fresh market' }
  ];

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      toast({
        title: "Welcome to SmartCart! 🎉",
        description: "Your AI-powered meal planning journey begins now.",
      });
      onComplete(profile);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const togglePreference = (item: string, type: 'dietary' | 'allergies' | 'stores') => {
    const key = type === 'dietary' ? 'dietaryPreferences' : 
                type === 'allergies' ? 'allergies' : 'connectedStores';
    
    setProfile(prev => ({
      ...prev,
      [key]: prev[key].includes(item) 
        ? prev[key].filter((i: string) => i !== item)
        : [...prev[key], item]
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step} of 4</span>
            <span className="text-sm text-gray-500">{Math.round((step / 4) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <Card className="p-8 shadow-xl border border-emerald-100">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Welcome! Let's get started</h2>
                <p className="text-gray-600">Tell us a bit about yourself to personalize your experience</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter your email"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="household">Household Size</Label>
                    <Input
                      id="household"
                      type="number"
                      min="1"
                      max="8"
                      value={profile.householdSize}
                      onChange={(e) => setProfile(prev => ({ ...prev, householdSize: parseInt(e.target.value) }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="budget">Weekly Budget (£)</Label>
                    <Input
                      id="budget"
                      type="number"
                      min="20"
                      max="200"
                      value={profile.weeklyBudget}
                      onChange={(e) => setProfile(prev => ({ ...prev, weeklyBudget: parseInt(e.target.value) }))}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Dietary Preferences</h2>
                <p className="text-gray-600">Select any that apply to your household</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {dietaryOptions.map((option) => (
                  <div
                    key={option}
                    onClick={() => togglePreference(option, 'dietary')}
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
                      onClick={() => togglePreference(allergy, 'allergies')}
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Connect Your Stores</h2>
                <p className="text-gray-600">Link your supermarket accounts to compare prices and apply discounts</p>
              </div>
              
              <div className="grid gap-4">
                {storeOptions.map((store) => (
                  <div
                    key={store.name}
                    onClick={() => togglePreference(store.name, 'stores')}
                    className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                      profile.connectedStores.includes(store.name)
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-3xl">{store.logo}</div>
                        <div>
                          <h3 className="font-semibold text-lg">{store.name}</h3>
                          <p className="text-gray-600">{store.description}</p>
                        </div>
                      </div>
                      <Checkbox 
                        checked={profile.connectedStores.includes(store.name)}
                        disabled={true}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  🔒 Your account details are securely encrypted and only used for price comparison and automated shopping.
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">You're all set! 🎉</h2>
                <p className="text-gray-600">AI is analyzing your preferences to create the perfect meal plan</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-emerald-50 to-blue-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-3">What happens next:</h3>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm">AI curates personalized recipes based on your preferences</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Smart shopping list with price comparisons across stores</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Weekly savings report and optimization suggestions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
              disabled={step === 1 && (!profile.name || !profile.email)}
            >
              {step === 4 ? 'Start Planning' : 'Continue'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
