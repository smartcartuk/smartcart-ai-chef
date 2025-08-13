import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { MealPlanDashboard } from '@/components/MealPlanDashboard';
import { Toaster } from '@/components/ui/toaster';
import { WebhookResponse } from '@/utils/webhookService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'dashboard'>('landing');
  const [userProfile, setUserProfile] = useState(null);
  const [generatedData, setGeneratedData] = useState<WebhookResponse | null>(null);
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
    setCurrentView('onboarding');
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  const handleOnboardingComplete = (profile: any, webhookData?: WebhookResponse) => {
    setUserProfile(profile);
    setGeneratedData(webhookData || null);
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
      
      {currentView === 'onboarding' && (
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      )}
      
      {currentView === 'dashboard' && (
        <MealPlanDashboard 
          userProfile={userProfile} 
          generatedData={generatedData}
        />
      )}
      
      <Toaster />
    </div>
  );
};

export default Index;
