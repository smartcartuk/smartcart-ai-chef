
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShoppingCart } from 'lucide-react';

interface MatchedProduct {
  title: string;
  price: string;
  source: string;
  url?: string;
  image?: string;
}

interface MatchedProductDisplayProps {
  originalItem: {
    name: string;
    quantity: string;
  };
  matchedProduct?: MatchedProduct;
  onReplace?: (newProduct: MatchedProduct) => void;
}

export const MatchedProductDisplay: React.FC<MatchedProductDisplayProps> = ({
  originalItem,
  matchedProduct,
  onReplace
}) => {
  if (!matchedProduct) {
    // Fallback display for items without matches
    return (
      <Card className="p-4 border-dashed border-gray-300">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-700">{originalItem.name}</div>
            <div className="text-sm text-gray-500">Quantity: {originalItem.quantity}</div>
            <Badge variant="outline" className="mt-1 text-xs">
              No match found
            </Badge>
          </div>
          <div className="text-gray-400">
            <ShoppingCart className="w-5 h-5" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 border-green-200 bg-green-50">
      <div className="flex items-center gap-4">
        {matchedProduct.image && (
          <img 
            src={matchedProduct.image} 
            alt={matchedProduct.title}
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        
        <div className="flex-1">
          <div className="font-medium text-green-800">
            {matchedProduct.url ? (
              <a 
                href={matchedProduct.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:underline flex items-center gap-1"
              >
                {matchedProduct.title}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              matchedProduct.title
            )}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Original: {originalItem.name} (Qty: {originalItem.quantity})
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-green-100 text-green-700">
              {matchedProduct.price}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {matchedProduct.source}
            </Badge>
          </div>
        </div>
        
        <div className="text-green-600">
          <ShoppingCart className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
};
