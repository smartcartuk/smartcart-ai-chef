
import { supabase } from '@/integrations/supabase/client';

interface IngredientPrice {
  ingredient_name: string;
  average_price: number;
}

interface EnhancedIngredient {
  name: string;
  amount: string;
  prices?: {
    tesco?: { price: number; url?: string };
    sainsburys?: { price: number; url?: string };
    [key: string]: { price: number; url?: string } | undefined;
  };
}

export const usePriceCalculation = () => {
  const calculateEstimatedPrice = async (ingredients: (string | EnhancedIngredient)[]): Promise<number> => {
    try {
      let totalPrice = 0;
      
      for (const ingredient of ingredients) {
        let ingredientPrice = 0;
        let ingredientName = '';
        
        if (typeof ingredient === 'string') {
          // Handle simple string ingredients
          ingredientName = ingredient;
          
          // Try to get price from database
          const { data: priceData, error } = await (supabase as any)
            .from('ingredient_prices')
            .select('ingredient_name, average_price')
            .ilike('ingredient_name', `%${ingredientName}%`)
            .limit(1)
            .single();

          if (!error && priceData) {
            ingredientPrice = priceData.average_price;
          } else {
            ingredientPrice = 2.50; // Default fallback price
          }
        } else if (ingredient && typeof ingredient === 'object') {
          // Handle enhanced ingredients with embedded price data
          ingredientName = ingredient.name || '';
          
          if (ingredient.prices) {
            // Use the lowest price from available stores
            const availablePrices = Object.values(ingredient.prices)
              .filter(store => store && typeof store.price === 'number')
              .map(store => store!.price);
            
            if (availablePrices.length > 0) {
              ingredientPrice = Math.min(...availablePrices);
            }
          }
          
          // Fallback to database lookup if no embedded price
          if (ingredientPrice === 0 && ingredientName) {
            const { data: priceData, error } = await (supabase as any)
              .from('ingredient_prices')
              .select('ingredient_name, average_price')
              .ilike('ingredient_name', `%${ingredientName}%`)
              .limit(1)
              .single();

            if (!error && priceData) {
              ingredientPrice = priceData.average_price;
            } else {
              ingredientPrice = 2.50; // Default fallback price
            }
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
      return ingredients.length * 2.50; // Fallback: default price per ingredient
    }
  };

  return { calculateEstimatedPrice };
};
