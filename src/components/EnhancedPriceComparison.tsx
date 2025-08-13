import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Zap, ShoppingCart, Eye } from "lucide-react";
import { useRealTimePricing } from "@/hooks/useRealTimePricing";
import { getPriceTrends, RealTimePrice, PriceTrend } from "@/utils/enhancedPriceService";
import { toast } from "sonner";

interface EnhancedPriceComparisonProps {
  userProfile: any;
  recipes: Array<{
    recipe_name: string;
    ingredients: Array<{ name: string; amount: string }> | string[];
  }>;
  totalWeeklyCosts?: { [store: string]: number };
}

export const EnhancedPriceComparison: React.FC<EnhancedPriceComparisonProps> = ({
  userProfile,
  recipes,
  totalWeeklyCosts
}) => {
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{ name: string; amount: string }>>([]);
  const [showTrends, setShowTrends] = useState<{ [key: string]: boolean }>({});
  const [trends, setTrends] = useState<{ [key: string]: PriceTrend[] }>({});
  const [isComparingPrices, setIsComparingPrices] = useState(false);

  // Extract all ingredients from recipes
  const allIngredients = React.useMemo(() => {
    const ingredients: Array<{ name: string; amount: string }> = [];
    
    recipes.forEach(recipe => {
      if (recipe.ingredients) {
        recipe.ingredients.forEach((ingredient: any) => {
          if (typeof ingredient === 'string') {
            ingredients.push({ name: ingredient, amount: '1' });
          } else if (ingredient.name) {
            ingredients.push({ 
              name: ingredient.name, 
              amount: ingredient.amount || '1' 
            });
          }
        });
      }
    });
    
    // Remove duplicates
    const uniqueIngredients = ingredients.filter((item, index, self) => 
      index === self.findIndex(t => t.name === item.name)
    );
    
    return uniqueIngredients.slice(0, 20); // Limit to 20 for performance
  }, [recipes]);

  const {
    pricedIngredients,
    storeTotals,
    isLoading,
    error,
    refetchPrices
  } = useRealTimePricing(selectedIngredients);

  const handleStartComparison = async () => {
    if (allIngredients.length === 0) {
      toast.error("No ingredients found in recipes");
      return;
    }

    setIsComparingPrices(true);
    setSelectedIngredients(allIngredients);
    
    toast.success(`Starting price comparison for ${allIngredients.length} ingredients`);
  };

  const handleShowTrends = async (ingredientName: string, storeName: string) => {
    const key = `${ingredientName}-${storeName}`;
    
    if (showTrends[key]) {
      setShowTrends(prev => ({ ...prev, [key]: false }));
      return;
    }

    try {
      const trendData = await getPriceTrends(ingredientName, storeName, 30);
      setTrends(prev => ({ ...prev, [key]: trendData }));
      setShowTrends(prev => ({ ...prev, [key]: true }));
    } catch (error) {
      console.error('Error fetching trends:', error);
      toast.error('Failed to load price trends');
    }
  };

  const getBestStoreForIngredient = (prices: RealTimePrice[]) => {
    if (!prices || prices.length === 0) return null;
    return prices.reduce((best, current) => 
      current.price < best.price ? current : best
    );
  };

  const getCheapestStore = () => {
    if (!storeTotals || Object.keys(storeTotals).length === 0) return null;
    return Object.entries(storeTotals).reduce((cheapest, [store, total]) => 
      total < cheapest[1] ? [store, total] : cheapest
    );
  };

  const formatPrice = (price: number) => `£${price.toFixed(2)}`;

  const cheapestStore = getCheapestStore();

  return (
    <Card className="w-full shadow-xl border-emerald-100">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-emerald-100">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-emerald-800">Enhanced Price Comparison</CardTitle>
        </div>
        <CardDescription className="text-emerald-700">
          Real-time price tracking with trend analysis across {allIngredients.length} ingredients
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {!isComparingPrices ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-16 w-16 mx-auto text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Compare Prices</h3>
            <p className="text-muted-foreground mb-6">
              Compare prices for {allIngredients.length} ingredients across all major supermarkets
            </p>
            <Button 
              onClick={handleStartComparison}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
              disabled={allIngredients.length === 0}
            >
              <Zap className="mr-2 h-4 w-4" />
              Start Enhanced Price Comparison
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="totals" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="totals">Store Totals</TabsTrigger>
              <TabsTrigger value="ingredients">Ingredient Details</TabsTrigger>
              <TabsTrigger value="trends">Price Trends</TabsTrigger>
            </TabsList>

            <TabsContent value="totals" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-500 mb-4">{error}</p>
                  <Button onClick={refetchPrices} variant="outline">
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(storeTotals).map(([store, total]) => (
                    <Card key={store} className={`transition-all duration-200 ${
                      cheapestStore && cheapestStore[0] === store 
                        ? 'border-emerald-500 bg-emerald-50' 
                        : 'hover:shadow-md'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="capitalize font-semibold text-lg">
                              {store}
                            </div>
                            {cheapestStore && cheapestStore[0] === store && (
                              <Badge className="bg-emerald-500">
                                <TrendingDown className="mr-1 h-3 w-3" />
                                Cheapest
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">
                              {formatPrice(total)}
                            </div>
                            {cheapestStore && cheapestStore[0] !== store && (
                              <div className="text-sm text-red-500">
                                +{formatPrice(total - cheapestStore[1])} more
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ingredients" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {pricedIngredients.map((ingredient, index) => {
                    const bestPrice = getBestStoreForIngredient(ingredient.prices);
                    
                    return (
                      <Card key={index} className="transition-all duration-200 hover:shadow-md">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold capitalize">{ingredient.name}</h4>
                              <p className="text-sm text-muted-foreground">Quantity: {ingredient.amount}</p>
                            </div>
                            {bestPrice && (
                              <Badge className="bg-emerald-500">
                                Best: {formatPrice(bestPrice.price)} at {bestPrice.store}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {ingredient.prices.map((price, priceIndex) => (
                              <div 
                                key={priceIndex}
                                className={`p-3 rounded-lg text-center ${
                                  bestPrice && price.store === bestPrice.store
                                    ? 'bg-emerald-100 border-emerald-300 border'
                                    : 'bg-gray-50'
                                }`}
                              >
                                <div className="text-sm font-medium capitalize">{price.store}</div>
                                <div className="text-lg font-bold">{formatPrice(price.price)}</div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-1 p-1 h-6"
                                  onClick={() => handleShowTrends(ingredient.name, price.store)}
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="trends" className="space-y-4">
              <div className="text-center py-8">
                <TrendingUp className="h-16 w-16 mx-auto text-emerald-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Price Trend Analysis</h3>
                <p className="text-muted-foreground">
                  Click the eye icon on any ingredient price to view historical trends
                </p>
              </div>

              {Object.entries(showTrends).filter(([_, show]) => show).map(([key, _]) => {
                const trendData = trends[key];
                const [ingredientName, storeName] = key.split('-');
                
                return (
                  <Card key={key} className="p-4">
                    <h4 className="font-semibold mb-2 capitalize">
                      {ingredientName} at {storeName}
                    </h4>
                    {trendData && trendData.length > 0 ? (
                      <div className="space-y-2">
                        {trendData.slice(-5).map((trend, index) => (
                          <div key={index} className="flex justify-between">
                            <span className="text-sm text-muted-foreground">
                              {new Date(trend.recordedAt).toLocaleDateString()}
                            </span>
                            <span className="font-medium">{formatPrice(trend.price)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No historical data available</p>
                    )}
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};