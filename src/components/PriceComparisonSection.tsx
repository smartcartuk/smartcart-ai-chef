
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
        <Card className="p-6 bg-green-50 border-green-200">
          <h3 className="font-semibold text-lg mb-4">Price Comparison Results</h3>
          <div className="bg-white p-4 rounded-lg">
            <pre className="text-sm overflow-auto">
              {JSON.stringify(priceComparisonResult, null, 2)}
            </pre>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Detailed price comparison results displayed above. Integration with store data coming soon!
          </p>
        </Card>
      )}
    </>
  );
};
