
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <div className="relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white border-0">
                🤖 Powered by AI
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Smart Grocery
                </span>
                <br />
                <span className="text-gray-900">Planning Made</span>
                <br />
                <span className="text-gray-900">Simple</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Save time and money with AI-powered meal planning. Get personalized recipes, 
                optimized shopping lists, and automatic price comparisons across UK supermarkets.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                onClick={onGetStarted}
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white px-8 py-4 text-lg"
              >
                Start Planning Now
              </Button>
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">£127</div>
                <div className="text-sm text-gray-600">Avg. monthly savings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">15min</div>
                <div className="text-sm text-gray-600">Planning time saved</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">98%</div>
                <div className="text-sm text-gray-600">User satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right side - Feature preview */}
          <div className="space-y-6">
            <Card className="p-6 bg-white/60 backdrop-blur-sm border border-emerald-100 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="font-medium">This Week's Plan</span>
                </div>
                <div className="space-y-3">
                  {['Mediterranean Salmon', 'Thai Green Curry', 'Classic Lasagne'].map((meal, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100">
                      <span className="text-sm font-medium">{meal}</span>
                      <Badge variant="secondary" className="text-xs">
                        £{(8.50 + index * 1.20).toFixed(2)}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total saved:</span>
                    <span className="text-emerald-600 font-bold">£12.50</span>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 shadow-xl">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="font-medium">AI Assistant</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg text-sm">
                    "I need a gluten-free version of tonight's recipe"
                  </div>
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg text-sm">
                    I've found 3 gluten-free alternatives that match your preferences. The coconut flour option saves £2.30!
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
