
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

const BASKET_API_URL = 'https://smartcart-operator.vercel.app/api/add-to-basket';

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
  
  // Check cache first
  const cachedResult = getCachedPrice(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const supermarkets = ['tesco', 'sainsburys', 'asda', 'aldi'];
  const prices: RealTimePrice[] = [];
  
  // Default credentials for price lookup (these would normally come from user profile)
  const defaultCredentials = {
    username: 'price_lookup@example.com',
    password: 'lookup123'
  };

  console.log(`🔍 Looking up live prices for: ${ingredientName} (${quantity})`);

  let successfulCalls = 0;
  let failedCalls = 0;

  for (const supermarket of supermarkets) {
    try {
      const requestBody: PriceLookupRequest = {
        supermarket: supermarket.toLowerCase(),
        credentials: defaultCredentials,
        items: [{
          name: ingredientName,
          quantity: quantity
        }]
      };

      console.log(`📡 Fetching ${supermarket} price for ${ingredientName}`);

      const response = await fetch(BASKET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch ${supermarket} price: HTTP ${response.status}`);
        failedCalls++;
        continue;
      }

      const data: PriceLookupResponse = await response.json();
      
      if (data.success && data.items && data.items.length > 0) {
        const item = data.items[0];
        if (item.matched_product) {
          const priceValue = parseFloat(item.matched_product.price.replace(/[£$€,]/g, ''));
          
          prices.push({
            store: supermarket,
            price: isNaN(priceValue) ? 2.50 : priceValue,
            url: item.matched_product.url,
            title: item.matched_product.title,
            image: item.matched_product.image
          });
          
          console.log(`✅ Found ${supermarket} price: £${priceValue} for "${item.matched_product.title}"`);
          successfulCalls++;
        } else {
          console.warn(`⚠️ No product match found for ${ingredientName} at ${supermarket}`);
          
          // Add fallback entry with "No Match" indicator
          prices.push({
            store: supermarket,
            price: 2.50,
            title: `${ingredientName} (No Match)`,
            url: undefined,
            image: undefined
          });
          failedCalls++;
        }
      } else {
        console.error(`❌ ${supermarket} API returned error:`, data.error || 'Unknown error');
        failedCalls++;
      }
    } catch (error) {
      console.error(`💥 Network error fetching ${supermarket} price for ${ingredientName}:`, error);
      failedCalls++;
    }
  }

  // Log API usage summary
  console.log(`📊 Price lookup summary for "${ingredientName}": ${successfulCalls} successful, ${failedCalls} failed out of ${supermarkets.length} calls`);
  
  // Alert if all calls failed
  if (successfulCalls === 0) {
    console.error(`🚨 ALL price lookups failed for "${ingredientName}" - check API connectivity`);
  }

  // If no prices found, return fallback prices for all stores
  if (prices.length === 0) {
    console.log(`🔄 No live prices found for ${ingredientName}, using fallbacks`);
    const fallbackPrices = supermarkets.map(store => ({
      store,
      price: 2.50,
      title: `${ingredientName} (No Match)`
    }));
    
    // Cache fallback results for shorter duration (1 minute)
    priceCache.set(cacheKey, {
      data: fallbackPrices,
      timestamp: Date.now() - (CACHE_DURATION - 60000) // Expire in 1 minute instead of 5
    });
    
    return fallbackPrices;
  }

  // Cache successful results
  setCachedPrice(cacheKey, prices);

  return prices;
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
