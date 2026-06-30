import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, Truck, ClipboardList, Share2 } from 'lucide-react';

interface FulfilmentOptionsProps {
  cheapestStore: string | null;
  cheapestPrice: string;
  onCheckout: (store: string) => void;
  onCourierDelivery: () => void;
  onExportList: (format: 'reminders' | 'pdf' | 'clipboard') => void;
  isCheckoutLoading?: boolean;
}

export const FulfilmentOptions: React.FC<FulfilmentOptionsProps> = ({
  cheapestStore,
  cheapestPrice,
  onCheckout,
  onCourierDelivery,
  onExportList,
  isCheckoutLoading,
}) => {
  const storeName = cheapestStore === 'sainsburys' ? "Sainsbury's"
    : cheapestStore ? cheapestStore.charAt(0).toUpperCase() + cheapestStore.slice(1)
    : 'store';

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        How do you want to shop?
      </h3>

      <div className="space-y-2">
        {/* Primary: Checkout at cheapest store */}
        <Button
          className="w-full h-auto p-4 justify-start text-left"
          onClick={() => cheapestStore && onCheckout(cheapestStore)}
          disabled={!cheapestStore || isCheckoutLoading}
        >
          <ExternalLink className="h-5 w-5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">
              Checkout at {storeName} — £{cheapestPrice}
            </p>
            <p className="text-xs font-normal text-primary-foreground/70">
              Opens {storeName} with your basket pre-filled
            </p>
          </div>
        </Button>

        {/* Secondary: Uber courier */}
        <Button
          variant="outline"
          className="w-full h-auto p-4 justify-start text-left"
          onClick={onCourierDelivery}
        >
          <Truck className="h-5 w-5 mr-3 flex-shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Get it delivered — est. £4.99
            </p>
            <p className="text-xs text-muted-foreground">
              Uber courier shops and delivers in ~2 hours
            </p>
          </div>
        </Button>

        {/* Tertiary: Self-shop export */}
        <Button
          variant="outline"
          className="w-full h-auto p-4 justify-start text-left"
          onClick={() => onExportList('reminders')}
        >
          <ClipboardList className="h-5 w-5 mr-3 flex-shrink-0 text-muted-foreground" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Shop in-store
            </p>
            <p className="text-xs text-muted-foreground">
              Export to Apple Reminders, download PDF, or copy list
            </p>
          </div>
        </Button>
      </div>
    </section>
  );
};
