
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
        userProfile={userProfile}
      />
      
      {currentView === 'landing' && (
        <>
          <Hero onGetStarted={handleGetStarted} />
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
