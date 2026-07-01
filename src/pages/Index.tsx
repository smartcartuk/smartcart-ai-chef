import React, { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { AuthModal } from '@/components/AuthModal';
import { OnboardingWizard } from '@/components/OnboardingWizard';
import { DashboardFlow } from '@/components/dashboard/DashboardFlow';
import { Toaster } from '@/components/ui/toaster';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Check auth state on mount and handle OAuth redirects
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsAuthenticated(true);
        await loadProfile(session.user.id);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Event:', event, 'User:', session?.user?.id);

        if (session?.user) {
          setIsAuthenticated(true);
          setShowAuth(false);
          const profile = await loadProfile(session.user.id);

          // If new user or onboarding not completed, show onboarding
          if (event === 'SIGNED_IN' && (!profile || !profile.onboarding_completed)) {
            setShowOnboarding(true);
          } else if (profile) {
            setCurrentView('dashboard');
          }
        } else {
          setIsAuthenticated(false);
          setUserProfile(null);
          setCurrentView('landing');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string): Promise<any> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUserProfile(data);
        if (data.onboarding_completed) {
          setCurrentView('dashboard');
        }
        return data;
      }
      return null;
    } catch (err) {
      console.error('Failed to load profile:', err);
      return null;
    }
  };

  // "Try it free" — show dashboard with sample data, no signup needed
  const handleQuickStart = (postcode: string, householdSize: number) => {
    // Show onboarding to collect dietary preferences & budget
    // but pre-fill what we already have
    setUserProfile({
      full_name: '',
      postcode,
      household_size: householdSize,
      weekly_budget: 50,
      dietary_preferences: [],
      allergies: [],
      meal_types: ['breakfast', 'lunch', 'dinner'],
      preferred_supermarkets: ['tesco', 'asda', 'sainsburys', 'morrisons', 'waitrose'],
      preferred_fulfilment: 'delivery',
      isGuest: true,
    });
    setShowOnboarding(true);
  };

  // "Get Started" button → show signup modal
  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuth(true);
  };

  // "Sign In" button → show signin modal
  const handleSignIn = () => {
    setAuthMode('signin');
    setShowAuth(true);
  };

  // Onboarding completed → go to dashboard
  const handleOnboardingComplete = (data: any) => {
    setShowOnboarding(false);
    const mergedProfile = { ...userProfile, ...data, onboarding_completed: true };
    setUserProfile(mergedProfile);
    setCurrentView('dashboard');
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUserProfile(null);
    setCurrentView('landing');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentView={currentView}
        onBackToLanding={() => {
          if (isAuthenticated) {
            // Stay on dashboard if signed in
            return;
          }
          setCurrentView('landing');
        }}
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

      {/* Auth Modal — Google / Apple / Email */}
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        defaultMode={authMode}
      />

      {/* Onboarding — preferences, budget, stores */}
      <OnboardingWizard
        isOpen={showOnboarding}
        onClose={() => {
          setShowOnboarding(false);
          // If guest, still show dashboard with defaults
          if (userProfile?.isGuest) {
            setCurrentView('dashboard');
          }
        }}
        onComplete={handleOnboardingComplete}
      />

      <Toaster />
    </div>
  );
};

export default Index;
