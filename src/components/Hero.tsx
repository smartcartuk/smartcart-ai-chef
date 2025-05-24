
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface HeroProps {
  onGetStarted: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        {/* Hero Header */}
        <div className="space-y-6">
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 px-4 py-2">
            🚀 AI-Powered Meal Planning
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Save Money & Time on
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent block">
              Weekly Groceries
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            AI creates personalized meal plans, compares prices across supermarkets, and optimizes your shopping list to save you £50+ every week.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-lg px-8 py-6 h-auto"
            onClick={onGetStarted}
          >
            Start Free Trial →
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
            Watch Demo
          </Button>
        </div>

        {/* Social Proof */}
        <div className="pt-8">
          <p className="text-sm text-gray-500 mb-4">Trusted by 10,000+ families across the UK</p>
          <div className="flex justify-center items-center flex-wrap gap-6 opacity-60">
            <span className="text-2xl">🛒 Tesco</span>
            <span className="text-2xl">🛍️ Sainsbury's</span>
            <span className="text-2xl">🏪 Asda</span>
            <span className="text-2xl">🥬 Morrisons</span>
            <span className="text-2xl">🌟 Waitrose</span>
            <span className="text-2xl">📦 Amazon Fresh</span>
            <span className="text-2xl">🚚 Ocado</span>
            <span className="text-2xl">🛍️ M&S Food</span>
            <span className="text-2xl">🥕 Aldi</span>
            <span className="text-2xl">💝 Lidl</span>
            <span className="text-2xl">🏪 Co-op</span>
            <span className="text-2xl">🌟 Iceland</span>
          </div>
        </div>

        {/* Feature Preview Cards */}
        <div className="grid md:grid-cols-3 gap-6 pt-16">
          <Card className="p-6 border border-emerald-100 bg-emerald-50/50">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="font-semibold text-lg mb-2">AI Recipe Curation</h3>
            <p className="text-gray-600 text-sm">Personalized weekly meal plans matching your dietary preferences and budget</p>
          </Card>
          
          <Card className="p-6 border border-blue-100 bg-blue-50/50">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="font-semibold text-lg mb-2">Smart Price Comparison</h3>
            <p className="text-gray-600 text-sm">Compare prices across all major UK supermarkets and apply loyalty discounts</p>
          </Card>
          
          <Card className="p-6 border border-purple-100 bg-purple-50/50">
            <div className="text-3xl mb-4">📱</div>
            <h3 className="font-semibold text-lg mb-2">One-Click Shopping</h3>
            <p className="text-gray-600 text-sm">Auto-fill baskets and schedule deliveries across multiple stores</p>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-16 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">£50+</div>
            <div className="text-sm text-gray-600">Average Weekly Savings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">2hrs</div>
            <div className="text-sm text-gray-600">Time Saved Per Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">7</div>
            <div className="text-sm text-gray-600">Personalized Recipes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">12</div>
            <div className="text-sm text-gray-600">Connected Stores</div>
          </div>
        </div>
      </div>
    </div>
  );
};
