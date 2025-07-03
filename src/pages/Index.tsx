
import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { MealPlanDashboard } from '@/components/MealPlanDashboard';
import { Toaster } from '@/components/ui/toaster';
import { WebhookResponse } from '@/utils/webhookService';

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'dashboard'>('landing');
  const [userProfile, setUserProfile] = useState(null);
  const [generatedData, setGeneratedData] = useState<WebhookResponse | null>(null);

  const handleGetStarted = () => {
    setCurrentView('onboarding');
  };

  const handleSignIn = () => {
    // For now, simulate sign in by going directly to onboarding
    // In a real app, this would open a sign-in modal or redirect to auth page
    setCurrentView('onboarding');
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
