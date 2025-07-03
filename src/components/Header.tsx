
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
    <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer"
            onClick={onBackToLanding}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🛒</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                SmartCart
              </h1>
              <p className="text-xs text-gray-500">AI-Powered Meal Planning</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {currentView === 'dashboard' && userProfile && (
              <>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  Premium
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-medium">{userProfile.name || 'User'}</p>
                  <p className="text-xs text-gray-500">Weekly savings: £12.50</p>
                </div>
              </>
            )}
            
            {currentView === 'landing' && (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={onSignIn}>
                  Sign In
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                  onClick={onGetStarted}
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
