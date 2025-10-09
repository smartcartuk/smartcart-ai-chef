import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { MealPlanDashboard } from '@/components/MealPlanDashboard';
import { AIChatInterface } from '@/components/AIChatInterface';
import { Toaster } from '@/components/ui/toaster';
import { WebhookResponse } from '@/utils/webhookService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getUserProfile } from '@/utils/profileService';
import { useAutoMealPlanner } from '@/hooks/useAutoMealPlanner';

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'dashboard'>('landing');
  const [userProfile, setUserProfile] = useState(null);
  const [generatedData, setGeneratedData] = useState<WebhookResponse | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { generatedMeals, isGenerating } = useAutoMealPlanner(userProfile);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setIsAuthenticated(!!session);
      
      // When user logs in, automatically load their profile
      if (session) {
        const profileResult = await getUserProfile();
        if (profileResult.success && profileResult.data) {
          // User has a profile - go to dashboard
          setUserProfile(profileResult.data);
          setCurrentView('dashboard');
        } else if (profileResult.success && !profileResult.data) {
          // User is authenticated but has no profile - show onboarding
          console.log('New user detected - opening onboarding wizard');
          setShowOnboarding(true);
          setCurrentView('onboarding');
        }
      }
    });
    
    supabase.auth.getSession().then(async ({ data }) => {
      setIsAuthenticated(!!data.session);
      
      // Load profile on initial mount if authenticated
      if (data.session) {
        const profileResult = await getUserProfile();
        if (profileResult.success && profileResult.data) {
          // User has a profile - go to dashboard
          setUserProfile(profileResult.data);
          setCurrentView('dashboard');
        } else if (profileResult.success && !profileResult.data) {
          // User is authenticated but has no profile - show onboarding
          console.log('New user detected - opening onboarding wizard');
          setShowOnboarding(true);
          setCurrentView('onboarding');
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    // Always open onboarding wizard - it handles signup internally
    setShowOnboarding(true);
    setCurrentView('onboarding');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleOnboardingComplete = async (profile: any, webhookData?: WebhookResponse) => {
    setUserProfile(profile);
    setShowOnboarding(false);
    setCurrentView('dashboard');
    // The MealPlanDashboard will automatically trigger meal generation via useWeeklyPlan
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <Header 
        currentView={currentView} 
        onBackToLanding={handleBackToLanding}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        userProfile={userProfile}
      />
      
      {currentView === 'landing' && (
        <>
          <Hero 
            onGetStarted={handleGetStarted}
            onSignIn={handleSignIn}
          />
        </>
      )}
      
      <OnboardingWizard 
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          setCurrentView('landing');
        }}
        onComplete={handleOnboardingComplete}
      />
      
      {currentView === 'dashboard' && (
        <div className="container mx-auto p-4">
          {isGenerating && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <div className="text-lg font-semibold text-blue-700">🤖 AI is generating your personalized meal plan...</div>
              <div className="text-sm text-blue-600 mt-1">Creating recipes, images, and finding the best prices</div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MealPlanDashboard 
                userProfile={userProfile} 
                generatedData={generatedMeals || generatedData}
              />
            </div>
            <div className="lg:col-span-1">
              <AIChatInterface 
                userProfile={userProfile}
                onMealPlanGenerated={(meals) => {
                  console.log('AI generated meal plan:', meals);
                  setGeneratedData(prev => ({
                    ...prev,
                    meals: meals,
                    priceComparisons: prev?.priceComparisons || [],
                    shoppingList: prev?.shoppingList || []
                  }));
                }}
                onShoppingStrategy={(strategy) => {
                  console.log('AI shopping strategy:', strategy);
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      <Toaster />
    </div>
  );
};

export default Index;
