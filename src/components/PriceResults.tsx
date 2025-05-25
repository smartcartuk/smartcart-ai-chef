
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

  // Example ingredients - you can make this dynamic based on user input
  const ingredients = ["pasta", "onion", "chopped tomatoes"];

  const fetchPrices = async () => {
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
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Meal Plan Prices</h3>
          <Button 
            onClick={fetchPrices} 
            disabled={isLoading}
            className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching Prices...
              </>
            ) : (
              "Get Latest Prices"
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            Ingredients: {ingredients.join(", ")}
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">Error: {error}</p>
          </div>
        )}

        <div className="border border-gray-200 rounded-lg p-4 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="ml-2 text-gray-600">Fetching prices from stores...</span>
            </div>
          ) : priceData.length > 0 ? (
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
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <div className="text-center">
                <p>No price data available</p>
                <p className="text-sm mt-1">Click "Get Latest Prices" to fetch current prices</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
