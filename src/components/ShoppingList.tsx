import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { WebhookResponse } from '@/utils/webhookService';
import { SupermarketCredentialsModal } from '@/components/SupermarketCredentialsModal';
import { addItemsToBasket, formatItemsForBasket } from '@/utils/shoppingBasketService';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink } from 'lucide-react';
import { MatchedProductsModal } from '@/components/MatchedProductsModal';

interface ShoppingListProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
  recipes?: any[];
}

interface PriceInfo {
  price: number;
  url: string;
}

interface IngredientWithPrices {
  name: string;
  amount: string;
  prices: {
    tesco: PriceInfo;
    sainsburys: PriceInfo;
    [key: string]: PriceInfo;
    [key: string]: PriceInfo;
  };
}

interface EnhancedRecipe {
  day: string;
  recipe_name: string;
  ingredients: IngredientWithPrices[];
  cost_by_supermarket: {
    tesco: number;
    sainsburys: number;
  };
}

interface ShoppingItem {
  name: string;
  amount: string;
  price: number;
  store: string;
  checked: boolean;
  category: string;
  url?: string;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ 
  userProfile, 
  generatedData, 
  recipes = [] 
}) => {
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [shoppingItems, setShoppingItems] = useState<{[key: string]: ShoppingItem[]}>({});
  const [totalWeekCost, setTotalWeekCost] = useState<{[key: string]: number}>({});
  const [bestOption, setBestOption] = useState<{store: string, cost: number} | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [isAddingToBasket, setIsAddingToBasket] = useState(false);
  const [basketUrl, setBasketUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const [showMatchedProductsModal, setShowMatchedProductsModal] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState<any[]>([]);

  // Generate shopping list from enhanced recipes with price data
  useEffect(() => {
    console.log('ShoppingList useEffect triggered', { recipes, generatedData });
    
    if (recipes.length > 0) {
      console.log('Processing recipes:', recipes);
      // Check if recipes have the enhanced format with price data
      const hasEnhancedData = recipes.some(recipe => 
        recipe.ingredients && 
        recipe.ingredients.length > 0 && 
        typeof recipe.ingredients[0] === 'object' &&
        recipe.ingredients[0].prices
      );

      console.log('Has enhanced data:', hasEnhancedData);

      if (hasEnhancedData) {
        try {
          const { items, totals, best } = generateEnhancedShoppingList(recipes as EnhancedRecipe[]);
          console.log('Generated enhanced shopping list:', { items, totals, best });
          setShoppingItems(items);
          setTotalWeekCost(totals);
          setBestOption(best);
        } catch (error) {
          console.error('Error generating enhanced shopping list:', error);
          const fallbackItems = generateShoppingListFromRecipes(recipes);
          setShoppingItems(fallbackItems);
        }
      } else {
        // Fallback for basic recipe format
        console.log('Using basic recipe format');
        const generatedItems = generateShoppingListFromRecipes(recipes);
        setShoppingItems(generatedItems);
      }
    } else if (generatedData?.shoppingList) {
      console.log('Using generated data shopping list');
      const generatedItems = generateShoppingItemsFromData(generatedData.shoppingList);
      setShoppingItems(generatedItems);
    } else {
      // Fallback to mock data
      console.log('Using mock data');
      setShoppingItems(mockShoppingItems);
    }
  }, [recipes, generatedData]);

  const handleItemCheck = (category: string, index: number) => {
    const key = `${category}-${index}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStoreColor = (store: string) => {
    const colors = {
      'tesco': 'bg-blue-100 text-blue-700',
      'sainsburys': 'bg-orange-100 text-orange-700', 
      'asda': 'bg-green-100 text-green-700',
      'morrisons': 'bg-purple-100 text-purple-700'
    };
    return colors[store.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const currentTotalCost = selectedStore === 'all' 
    ? Object.values(totalWeekCost)[0] || Object.values(shoppingItems).flat().reduce((sum, item) => sum + item.price, 0)
    : totalWeekCost[selectedStore] || 0;

  const storeBreakdown = totalWeekCost;
  const availableStores = Object.keys(storeBreakdown).length > 0 ? Object.keys(storeBreakdown) : ['tesco', 'sainsburys'];

  const totalItems = Object.values(shoppingItems).flat().length;

  console.log('ShoppingList render state:', {
    totalItems,
    storeBreakdown,
    bestOption,
    shoppingItemsKeys: Object.keys(shoppingItems)
  });

  const handleStartShoppingOnline = async () => {
    const items = formatItemsForBasket(shoppingItems);
    
    if (items.length === 0) {
      toast({
        title: "No items to add",
        description: "Please generate a meal plan first to create your shopping list.",
        variant: "destructive"
      });
      return;
    }

    // Determine which supermarket to use
    const targetSupermarket = selectedStore === 'all' 
      ? (bestOption?.store || 'tesco') 
      : selectedStore;

    // Check if user has saved credentials for this supermarket
    const savedCredentials = userProfile?.connectedStores?.find(
      (store: any) => store.name.toLowerCase() === targetSupermarket.toLowerCase()
    );

    if (savedCredentials?.credentials?.username && savedCredentials?.credentials?.password) {
      // Use saved credentials
      await processBasketAddition(targetSupermarket, {
        username: savedCredentials.credentials.username,
        password: savedCredentials.credentials.password
      }, items);
    } else {
      // Show credentials modal
      setShowCredentialsModal(true);
    }
  };

  const processBasketAddition = async (
    supermarket: string, 
    credentials: { username: string; password: string }, 
    items: any[]
  ) => {
    setIsAddingToBasket(true);
    
    try {
      const result = await addItemsToBasket(supermarket, credentials, items);
      
      if (result.success) {
        if (result.items && result.items.length > 0) {
          // Show matched products modal
          setMatchedProducts(result.items);
          setShowMatchedProductsModal(true);
          
          if (result.basketUrl) {
            setBasketUrl(result.basketUrl);
          }
          
          const matchedCount = result.items.filter(item => item.matched_product).length;
          toast({
            title: "Product matches found!",
            description: `Found ${matchedCount}/${result.items.length} product matches. Review before proceeding.`,
          });
        } else if (result.basketUrl) {
          setBasketUrl(result.basketUrl);
          toast({
            title: "Items added to basket!",
            description: `Successfully added ${items.length} items to your ${supermarket} basket.`,
          });
        }
      } else {
        toast({
          title: "Failed to add items",
          description: result.error || "There was an error adding items to your basket. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Connection error",
        description: "Failed to connect to the shopping service. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsAddingToBasket(false);
      setShowCredentialsModal(false);
    }
  };

  const handleCredentialsSubmit = async (credentials: { username: string; password: string }) => {
    const items = formatItemsForBasket(shoppingItems);
    const targetSupermarket = selectedStore === 'all' 
      ? (bestOption?.store || 'tesco') 
      : selectedStore;
    
    await processBasketAddition(targetSupermarket, credentials, items);
  };

  const handleProceedToBasket = () => {
    setShowMatchedProductsModal(false);
    if (basketUrl) {
      window.open(basketUrl, '_blank');
    }
  };

  const handleFinishOrder = () => {
    if (basketUrl) {
      window.open(basketUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Shopping List Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Shopping List</h2>
            <p className="text-gray-600 mt-1">
              Generated from your {recipes.length || 7} meal plan recipes • Price comparison across supermarkets
            </p>
            {bestOption && (
              <p className="text-sm text-green-600 mt-1 font-medium">
                💡 Best deal: Shop at {bestOption.store.charAt(0).toUpperCase() + bestOption.store.slice(1)} for £{bestOption.cost.toFixed(2)} total
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">£{currentTotalCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">
                {selectedStore === 'all' ? 'Best Price' : `${selectedStore.charAt(0).toUpperCase() + selectedStore.slice(1)} Total`}
              </div>
            </div>
            {Object.keys(storeBreakdown).length > 1 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  £{(Math.max(...Object.values(storeBreakdown)) - Math.min(...Object.values(storeBreakdown))).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Potential Savings</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Store Comparison */}
      {Object.keys(storeBreakdown).length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Weekly Cost Comparison</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(storeBreakdown).map(([store, cost]) => (
              <div key={store} className={`text-center p-4 rounded-lg border-2 ${
                bestOption?.store === store ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`text-lg font-bold ${bestOption?.store === store ? 'text-green-700' : 'text-gray-900'}`}>
                  £{cost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 capitalize">{store}</div>
                {bestOption?.store === store && (
                  <Badge className="mt-1 text-xs bg-green-100 text-green-700">
                    Best Deal 🏆
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filter Options */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={selectedStore === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedStore('all')}
        >
          All Items ({totalItems} items)
        </Button>
        {availableStores.map((store) => (
          <Button
            key={store}
            variant={selectedStore === store ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStore(store)}
            className={selectedStore === store ? getStoreColor(store) : ''}
          >
            {store.charAt(0).toUpperCase() + store.slice(1)}
          </Button>
        ))}
      </div>

      {/* Shopping List Items */}
      <div className="space-y-6">
        {Object.entries(shoppingItems).map(([category, items]) => (
          <Card key={category} className="p-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center space-x-2">
              <span>{category}</span>
              <Badge variant="outline">{items.length} items</Badge>
            </h3>
            
            <div className="space-y-3">
              {items
                .filter(item => selectedStore === 'all' || item.store === selectedStore)
                .map((item, index) => {
                  const key = `${category}-${index}`;
                  const isChecked = checkedItems[key] || false;
                  
                  return (
                    <div 
                      key={index}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        isChecked 
                          ? 'bg-green-50 border-green-200 opacity-60' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleItemCheck(category, index)}
                        />
                        <div className={isChecked ? 'line-through text-gray-500' : ''}>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.amount}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={`text-xs ${getStoreColor(item.store)}`}>
                          {item.store.charAt(0).toUpperCase() + item.store.slice(1)}
                        </Badge>
                        <div className={`font-bold ${isChecked ? 'text-gray-500' : 'text-gray-900'}`}>
                          £{item.price.toFixed(2)}
                        </div>
                        {item.url && item.url !== '#' && (
                          <Button size="sm" variant="outline" asChild>
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs">
                              Buy
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        ))}
      </div>

      {/* Show message if no items */}
      {totalItems === 0 && (
        <Card className="p-6 text-center">
          <p className="text-gray-500">No shopping items available. Please generate a meal plan first.</p>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" className="flex-1">
          Export to Email
        </Button>
        <Button variant="outline" className="flex-1">
          Add to Phone
        </Button>
        {basketUrl ? (
          <Button 
            onClick={handleFinishOrder}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Finish Order at {selectedStore === 'all' ? (bestOption?.store || 'Tesco') : selectedStore}
          </Button>
        ) : (
          <Button 
            onClick={handleStartShoppingOnline}
            disabled={isAddingToBasket}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
          >
            {isAddingToBasket ? 'Adding to Basket...' : 'Start Shopping Online'}
          </Button>
        )}
      </div>

      <SupermarketCredentialsModal
        isOpen={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        onSubmit={handleCredentialsSubmit}
        supermarket={selectedStore === 'all' ? (bestOption?.store || 'Tesco') : selectedStore}
        isLoading={isAddingToBasket}
      />

      <MatchedProductsModal
        isOpen={showMatchedProductsModal}
        onClose={() => setShowMatchedProductsModal(false)}
        onProceedToBasket={handleProceedToBasket}
        items={matchedProducts}
        basketUrl={basketUrl}
        supermarket={selectedStore === 'all' ? (bestOption?.store || 'tesco') : selectedStore}
      />
    </div>
  );
};

// Helper function to generate shopping list from recipes
const generateShoppingListFromRecipes = (recipes: any[]): {[key: string]: ShoppingItem[]} => {
  const categorized: {[key: string]: ShoppingItem[]} = {};
  
  const allIngredients: string[] = [];
  recipes.forEach(recipe => {
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      recipe.ingredients.forEach(ingredient => {
        // Handle both string and object ingredients
        const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name;
        if (ingredientName) {
          allIngredients.push(ingredientName);
        }
      });
    }
  });

  const uniqueIngredients = [...new Set(allIngredients)];
  
  uniqueIngredients.forEach(ingredient => {
    const category = categorizeIngredient(ingredient);
    if (!categorized[category]) {
      categorized[category] = [];
    }
    
    categorized[category].push({
      name: ingredient,
      amount: '1 unit',
      price: estimatePrice(ingredient),
      store: getOptimalStore(ingredient),
      checked: false,
      category
    });
  });
  
  return categorized;
};

// Helper function to categorize ingredients - ensure we always get a string
const categorizeIngredient = (ingredient: string | any): string => {
  // Handle both string and object inputs
  const ingredientName = typeof ingredient === 'string' ? ingredient : (ingredient?.name || 'unknown');
  const lowerIngredient = ingredientName.toLowerCase();
  
  if (lowerIngredient.includes('chicken') || lowerIngredient.includes('beef') || 
      lowerIngredient.includes('fish') || lowerIngredient.includes('meat') ||
      lowerIngredient.includes('salmon') || lowerIngredient.includes('cheese') ||
      lowerIngredient.includes('milk') || lowerIngredient.includes('yogurt') ||
      lowerIngredient.includes('mozzarella')) {
    return 'Meat & Dairy';
  }
  
  if (lowerIngredient.includes('tomato') || lowerIngredient.includes('cucumber') ||
      lowerIngredient.includes('lettuce') || lowerIngredient.includes('onion') ||
      lowerIngredient.includes('pepper') || lowerIngredient.includes('mushroom') ||
      lowerIngredient.includes('carrot') || lowerIngredient.includes('lemon') ||
      lowerIngredient.includes('spinach') || lowerIngredient.includes('celery') ||
      lowerIngredient.includes('zucchini') || lowerIngredient.includes('bell pepper') ||
      lowerIngredient.includes('bell peppers') || lowerIngredient.includes('cherry tomatoes')) {
    return 'Fresh Produce';
  }
  
  if (lowerIngredient.includes('rice') || lowerIngredient.includes('pasta') ||
      lowerIngredient.includes('flour') || lowerIngredient.includes('oil') ||
      lowerIngredient.includes('salt') || lowerIngredient.includes('sugar') ||
      lowerIngredient.includes('spice') || lowerIngredient.includes('herb') ||
      lowerIngredient.includes('quinoa') || lowerIngredient.includes('lentils') ||
      lowerIngredient.includes('chickpeas') || lowerIngredient.includes('beans') ||
      lowerIngredient.includes('soy sauce') || lowerIngredient.includes('stock') ||
      lowerIngredient.includes('passata') || lowerIngredient.includes('sauce') ||
      lowerIngredient.includes('mixed herbs') || lowerIngredient.includes('chili powder')) {
    return 'Pantry Staples';
  }
  
  if (lowerIngredient.includes('frozen') || lowerIngredient.includes('ready') ||
      lowerIngredient.includes('canned') || lowerIngredient.includes('tinned') ||
      lowerIngredient.includes('pizza dough') || lowerIngredient.includes('corn')) {
    return 'Frozen & Convenience';
  }
  
  return 'Other Items';
};

// Helper function to estimate price
const estimatePrice = (ingredient: string): number => {
  const lowerIngredient = ingredient.toLowerCase();
  
  if (lowerIngredient.includes('salmon') || lowerIngredient.includes('beef')) {
    return 5.99 + Math.random() * 3;
  }
  
  if (lowerIngredient.includes('chicken') || lowerIngredient.includes('fish')) {
    return 3.99 + Math.random() * 2;
  }
  
  if (lowerIngredient.includes('tomato') || lowerIngredient.includes('cucumber')) {
    return 1.99 + Math.random() * 1;
  }
  
  // Pantry staples - lower prices
  return 0.99 + Math.random() * 2;
};

// Helper function to get optimal store
const getOptimalStore = (ingredient: string): string => {
  const stores = ['tesco', 'sainsburys', 'asda', 'morrisons'];
  return stores[Math.floor(Math.random() * stores.length)];
};

// Helper function to convert webhook shopping list to component format
const generateShoppingItemsFromData = (shoppingList: any[]): {[key: string]: ShoppingItem[]} => {
  const categorized: {[key: string]: ShoppingItem[]} = {};
  
  shoppingList.forEach(item => {
    const category = item.category || 'Other';
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push({
      name: item.item,
      amount: item.quantity,
      price: Number(item.estimated_cost) || 0,
      store: 'tesco', // Default store
      checked: false,
      category
    });
  });
  
  return categorized;
};

// Mock data fallback
const mockShoppingItems = {
  'Fresh Produce': [
    { name: 'Salmon Fillets', amount: '4 portions', price: 12.99, store: 'tesco', checked: false, category: 'Fresh Produce' },
    { name: 'Cherry Tomatoes', amount: '2 punnets', price: 3.50, store: 'sainsburys', checked: false, category: 'Fresh Produce' }
  ],
  'Pantry Staples': [
    { name: 'Arborio Rice', amount: '1kg', price: 3.20, store: 'asda', checked: false, category: 'Pantry Staples' }
  ]
};

// Generate shopping list from enhanced recipes with price data
const generateEnhancedShoppingList = (recipes: EnhancedRecipe[]) => {
  console.log('generateEnhancedShoppingList called with:', recipes);
  
  const categorized: {[key: string]: ShoppingItem[]} = {};
  const ingredientMap = new Map<string, IngredientWithPrices>();
  
  // Collect unique ingredients from all recipes
  recipes.forEach(recipe => {
    if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
      recipe.ingredients.forEach(ingredient => {
        if (ingredient && ingredient.name) {
          const key = ingredient.name.toLowerCase();
          if (!ingredientMap.has(key)) {
            ingredientMap.set(key, ingredient);
          }
        }
      });
    }
  });

  console.log('Unique ingredients found:', Array.from(ingredientMap.keys()));

  // Calculate total costs per supermarket
  const totalWeekCost: {[key: string]: number} = {};
  const supermarkets = ['tesco', 'sainsburys'];
  
  supermarkets.forEach(market => {
    totalWeekCost[market] = recipes.reduce((sum, recipe) => {
      return sum + (recipe.cost_by_supermarket?.[market] || 0);
    }, 0);
    totalWeekCost[market] = parseFloat(totalWeekCost[market].toFixed(2));
  });

  console.log('Total week costs:', totalWeekCost);

  // Find best option
  const bestStore = Object.entries(totalWeekCost).reduce((best, [store, cost]) => 
    cost < best.cost ? { store, cost } : best
  , { store: '', cost: Infinity });

  console.log('Best store option:', bestStore);

  // Create shopping items optimized for best prices per ingredient
  Array.from(ingredientMap.values()).forEach(ingredient => {
    const category = categorizeIngredient(ingredient.name);
    if (!categorized[category]) {
      categorized[category] = [];
    }

    // Find the best price for this ingredient
    const bestPrice = supermarkets.reduce((best, market) => {
      const price = ingredient.prices?.[market]?.price || 999;
      return price < best.price ? { market, price, url: ingredient.prices?.[market]?.url || '#' } : best;
    }, { market: '', price: Infinity, url: '#' });

    categorized[category].push({
      name: ingredient.name,
      amount: ingredient.amount,
      price: bestPrice.price,
      store: bestPrice.market,
      checked: false,
      category,
      url: bestPrice.url
    });
  });

  console.log('Generated categorized items:', categorized);

  return {
    items: categorized,
    totals: totalWeekCost,
    best: bestStore.cost !== Infinity ? bestStore : null
  };
};
