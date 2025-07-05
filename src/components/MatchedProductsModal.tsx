
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MatchedProductDisplay } from './MatchedProductDisplay';
import { ExternalLink } from 'lucide-react';

interface MatchedProduct {
  title: string;
  price: string;
  source: string;
  url?: string;
}

interface BasketItemResponse {
  name: string;
  quantity: number;
  matched_product?: MatchedProduct;
}

interface MatchedProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToBasket: () => void;
  items: BasketItemResponse[];
  basketUrl?: string;
  supermarket: string;
}

export const MatchedProductsModal: React.FC<MatchedProductsModalProps> = ({
  isOpen,
  onClose,
  onProceedToBasket,
  items,
  basketUrl,
  supermarket
}) => {
  const matchedCount = items.filter(item => item.matched_product).length;
  const totalItems = items.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Product Matches Found
            <span className="text-sm font-normal text-gray-600">
              ({matchedCount}/{totalItems} items matched)
            </span>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96 pr-4">
          <div className="space-y-3">
            {items.map((item, index) => (
              <MatchedProductDisplay
                key={index}
                originalItem={{
                  name: item.name,
                  quantity: item.quantity.toString()
                }}
                matchedProduct={item.matched_product}
              />
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {matchedCount > 0 ? (
              <span>✅ {matchedCount} products found and ready to add</span>
            ) : (
              <span>⚠️ No product matches found - items will be added by name</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {basketUrl ? (
              <Button onClick={onProceedToBasket} className="bg-green-600 hover:bg-green-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                Continue to {supermarket.charAt(0).toUpperCase() + supermarket.slice(1)}
              </Button>
            ) : (
              <Button onClick={onProceedToBasket}>
                Proceed with Shopping
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
