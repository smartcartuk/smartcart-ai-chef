
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface PriceResultsProps {
  userProfile: any;
}

interface PriceItem {
  ingredient: string;
  product_name: string;
  price: number;
  store?: string;
}

interface ComparisonResult {
  best_single_store: {
    store: string;
    total_cost: number;
    items: Array<{
      ingredient: string;
      price: number;
      product_name: string;
    }>;
  };
  best_split: {
    total_cost: number;
    stores: Array<{
      store: string;
      items: Array<{
        ingredient: string;
        price: number;
        product_name: string;
      }>;
    }>;
  };
}

interface Recipe {
  recipe_name: string;
  ingredients: string[];
  instructions: string;
}

export const PriceResults: React.FC<PriceResultsProps> = ({ userProfile }) => {
  const [priceData, setPriceData] = useState<PriceItem[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipePreference, setRecipePreference] = useState("");

  const generateRecipe = async () => {
    if (!recipePreference.trim()) {
      setError("Please enter what you'd like to cook");
      return;
    }

    setIsLoading(true);
    setError(null);
    setRecipe(null);
    
    try {
      const response = await fetch("https://proj3cts.app.n8n.cloud/webhook-test/generate-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          preferences: recipePreference,
          userProfile: userProfile 
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Recipe generated:", data);
      
      setRecipe(data);
    } catch (err) {
      console.error("Error generating recipe:", err);
      setError("Failed to generate recipe. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const startComparison = async () => {
    if (!recipe?.ingredients) {
      setError("No recipe ingredients available for comparison");
      return;
    }

    await getPriceComparison();
  };

  const getPriceComparison = async () => {
    if (!recipe?.ingredients) {
      setError("No recipe ingredients available for comparison");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("https://proj3cts.app.n8n.cloud/webhook-test/compare-prices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ingredients: recipe.ingredients
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(result);

      if (result && result[0]) {
        setComparisonData(result[0]);
      } else {
        setError("No comparison data available");
      }
    } catch (err) {
      console.error("Error fetching price comparison:", err);
      setError(err instanceof Error ? err.message : "Could not fetch price comparison. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderComparisonResult = (bestSingleStore: ComparisonResult['best_single_store'], bestSplit: ComparisonResult['best_split']) => {
    return (
      <div className="space-y-6">
        {/* Best Single Store */}
        <Card className="p-4 bg-green-50 border-green-200">
          <h4 className="font-semibold text-green-800 mb-3">🏪 Best Single Store Option</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{bestSingleStore.store}</span>
              <span className="text-lg font-bold text-green-600">£{bestSingleStore.total_cost.toFixed(2)}</span>
            </div>
            <ul className="text-sm space-y-1">
              {bestSingleStore.items.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>{item.ingredient} - {item.product_name}</span>
                  <span>£{item.price.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        {/* Best Split Option */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-3">🛒 Best Split Shopping Option</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Cost (Split)</span>
              <span className="text-lg font-bold text-blue-600">£{bestSplit.total_cost.toFixed(2)}</span>
            </div>
            {bestSplit.stores.map((store, storeIndex) => (
              <div key={storeIndex} className="border-l-4 border-blue-300 pl-3">
                <div className="font-medium text-blue-700">{store.store}</div>
                <ul className="text-sm space-y-1 mt-1">
                  {store.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex justify-between">
                      <span>{item.ingredient} - {item.product_name}</span>
                      <span>£{item.price.toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>

        {/* Savings Summary */}
        {bestSingleStore.total_cost !== bestSplit.total_cost && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <h4 className="font-semibold text-yellow-800 mb-2">💰 Savings Summary</h4>
            <p className="text-sm">
              By shopping across multiple stores, you could save{' '}
              <span className="font-bold text-green-600">
                £{(bestSingleStore.total_cost - bestSplit.total_cost).toFixed(2)}
              </span>
            </p>
          </Card>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recipe Generator & Price Comparison</h3>
        </div>

        {/* Recipe Generation Section */}
        <div className="space-y-4 p-4 border border-gray-200 rounded-lg bg-blue-50">
          <div>
            <Label htmlFor="recipe-preference" className="text-sm font-medium">
              What would you like to cook?
            </Label>
            <Input
              id="recipe-preference"
              type="text"
              placeholder="e.g. Vegetarian pasta, Italian dinner, quick breakfast"
              value={recipePreference}
              onChange={(e) => setRecipePreference(e.target.value)}
              className="mt-2"
            />
          </div>
          <Button 
            onClick={generateRecipe} 
            disabled={isLoading}
            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Recipe"
            )}
          </Button>
        </div>

        {/* Generated Recipe Display */}
        {recipe && (
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <h4 className="text-lg font-semibold text-green-800 mb-3">{recipe.recipe_name}</h4>
            <div className="space-y-3">
              <div>
                <strong className="text-green-700">Ingredients:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="text-green-700">{ingredient}</li>
                  ))}
                </ul>
              </div>
              <div>
                <strong className="text-green-700">Instructions:</strong>
                <p className="text-green-700 mt-1">{recipe.instructions}</p>
              </div>
              <Button 
                onClick={startComparison} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                Compare Prices for This Recipe
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">⚠️ {error}</p>
          </div>
        )}

        <div className="border border-gray-200 rounded-lg p-4 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="ml-2 text-gray-600">🔄 Loading prices, please wait...</span>
            </div>
          ) : comparisonData ? (
            renderComparisonResult(comparisonData.best_single_store, comparisonData.best_split)
          ) : priceData.length > 0 ? (
            <div>
              <strong className="block mb-3">Meal Plan Prices:</strong>
              <ul className="space-y-3">
                {priceData.map((item, index) => (
                  <li key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{item.ingredient}</span>
                      <span className="text-gray-600 ml-2">– {item.product_name}</span>
                      {item.store && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {item.store}
                        </Badge>
                      )}
                    </div>
                    <span className="font-semibold text-emerald-600">
                      £{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <p>No price data available</p>
                <p className="text-sm mt-1">Generate a recipe above to start price comparison</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
