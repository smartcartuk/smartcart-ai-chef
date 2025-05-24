
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface WeeklyPlanProps {
  userProfile: any;
}

const mockMeals = [
  {
    id: 1,
    day: 'Monday',
    name: 'Mediterranean Salmon Bowl',
    image: '🐟',
    cookTime: '25 min',
    difficulty: 'Easy',
    calories: 420,
    cost: 8.50,
    tags: ['Healthy', 'High Protein', 'Omega-3'],
    description: 'Fresh salmon with quinoa, cherry tomatoes, cucumber, and tahini dressing'
  },
  {
    id: 2,
    day: 'Tuesday', 
    name: 'Thai Green Curry',
    image: '🍛',
    cookTime: '30 min',
    difficulty: 'Medium',
    calories: 380,
    cost: 6.75,
    tags: ['Vegan', 'Spicy', 'Coconut'],
    description: 'Aromatic curry with seasonal vegetables and jasmine rice'
  },
  {
    id: 3,
    day: 'Wednesday',
    name: 'Classic Beef Lasagne', 
    image: '🍝',
    cookTime: '45 min',
    difficulty: 'Medium',
    calories: 520,
    cost: 9.20,
    tags: ['Comfort Food', 'Family Favorite'],
    description: 'Layers of pasta, rich meat sauce, and creamy bechamel'
  },
  {
    id: 4,
    day: 'Thursday',
    name: 'Lemon Herb Chicken',
    image: '🍗',
    cookTime: '35 min', 
    difficulty: 'Easy',
    calories: 340,
    cost: 7.30,
    tags: ['Gluten-Free', 'Low Carb'],
    description: 'Roasted chicken breast with roasted vegetables and herbs'
  },
  {
    id: 5,
    day: 'Friday',
    name: 'Mushroom Risotto',
    image: '🍄',
    cookTime: '40 min',
    difficulty: 'Medium',
    calories: 460,
    cost: 5.90,
    tags: ['Vegetarian', 'Creamy', 'Comfort'],
    description: 'Creamy arborio rice with wild mushrooms and parmesan'
  },
  {
    id: 6,
    day: 'Saturday',
    name: 'Fish & Chips',
    image: '🍟',
    cookTime: '25 min',
    difficulty: 'Easy',
    calories: 580,
    cost: 8.80,
    tags: ['Weekend Treat', 'British Classic'],
    description: 'Beer-battered cod with triple-cooked chips and mushy peas'
  },
  {
    id: 7,
    day: 'Sunday',
    name: 'Roast Beef Sunday Dinner',
    image: '🥩',
    cookTime: '90 min',
    difficulty: 'Hard',
    calories: 650,
    cost: 12.40,
    tags: ['Sunday Roast', 'Family Meal'],
    description: 'Slow-roasted beef with Yorkshire pudding and all the trimmings'
  }
];

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({ userProfile }) => {
  const [selectedMeal, setSelectedMeal] = useState<number | null>(null);

  const totalCost = mockMeals.reduce((sum, meal) => sum + meal.cost, 0);
  const avgCalories = Math.round(mockMeals.reduce((sum, meal) => sum + meal.calories, 0) / mockMeals.length);

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">This Week's Meal Plan</h2>
            <p className="text-gray-600 mt-1">
              Personalized for {userProfile?.householdSize || 2} people • {userProfile?.dietaryPreferences?.join(', ') || 'Balanced diet'}
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">£{totalCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{avgCalories}</div>
              <div className="text-sm text-gray-600">Avg Calories</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Meal Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockMeals.map((meal) => (
          <Card 
            key={meal.id}
            className={`p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedMeal === meal.id ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedMeal(selectedMeal === meal.id ? null : meal.id)}
          >
            <div className="space-y-4">
              {/* Meal Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-4xl">{meal.image}</div>
                  <div>
                    <Badge variant="outline" className="text-xs mb-2">
                      {meal.day}
                    </Badge>
                    <h3 className="font-bold text-lg text-gray-900">{meal.name}</h3>
                    <p className="text-sm text-gray-600">{meal.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600">£{meal.cost.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{meal.calories} cal</div>
                </div>
              </div>

              {/* Meal Details */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>⏱️ {meal.cookTime}</span>
                  <span>👨‍🍳 {meal.difficulty}</span>
                </div>
                <div className="flex space-x-1">
                  {meal.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Expanded Details */}
              {selectedMeal === meal.id && (
                <div className="pt-4 border-t border-gray-100 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" size="sm" className="w-full">
                      View Recipe
                    </Button>
                    <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-blue-600">
                      Swap Meal
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">All Tags:</h4>
                    <div className="flex flex-wrap gap-1">
                      {meal.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Weekly Summary */}
      <Card className="p-6 bg-white border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h3 className="font-semibold text-lg">Weekly Summary</h3>
            <p className="text-gray-600 text-sm">
              Based on your preferences and connected store discounts
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-sm text-gray-600">vs. Last Week</div>
              <div className="text-lg font-bold text-green-600">-£4.20</div>
            </div>
            <Button className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
              Generate Shopping List
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
