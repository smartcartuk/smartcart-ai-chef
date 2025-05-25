
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

export const PriceResults: React.FC<PriceResultsProps> = ({ userProfile }) => {
  const [priceData, setPriceData] = useState<PriceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ingredientInput, setIngredientInput] = useState("pasta, onion, chopped tomatoes");

  const fetchPrices = async () => {
    const ingredients = ingredientInput.split(",").map(x => x.trim()).filter(x => x.length > 0);
    
    if (ingredients.length === 0) {
      setError("Please enter at least one ingredient");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch("https://proj3cts.app.n8n.cloud/webhook-test/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: `user_${Date.now()}`,
          ingredients: ingredients,
          userProfile: userProfile
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Prices returned from n8n:", data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setPriceData(data);
      } else if (data.priceComparisons) {
        // Convert price comparisons to simple format
        const prices = data.priceComparisons.flatMap((item: any) =>
          item.prices.map((price: any) => ({
            ingredient: item.item,
            product_name: item.item,
            price: price.price,
            store: price.store
          }))
        );
        setPriceData(prices);
      } else {
        setPriceData([]);
      }
    } catch (err) {
      console.error("Error fetching prices:", err);
      setError(err instanceof Error ? err.message : "Could not fetch prices. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Meal Plan Prices</h3>
        </div>

        <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
          <div>
            <Label htmlFor="ingredient-input" className="text-sm font-medium">
              Enter your ingredients (comma separated):
            </Label>
            <Input
              id="ingredient-input"
              type="text"
              placeholder="e.g. pasta, onion, tomato"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              className="mt-2"
            />
          </div>
          <Button 
            onClick={fetchPrices} 
            disabled={isLoading}
            className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading prices, please wait...
              </>
            ) : (
              "Get Prices"
            )}
          </Button>
        </div>

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
                <p className="text-sm mt-1">Enter ingredients above and click "Get Prices" to fetch current prices</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
