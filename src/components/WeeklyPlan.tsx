
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { WebhookResponse } from '@/utils/webhookService';

interface WeeklyPlanProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
}

interface Recipe {
  day: string;
  recipe_name: string;
  ingredients: string[];
  instructions: string;
  image?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({ userProfile, generatedData }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [expandedRecipes, setExpandedRecipes] = useState<Set<number>>(new Set());
  const [isComparingPrices, setIsComparingPrices] = useState(false);
  const [priceComparisonResult, setPriceComparisonResult] = useState<any>(null);

  const fetchWeeklyRecipes = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const weeklyRecipes: Recipe[] = [];
      
      // Fetch 7 recipes, one for each day
      for (let i = 0; i < DAYS_OF_WEEK.length; i++) {
        const day = DAYS_OF_WEEK[i];
        const response = await fetch('https://proj3cts.app.n8n.cloud/webhook-test/generate-recipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            preferences: `Recipe for ${day}`,
            userProfile: userProfile 
          })
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch recipe for ${day}`);
        }

        const recipeData = await response.json();
        weeklyRecipes.push({
          day,
          recipe_name: recipeData.recipe_name,
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions,
          image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=300&h=200&fit=crop' // Placeholder food image
        });
      }
      
      setRecipes(weeklyRecipes);
    } catch (err) {
      console.error('Error fetching weekly recipes:', err);
      setError('Failed to fetch weekly recipes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyRecipes();
  }, [userProfile]);

  const toggleRecipeDetails = (index: number) => {
    const newExpanded = new Set(expandedRecipes);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRecipes(newExpanded);
  };

  const addToPlan = (recipe: Recipe) => {
    setSelectedIngredients(prev => [...prev, ...recipe.ingredients]);
    console.log(`${recipe.recipe_name} added to plan`);
  };

  const compareSelectedPrices = async () => {
    if (selectedIngredients.length === 0) {
      setError('No ingredients selected. Please add some recipes to your plan first.');
      return;
    }

    setIsComparingPrices(true);
    setError(null);

    try {
      const response = await fetch('https://proj3cts.app.n8n.cloud/webhook-test/compare-prices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients: selectedIngredients })
      });

      if (!response.ok) {
        throw new Error('Failed to compare prices');
      }

      const priceData = await response.json();
      setPriceComparisonResult(priceData);
      console.log('Price comparison result:', priceData);
    } catch (err) {
      console.error('Error comparing prices:', err);
      setError('Failed to compare prices. Please try again.');
    } finally {
      setIsComparingPrices(false);
    }
  };

  const clearSelection = () => {
    setSelectedIngredients([]);
    setPriceComparisonResult(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-lg">Generating your weekly meal plan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI-Generated Weekly Meal Plan</h2>
            <p className="text-gray-600 mt-1">
              Personalized recipes for {userProfile?.householdSize || 2} people
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={fetchWeeklyRecipes} variant="outline">
              Regenerate Plan
            </Button>
            {selectedIngredients.length > 0 && (
              <Button onClick={clearSelection} variant="outline">
                Clear Selection ({selectedIngredients.length} ingredients)
              </Button>
            )}
          </div>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700">⚠️ {error}</p>
        </Card>
      )}

      {/* Recipe Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe, index) => (
          <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video overflow-hidden">
              <img 
                src={recipe.image} 
                alt={recipe.recipe_name}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-4 space-y-3">
              <div>
                <Badge variant="outline" className="mb-2">
                  {recipe.day}
                </Badge>
                <h3 className="font-bold text-lg">{recipe.recipe_name}</h3>
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={() => toggleRecipeDetails(index)}
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  {expandedRecipes.has(index) ? 'Hide Details' : 'View Recipe'}
                </Button>
                <Button 
                  onClick={() => addToPlan(recipe)}
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600"
                >
                  Add to Plan
                </Button>
              </div>

              {expandedRecipes.has(index) && (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Ingredients:</h4>
                    <ul className="text-sm space-y-1">
                      {recipe.ingredients.map((ingredient, idx) => (
                        <li key={idx} className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Instructions:</h4>
                    <p className="text-sm text-gray-600">{recipe.instructions}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Price Comparison Section */}
      {selectedIngredients.length > 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h3 className="font-semibold text-lg">Ready to Compare Prices?</h3>
              <p className="text-gray-600">
                You have {selectedIngredients.length} ingredients selected from your meal plan
              </p>
            </div>
            <Button 
              onClick={compareSelectedPrices}
              disabled={isComparingPrices}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              {isComparingPrices ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Comparing...
                </>
              ) : (
                'Compare Prices for Selected Meals'
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Price Comparison Results */}
      {priceComparisonResult && (
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-lg mb-4">Price Comparison Results</h3>
          <div className="bg-white p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(priceComparisonResult, null, 2)}
            </pre>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Detailed price comparison results displayed above. Integration with store data coming soon!
          </p>
        </Card>
      )}
    </div>
  );
};
