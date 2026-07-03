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

          // New user or onboarding not completed → show onboarding
          if (!profile || !profile.onboarding_completed) {
            setShowOnboarding(true);
          } else {
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

  // "Plan your first week free" → signup flow → onboarding → dashboard
  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuth(true);
  };

  // "Sign In" → signin flow → dashboard (or onboarding if not completed)
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

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentView={currentView}
        onBackToLanding={() => {
          if (!isAuthenticated) setCurrentView('landing');
        }}
        onGetStarted={handleGetStarted}
        onSignIn={handleSignIn}
        userProfile={userProfile}
      />

      {currentView === 'landing' && (
        <Hero
          onGetStarted={handleGetStarted}
          onSignIn={handleSignIn}
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

      {/* Onboarding — preferences, budget, stores (shown after auth) */}
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
