
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeeklyPlan } from '@/components/WeeklyPlan';
import { ShoppingList } from '@/components/ShoppingList';
import { PriceComparison } from '@/components/PriceComparison';
import { AIAssistant } from '@/components/AIAssistant';

interface MealPlanDashboardProps {
  userProfile: any;
}

export const MealPlanDashboard: React.FC<MealPlanDashboardProps> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('plan');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Dashboard Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userProfile?.name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Your AI-powered meal plan for the week of {new Date().toLocaleDateString('en-GB', { 
                day: 'numeric', 
                month: 'long',
                year: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" className="flex items-center space-x-2">
              <span>🔄</span>
              <span>Regenerate Plan</span>
            </Button>
            <Button className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
              Start Shopping
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <div className="space-y-2">
              <div className="text-2xl">💰</div>
              <div className="text-2xl font-bold text-emerald-700">£12.50</div>
              <div className="text-sm text-emerald-600">Weekly Savings</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="space-y-2">
              <div className="text-2xl">🍽️</div>
              <div className="text-2xl font-bold text-blue-700">7</div>
              <div className="text-sm text-blue-600">Meals Planned</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="space-y-2">
              <div className="text-2xl">📱</div>
              <div className="text-2xl font-bold text-purple-700">3</div>
              <div className="text-sm text-purple-600">Stores Compared</div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="space-y-2">
              <div className="text-2xl">⏱️</div>
              <div className="text-2xl font-bold text-orange-700">2hrs</div>
              <div className="text-sm text-orange-600">Time Saved</div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="plan" className="flex items-center space-x-2">
              <span>📅</span>
              <span>Meal Plan</span>
            </TabsTrigger>
            <TabsTrigger value="shopping" className="flex items-center space-x-2">
              <span>🛒</span>
              <span>Shopping List</span>
            </TabsTrigger>
            <TabsTrigger value="prices" className="flex items-center space-x-2">
              <span>💷</span>
              <span>Price Compare</span>
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center space-x-2">
              <span>🤖</span>
              <span>AI Assistant</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="plan" className="space-y-6">
            <WeeklyPlan userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="shopping" className="space-y-6">
            <ShoppingList userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="prices" className="space-y-6">
            <PriceComparison userProfile={userProfile} />
          </TabsContent>

          <TabsContent value="assistant" className="space-y-6">
            <AIAssistant userProfile={userProfile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
