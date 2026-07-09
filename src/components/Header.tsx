import React from 'react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  currentView: 'landing' | 'dashboard';
  onBackToLanding: () => void;
  onGetStarted: () => void;
  onSignIn: () => void;
  userProfile: any;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onBackToLanding,
  onGetStarted,
  onSignIn,
  userProfile
}) => {
  return (
    <header className="bg-background/85 backdrop-blur-md border-b border-foreground/10 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2.5"
            onClick={onBackToLanding}
          >
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-display text-sm pt-0.5">SC</span>
            </div>
            <span className="font-display text-xl text-foreground pt-0.5">
              SmartCart
            </span>
          </button>

          <div className="flex items-center gap-2">
            {currentView === 'dashboard' && userProfile && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {userProfile.full_name || userProfile.email || 'Account'}
              </span>
            )}

            {currentView === 'landing' && (
              <>
                <Button variant="ghost" size="sm" onClick={onSignIn} className="rounded-full">
                  Sign in
                </Button>
                <Button size="sm" onClick={onGetStarted} className="rounded-full font-semibold">
                  Get started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
