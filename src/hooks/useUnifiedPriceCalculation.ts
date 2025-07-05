
import { supabase } from '@/integrations/supabase/client';

interface EnhancedIngredient {
  name: string;
  amount: string;
  prices?: {
    [store: string]: { price: number; url?: string };
  };
}

export const useUnifiedPriceCalculation = () => {
  const calculatePriceFromStoreData = async (ingredientName: string): Promise<number> => {
    try {
      // Check multiple store tables for the ingredient
      const storeTables = ['tesco_prices', 'sainsbury_prices', 'asda_prices', 'aldi_prices'];
      const prices: number[] = [];

      for (const table of storeTables) {
        try {
          const { data, error } = await (supabase as any)
            .from(table)
            .select('average_price, price')
            .ilike('ingredient_name', `%${ingredientName}%`)
            .limit(1)
            .single();

          if (!error && data) {
            const price = data.average_price || data.price;
            if (price && typeof price === 'number') {
              prices.push(price);
            }
          }
        } catch (tableError) {
          // Continue checking other tables
          continue;
        }
      }

      // Return the average of found prices, or a default
      if (prices.length > 0) {
        return prices.reduce((sum, price) => sum + price, 0) / prices.length;
      }
      
      return 2.50; // Default fallback price
    } catch (err) {
      console.warn(`Error fetching price for ${ingredientName}:`, err);
      return 2.50;
    }
  };

  const calculateEstimatedPrice = async (ingredients: (string | EnhancedIngredient)[]): Promise<number> => {
    try {
      let totalPrice = 0;
      
      for (const ingredient of ingredients) {
        let ingredientPrice = 0;
        let ingredientName = '';
        
        if (typeof ingredient === 'string') {
          ingredientName = ingredient;
          ingredientPrice = await calculatePriceFromStoreData(ingredientName);
        } else if (ingredient && typeof ingredient === 'object') {
          ingredientName = ingredient.name || '';
          
          if (ingredient.prices) {
            // Use the lowest price from available stores
            const availablePrices = Object.values(ingredient.prices)
              .filter(store => store && typeof store.price === 'number')
              .map(store => store!.price);
            
            if (availablePrices.length > 0) {
              ingredientPrice = Math.min(...availablePrices);
            } else {
              ingredientPrice = await calculatePriceFromStoreData(ingredientName);
            }
          } else {
            ingredientPrice = await calculatePriceFromStoreData(ingredientName);
          }
        }
        
        totalPrice += ingredientPrice;
        console.log(`Price for ${ingredientName}: £${ingredientPrice.toFixed(2)}`);
      }

      const finalPrice = Math.round(totalPrice * 100) / 100;
      console.log(`Total calculated price: £${finalPrice.toFixed(2)}`);
      return finalPrice;
    } catch (err) {
      console.warn('Error calculating estimated price:', err);
      return ingredients.length * 2.50;
    }
  };

  return { calculateEstimatedPrice };
};
