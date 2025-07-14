import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRealTimePricing } from '@/hooks/useRealTimePricing';
import { BarChart3, TrendingDown, TrendingUp, RefreshCw } from 'lucide-react';

interface PriceComparisonProps {
  userProfile: any;
  generatedData?: any;
  recipes?: any[];
  totalWeeklyCosts?: any;
}

export const PriceComparison: React.FC<PriceComparisonProps> = ({ 
  userProfile, 
  generatedData, 
  recipes = [],
  totalWeeklyCosts 
}) => {
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{name: string; amount: string}>>([]);

  // Extract ingredients from recipes
  const allIngredients = React.useMemo(() => {
    const ingredients: Array<{name: string; amount: string}> = [];
    recipes.forEach(recipe => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name;
          const ingredientAmount = typeof ingredient === 'string' ? '1 unit' : (ingredient.amount || '1 unit');
          if (ingredientName) {
            ingredients.push({ name: ingredientName, amount: ingredientAmount });
          }
        });
      }
    });
    return ingredients.slice(0, 10); // Limit for demo
  }, [recipes]);

  const { pricedIngredients, storeTotals, isLoading, error, refetchPrices } = useRealTimePricing(selectedIngredients);

  const mockStoreTotals: { [key: string]: number } = totalWeeklyCosts || {
    tesco: 47.85,
    sainsburys: 52.30,
    asda: 44.20,
    aldi: 39.95,
    morrisons: 46.75
  };

  const cheapestStore = Object.entries(mockStoreTotals).reduce((min, [store, cost]) => 
    cost < min.cost ? { store, cost } : min, 
    { store: 'aldi', cost: 39.95 }
  );

  const handleCompareSelected = () => {
    if (allIngredients.length > 0) {
      setSelectedIngredients(allIngredients);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Live Price Comparison
          </CardTitle>
          <CardDescription>
            Compare prices across different supermarkets for your ingredients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleCompareSelected} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Comparing...' : 'Compare Recipe Prices'}
            </Button>
            <Badge variant="outline" className="px-3 py-1">
              {allIngredients.length} ingredients available
            </Badge>
          </div>

          {/* Store Totals Comparison */}
          <Tabs defaultValue="totals" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="totals">Store Totals</TabsTrigger>
              <TabsTrigger value="details">Item Details</TabsTrigger>
            </TabsList>

            <TabsContent value="totals" className="space-y-4">
              <div className="grid gap-4">
                {Object.entries(mockStoreTotals).map(([store, total]) => {
                  const savings = total - cheapestStore.cost;
                  const isLowest = store === cheapestStore.store;
                  
                  return (
                    <Card key={store} className={`p-4 ${isLowest ? 'border-green-500 bg-green-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="font-semibold capitalize">{store}</div>
                          {isLowest && <Badge className="bg-green-500">Cheapest</Badge>}
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold">£{total.toFixed(2)}</div>
                          {!isLowest && (
                            <div className="text-sm text-red-600 flex items-center">
                              <TrendingUp className="h-3 w-3 mr-1" />
                              +£{savings.toFixed(2)}
                            </div>
                          )}
                          {isLowest && (
                            <div className="text-sm text-green-600 flex items-center">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              Best value
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              {isLoading && (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p>Fetching real-time prices...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8 text-red-600">
                  <p>Error fetching prices: {error}</p>
                  <Button onClick={refetchPrices} variant="outline" className="mt-2">
                    Try Again
                  </Button>
                </div>
              )}

              {pricedIngredients.length > 0 && (
                <div className="space-y-3">
                  {pricedIngredients.map((ingredient, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{ingredient.name}</h4>
                          <p className="text-sm text-muted-foreground">{ingredient.amount}</p>
                        </div>
                        {ingredient.bestPrice && (
                          <Badge className="bg-green-500">
                            Best: {ingredient.bestPrice.store} - £{ingredient.bestPrice.price.toFixed(2)}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        {ingredient.prices.map((price, priceIndex) => (
                          <div key={priceIndex} className="flex justify-between p-2 bg-muted rounded">
                            <span className="capitalize">{price.store}</span>
                            <span className="font-medium">£{price.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {selectedIngredients.length === 0 && !isLoading && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Select ingredients to compare prices</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};