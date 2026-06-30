import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingDown, ChevronDown } from 'lucide-react';

interface StorePrice {
  store: string;
  totalPounds: string;
  color: string;
  itemCount?: number;
}

interface PriceComparisonBarProps {
  prices: StorePrice[];
  cheapestStore: string | null;
  isLoading?: boolean;
  onSelectStore: (store: string) => void;
}

const STORE_COLORS: Record<string, string> = {
  tesco: '#00539F',
  sainsburys: '#F06C00',
  asda: '#78BE20',
  waitrose: '#006B3A',
  morrisons: '#006836',
};

export const PriceComparisonBar: React.FC<PriceComparisonBarProps> = ({
  prices,
  cheapestStore,
  isLoading,
  onSelectStore,
}) => {
  if (isLoading) {
    return (
      <section className="space-y-3">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Price comparison
        </h3>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </section>
    );
  }

  if (prices.length === 0) return null;

  const sorted = [...prices].sort((a, b) => parseFloat(a.totalPounds) - parseFloat(b.totalPounds));
  const maxPrice = Math.max(...sorted.map(p => parseFloat(p.totalPounds)));
  const cheapestPrice = parseFloat(sorted[0]?.totalPounds || '0');
  const secondPrice = parseFloat(sorted[1]?.totalPounds || '0');
  const savings = (secondPrice - cheapestPrice).toFixed(2);
  const annualSavings = ((secondPrice - cheapestPrice) * 52).toFixed(0);

  return (
    <section className="space-y-4">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <TrendingDown className="h-3.5 w-3.5" />
        Price comparison
      </h3>

      <div className="space-y-2">
        {sorted.map((store, i) => {
          const price = parseFloat(store.totalPounds);
          const width = maxPrice > 0 ? (price / maxPrice) * 100 : 0;
          const isWinner = i === 0;
          const storeColor = STORE_COLORS[store.store] || '#6B7280';

          return (
            <button
              key={store.store}
              onClick={() => onSelectStore(store.store)}
              className="w-full flex items-center gap-3 group"
            >
              <span className="text-xs font-medium w-[85px] text-right text-foreground capitalize">
                {store.store === 'sainsburys' ? "Sainsbury's" : store.store}
              </span>
              <div className="flex-1 h-8 bg-muted/50 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg flex items-center px-3 transition-all duration-500 group-hover:opacity-90"
                  style={{
                    width: `${Math.max(width, 25)}%`,
                    backgroundColor: isWinner ? 'hsl(var(--primary))' : storeColor,
                    opacity: isWinner ? 1 : 0.4,
                  }}
                >
                  <span className="text-xs font-semibold text-white">
                    £{store.totalPounds}
                  </span>
                  {isWinner && (
                    <span className="ml-2 text-[10px] text-white/80">✓ cheapest</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {parseFloat(savings) > 0 && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
          <p className="text-lg font-semibold text-primary">
            Save £{savings} at {cheapestStore === 'sainsburys' ? "Sainsbury's" : cheapestStore}
          </p>
          <p className="text-xs text-muted-foreground">
            That's £{annualSavings} saved per year
          </p>
        </div>
      )}
    </section>
  );
};
