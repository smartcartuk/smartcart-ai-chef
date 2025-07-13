
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface TestUserProfile {
  name: string;
  dietaryPreferences: string[];
  allergies: string[];
  householdSize: number;
  weeklyBudget: number;
  address: {
    postcode: string;
    city: string;
    country: string;
  };
  connectedStores: Array<{
    name: string;
    credentials: {
      loyaltyCard: string;
    };
  }>;
}

export const WeeklyPlanTester: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Sample test user profile with dietary preferences and allergies
  const testUserProfile: TestUserProfile = {
    name: 'Test User',
    dietaryPreferences: ['vegetarian', 'low-carb'],
    allergies: ['nuts', 'dairy'],
    householdSize: 2,
    weeklyBudget: 60,
    address: {
      postcode: 'SW1A 1AA',
      city: 'London',
      country: 'UK'
    },
    connectedStores: [
      { name: 'Tesco', credentials: { loyaltyCard: 'yes' } },
      { name: 'Sainsburys', credentials: { loyaltyCard: 'no' } },
      { name: 'Asda', credentials: { loyaltyCard: 'yes' } },
      { name: 'Aldi', credentials: { loyaltyCard: 'no' } }
    ]
  };

  const testMealPlanGeneration = async () => {
    setIsLoading(true);
    setError(null);
    setTestResults(null);

    try {
      console.log('🧪 Testing meal plan generation with profile:', testUserProfile);
      
      const startTime = Date.now();
      
      // Call the Supabase Edge Function
      const { data, error: supabaseError } = await supabase.functions.invoke('proxy-generate-recipes', {
        body: {
          userProfile: testUserProfile,
          preferences: `vegetarian low-carb meals for 2 people, budget £60/week, allergic to nuts and dairy`
        }
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (supabaseError) {
        throw new Error(`Supabase Edge Function Error: ${supabaseError.message}`);
      }

      console.log('✅ Raw API Response:', data);
      console.log(`⏱️ API Response Time: ${duration}ms`);

      // Validate the response structure
      const validationResults = validateMealPlanResponse(data);
      
      setTestResults({
        success: true,
        data,
        duration,
        validation: validationResults,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Test Completed Successfully! 🎉",
        description: `Generated ${data?.meals?.length || 0} meals in ${duration}ms`,
      });

    } catch (err) {
      console.error('❌ Test Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      toast({
        title: "Test Failed ❌",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateMealPlanResponse = (data: any) => {
    const results = {
      hasMealsArray: Boolean(data?.meals && Array.isArray(data.meals)),
      mealCount: data?.meals?.length || 0,
      hasWeekCosts: Boolean(data?.total_week_cost),
      supermarketPricing: {} as Record<string, boolean>,
      ingredientPricing: {} as Record<string, number>,
      missingFields: [] as string[]
    };

    // Check if we have meals
    if (!results.hasMealsArray) {
      results.missingFields.push('meals array');
      return results;
    }

    // Check supermarket pricing coverage
    const expectedSupermarkets = ['tesco', 'sainsburys', 'asda', 'aldi'];
    expectedSupermarkets.forEach(supermarket => {
      results.supermarketPricing[supermarket] = Boolean(data.total_week_cost?.[supermarket]);
    });

    // Check individual meal structure and ingredient pricing
    data.meals.forEach((meal: any, index: number) => {
      const mealNum = index + 1;
      
      // Check required meal fields
      const requiredFields = ['day', 'recipe_name', 'ingredients', 'instructions', 'cost_by_supermarket'];
      requiredFields.forEach(field => {
        if (!meal[field]) {
          results.missingFields.push(`meal ${mealNum}.${field}`);
        }
      });

      // Check ingredient pricing structure
      if (meal.ingredients && Array.isArray(meal.ingredients)) {
        meal.ingredients.forEach((ingredient: any, ingIndex: number) => {
          if (ingredient.prices) {
            expectedSupermarkets.forEach(supermarket => {
              if (ingredient.prices[supermarket]?.price) {
                results.ingredientPricing[`${meal.day}_ingredient_${ingIndex}_${supermarket}`] = ingredient.prices[supermarket].price;
              }
            });
          }
        });
      }
    });

    return results;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">🧪 Meal Plan API Integration Tester</h3>
            <p className="text-gray-600 mt-2">
              Test the updated Spoonacular + SerpApi integration with real user preferences
            </p>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-800 mb-2">Test User Profile:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Dietary Preferences:</strong> {testUserProfile.dietaryPreferences.join(', ')}
              </div>
              <div>
                <strong>Allergies:</strong> {testUserProfile.allergies.join(', ')}
              </div>
              <div>
                <strong>Household Size:</strong> {testUserProfile.householdSize} people
              </div>
              <div>
                <strong>Weekly Budget:</strong> £{testUserProfile.weeklyBudget}
              </div>
            </div>
          </div>

          <Button 
            onClick={testMealPlanGeneration}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Testing API Integration...
              </>
            ) : (
              '🚀 Test Meal Plan Generation'
            )}
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="space-y-2">
            <h4 className="font-semibold text-red-800">❌ Test Failed</h4>
            <p className="text-red-700">{error}</p>
            <details className="text-sm text-red-600">
              <summary className="cursor-pointer">Show debugging tips</summary>
              <div className="mt-2 space-y-1">
                <p>• Check if your Vercel deployment is successful</p>
                <p>• Verify SPOONACULAR_API_KEY and SERPAPI_KEY environment variables are set</p>
                <p>• Check Vercel function logs for detailed error messages</p>
                <p>• Ensure your API is not hitting rate limits</p>
              </div>
            </details>
          </div>
        </Card>
      )}

      {testResults && (
        <Card className="p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-100 text-green-700">✅ Test Successful</Badge>
            <Badge variant="outline">
              Response Time: {testResults.duration}ms
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Validation Results */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">📊 Validation Results</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Meals Generated:</span>
                  <Badge variant={testResults.validation.mealCount === 7 ? "default" : "destructive"}>
                    {testResults.validation.mealCount}/7
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Has Week Costs:</span>
                  <Badge variant={testResults.validation.hasWeekCosts ? "default" : "destructive"}>
                    {testResults.validation.hasWeekCosts ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <span className="font-medium">Supermarket Pricing:</span>
                  {Object.entries(testResults.validation.supermarketPricing).map(([store, hasPricing]) => (
                    <div key={store} className="flex justify-between pl-4">
                      <span className="capitalize">{store}:</span>
                      <Badge variant={hasPricing ? "default" : "destructive"} className="text-xs">
                        {hasPricing ? '✅' : '❌'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sample Data Preview */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-800">🍽️ Sample Meal Data</h4>
              {testResults.data?.meals?.[0] && (
                <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                  <div><strong>Day:</strong> {testResults.data.meals[0].day}</div>
                  <div><strong>Recipe:</strong> {testResults.data.meals[0].recipe_name}</div>
                  <div><strong>Ingredients:</strong> {testResults.data.meals[0].ingredients?.length || 0}</div>
                  {testResults.data.meals[0].cost_by_supermarket && (
                    <div className="space-y-1">
                      <strong>Costs:</strong>
                      {Object.entries(testResults.data.meals[0].cost_by_supermarket).map(([store, cost]) => (
                        <div key={store} className="pl-2 text-xs">
                          {store}: £{Number(cost).toFixed(2)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Total Week Costs */}
          {testResults.data?.total_week_cost && (
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-800">💰 Total Week Costs</h4>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(testResults.data.total_week_cost).map(([store, cost]) => (
                  <div key={store} className="bg-gray-50 p-2 rounded text-center">
                    <div className="text-xs text-gray-600 capitalize">{store}</div>
                    <div className="font-semibold text-green-700">£{Number(cost).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Fields Warning */}
          {testResults.validation.missingFields.length > 0 && (
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <h4 className="font-semibold text-yellow-800">⚠️ Missing Fields</h4>
              <ul className="text-sm text-yellow-700 mt-1">
                {testResults.validation.missingFields.map((field, index) => (
                  <li key={index}>• {field}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw Data Preview */}
          <details className="space-y-2">
            <summary className="cursor-pointer font-semibold text-gray-800">🔍 View Raw API Response</summary>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-60">
              {JSON.stringify(testResults.data, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
};
