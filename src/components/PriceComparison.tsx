import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebhookResponse } from '@/utils/webhookService';
import { useRealTimePricing } from '@/hooks/useRealTimePricing';
import { Loader2 } from 'lucide-react';

interface PriceComparisonProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
  recipes?: any[];
  totalWeeklyCosts?: any;
}

const storeLogos = {
  'tesco': '🔵',
  'sainsburys': '🟠', 
  'asda': '🟢',
  'aldi': '🟣'
};

export const PriceComparison: React.FC<PriceComparisonProps> = ({ 
  userProfile, 
  generatedData, 
  recipes = [],
  totalWeeklyCosts 
}) => {
  const [sortBy, setSortBy] = useState<'price' | 'savings'>('price');

  // Extract ingredients from recipes for real-time pricing
  const ingredients = React.useMemo(() => {
    const allIngredients: Array<{ name: string; amount: string }> = [];
    
    recipes.forEach(recipe => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name;
          const ingredientAmount = typeof ingredient === 'string' ? '1 unit' : (ingredient.amount || '1 unit');
          
          if (ingredientName) {
            // Avoid duplicates and limit to first 10 for performance
            const exists = allIngredients.find(item => item.name.toLowerCase() === ingredientName.toLowerCase());
            if (!exists && allIngredients.length < 10) {
              allIngredients.push({
                name: ingredientName,
                amount: ingredientAmount
              });
            }
          }
        });
      }
    });
    
    return allIngredients;
  }, [recipes]);

  // Use real-time pricing hook
  const { pricedIngredients, storeTotals, isLoading, error, refetchPrices } = useRealTimePricing(ingredients);

  // Convert priced ingredients to comparison format
  const comparisons = React.useMemo(() => {
    return pricedIngredients.map(ingredient => {
      const prices = ingredient.prices.map(priceData => ({
        store: storeLogos[priceData.store as keyof typeof storeLogos] ? 
          priceData.store.charAt(0).toUpperCase() + priceData.store.slice(1) : 
          priceData.store,
        price: priceData.price,
        discount: priceData.price < 3 ? 'Best Price' : null,
        savings: priceData.price < 3 ? 0.50 : 0,
        clubcard: priceData.store === 'tesco',
        url: priceData.url,
        title: priceData.title
      }));

      return {
        item: ingredient.name,
        prices: prices.sort((a, b) => a.price - b.price) // Sort by price
      };
    });
  }, [pricedIngredients]);

  const totalPotentialSavings = React.useMemo(() => {
    return comparisons.reduce((sum, item) => {
      if (item.prices.length === 0) return sum;
      const bestPrice = Math.min(...item.prices.map(p => p.price));
      const worstPrice = Math.max(...item.prices.map(p => p.price));
      return sum + (worstPrice - bestPrice);
    }, 0);
  }, [comparisons]);

  const totalOptimizedCost = React.useMemo(() => {
    // If we have totalWeeklyCosts from the API, use the lowest value
    if (totalWeeklyCosts) {
      const costs = Object.values(totalWeeklyCosts) as number[];
      return Math.min(...costs);
    }
    
    // Otherwise calculate from comparisons
    return comparisons.reduce((sum, item) => {
      if (item.prices.length === 0) return sum;
      const bestPrice = Math.min(...item.prices.map(p => p.price));
      return sum + bestPrice;
    }, 0);
  }, [comparisons, totalWeeklyCosts]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading real-time price comparisons...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Price Comparison Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refetchPrices}>Retry Price Lookup</Button>
          </div>
        </Card>
      </div>
    );
  }

  if (comparisons.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Price Comparison</h2>
            <p className="text-gray-600 mb-4">No ingredients available for price comparison.</p>
            <p className="text-sm text-gray-500">Generate some recipes first to see price comparisons.</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Price Comparison Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Live Price Comparison</h2>
            <p className="text-gray-600 mt-1">
              Real-time prices via Google Shopping for ingredients from your {recipes.length} generated recipes
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">£{totalOptimizedCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Optimized Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">£{totalPotentialSavings.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Live Savings</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Weekly Costs Summary - if available from API */}
      {totalWeeklyCosts && (
        <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50">
          <h3 className="font-semibold text-lg mb-4">API Weekly Cost Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(totalWeeklyCosts).map(([storeName, cost]) => (
              <div key={storeName} className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl mb-2">
                  {storeLogos[storeName as keyof typeof storeLogos] || '🏪'}
                </div>
                <div className="font-medium text-sm capitalize">{storeName}</div>
                <div className="text-lg font-bold text-blue-600 mt-1">
                  £{(cost as number).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'price' | 'savings')}>
          <TabsList>
            <TabsTrigger value="price">Sort by Price</TabsTrigger>
            <TabsTrigger value="savings">Sort by Savings</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetchPrices}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Refreshing...
            </>
          ) : (
            'Refresh Live Prices'
          )}
        </Button>
      </div>

      {/* Price Comparison Items */}
      <div className="space-y-6">
        {comparisons.map((comparison, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{comparison.item}</h3>
                <Badge variant="outline">
                  Best: {comparison.prices.length > 0 ? comparison.prices[0].store : 'N/A'}
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {comparison.prices
                  .sort((a, b) => sortBy === 'price' 
                    ? a.price - b.price
                    : b.savings - a.savings
                  )
                  .map((store, storeIndex) => {
                    const isBest = storeIndex === 0 && sortBy === 'price';
                    const storeName = store.store.toLowerCase();
                    
                    return (
                      <div 
                        key={storeIndex}
                        className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                          isBest 
                            ? 'border-green-400 bg-green-50' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">
                            {storeLogos[storeName as keyof typeof storeLogos] || '🏪'}
                          </div>
                          <div>
                            <div className="font-medium">{store.store}</div>
                            {store.title && store.title !== comparison.item && (
                              <div className="text-sm text-gray-600 truncate max-w-[200px]">
                                {store.title}
                              </div>
                            )}
                            {store.clubcard && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Loyalty Member
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-bold ${isBest ? 'text-green-600' : 'text-gray-900'}`}>
                              £{store.price.toFixed(2)}
                            </span>
                            {store.url && (
                              <a 
                                href={store.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700"
                              >
                                🔗
                              </a>
                            )}
                          </div>
                          
                          {store.discount && (
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                {store.discount}
                              </Badge>
                            </div>
                          )}
                          
                          <div className="text-xs text-gray-500 mt-1">
                            Live via Google Shopping
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Live Price Optimization Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {Object.keys(storeTotals).length || 4}
              </div>
              <div className="text-sm text-gray-600">Stores compared</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {totalPotentialSavings > 0 ? 
                  ((totalPotentialSavings / (totalOptimizedCost + totalPotentialSavings)) * 100).toFixed(0) : 
                  '0'
                }%
              </div>
              <div className="text-sm text-gray-600">Live savings</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">£{totalOptimizedCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Optimized cost</div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
              Apply Live Price Shopping Route
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
