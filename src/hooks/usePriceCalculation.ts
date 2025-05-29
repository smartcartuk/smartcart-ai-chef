
import { supabase } from '@/integrations/supabase/client';

interface IngredientPrice {
  ingredient_name: string;
  average_price: number;
}

export const usePriceCalculation = () => {
  const calculateEstimatedPrice = async (ingredients: string[]): Promise<number> => {
    try {
      // Query the ingredient_prices table for cached prices using type assertion
      const { data: priceData, error } = await (supabase as any)
        .from('ingredient_prices')
        .select('ingredient_name, average_price')
        .in('ingredient_name', ingredients);

      if (error) {
        console.warn('Could not fetch ingredient prices:', error);
        return 0;
      }

      let totalPrice = 0;
      ingredients.forEach(ingredient => {
        const priceInfo = (priceData as IngredientPrice[])?.find(p => 
          p.ingredient_name.toLowerCase().includes(ingredient.toLowerCase()) ||
          ingredient.toLowerCase().includes(p.ingredient_name.toLowerCase())
        );
        totalPrice += priceInfo?.average_price || 2.50; // Default price if not found
      });

      return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
    } catch (err) {
      console.warn('Error calculating estimated price:', err);
      return 0;
    }
  };

  return { calculateEstimatedPrice };
};
