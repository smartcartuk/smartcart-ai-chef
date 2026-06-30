import React from 'react';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  currentView: 'landing' | 'onboarding' | 'dashboard';
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
    <header className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            className="flex items-center gap-2"
            onClick={onBackToLanding}
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">SC</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight">
                SmartCart
              </h1>
              {currentView === 'dashboard' && (
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Your weekly shop, sorted
                </p>
              )}
            </div>
          </button>

          <div className="flex items-center gap-2">
            {currentView === 'dashboard' && userProfile && (
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {userProfile.name || userProfile.email || 'Account'}
              </span>
            )}

            {currentView === 'landing' && (
              <>
                <Button variant="ghost" size="sm" onClick={onSignIn}>
                  Sign in
                </Button>
                <Button size="sm" onClick={onGetStarted}>
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
