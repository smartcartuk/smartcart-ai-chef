import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Meal {
  day: string;
  recipe_name: string;
  estimated_cost?: number;
  image?: string;
  prep_time?: number;
  servings?: number;
  kg_token?: string;
  ingredients?: Array<{ name: string; amount: string; unit: string }>;
}

interface ShoppingItem {
  name: string;
  quantity: string;
  category?: string;
  inPantry?: boolean;
  checked?: boolean;
  price?: number;
}

interface StorePrice {
  store: string;
  totalPounds: string;
  color: string;
  itemCount?: number;
}

export function usePepestoMealPlan(userProfile: any) {
  const { toast } = useToast();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [priceComparison, setPriceComparison] = useState<StorePrice[]>([]);
  const [cheapestStore, setCheapestStore] = useState<string | null>(null);
  const [kgTokens, setKgTokens] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComparingPrices, setIsComparingPrices] = useState(false);
  const [activeSection, setActiveSection] = useState('plan');

  // Generate meal plan via Pepesto edge function
  const generatePlan = useCallback(async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('pepesto-meal-planner', {
        body: {
          action: 'suggest',
          dietaryPreferences: userProfile?.dietary_preferences || userProfile?.dietaryPreferences || [],
          allergies: userProfile?.allergies || [],
          householdSize: userProfile?.household_size || userProfile?.householdSize || 2,
          weeklyBudget: userProfile?.weekly_budget || userProfile?.weeklyBudget || 50,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to generate meal plan');

      const plan = data.mealPlan;
      setMeals(plan.recipes || []);
      setKgTokens(plan.kgTokens || []);

      // Build aggregated shopping list from all recipe ingredients
      const ingredientMap = new Map<string, ShoppingItem>();
      for (const recipe of (plan.recipes || [])) {
        for (const ing of (recipe.ingredients || [])) {
          const name = typeof ing === 'string' ? ing : ing.name;
          const qty = typeof ing === 'string' ? '' : `${ing.amount || ''} ${ing.unit || ''}`.trim();
          if (ingredientMap.has(name.toLowerCase())) {
            // Already have this ingredient — could aggregate quantities later
          } else {
            ingredientMap.set(name.toLowerCase(), {
              name,
              quantity: qty,
              checked: false,
              inPantry: false,
            });
          }
        }
      }
      setShoppingList(Array.from(ingredientMap.values()));

      // Auto-compare prices if we have kg_tokens
      if (plan.kgTokens?.length > 0) {
        comparePricesInternal(plan.kgTokens);
      }

      toast({
        title: 'Meal plan ready',
        description: `${plan.recipes?.length || 0} meals planned for this week`,
      });
    } catch (err) {
      console.error('[usePepestoMealPlan] Generate error:', err);
      toast({
        title: 'Couldn\'t generate plan',
        description: (err as Error).message,
        variant: 'destructive',
      });
      // Load sample data as fallback for demo/development
      loadSampleData();
    } finally {
      setIsGenerating(false);
    }
  }, [userProfile, toast]);

  // Compare prices across supermarkets
  const comparePricesInternal = useCallback(async (tokens: string[]) => {
    setIsComparingPrices(true);
    try {
      const { data, error } = await supabase.functions.invoke('pepesto-meal-planner', {
        body: {
          action: 'compare-prices',
          kgTokens: tokens,
          preferredSupermarkets: userProfile?.preferred_supermarkets ||
            userProfile?.preferredSupermarkets || ['tesco', 'asda', 'sainsburys', 'morrisons', 'waitrose'],
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to compare prices');

      const prices: StorePrice[] = Object.entries(data.priceComparison || {}).map(
        ([store, info]: [string, any]) => ({
          store,
          totalPounds: info.totalPounds || '0.00',
          color: '',
          itemCount: info.itemCount,
        })
      );

      setPriceComparison(prices);
      setCheapestStore(data.cheapestStore);
    } catch (err) {
      console.error('[usePepestoMealPlan] Price comparison error:', err);
      // Load sample prices as fallback
      loadSamplePrices();
    } finally {
      setIsComparingPrices(false);
    }
  }, [userProfile]);

  const comparePrices = useCallback(() => {
    if (kgTokens.length > 0) {
      comparePricesInternal(kgTokens);
    }
  }, [kgTokens, comparePricesInternal]);

  // Toggle shopping list item
  const toggleListItem = useCallback((index: number) => {
    setShoppingList(prev =>
      prev.map((item, i) => i === index ? { ...item, checked: !item.checked } : item)
    );
  }, []);

  // Swap a single meal
  const swapMeal = useCallback((index: number) => {
    toast({
      title: 'Swap meal',
      description: `Tap confirmed — meal swap coming in next update`,
    });
    // TODO: Call Pepesto /suggest with single meal query
  }, [toast]);

  // Sample data for development/demo (before Pepesto key is configured)
  const loadSampleData = useCallback(() => {
    const sampleMeals: Meal[] = [
      { day: 'Monday', recipe_name: 'Shakshuka with crusty bread', estimated_cost: 3.20, image: '' },
      { day: 'Tuesday', recipe_name: 'Pesto pasta with cherry tomatoes', estimated_cost: 2.80, image: '' },
      { day: 'Wednesday', recipe_name: 'Chicken tikka masala', estimated_cost: 4.10, image: '' },
      { day: 'Thursday', recipe_name: 'Greek salad with halloumi', estimated_cost: 2.50, image: '' },
      { day: 'Friday', recipe_name: 'Fish pie with mashed potato', estimated_cost: 4.60, image: '' },
      { day: 'Saturday', recipe_name: 'Beef tacos with guacamole', estimated_cost: 3.90, image: '' },
      { day: 'Sunday', recipe_name: 'Roast chicken with veg', estimated_cost: 5.20, image: '' },
    ];
    setMeals(sampleMeals);

    const sampleList: ShoppingItem[] = [
      { name: 'Chicken breast', quantity: '800g', checked: false },
      { name: 'Chopped tomatoes', quantity: '2 tins', checked: false },
      { name: 'Basmati rice', quantity: '1kg', inPantry: true, checked: false },
      { name: 'Red onions', quantity: '4', checked: false },
      { name: 'Garlic', quantity: '1 bulb', checked: false },
      { name: 'Penne pasta', quantity: '500g', checked: false },
      { name: 'Green pesto', quantity: '190g jar', checked: false },
      { name: 'Cherry tomatoes', quantity: '300g', checked: false },
      { name: 'Halloumi', quantity: '225g', checked: false },
      { name: 'Cucumber', quantity: '1', checked: false },
      { name: 'White fish fillets', quantity: '400g', checked: false },
      { name: 'Potatoes', quantity: '1kg', checked: false },
    ];
    setShoppingList(sampleList);
    loadSamplePrices();
  }, []);

  const loadSamplePrices = useCallback(() => {
    setPriceComparison([
      { store: 'asda', totalPounds: '38.90', color: '' },
      { store: 'morrisons', totalPounds: '41.60', color: '' },
      { store: 'tesco', totalPounds: '42.30', color: '' },
      { store: 'sainsburys', totalPounds: '44.10', color: '' },
      { store: 'waitrose', totalPounds: '47.80', color: '' },
    ]);
    setCheapestStore('asda');
  }, []);

  // Auto-generate on mount
  useEffect(() => {
    if (userProfile) {
      generatePlan();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    meals,
    shoppingList,
    priceComparison,
    cheapestStore,
    kgTokens,
    isGenerating,
    isComparingPrices,
    activeSection,
    setActiveSection,
    generatePlan,
    comparePrices,
    toggleListItem,
    swapMeal,
  };
}
