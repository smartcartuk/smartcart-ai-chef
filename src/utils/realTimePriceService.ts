import { supabase } from '@/integrations/supabase/client';

interface RealTimePrice {
  store: string;
  price: number;
  url?: string;
  title?: string;
  image?: string;
}

interface PriceLookupRequest {
  supermarket: string;
  credentials: {
    username: string;
    password: string;
  };
  items: Array<{
    name: string;
    quantity: string;
  }>;
}

interface PriceLookupResponse {
  success: boolean;
  items?: Array<{
    name: string;
    quantity: number;
    matched_product?: {
      title: string;
      price: string;
      source: string;
      url?: string;
      image?: string;
    };
  }>;
  error?: string;
}

const PRICE_LOOKUP_FN = 'price-lookup';

// Simple in-memory cache with 5-minute expiration
interface CacheEntry {
  data: RealTimePrice[];
  timestamp: number;
}

const priceCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const getCacheKey = (ingredientName: string, quantity: string): string => {
  return `${ingredientName.toLowerCase()}-${quantity}`;
};

const getCachedPrice = (cacheKey: string): RealTimePrice[] | null => {
  const cached = priceCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached price for: ${cacheKey}`);
    return cached.data;
  }
  return null;
};

const setCachedPrice = (cacheKey: string, data: RealTimePrice[]): void => {
  priceCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
};

export const getRealTimePrices = async (
  ingredientName: string,
  quantity: string = '1'
): Promise<RealTimePrice[]> => {
  const cacheKey = getCacheKey(ingredientName, quantity);

  const cachedResult = getCachedPrice(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  console.log(`🔍 Looking up live prices via edge function for: ${ingredientName} (${quantity})`);

  try {
    const { data, error } = await supabase.functions.invoke(PRICE_LOOKUP_FN, {
      body: { ingredientName, quantity }
    });

    if (error) {
      console.error('price-lookup invocation error:', error);
      throw error;
    }

    const prices: RealTimePrice[] = Array.isArray(data?.prices) ? data.prices : [];

    if (prices.length === 0) {
      console.warn(`No live prices returned for ${ingredientName}, using fallbacks`);
      const fallback = ['tesco', 'sainsburys', 'asda', 'aldi'].map((store) => ({
        store,
        price: 2.5,
        title: `${ingredientName} (No Match)`
      }));
      // Shorter cache for fallbacks
      priceCache.set(cacheKey, { data: fallback, timestamp: Date.now() - (CACHE_DURATION - 60000) });
      return fallback;
    }

    setCachedPrice(cacheKey, prices);
    return prices;
  } catch (err) {
    console.error('💥 Edge price-lookup failed, returning fallbacks:', err);
    const fallback = ['tesco', 'sainsburys', 'asda', 'aldi'].map((store) => ({
      store,
      price: 2.5,
      title: `${ingredientName} (No Match)`
    }));
    // Shorter cache for fallbacks
    priceCache.set(cacheKey, { data: fallback, timestamp: Date.now() - (CACHE_DURATION - 60000) });
    return fallback;
  }
};

export const getBestPrice = (prices: RealTimePrice[]): RealTimePrice | null => {
  if (prices.length === 0) return null;
  
  return prices.reduce((best, current) => 
    current.price < best.price ? current : best
  );
};

export const calculateTotalCostByStore = (
  items: Array<{ name: string; prices: RealTimePrice[] }>
): { [store: string]: number } => {
  const storeTotals: { [store: string]: number } = {};
  const stores = ['tesco', 'sainsburys', 'asda', 'aldi'];
  
  stores.forEach(store => {
    storeTotals[store] = 0;
    
    items.forEach(item => {
      const storePrice = item.prices.find(p => p.store === store);
      if (storePrice) {
        storeTotals[store] += storePrice.price;
      }
    });
    
    storeTotals[store] = parseFloat(storeTotals[store].toFixed(2));
  });
  
  return storeTotals;
};

// Utility function to clear cache (useful for debugging)
export const clearPriceCache = (): void => {
  priceCache.clear();
  console.log('🗑️ Price cache cleared');
};

// Utility function to get cache stats
export const getCacheStats = (): { size: number; keys: string[] } => {
  return {
    size: priceCache.size,
    keys: Array.from(priceCache.keys())
  };
};
