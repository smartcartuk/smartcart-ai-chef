import { supabase } from '@/integrations/supabase/client';

export interface PriceResult {
  store: string;
  price: number;
  url?: string;
  title?: string;
  image?: string;
  barcode?: string;
  source?: string;
}

export interface PriceComparisonResult {
  ingredient: string;
  results: PriceResult[];
  cheapestStore: string;
  cheapestPrice: number;
  savings: number;
  cached: boolean;
}

/**
 * Fetch real-time prices for an ingredient across multiple stores
 */
export async function fetchIngredientPrices(
  ingredientName: string,
  stores: string[] = ['tesco', 'sainsburys', 'asda', 'aldi', 'morrisons', 'lidl', 'waitrose']
): Promise<PriceComparisonResult> {
  console.log(`Fetching prices for: ${ingredientName}`);

  try {
    const { data, error } = await supabase.functions.invoke('unified-price-lookup', {
      body: {
        ingredientName,
        stores,
        quantity: '1'
      }
    });

    if (error) throw error;

    const results: PriceResult[] = data.results || [];
    
    if (results.length === 0) {
      throw new Error('No prices found');
    }

    // Sort by price to find cheapest
    results.sort((a, b) => a.price - b.price);
    
    const cheapestPrice = results[0].price;
    const cheapestStore = results[0].store;
    const mostExpensive = results[results.length - 1].price;
    const savings = mostExpensive - cheapestPrice;

    return {
      ingredient: ingredientName,
      results,
      cheapestStore,
      cheapestPrice,
      savings,
      cached: data.cached || false
    };
  } catch (error) {
    console.error('Error fetching ingredient prices:', error);
    throw error;
  }
}

/**
 * Fetch prices for multiple ingredients in parallel
 */
export async function fetchMultipleIngredientPrices(
  ingredients: string[],
  stores?: string[]
): Promise<PriceComparisonResult[]> {
  console.log(`Fetching prices for ${ingredients.length} ingredients`);

  const promises = ingredients.map(ingredient => 
    fetchIngredientPrices(ingredient, stores)
  );

  const results = await Promise.allSettled(promises);
  
  return results
    .filter((result): result is PromiseFulfilledResult<PriceComparisonResult> => 
      result.status === 'fulfilled'
    )
    .map(result => result.value);
}

/**
 * Calculate total cost for shopping list by store
 */
export interface StoreTotalCost {
  store: string;
  totalCost: number;
  itemCount: number;
  savings?: number;
}

export async function calculateStoreTotals(
  shoppingList: { name: string; quantity?: number }[]
): Promise<{
  storeTotals: StoreTotalCost[];
  cheapestStore: string;
  cheapestTotal: number;
  mostExpensiveTotal: number;
  maxSavings: number;
}> {
  console.log(`Calculating store totals for ${shoppingList.length} items`);

  // Fetch prices for all ingredients
  const priceResults = await fetchMultipleIngredientPrices(
    shoppingList.map(item => item.name)
  );

  // Aggregate by store
  const storeMap = new Map<string, { total: number; count: number }>();

  priceResults.forEach(priceResult => {
    priceResult.results.forEach(result => {
      const existing = storeMap.get(result.store) || { total: 0, count: 0 };
      storeMap.set(result.store, {
        total: existing.total + result.price,
        count: existing.count + 1
      });
    });
  });

  // Convert to array and calculate
  const storeTotals: StoreTotalCost[] = Array.from(storeMap.entries())
    .map(([store, data]) => ({
      store,
      totalCost: Number(data.total.toFixed(2)),
      itemCount: data.count
    }))
    .sort((a, b) => a.totalCost - b.totalCost);

  const cheapestTotal = storeTotals[0]?.totalCost || 0;
  const cheapestStore = storeTotals[0]?.store || '';
  const mostExpensiveTotal = storeTotals[storeTotals.length - 1]?.totalCost || 0;
  const maxSavings = mostExpensiveTotal - cheapestTotal;

  // Add savings for each store
  storeTotals.forEach(store => {
    store.savings = mostExpensiveTotal - store.totalCost;
  });

  return {
    storeTotals,
    cheapestStore,
    cheapestTotal,
    mostExpensiveTotal,
    maxSavings
  };
}

/**
 * Get optimal store combination (if buying from multiple stores saves money)
 */
export async function getOptimalStoreCombination(
  shoppingList: { name: string; quantity?: number }[]
): Promise<{
  combination: { store: string; items: string[]; cost: number }[];
  totalCost: number;
  savings: number;
}> {
  const priceResults = await fetchMultipleIngredientPrices(
    shoppingList.map(item => item.name)
  );

  // For each ingredient, pick the cheapest store
  const combination = new Map<string, { items: string[]; cost: number }>();

  priceResults.forEach(priceResult => {
    const cheapest = priceResult.results[0];
    const existing = combination.get(cheapest.store) || { items: [], cost: 0 };
    existing.items.push(priceResult.ingredient);
    existing.cost += cheapest.price;
    combination.set(cheapest.store, existing);
  });

  const combinationArray = Array.from(combination.entries()).map(([store, data]) => ({
    store,
    items: data.items,
    cost: Number(data.cost.toFixed(2))
  }));

  const totalCost = combinationArray.reduce((sum, item) => sum + item.cost, 0);

  // Calculate savings vs single cheapest store
  const { cheapestTotal } = await calculateStoreTotals(shoppingList);
  const savings = cheapestTotal - totalCost;

  return {
    combination: combinationArray,
    totalCost: Number(totalCost.toFixed(2)),
    savings: Number(Math.max(0, savings).toFixed(2))
  };
}
