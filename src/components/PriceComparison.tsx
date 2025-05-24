
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface PriceComparisonProps {
  userProfile: any;
}

const mockComparisons = [
  {
    item: 'Salmon Fillets (4 portions)',
    prices: [
      { store: 'Tesco', price: 12.99, discount: '25% off', savings: 4.33, clubcard: true },
      { store: 'Sainsburys', price: 14.50, discount: 'Nectar offer', savings: 2.00, clubcard: true },
      { store: 'Asda', price: 15.99, discount: null, savings: 0, clubcard: false },
      { store: 'Morrisons', price: 13.75, discount: '£1 off', savings: 1.00, clubcard: false }
    ]
  },
  {
    item: 'Organic Cherry Tomatoes (2 punnets)',
    prices: [
      { store: 'Sainsburys', price: 3.50, discount: null, savings: 0, clubcard: false },
      { store: 'Tesco', price: 4.00, discount: null, savings: 0, clubcard: false },
      { store: 'Asda', price: 3.25, discount: 'Rollback', savings: 0.75, clubcard: false },
      { store: 'Morrisons', price: 3.80, discount: null, savings: 0, clubcard: false }
    ]
  },
  {
    item: 'Arborio Rice (1kg)',
    prices: [
      { store: 'Asda', price: 3.20, discount: null, savings: 0, clubcard: false },
      { store: 'Tesco', price: 3.75, discount: 'Clubcard', savings: 0.50, clubcard: true },
      { store: 'Sainsburys', price: 4.20, discount: null, savings: 0, clubcard: false },
      { store: 'Morrisons', price: 3.60, discount: null, savings: 0, clubcard: false }
    ]
  }
];

const storeLogos = {
  'Tesco': '🔵',
  'Sainsburys': '🟠', 
  'Asda': '🟢',
  'Morrisons': '🟣'
};

export const PriceComparison: React.FC<PriceComparisonProps> = ({ userProfile }) => {
  const [sortBy, setSortBy] = useState<'price' | 'savings'>('price');

  const totalPotentialSavings = mockComparisons.reduce((sum, item) => {
    const bestPrice = Math.min(...item.prices.map(p => p.price - p.savings));
    const worstPrice = Math.max(...item.prices.map(p => p.price));
    return sum + (worstPrice - bestPrice);
  }, 0);

  const totalOptimizedCost = mockComparisons.reduce((sum, item) => {
    const bestPrice = Math.min(...item.prices.map(p => p.price - p.savings));
    return sum + bestPrice;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Price Comparison Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Price Comparison</h2>
            <p className="text-gray-600 mt-1">
              Real-time prices across your connected stores with loyalty discounts applied
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">£{totalOptimizedCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Optimized Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">£{totalPotentialSavings.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Max Savings</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'price' | 'savings')}>
          <TabsList>
            <TabsTrigger value="price">Sort by Price</TabsTrigger>
            <TabsTrigger value="savings">Sort by Savings</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button variant="outline" size="sm">
          Refresh Prices
        </Button>
      </div>

      {/* Price Comparison Items */}
      <div className="space-y-6">
        {mockComparisons.map((comparison, index) => (
          <Card key={index} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{comparison.item}</h3>
                <Badge variant="outline">
                  Best: {comparison.prices.sort((a, b) => (a.price - a.savings) - (b.price - b.savings))[0].store}
                </Badge>
              </div>
              
              <div className="grid gap-4">
                {comparison.prices
                  .sort((a, b) => sortBy === 'price' 
                    ? (a.price - a.savings) - (b.price - b.savings)
                    : b.savings - a.savings
                  )
                  .map((store, storeIndex) => {
                    const finalPrice = store.price - store.savings;
                    const isBest = finalPrice === Math.min(...comparison.prices.map(p => p.price - p.savings));
                    
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
                          <div className="text-2xl">{storeLogos[store.store as keyof typeof storeLogos]}</div>
                          <div>
                            <div className="font-medium">{store.store}</div>
                            {store.clubcard && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                Loyalty Member
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            {store.savings > 0 && (
                              <span className="text-sm text-gray-500 line-through">
                                £{store.price.toFixed(2)}
                              </span>
                            )}
                            <span className={`text-lg font-bold ${isBest ? 'text-green-600' : 'text-gray-900'}`}>
                              £{finalPrice.toFixed(2)}
                            </span>
                          </div>
                          
                          {store.discount && (
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                {store.discount}
                              </Badge>
                              {store.savings > 0 && (
                                <span className="text-xs text-green-600 font-medium">
                                  Save £{store.savings.toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
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
          <h3 className="font-semibold text-lg">Optimization Summary</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">3</div>
              <div className="text-sm text-gray-600">Stores to visit</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">18%</div>
              <div className="text-sm text-gray-600">Total savings</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-2xl font-bold text-purple-600">£{totalOptimizedCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Final cost</div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
              Apply Optimal Shopping Route
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
