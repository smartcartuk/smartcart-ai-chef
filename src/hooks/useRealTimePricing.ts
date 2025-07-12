
import { useState, useEffect } from 'react';
import { getRealTimePrices, getBestPrice, calculateTotalCostByStore } from '@/utils/realTimePriceService';

interface RealTimePrice {
  store: string;
  price: number;
  url?: string;
  title?: string;
  image?: string;
}

interface PricedIngredient {
  name: string;
  amount: string;
  prices: RealTimePrice[];
  bestPrice?: RealTimePrice;
}

export const useRealTimePricing = (ingredients: Array<{ name: string; amount: string }>) => {
  const [pricedIngredients, setPricedIngredients] = useState<PricedIngredient[]>([]);
  const [storeTotals, setStoreTotals] = useState<{ [store: string]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    if (ingredients.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching real-time prices for ingredients:', ingredients);
      
      const pricedItems = await Promise.all(
        ingredients.map(async (ingredient) => {
          const prices = await getRealTimePrices(ingredient.name, ingredient.amount);
          const bestPrice = getBestPrice(prices);
          
          return {
            name: ingredient.name,
            amount: ingredient.amount,
            prices,
            bestPrice: bestPrice || undefined
          };
        })
      );
      
      setPricedIngredients(pricedItems);
      
      // Calculate store totals
      const totals = calculateTotalCostByStore(pricedItems);
      setStoreTotals(totals);
      
      console.log('Real-time pricing complete:', { pricedItems, totals });
      
    } catch (err) {
      console.error('Error fetching real-time prices:', err);
      setError('Failed to fetch real-time prices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [ingredients.length]); // Re-fetch when ingredient count changes

  return {
    pricedIngredients,
    storeTotals,
    isLoading,
    error,
    refetchPrices: fetchPrices
  };
};
