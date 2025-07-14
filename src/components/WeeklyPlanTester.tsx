import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FlaskConical, Send, Loader2, CheckCircle, XCircle } from 'lucide-react';

export const WeeklyPlanTester: React.FC = () => {
  const [testData, setTestData] = useState({
    name: 'John Doe',
    dietaryPreferences: ['vegetarian'],
    allergies: ['nuts'],
    householdSize: 2,
    weeklyBudget: 50
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing recipe generation with:', testData);
      
      const { data, error } = await supabase.functions.invoke('proxy-generate-recipes', {
        body: {
          userProfile: testData,
          customPrompt: customPrompt || undefined
        }
      });

      if (error) {
        throw new Error(error.message || 'Function invocation failed');
      }

      setResult(data);
      toast({
        title: "Test completed successfully!",
        description: `Generated ${data?.recipes?.length || 0} recipes.`
      });

    } catch (err) {
      console.error('Test error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast({
        title: "Test failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTestData = (field: string, value: any) => {
    setTestData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Recipe Generation API Tester
          </CardTitle>
          <CardDescription>
            Test the AI recipe generation with different parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={testData.name}
                onChange={(e) => updateTestData('name', e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="householdSize">Household Size</Label>
              <Input
                id="householdSize"
                type="number"
                value={testData.householdSize}
                onChange={(e) => updateTestData('householdSize', parseInt(e.target.value) || 2)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="weeklyBudget">Weekly Budget (£)</Label>
              <Input
                id="weeklyBudget"
                type="number"
                value={testData.weeklyBudget}
                onChange={(e) => updateTestData('weeklyBudget', parseInt(e.target.value) || 50)}
              />
            </div>

            <div className="space-y-2">
              <Label>Dietary Preferences</Label>
              <div className="flex flex-wrap gap-2">
                {['vegetarian', 'vegan', 'gluten-free', 'keto', 'mediterranean'].map(pref => (
                  <Badge
                    key={pref}
                    variant={testData.dietaryPreferences.includes(pref) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const newPrefs = testData.dietaryPreferences.includes(pref)
                        ? testData.dietaryPreferences.filter(p => p !== pref)
                        : [...testData.dietaryPreferences, pref];
                      updateTestData('dietaryPreferences', newPrefs);
                    }}
                  >
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="space-y-2">
            <Label htmlFor="customPrompt">Custom Prompt (Optional)</Label>
            <Textarea
              id="customPrompt"
              placeholder="Add any specific requirements or preferences..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
            />
          </div>

          {/* Test Button */}
          <Button 
            onClick={handleTest} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Testing...' : 'Run Test'}
          </Button>

          {/* Results */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Test Failed</span>
                </div>
                <p className="text-red-600 mt-2">{error}</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-green-700 mb-3">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Test Successful</span>
                </div>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Recipes Generated:</span> {result?.recipes?.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Total Cost:</span> £{result?.totalCost?.toFixed(2) || 'N/A'}
                    </div>
                  </div>
                  
                  {result?.recipes && result.recipes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Generated Recipes:</h4>
                      <div className="space-y-2">
                        {result.recipes.slice(0, 3).map((recipe: any, index: number) => (
                          <div key={index} className="p-2 bg-white rounded border">
                            <div className="font-medium">{recipe.recipe_name}</div>
                            <div className="text-sm text-gray-600">
                              {recipe.ingredients?.length || 0} ingredients • 
                              {recipe.cooking_time || 'N/A'} • 
                              £{recipe.cost?.toFixed(2) || 'N/A'}
                            </div>
                          </div>
                        ))}
                        {result.recipes.length > 3 && (
                          <p className="text-sm text-gray-600">
                            ... and {result.recipes.length - 3} more recipes
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};