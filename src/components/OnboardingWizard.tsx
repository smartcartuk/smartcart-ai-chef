import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Users, Target, ShoppingCart, Check } from 'lucide-react';
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
  const [isSuccess, setIsSuccess] = useState(false);
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
    // Validate step 1 before allowing to proceed
    if (currentStep === 0) {
      if (!profile.email || !profile.password) {
        toast({
          title: "Missing Information",
          description: "Please provide email and password",
          variant: "destructive"
        });
        return;
      }

      if (!profile.name) {
        toast({
          title: "Missing Information",
          description: "Please provide your name",
          variant: "destructive"
        });
        return;
      }

      if (profile.password.length < 6) {
        toast({
          title: "Invalid Password",
          description: "Password must be at least 6 characters",
          variant: "destructive"
        });
        return;
      }
    }

    if (currentStep === steps.length - 1) {
      setIsSaving(true);
      console.log('🔵 [ONBOARDING] Starting onboarding completion...');
      console.log('🔵 [ONBOARDING] Profile data:', { ...profile, password: '[REDACTED]' });
      
      try {
        // Step 1: Create user account (auto-signs in when email confirmation is disabled)
        console.log('🔵 [ONBOARDING] Creating user account...');
        
        const { data, error } = await supabase.auth.signUp({
          email: profile.email,
          password: profile.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: profile.name
            }
          }
        });
        
        if (error) {
          console.error('🔴 [ONBOARDING ERROR] Signup failed:', error);
          throw error;
        }
        
        if (!data.user) {
          throw new Error('No user returned from signup');
        }
        
        console.log('✅ [ONBOARDING] User created and signed in:', data.user.id);
        
        // Step 2: Save profile data
        console.log('🔵 [ONBOARDING] Saving profile data...');
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

        // Step 3: Save connected stores
        if (profile.connectedStores.length > 0) {
          console.log('🔵 [ONBOARDING] Saving connected stores...');
          const storesResult = await saveConnectedStores(profile.connectedStores);
          
          if (!storesResult.success) {
            console.warn('⚠️ [ONBOARDING WARNING] Failed to save stores:', storesResult.error);
          } else {
            console.log('✅ [ONBOARDING] Connected stores saved');
          }
        }

        console.log('✅ [ONBOARDING] Onboarding completed successfully!');
        
        // Stop saving state FIRST
        setIsSaving(false);
        
        // Show success state
        setIsSuccess(true);
        
        toast({
          title: "Setup Complete!",
          description: "Redirecting to your dashboard...",
        });

        // Wait 2 seconds to show success message, then complete
        setTimeout(() => {
          onComplete(profile);
        }, 2000);
      } catch (error: any) {
        console.error('🔴 [ONBOARDING EXCEPTION]', error);
        console.error('🔴 [ONBOARDING EXCEPTION] Stack:', error.stack);
        
        let errorMessage = error.message || 'An unexpected error occurred';
        
        // Provide specific guidance based on error
        if (errorMessage.includes('already registered')) {
          errorMessage = 'This email is already registered. Please sign in instead.';
        } else if (errorMessage.includes('Invalid email')) {
          errorMessage = 'Please provide a valid email address.';
        }
        
        toast({
          title: "Setup Failed",
          description: errorMessage,
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
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-semibold">Setup Complete!</h3>
                    <p className="text-muted-foreground">Redirecting to your dashboard...</p>
                  </div>
                </div>
              ) : currentStep === 0 && (
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

          {!isSuccess && (
            <div className="flex justify-between">
              <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0 || isSaving}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button 
                onClick={handleNext} 
                disabled={
                  isSaving || 
                  (currentStep === 0 && (!profile.name || !profile.email || !profile.password || profile.password.length < 6))
                }
              >
                {isSaving ? 'Saving...' : currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
                {currentStep < steps.length - 1 && !isSaving && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};