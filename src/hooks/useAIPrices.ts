import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIPrice {
  ingredient: string;
  typical_size: string;
  stores: Array<{
    store: string;
    price: number;
    unit: string;
    availability: string;
  }>;
}

export const useAIPrices = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIPrices = async (ingredients: string[], stores?: string[]) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching AI-powered prices for:', ingredients);

      const { data, error: functionError } = await supabase.functions.invoke('ai-price-lookup', {
        body: { 
          ingredients,
          stores: stores || ['Tesco', 'Sainsbury\'s', 'Asda', 'Aldi', 'Morrisons', 'Lidl']
        }
      });

      if (functionError) {
        throw functionError;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch prices');
      }

      console.log('AI prices fetched successfully:', data.prices.length, 'ingredients');
      return data.prices as AIPrice[];

    } catch (err: any) {
      console.error('Error fetching AI prices:', err);
      const errorMessage = err.message || 'Failed to fetch prices';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getCheapestStore = (prices: AIPrice[]) => {
    const storeTotals: { [store: string]: number } = {};
    
    prices.forEach(item => {
      item.stores.forEach(store => {
        if (store.availability === 'In Stock') {
          storeTotals[store.store] = (storeTotals[store.store] || 0) + store.price;
        }
      });
    });

    const cheapest = Object.entries(storeTotals).sort((a, b) => a[1] - b[1])[0];
    return cheapest ? { store: cheapest[0], total: cheapest[1] } : null;
  };

  const compareStorePrices = (prices: AIPrice[]) => {
    const comparison: { [store: string]: { total: number; available: number } } = {};
    
    prices.forEach(item => {
      item.stores.forEach(store => {
        if (!comparison[store.store]) {
          comparison[store.store] = { total: 0, available: 0 };
        }
        if (store.availability === 'In Stock') {
          comparison[store.store].total += store.price;
          comparison[store.store].available += 1;
        }
      });
    });

    return Object.entries(comparison)
      .map(([store, data]) => ({
        store,
        total: data.total,
        available: data.available,
        avgPrice: data.total / Math.max(data.available, 1)
      }))
      .sort((a, b) => a.total - b.total);
  };

  return {
    fetchAIPrices,
    getCheapestStore,
    compareStorePrices,
    isLoading,
    error
  };
};
