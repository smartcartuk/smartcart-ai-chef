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
    // Personal details
    name: '',
    email: '',
    password: '',
    address: {
      street: '',
      city: '',
      postcode: '',
      country: 'United Kingdom'
    },
    // Existing fields
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
    if (step < 6) {
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

  const updateAddress = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const isStep1Valid = profile.name && profile.email && profile.password && 
                       profile.address.street && profile.address.city && profile.address.postcode;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step} of 6</span>
            <span className="text-sm text-gray-500">{Math.round((step / 6) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        <Card className="p-8 shadow-xl border border-emerald-100">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
                <p className="text-gray-600">Let's start with your personal details</p>
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

                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={profile.password}
                    onChange={(e) => setProfile(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Create a secure password"
                    className="mt-1"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Your Address</h3>
                  
                  <div>
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      value={profile.address.street}
                      onChange={(e) => updateAddress('street', e.target.value)}
                      placeholder="Enter your street address"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={profile.address.city}
                        onChange={(e) => updateAddress('city', e.target.value)}
                        placeholder="City"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input
                        id="postcode"
                        value={profile.address.postcode}
                        onChange={(e) => updateAddress('postcode', e.target.value)}
                        placeholder="SW1A 1AA"
                        className="mt-1"
                      />
                    </div>
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
          )}

          {step === 5 && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Optimize & Compare</h2>
                <p className="text-gray-600">Smart price comparison across your connected stores</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-3">Price optimization features:</h3>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Compare prices across all your connected stores</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm">Apply loyalty card discounts automatically</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                      <span className="text-sm">Suggest cheaper alternatives for expensive items</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                      <span className="text-sm">Split shopping across stores for maximum savings</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">Export & Shop</h2>
                <p className="text-gray-600">Your SmartCart is ready! Choose how you'd like to shop</p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-3">Shopping options:</h3>
                  <div className="space-y-2 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Export shopping list to email or PDF</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm">Auto-fill baskets on supermarket websites</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="text-sm">Schedule weekly delivery or collection</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      <span className="text-sm">Track your weekly savings progress</span>
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
              disabled={step === 1 && !isStep1Valid}
            >
              {step === 6 ? 'Start Planning' : 'Continue'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
