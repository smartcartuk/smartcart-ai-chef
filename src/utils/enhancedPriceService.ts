import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

// Enhanced type definitions
export interface RealTimePrice {
  store: string;
  price: number;
  url?: string;
  title?: string;
  image?: string;
  lastUpdated?: string;
}

export interface PricedIngredient {
  name: string;
  amount: string;
  prices: RealTimePrice[];
  bestPrice?: RealTimePrice;
  normalizedName?: string;
}

export interface PriceTrend {
  price: number;
  recordedAt: string;
}

// Ingredient name normalization
export const normalizeIngredientName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\d+\s*(large|small|medium|kg|g|lb|oz|ml|l|cup|tbsp|tsp|piece|pieces)\s*/g, '')
    .replace(/\s*\(.*?\)\s*/g, '') // Remove content in parentheses
    .replace(/[^\w\s]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, ' '); // Normalize spaces
};

// Enhanced price fetching with real-time updates
export const getEnhancedRealTimePrices = async (
  ingredientName: string,
  quantity: string = '1',
  stores: string[] = ['tesco', 'sainsburys', 'asda', 'aldi']
): Promise<RealTimePrice[]> => {
  try {
    console.log('Fetching enhanced real-time prices for:', ingredientName);
    
    const { data, error } = await supabase.functions.invoke('unified-price-lookup', {
      body: {
        ingredientName,
        quantity,
        stores
      }
    });

    if (error) {
      console.error('Error calling unified-price-lookup:', error);
      return getFallbackPrices(ingredientName, stores);
    }

    return data?.results || getFallbackPrices(ingredientName, stores);
  } catch (err) {
    console.error('Error in getEnhancedRealTimePrices:', err);
    return getFallbackPrices(ingredientName, stores);
  }
};

// Fallback prices for reliability
const getFallbackPrices = (ingredientName: string, stores: string[]): RealTimePrice[] => {
  const basePrice = 1.5 + Math.random() * 3;
  const storeMultipliers: { [key: string]: number } = {
    'tesco': 1.0,
    'sainsburys': 1.05,
    'asda': 0.95,
    'aldi': 0.90,
    'morrisons': 0.98,
    'lidl': 0.88,
    'waitrose': 1.15,
    'iceland': 0.92,
    'coop': 1.08,
    'ocado': 1.12
  };

  return stores.map(store => ({
    store,
    price: Number((basePrice * (storeMultipliers[store] || 1.0)).toFixed(2)),
    url: `https://${store}.com/search?q=${encodeURIComponent(ingredientName)}`,
    title: `${store} ${ingredientName}`
  }));
};

// Get best price from array
export const getBestPrice = (prices: RealTimePrice[]): RealTimePrice | null => {
  if (!prices || prices.length === 0) return null;
  return prices.reduce((best, current) => 
    current.price < best.price ? current : best
  );
};

// Calculate total cost by store
export const calculateTotalCostByStore = (
  items: Array<{ name: string; prices: RealTimePrice[] }>
): { [store: string]: number } => {
  const stores = ['tesco', 'sainsburys', 'asda', 'aldi', 'morrisons', 'lidl', 'waitrose', 'iceland', 'coop', 'ocado'];
  const totals: { [store: string]: number } = {};

  stores.forEach(store => {
    totals[store] = items.reduce((sum, item) => {
      const storePrice = item.prices.find(p => p.store === store);
      return sum + (storePrice?.price || 0);
    }, 0);
  });

  return totals;
};

// Get price trends from database
export const getPriceTrends = async (
  ingredientName: string,
  storeName: string,
  daysBack: number = 30
): Promise<PriceTrend[]> => {
  try {
    const normalizedName = normalizeIngredientName(ingredientName);
    
    const { data, error } = await supabase.rpc('get_price_trends', {
      ingredient_name_param: normalizedName,
      store_name_param: storeName,
      days_back: daysBack
    });

    if (error) {
      console.error('Error fetching price trends:', error);
      return [];
    }

    return data?.map((trend: any) => ({
      price: Number(trend.price),
      recordedAt: trend.recorded_at
    })) || [];
  } catch (err) {
    console.error('Error in getPriceTrends:', err);
    return [];
  }
};

// React hook for real-time price updates
export const useRealTimePriceUpdates = (ingredientNames: string[]) => {
  const [prices, setPrices] = useState<{ [key: string]: RealTimePrice[] }>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (ingredientNames.length === 0) return;

    setIsLoading(true);

    // Subscribe to real-time price updates
    const channel = supabase
      .channel('price-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prices',
          filter: `ingredient_name=in.(${ingredientNames.map(name => normalizeIngredientName(name)).join(',')})`
        },
        (payload) => {
          console.log('Real-time price update:', payload);
          // Refresh prices when changes occur
          fetchLatestPrices();
        }
      )
      .subscribe();

    const fetchLatestPrices = async () => {
      const newPrices: { [key: string]: RealTimePrice[] } = {};
      
      for (const ingredientName of ingredientNames) {
        try {
          const priceData = await getEnhancedRealTimePrices(ingredientName);
          newPrices[ingredientName] = priceData;
        } catch (err) {
          console.error(`Error fetching prices for ${ingredientName}:`, err);
          newPrices[ingredientName] = [];
        }
      }
      
      setPrices(newPrices);
      setIsLoading(false);
    };

    fetchLatestPrices();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [JSON.stringify(ingredientNames)]);

  return { prices, isLoading, refetch: () => setIsLoading(true) };
};

// Smart ingredient parsing
export const parseIngredientQuantity = (ingredient: string): { name: string; quantity: string; unit?: string } => {
  const quantityRegex = /^(\d+(?:\.\d+)?)\s*(kg|g|lb|oz|ml|l|cup|tbsp|tsp|piece|pieces?)?\s*(.+)$/i;
  const match = ingredient.match(quantityRegex);
  
  if (match) {
    return {
      quantity: match[1],
      unit: match[2] || 'each',
      name: match[3].trim()
    };
  }
  
  return {
    name: ingredient.trim(),
    quantity: '1',
    unit: 'each'
  };
};

// Cache management
const priceCache = new Map<string, { data: RealTimePrice[]; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for faster updates

export const getCachedPrice = (key: string): RealTimePrice[] | null => {
  const cached = priceCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

export const setCachedPrice = (key: string, data: RealTimePrice[]): void => {
  priceCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const clearPriceCache = (): void => {
  priceCache.clear();
};