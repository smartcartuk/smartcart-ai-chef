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

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'dashboard'>('landing');
  const [userProfile, setUserProfile] = useState(null);
  const [generatedData, setGeneratedData] = useState<WebhookResponse | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    supabase.auth.getSession().then(({ data }) => setIsAuthenticated(!!data.session));
    return () => subscription.unsubscribe();
  }, []);

  const handleGetStarted = () => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }
    setShowOnboarding(true);
    setCurrentView('onboarding');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleOnboardingComplete = (profile: any, webhookData?: WebhookResponse) => {
    setUserProfile(profile);
    setGeneratedData(webhookData || null);
    setShowOnboarding(false);
    setCurrentView('dashboard');
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <MealPlanDashboard 
                userProfile={userProfile} 
                generatedData={generatedData}
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
