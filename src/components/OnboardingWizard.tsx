import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Users, Target, ShoppingCart } from 'lucide-react';
import { PersonalDetailsStep } from '@/components/onboarding/PersonalDetailsStep';
import { DietaryPreferencesStep } from '@/components/onboarding/DietaryPreferencesStep';
import { ConnectStoresStep } from '@/components/onboarding/ConnectStoresStep';
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { saveUserProfile, saveConnectedStores } from '@/utils/profileService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    password: '',
    address: {
      street: '',
      city: '',
      postcode: ''
    },
    householdSize: 2,
    weeklyBudget: 80,
    dietaryPreferences: [],
    allergies: [],
    connectedStores: []
  });

  const { 
    suggestions: addressSuggestions, 
    showSuggestions: showAddressSuggestions, 
    searchAddress, 
    selectAddress 
  } = useAddressSearch();

  const steps = [
    { title: 'Personal Details', icon: Users },
    { title: 'Dietary Preferences', icon: Target },
    { title: 'Connect Stores', icon: ShoppingCart }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = async () => {
    if (currentStep === steps.length - 1) {
      setIsSaving(true);
      console.log('🔵 [ONBOARDING] Starting onboarding completion...');
      console.log('🔵 [ONBOARDING] Profile data:', { ...profile, password: '[REDACTED]' });
      
      try {
        // Step 1: Create the user account
        console.log('🔵 [ONBOARDING] Step 1: Creating user account...');
        const redirectUrl = `${window.location.origin}/`;
        
        const signUpResult = await supabase.auth.signUp({
          email: profile.email,
          password: profile.password,
          options: { emailRedirectTo: redirectUrl }
        });
        
        console.log('🔵 [ONBOARDING] SignUp result:', JSON.stringify(signUpResult, null, 2));
        
        if (signUpResult.error) {
          console.error('🔴 [ONBOARDING ERROR] Signup failed:', signUpResult.error);
          throw new Error(`Account creation failed: ${signUpResult.error.message}`);
        }
        
        console.log('✅ [ONBOARDING] User account created:', signUpResult.data.user?.id);
        
        // Step 2: Sign in the user (since email confirmation is disabled)
        console.log('🔵 [ONBOARDING] Step 2: Signing in user...');
        const signInResult = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: profile.password
        });
        
        console.log('🔵 [ONBOARDING] SignIn result:', JSON.stringify(signInResult, null, 2));
        
        if (signInResult.error) {
          console.error('🔴 [ONBOARDING ERROR] Sign in failed:', signInResult.error);
          throw new Error(`Sign in failed: ${signInResult.error.message}`);
        }
        
        console.log('✅ [ONBOARDING] User signed in, session created');
        
        // Step 3: Save profile data
        console.log('🔵 [ONBOARDING] Step 3: Saving profile data...');
        const profileResult = await saveUserProfile({
          full_name: profile.name,
          email: profile.email,
          address: profile.address,
          household_size: profile.householdSize,
          weekly_budget: profile.weeklyBudget,
          dietary_preferences: profile.dietaryPreferences,
          allergies: profile.allergies
        });

        if (!profileResult.success) {
          console.error('🔴 [ONBOARDING ERROR] Profile save failed:', profileResult.error);
          throw new Error(profileResult.error || 'Failed to save profile');
        }

        console.log('✅ [ONBOARDING] Profile saved successfully');

        // Step 4: Save connected stores
        if (profile.connectedStores.length > 0) {
          console.log('🔵 [ONBOARDING] Step 4: Saving connected stores...');
          const storesResult = await saveConnectedStores(profile.connectedStores);
          
          if (!storesResult.success) {
            console.warn('⚠️ [ONBOARDING WARNING] Failed to save stores:', storesResult.error);
          } else {
            console.log('✅ [ONBOARDING] Connected stores saved');
          }
        }

        console.log('✅ [ONBOARDING] Onboarding completed successfully!');
        
        toast({
          title: "Profile Saved!",
          description: "Generating your personalized meal plan with AI...",
        });

        // Pass profile to parent to trigger automatic meal generation
        onComplete(profile);
      } catch (error: any) {
        console.error('🔴 [ONBOARDING EXCEPTION]', error);
        console.error('🔴 [ONBOARDING EXCEPTION] Stack:', error.stack);
        toast({
          title: "Error Completing Setup",
          description: error.message || "Failed to complete setup. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsSaving(false);
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleTogglePreference = (item: string, type: 'dietary' | 'allergies') => {
    setProfile(prev => {
      const currentList = type === 'dietary' ? prev.dietaryPreferences : prev.allergies;
      const newList = currentList.includes(item)
        ? currentList.filter(i => i !== item)
        : [...currentList, item];
      
      return {
        ...prev,
        [type === 'dietary' ? 'dietaryPreferences' : 'allergies']: newList
      };
    });
  };

  const handleToggleStore = (store: any) => {
    setProfile(prev => {
      const isAlreadyConnected = prev.connectedStores.some(s => s.name === store.name);
      
      if (isAlreadyConnected) {
        return {
          ...prev,
          connectedStores: prev.connectedStores.filter(s => s.name !== store.name)
        };
      } else {
        return {
          ...prev,
          connectedStores: [...prev.connectedStores, { 
            ...store, 
            credentials: { username: '', password: '', loyaltyCard: '' }
          }]
        };
      }
    });
  };

  const handleUpdateStoreCredentials = (storeName: string, field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      connectedStores: prev.connectedStores.map(store =>
        store.name === storeName
          ? {
              ...store,
              credentials: {
                ...store.credentials,
                [field]: value
              }
            }
          : store
      )
    }));
  };

  const handleAddressSearch = (query: string) => {
    searchAddress(query);
  };

  const handleAddressSelect = (address: string) => {
    selectAddress(address);
    // Update the profile with the selected address
    setProfile(prev => ({
      ...prev,
      address: {
        ...prev.address,
        street: address
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Welcome to SmartCart</h2>
            <p className="text-muted-foreground">Let's get you set up in just a few steps</p>
            <Progress value={progress} className="mt-4" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription>Step {currentStep + 1} of {steps.length}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStep === 0 && (
                <PersonalDetailsStep
                  profile={profile}
                  setProfile={setProfile}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  addressSuggestions={addressSuggestions}
                  showAddressSuggestions={showAddressSuggestions}
                  onAddressSearch={handleAddressSearch}
                  onAddressSelect={handleAddressSelect}
                />
              )}

              {currentStep === 1 && (
                <DietaryPreferencesStep
                  profile={profile}
                  onTogglePreference={handleTogglePreference}
                />
              )}

              {currentStep === 2 && (
                <ConnectStoresStep
                  profile={profile}
                  onToggleStore={handleToggleStore}
                  onUpdateStoreCredentials={handleUpdateStoreCredentials}
                />
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button onClick={handleNext} disabled={isSaving}>
              {isSaving ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
              {currentStep < steps.length - 1 && !isSaving && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};