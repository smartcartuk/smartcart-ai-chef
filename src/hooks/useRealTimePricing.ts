
import { useState, useEffect } from 'react';
import { getEnhancedRealTimePrices, getBestPrice, calculateTotalCostByStore, useRealTimePriceUpdates } from '@/utils/enhancedPriceService';

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

  // Use enhanced real-time updates
  const ingredientNames = ingredients.map(ing => ing.name);
  const { prices: realtimePrices, isLoading: realtimeLoading } = useRealTimePriceUpdates(ingredientNames);

  const fetchPrices = async () => {
    if (ingredients.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching enhanced real-time prices for ingredients:', ingredients);
      
      const pricedItems = await Promise.all(
        ingredients.map(async (ingredient) => {
          // First check if we have real-time data
          const realtimeData = realtimePrices[ingredient.name];
          let prices;
          
          if (realtimeData && realtimeData.length > 0) {
            prices = realtimeData;
          } else {
            // Fallback to API call
            prices = await getEnhancedRealTimePrices(ingredient.name, ingredient.amount);
          }
          
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
      
      console.log('Enhanced real-time pricing complete:', { pricedItems, totals });
      
    } catch (err) {
      console.error('Error fetching enhanced real-time prices:', err);
      setError('Failed to fetch real-time prices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Re-fetch when the ingredient set changes (name/amount), not just count
  }, [JSON.stringify(ingredients)]);

  return {
    pricedIngredients,
    storeTotals,
    isLoading,
    error,
    refetchPrices: fetchPrices
  };
};
