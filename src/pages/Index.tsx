import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { DashboardFlow } from '@/components/dashboard/DashboardFlow';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'onboarding' | 'dashboard'>('landing');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        await loadProfile(session.user.id);
        setCurrentView('dashboard');
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setIsAuthenticated(true);
          await loadProfile(session.user.id);
          setCurrentView('dashboard');
        } else {
          setIsAuthenticated(false);
          setUserProfile(null);
          setCurrentView('landing');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUserProfile(data);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  // "Try it free" — show dashboard with sample data, no signup
  const handleQuickStart = (postcode: string, householdSize: number) => {
    setUserProfile({
      name: '',
      postcode,
      householdSize,
      household_size: householdSize,
      weeklyBudget: 50,
      weekly_budget: 50,
      dietaryPreferences: [],
      dietary_preferences: [],
      allergies: [],
      preferred_supermarkets: ['tesco', 'asda', 'sainsburys', 'morrisons', 'waitrose'],
      isGuest: true,
    });
    setCurrentView('dashboard');
    toast({
      title: 'Generating your meal plan...',
      description: 'Finding the best meals for your household',
    });
  };

  const handleGetStarted = () => {
    setShowOnboarding(true);
  };

  const handleSignIn = async () => {
    // For MVP: use magic link or show a sign-in form
    const email = window.prompt('Enter your email to sign in:');
    if (email) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        toast({
          title: 'Sign in failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Check your email',
          description: 'We sent you a magic link to sign in',
        });
      }
    }
  };

  const handleOnboardingComplete = async (data: any) => {
    setShowOnboarding(false);
    setUserProfile(data);
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentView={currentView}
        onBackToLanding={() => setCurrentView('landing')}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        userProfile={userProfile}
      />

      {currentView === 'landing' && (
        <Hero
          onGetStarted={handleGetStarted}
          onSignIn={handleSignIn}
          onQuickStart={handleQuickStart}
        />
      )}

      {currentView === 'dashboard' && userProfile && (
        <DashboardFlow userProfile={userProfile} />
      )}

      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />

      <Toaster />
    </div>
  );
};

export default Index;
