
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

export const getRealTimePrices = async (
  ingredientName: string,
  quantity: string = '1'
): Promise<RealTimePrice[]> => {
  const supermarkets = ['tesco', 'sainsburys', 'asda', 'aldi'];
  const prices: RealTimePrice[] = [];
  
  // Default credentials for price lookup (these would normally come from user profile)
  const defaultCredentials = {
    username: 'price_lookup@example.com',
    password: 'lookup123'
  };

  console.log(`Looking up real-time prices for: ${ingredientName}`);

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

      console.log(`Fetching ${supermarket} price for ${ingredientName}`);

      const response = await fetch(BASKET_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.warn(`Failed to fetch ${supermarket} price: ${response.status}`);
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
          
          console.log(`Found ${supermarket} price: £${priceValue} for ${item.matched_product.title}`);
        }
      }
    } catch (error) {
      console.error(`Error fetching ${supermarket} price for ${ingredientName}:`, error);
    }
  }

  // If no prices found, return fallback prices
  if (prices.length === 0) {
    console.log(`No real-time prices found for ${ingredientName}, using fallbacks`);
    return supermarkets.map(store => ({
      store,
      price: 2.50,
      title: ingredientName
    }));
  }

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
