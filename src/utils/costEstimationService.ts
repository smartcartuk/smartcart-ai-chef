import { supabase } from '@/integrations/supabase/client';

interface CostEstimate {
  totalCost: number;
  perServingCost: number;
  confidence: 'low' | 'medium' | 'high';
}

// Base ingredient costs (rough estimates in GBP per typical package/portion)
const BASE_INGREDIENT_COSTS: Record<string, number> = {
  // Proteins
  'chicken breast': 2.50,
  'chicken thigh': 2.00,
  'beef mince': 2.80,
  'beef steak': 4.50,
  'pork chop': 2.20,
  'salmon fillet': 3.50,
  'cod fillet': 3.00,
  'tuna': 1.50,
  'prawns': 3.00,
  'eggs': 0.20,
  'tofu': 1.80,
  
  // Dairy
  'milk': 0.50,
  'cheese': 1.80,
  'cheddar cheese': 2.00,
  'mozzarella': 1.50,
  'butter': 1.50,
  'cream': 1.20,
  'yogurt': 1.00,
  
  // Vegetables
  'tomatoes': 0.40,
  'onions': 0.15,
  'garlic': 0.10,
  'peppers': 0.60,
  'carrots': 0.30,
  'broccoli': 0.80,
  'cauliflower': 1.00,
  'spinach': 0.70,
  'lettuce': 0.60,
  'cucumber': 0.50,
  'potatoes': 0.40,
  'sweet potato': 0.60,
  'courgette': 0.50,
  'aubergine': 0.80,
  
  // Pantry staples
  'rice': 0.50,
  'pasta': 0.60,
  'flour': 0.40,
  'sugar': 0.30,
  'salt': 0.05,
  'pepper': 0.10,
  'olive oil': 0.30,
  'vegetable oil': 0.20,
  'soy sauce': 0.15,
  
  // Canned/packaged
  'tinned tomatoes': 0.50,
  'coconut milk': 0.80,
  'chickpeas': 0.50,
  'black beans': 0.50,
  'kidney beans': 0.50,
  
  // Herbs & spices (per use)
  'basil': 0.30,
  'parsley': 0.30,
  'coriander': 0.30,
  'thyme': 0.20,
  'oregano': 0.15,
  'cumin': 0.10,
  'paprika': 0.10,
  'chili powder': 0.10,
  
  // Default fallback
  'unknown': 0.50,
};

/**
 * Normalize ingredient names for better matching
 */
export function normalizeIngredientName(ingredient: string): string {
  return ingredient
    .toLowerCase()
    .replace(/\d+/g, '') // Remove numbers
    .replace(/\s*(g|kg|ml|l|oz|lb|cup|tbsp|tsp)\s*/gi, '') // Remove units
    .replace(/\s*(fresh|dried|frozen|canned|tinned)\s*/gi, '') // Remove descriptors
    .replace(/[^a-z\s]/g, '') // Remove special chars
    .trim();
}

/**
 * Get historical price data from database
 */
async function getHistoricalPrice(
  normalizedName: string,
  storeName?: string
): Promise<{ price: number; confidence: 'low' | 'medium' | 'high' } | null> {
  try {
    let query = supabase
      .from('ingredient_price_history')
      .select('price, recorded_at')
      .eq('normalized_name', normalizedName)
      .gte('recorded_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('recorded_at', { ascending: false });

    if (storeName) {
      query = query.eq('store_name', storeName);
    }

    const { data, error } = await query.limit(10);

    if (error || !data || data.length === 0) {
      return null;
    }

    // Calculate average price from recent history
    const avgPrice = data.reduce((sum, record) => sum + Number(record.price), 0) / data.length;
    
    // Confidence based on data availability
    const confidence = data.length >= 5 ? 'high' : data.length >= 2 ? 'medium' : 'low';

    return { price: avgPrice, confidence };
  } catch (error) {
    console.error('Error fetching historical price:', error);
    return null;
  }
}

/**
 * Estimate the cost of a recipe based on ingredients
 */
export async function estimateRecipeCost(
  ingredients: string[],
  householdSize: number = 2
): Promise<CostEstimate> {
  let totalCost = 0;
  let confidenceScore = 0;
  let ingredientCount = 0;

  for (const ingredient of ingredients) {
    const normalized = normalizeIngredientName(ingredient);
    
    // Try to get historical price first
    const historicalData = await getHistoricalPrice(normalized);
    
    let ingredientCost = 0;
    let itemConfidence = 0;

    if (historicalData) {
      ingredientCost = historicalData.price;
      itemConfidence = historicalData.confidence === 'high' ? 3 : historicalData.confidence === 'medium' ? 2 : 1;
    } else {
      // Fall back to base costs
      // Try to find a matching key in BASE_INGREDIENT_COSTS
      const matchingKey = Object.keys(BASE_INGREDIENT_COSTS).find(key => 
        normalized.includes(key) || key.includes(normalized)
      );
      
      ingredientCost = matchingKey ? BASE_INGREDIENT_COSTS[matchingKey] : BASE_INGREDIENT_COSTS['unknown'];
      itemConfidence = matchingKey ? 1 : 0;
    }

    totalCost += ingredientCost;
    confidenceScore += itemConfidence;
    ingredientCount++;
  }

  // Apply household size multiplier (scale portions)
  const householdMultiplier = householdSize / 2; // Base is 2 people
  totalCost *= householdMultiplier;

  // Calculate per-serving cost
  const perServingCost = totalCost / householdSize;

  // Determine overall confidence
  const avgConfidence = confidenceScore / ingredientCount;
  const confidence: 'low' | 'medium' | 'high' = 
    avgConfidence >= 2 ? 'high' : avgConfidence >= 1 ? 'medium' : 'low';

  return {
    totalCost: Math.round(totalCost * 100) / 100, // Round to 2 decimals
    perServingCost: Math.round(perServingCost * 100) / 100,
    confidence
  };
}

/**
 * Save ingredient price to history for future cost estimation improvement
 */
export async function saveIngredientPrice(
  ingredientName: string,
  storeName: string,
  price: number,
  unit: string = 'each'
): Promise<void> {
  try {
    const normalized = normalizeIngredientName(ingredientName);

    await supabase
      .from('ingredient_price_history')
      .insert({
        ingredient_name: ingredientName,
        normalized_name: normalized,
        store_name: storeName,
        price,
        unit
      });

    console.log(`✅ Saved price for ${ingredientName} (${storeName}): £${price}`);
  } catch (error) {
    console.error('Error saving ingredient price:', error);
  }
}

/**
 * Get budget range values based on tier
 */
export function getBudgetRange(tier: 'low' | 'medium' | 'high'): { min: number; max: number } {
  const ranges = {
    low: { min: 70, max: 90 },
    medium: { min: 90, max: 120 },
    high: { min: 120, max: 150 }
  };

  return ranges[tier];
}
