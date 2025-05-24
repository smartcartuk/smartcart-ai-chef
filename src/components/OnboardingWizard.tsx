import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { OnboardingProgress } from './onboarding/OnboardingProgress';
import { PersonalDetailsStep } from './onboarding/PersonalDetailsStep';
import { DietaryPreferencesStep } from './onboarding/DietaryPreferencesStep';
import { ConnectStoresStep } from './onboarding/ConnectStoresStep';
import { WeeklyPlanOverviewStep } from './onboarding/WeeklyPlanOverviewStep';
import { OptimizeCompareStep } from './onboarding/OptimizeCompareStep';
import { ExportShopStep } from './onboarding/ExportShopStep';
import { sendUserPreferences, WebhookResponse } from '@/utils/webhookService';

interface OnboardingWizardProps {
  onComplete: (profile: any, generatedData?: WebhookResponse) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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
    connectedStores: [] as any[]
  });
  const { toast } = useToast();
  const { addressSuggestions, showAddressSuggestions, searchAddresses, selectAddress } = useAddressSearch();

  const updateAddress = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  const handleAddressSelect = (address: string) => {
    selectAddress(address, updateAddress);
  };

  const togglePreference = (item: string, type: 'dietary' | 'allergies') => {
    const key = type === 'dietary' ? 'dietaryPreferences' : 'allergies';
    
    setProfile(prev => ({
      ...prev,
      [key]: prev[key].includes(item) 
        ? prev[key].filter((i: string) => i !== item)
        : [...prev[key], item]
    }));
  };

  const toggleStore = (store: any) => {
    setProfile(prev => {
      const isConnected = prev.connectedStores.some(s => s.name === store.name);
      return {
        ...prev,
        connectedStores: isConnected
          ? prev.connectedStores.filter(s => s.name !== store.name)
          : [...prev.connectedStores, { ...store, credentials: { username: '', password: '', loyaltyCard: '' } }]
      };
    });
  };

  const updateStoreCredentials = (storeName: string, field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      connectedStores: prev.connectedStores.map(store =>
        store.name === storeName
          ? { ...store, credentials: { ...store.credentials, [field]: value } }
          : store
      )
    }));
  };

  const handleNext = async () => {
    if (step < 6) {
      setStep(step + 1);
    } else {
      setIsGenerating(true);
      
      try {
        toast({
          title: "Generating your meal plan... 🤖",
          description: "AI is analyzing your preferences and comparing prices.",
        });

        const generatedData = await sendUserPreferences(profile);
        
        toast({
          title: "Welcome to SmartCart! 🎉",
          description: "Your personalized meal plan is ready!",
        });
        
        onComplete(profile, generatedData);
      } catch (error) {
        console.error('Error generating meal plan:', error);
        toast({
          title: "Generation failed",
          description: "Using default meal plan. You can regenerate later.",
          variant: "destructive",
        });
        
        // Fall back to completing without generated data
        onComplete(profile);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const isStep1Valid = profile.name && profile.email && profile.password && 
                       profile.address.street && profile.address.city && profile.address.postcode;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <PersonalDetailsStep
            profile={profile}
            setProfile={setProfile}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            addressSuggestions={addressSuggestions}
            showAddressSuggestions={showAddressSuggestions}
            onAddressSearch={searchAddresses}
            onAddressSelect={handleAddressSelect}
          />
        );
      case 2:
        return (
          <DietaryPreferencesStep
            profile={profile}
            onTogglePreference={togglePreference}
          />
        );
      case 3:
        return (
          <ConnectStoresStep
            profile={profile}
            onToggleStore={toggleStore}
            onUpdateStoreCredentials={updateStoreCredentials}
          />
        );
      case 4:
        return <WeeklyPlanOverviewStep />;
      case 5:
        return <OptimizeCompareStep />;
      case 6:
        return <ExportShopStep />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <OnboardingProgress currentStep={step} totalSteps={6} />

        <Card className="p-8 shadow-xl border border-emerald-100">
          {renderStep()}

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isGenerating}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
              disabled={(step === 1 && !isStep1Valid) || isGenerating}
            >
              {isGenerating ? 'Generating...' : (step === 6 ? 'Start Planning' : 'Continue')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
