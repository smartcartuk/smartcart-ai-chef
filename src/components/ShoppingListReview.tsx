import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ShoppingCart } from 'lucide-react';
import { useMealSelectionFlow } from '@/hooks/useMealSelectionFlow';

interface ShoppingListReviewProps {
  userProfile: any;
  onComparePrices: () => void;
}

export const ShoppingListReview: React.FC<ShoppingListReviewProps> = ({ 
  userProfile, 
  onComparePrices 
}) => {
  const { shoppingList, loadShoppingList, isLoading, comparePrices } = useMealSelectionFlow(userProfile);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!shoppingList) {
      loadShoppingList();
    } else if (shoppingList?.items) {
      setSelectedItems(new Set(shoppingList.items.map((item: any) => item.name || item)));
    }
  }, [shoppingList]);

  const handleToggleItem = (item: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item)) {
        newSet.delete(item);
      } else {
        newSet.add(item);
      }
      return newSet;
    });
  };

  const handleComparePrices = async () => {
    await comparePrices(Array.from(selectedItems));
    onComparePrices();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const items = shoppingList?.items || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Review Your Shopping List
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Uncheck items you already have at home
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {items.map((item: any, index: number) => {
              const itemName = typeof item === 'string' ? item : item.name;
              return (
                <div key={index} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                  <Checkbox
                    checked={selectedItems.has(itemName)}
                    onCheckedChange={() => handleToggleItem(itemName)}
                  />
                  <label className="flex-1 cursor-pointer">
                    {itemName}
                  </label>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold">{selectedItems.size} items selected</p>
                <p className="text-sm text-muted-foreground">
                  {items.length - selectedItems.size} items unchecked
                </p>
              </div>
              <Button onClick={handleComparePrices} disabled={selectedItems.size === 0}>
                Compare Prices
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
