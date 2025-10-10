
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PriceComparisonSectionProps {
  selectedIngredientsCount: number;
  isComparingPrices: boolean;
  priceComparisonResult: any;
  onCompareSelectedPrices: () => void;
}

export const PriceComparisonSection: React.FC<PriceComparisonSectionProps> = ({
  selectedIngredientsCount,
  isComparingPrices,
  priceComparisonResult,
  onCompareSelectedPrices
}) => {
  if (selectedIngredientsCount === 0 && !priceComparisonResult) {
    return null;
  }

  return (
    <>
      {/* Price Comparison Section */}
      {selectedIngredientsCount > 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h3 className="font-semibold text-lg">Ready to Compare Prices?</h3>
              <p className="text-gray-600">
                You have {selectedIngredientsCount} ingredients selected from your meal plan
              </p>
            </div>
            <Button 
              onClick={onCompareSelectedPrices}
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
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <h3 className="font-semibold text-lg mb-4">Live Price Comparison Results</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(priceComparisonResult).map(([store, data]: [string, any]) => (
              <Card key={store} className="p-4 hover:shadow-lg transition-shadow">
                <div className="flex flex-col h-full">
                  <h4 className="font-semibold text-base capitalize mb-2 flex items-center justify-between">
                    {store}
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      {data.itemCount} items
                    </span>
                  </h4>
                  
                  <div className="flex-1 mb-3">
                    <div className="text-3xl font-bold text-primary">
                      £{data.total.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total basket cost
                    </p>
                  </div>

                  {data.items.length > 0 && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      <p className="font-medium mb-1">Sample items:</p>
                      <ul className="space-y-1">
                        {data.items.slice(0, 2).map((item: any, idx: number) => (
                          <li key={idx} className="truncate">
                            {item.ingredient}: £{item.price.toFixed(2)}
                          </li>
                        ))}
                        {data.items.length > 2 && (
                          <li className="text-primary">+{data.items.length - 2} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground mt-4 text-center">
            ✨ Live prices from RapidAPI • Select your preferred supermarket to continue
          </p>
        </Card>
      )}
    </>
  );
};
