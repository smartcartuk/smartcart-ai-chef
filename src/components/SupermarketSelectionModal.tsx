import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, TrendingDown } from 'lucide-react';

interface SupermarketOption {
  name: string;
  totalCost: number;
  itemCount: number;
  savings?: number;
}

interface SupermarketSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  supermarkets: SupermarketOption[];
  onSelectSupermarket: (supermarket: string) => void;
}

export const SupermarketSelectionModal: React.FC<SupermarketSelectionModalProps> = ({
  isOpen,
  onClose,
  supermarkets,
  onSelectSupermarket,
}) => {
  const sortedSupermarkets = [...supermarkets].sort((a, b) => a.totalCost - b.totalCost);
  const cheapestCost = sortedSupermarkets[0]?.totalCost || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Your Preferred Supermarket</DialogTitle>
          <DialogDescription>
            Compare total costs and choose where to shop
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {sortedSupermarkets.map((supermarket, index) => {
            const savings = supermarket.totalCost - cheapestCost;
            const isCheapest = index === 0;

            return (
              <Card
                key={supermarket.name}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  isCheapest ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => onSelectSupermarket(supermarket.name)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold capitalize">
                        {supermarket.name}
                      </h3>
                      {isCheapest && (
                        <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                          Best Value
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {supermarket.itemCount} items available
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      £{supermarket.totalCost.toFixed(2)}
                    </div>
                    {!isCheapest && savings > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <TrendingDown className="w-4 h-4" />
                        +£{savings.toFixed(2)} vs cheapest
                      </div>
                    )}
                    {isCheapest && (
                      <div className="flex items-center gap-1 text-sm text-primary">
                        <Check className="w-4 h-4" />
                        Lowest price
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  className="w-full mt-4"
                  variant={isCheapest ? 'default' : 'outline'}
                >
                  Select {supermarket.name}
                </Button>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
