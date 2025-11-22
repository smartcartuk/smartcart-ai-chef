import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle, Circle, ShoppingCart, MapPin, Clock, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { WebhookResponse } from '@/utils/webhookService';
import { getSupermarketLogo } from '@/utils/supermarketLogos';
import { getIngredientImage } from '@/utils/recipeImageGenerator';
import { supabase } from '@/integrations/supabase/client';
import { AIShoppingAgent } from './AIShoppingAgent';
import { useToast } from '@/hooks/use-toast';
import { getConnectedStores } from '@/utils/profileService';
interface ShoppingListProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
  recipes?: any[];
  totalWeeklyCosts?: any;
}

// Helper function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};
export const ShoppingList: React.FC<ShoppingListProps> = ({
  userProfile,
  generatedData,
  recipes = [],
  totalWeeklyCosts
}) => {
  const [activeStore, setActiveStore] = useState('tesco');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [optimizedRoute, setOptimizedRoute] = useState<any[]>([]);
  const [addingToBasket, setAddingToBasket] = useState(false);
  const [connectedStores, setConnectedStores] = useState<any[]>([]);
  const [ingredientPrices, setIngredientPrices] = useState<Map<string, any>>(new Map());
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [removedIngredients, setRemovedIngredients] = useState<Set<string>>(new Set());
  const [useSuggesticList, setUseSuggesticList] = useState(false);
  const [suggesticItems, setSuggesticItems] = useState<any[]>([]);
  const [loadingSuggestic, setLoadingSuggestic] = useState(false);
  const {
    toast
  } = useToast();

  // Load connected stores on mount
  useEffect(() => {
    const loadStores = async () => {
      const result = await getConnectedStores();
      if (result.success && result.data) {
        setConnectedStores(result.data);
        console.log('Connected stores loaded:', result.data);
      }
    };
    loadStores();
  }, []);

  // Fetch Suggestic shopping list
  const fetchSuggesticShoppingList = async () => {
    setLoadingSuggestic(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggestic-meal-planner', {
        body: { action: 'shopping-list' }
      });

      if (error) throw error;

      if (!data?.success) {
        // Check if it's an authorization error
        if (data?.error?.includes('Not authorized')) {
          toast({
            title: "Suggestic API Limitation",
            description: "Your Suggestic API plan doesn't include shopping list access. Using recipe-based list instead.",
            variant: "destructive"
          });
          setUseSuggesticList(false);
          return;
        }
        throw new Error(data?.error || 'Failed to fetch shopping list');
      }

      if (data?.shoppingList) {
        setSuggesticItems(data.shoppingList);
        console.log('✅ Fetched Suggestic shopping list:', data.shoppingList);
        toast({
          title: "Shopping list synced!",
          description: `Loaded ${data.shoppingList.length} items from Suggestic`,
        });
      }
    } catch (error: any) {
      console.error('Error fetching Suggestic shopping list:', error);
      toast({
        title: "Suggestic API Not Available",
        description: "Using recipe-based shopping list instead.",
        variant: "destructive"
      });
      setUseSuggesticList(false);
    } finally {
      setLoadingSuggestic(false);
    }
  };

  // Fetch Suggestic shopping list when enabled
  useEffect(() => {
    if (useSuggesticList) {
      fetchSuggesticShoppingList();
    }
  }, [useSuggesticList]);

  // Extract and consolidate ingredients from recipes (excluding removed ones)
  const ingredients = React.useMemo(() => {
    // Use Suggestic shopping list if enabled
    if (useSuggesticList && suggesticItems.length > 0) {
      return suggesticItems.map((item: any) => ({
        name: capitalizeWords(item.ingredient),
        amount: `${item.quantity || ''} ${item.unit || ''}`.trim(),
        image: getIngredientImage(item.ingredient),
        aisle: item.aisleName,
        isDone: item.isDone,
        grams: item.grams
      }));
    }

    // Otherwise extract from recipes
    const ingredientMap = new Map<string, {
      name: string;
      totalAmount: number;
      unit: string;
      image: string;
      count: number;
    }>();
    recipes.forEach(recipe => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name;
          const ingredientAmount = typeof ingredient === 'string' ? '150g' : ingredient.amount || '150g';
          if (ingredientName && !removedIngredients.has(ingredientName.toLowerCase())) {
            const key = ingredientName.toLowerCase();

            // Extract numeric amount and unit
            const amountMatch = ingredientAmount.match(/(\d+)\s*(\w+)/);
            const numericAmount = amountMatch ? parseInt(amountMatch[1]) : 150;
            const unit = amountMatch ? amountMatch[2] : 'g';
            if (ingredientMap.has(key)) {
              const existing = ingredientMap.get(key)!;
              existing.totalAmount += numericAmount;
              existing.count += 1;
            } else {
              ingredientMap.set(key, {
                name: capitalizeWords(ingredientName),
                totalAmount: numericAmount,
                unit: unit,
                image: getIngredientImage(ingredientName),
                count: 1
              });
            }
          }
        });
      }
    });
    return Array.from(ingredientMap.values()).map(item => ({
      name: item.name,
      amount: item.count > 1 ? `${item.totalAmount}${item.unit} (${item.count} recipes)` : `${item.totalAmount}${item.unit}`,
      image: item.image
    }));
  }, [recipes, removedIngredients, useSuggesticList, suggesticItems]);

  // Show empty state if no recipes or ingredients
  if (recipes.length === 0 || ingredients.length === 0) {
    return <Card className="p-8 text-center">
        <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No Shopping List Yet
        </h3>
        <p className="text-gray-600 mb-4">
          Add recipes to your meal plan to generate a shopping list
        </p>
      </Card>;
  }

  // Fetch prices for all ingredients from unified-price-lookup
  useEffect(() => {
    const fetchPrices = async () => {
      if (ingredients.length === 0) return;
      setLoadingPrices(true);
      try {
        const pricesMap = new Map();

        // Fetch prices for each ingredient
        for (const ingredient of ingredients) {
          try {
            const {
              data,
              error
            } = await supabase.functions.invoke('unified-price-lookup', {
              body: {
                ingredientName: ingredient.name,
                quantity: 1,
                stores: ['tesco', 'sainsburys', 'asda', 'aldi']
              }
            });
            
            if (error) {
              console.error(`❌ Price lookup error for ${ingredient.name}:`, error);
              continue;
            }
            
            if (!data?.results || data.results.length === 0) {
              console.warn(`⚠️ No prices returned for ${ingredient.name}`);
              continue;
            }
            
            // Transform array results into store-keyed object
            const storeData: any = {};
            data.results.forEach((result: any) => {
              storeData[result.store] = {
                price: result.price,
                url: result.url,
                title: result.title
              };
            });
            pricesMap.set(ingredient.name.toLowerCase(), storeData);
            console.log(`✓ Fetched prices for ${ingredient.name}:`, data.results.length, 'stores');
          } catch (itemError) {
            console.error(`❌ Failed to fetch price for ${ingredient.name}:`, itemError);
          }
        }
        setIngredientPrices(pricesMap);
        console.log(`✅ Price fetch complete. Got prices for ${pricesMap.size}/${ingredients.length} ingredients`);
      } catch (error) {
        console.error('❌ Error in fetchPrices:', error);
        toast({
          title: "Price Fetch Error",
          description: "Some ingredient prices could not be loaded. Showing estimated prices.",
          variant: "destructive"
        });
      } finally {
        setLoadingPrices(false);
      }
    };
    fetchPrices();
  }, [ingredients]);

  // Calculate total costs per store from actual prices
  const storeTotals = React.useMemo(() => {
    const totals: {
      [key: string]: number;
    } = {
      tesco: 0,
      sainsburys: 0,
      asda: 0,
      aldi: 0
    };
    ingredients.forEach(ingredient => {
      const priceData = ingredientPrices.get(ingredient.name.toLowerCase());
      if (priceData) {
        Object.keys(totals).forEach(store => {
          const storePrice = priceData[store]?.price || 0;
          totals[store] += typeof storePrice === 'number' ? storePrice : 0;
        });
      }
    });
    return totals;
  }, [ingredients, ingredientPrices]);

  // Store information with enhanced data using actual price totals
  const stores = [{
    id: 'tesco',
    name: 'Tesco',
    total: storeTotals.tesco || 0,
    items: ingredients.length,
    savings: 0,
    deliveryTime: '2-3 hours',
    address: '123 High Street, Your Area'
  }, {
    id: 'sainsburys',
    name: 'Sainsbury\'s',
    total: storeTotals.sainsburys || 0,
    items: ingredients.length,
    savings: Math.max(0, storeTotals.sainsburys - storeTotals.tesco),
    deliveryTime: '3-4 hours',
    address: '456 Main Road, Your Area'
  }, {
    id: 'asda',
    name: 'ASDA',
    total: storeTotals.asda || 0,
    items: ingredients.length,
    savings: Math.max(0, storeTotals.tesco - storeTotals.asda),
    deliveryTime: '2-4 hours',
    address: '789 Shopping Centre, Your Area'
  }, {
    id: 'aldi',
    name: 'Aldi',
    total: storeTotals.aldi || 0,
    items: ingredients.length,
    savings: Math.max(0, storeTotals.tesco - storeTotals.aldi),
    deliveryTime: '4-6 hours',
    address: '321 Budget Lane, Your Area'
  }];
  const currentStore = stores.find(store => store.id === activeStore) || stores[0];

  // Get ingredients with prices for the current store
  const currentIngredientsWithPrices = ingredients.map(ing => {
    const priceData = ingredientPrices.get(ing.name.toLowerCase());
    const storePrice = priceData?.[activeStore]?.price || 0;
    return {
      ...ing,
      price: storePrice
    };
  });
  const removeIngredient = (ingredientName: string) => {
    setRemovedIngredients(prev => new Set([...prev, ingredientName.toLowerCase()]));
    toast({
      title: "Ingredient removed",
      description: `${ingredientName} has been removed from your shopping list.`
    });
  };
  const toggleItem = (itemName: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(itemName)) {
      newChecked.delete(itemName);
    } else {
      newChecked.add(itemName);
    }
    setCheckedItems(newChecked);
  };
  const generateOptimizedRoute = () => {
    // Simple route optimization - group by aisle/category
    const categories = {
      'Fresh Produce': ['tomatoes', 'onions', 'lettuce', 'carrots', 'potatoes', 'cucumber', 'peppers'],
      'Meat & Fish': ['chicken', 'beef', 'salmon', 'prawns', 'fish'],
      'Dairy': ['milk', 'cheese', 'yogurt', 'butter'],
      'Pantry': ['rice', 'pasta', 'oil', 'spices', 'flour', 'bread']
    };
    const route = Object.entries(categories).map(([category, items]) => ({
      category,
      items: currentIngredientsWithPrices.filter(ingredient => items.some(item => ingredient.name.toLowerCase().includes(item)))
    })).filter(section => section.items.length > 0);
    setOptimizedRoute(route);
  };
  const handleAddToBasket = async () => {
    if (!connectedStores?.length) {
      toast({
        title: "No connected stores",
        description: "Please connect your supermarket accounts first.",
        variant: "destructive"
      });
      return;
    }
    const connectedStore = connectedStores.find((store: any) => store.name.toLowerCase() === activeStore);
    if (!connectedStore || !connectedStore.credentials) {
      toast({
        title: "Store not connected",
        description: `Please connect your ${currentStore.name} account first.`,
        variant: "destructive"
      });
      return;
    }
    setAddingToBasket(true);
    try {
      const shoppingItems = currentIngredientsWithPrices.map(item => ({
        name: item.name,
        quantity: item.amount || '1'
      }));
      const {
        data,
        error
      } = await supabase.functions.invoke('ai-shopping-agent', {
        body: {
          action: 'execute',
          store: activeStore,
          items: shoppingItems,
          credentials: connectedStore.credentials
        }
      });
      if (error) throw error;
      toast({
        title: 'Items added to basket!',
        description: `Successfully added ${shoppingItems.length} items to your ${currentStore.name} basket.`
      });
      if (data?.basketUrl) {
        window.open(data.basketUrl, '_blank');
      }
    } catch (error) {
      console.error('Error adding to basket:', error);
      toast({
        title: 'Failed to add to basket',
        description: 'There was an error adding items to your basket. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setAddingToBasket(false);
    }
  };
  useEffect(() => {
    generateOptimizedRoute();
  }, [activeStore, currentIngredientsWithPrices.length]);
  return <div className="space-y-6">
      {/* Shopping List Header */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Smart Shopping List</h2>
            <p className="text-gray-600 mt-1">
              {loadingPrices ? 'Fetching live prices...' : useSuggesticList ? 'Synced with Suggestic' : 'Optimized for your weekly meal plan with live price comparisons'}
            </p>
            
            {/* Suggestic Sync Toggle - Hidden for now due to API limitations */}
            {false && (
              <div className="flex items-center space-x-3 mt-4">
                <Switch 
                  id="suggestic-sync" 
                  checked={useSuggesticList}
                  onCheckedChange={setUseSuggesticList}
                />
                <Label htmlFor="suggestic-sync" className="text-sm font-medium cursor-pointer">
                  Sync with Suggestic Shopping List
                </Label>
                {useSuggesticList && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={fetchSuggesticShoppingList}
                    disabled={loadingSuggestic}
                  >
                    {loadingSuggestic ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {ingredients.length}
              </div>
              <div className="text-sm text-gray-600">Items</div>
            </div>
            <div className="text-center">
              {loadingPrices || loadingSuggestic ? <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /> : <div className="text-2xl font-bold text-blue-600">
                  £{currentStore.total.toFixed(2)}
                </div>}
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Store Selection Tabs */}
      <Tabs value={activeStore} onValueChange={setActiveStore}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 bg-white border shadow-sm p-2 h-auto">
          {stores.map(store => {
          const {
            logo,
            emoji
          } = getSupermarketLogo(store.id);
          return <TabsTrigger key={store.id} value={store.id} className="flex flex-col items-center justify-center gap-1.5 p-2 min-h-[100px] data-[state=active]:bg-blue-50 data-[state=active]:border-blue-200 data-[state=active]:border-2 rounded-lg">
                <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-12">
                  <img src={logo} alt={store.name} loading="lazy" className="max-w-full max-h-full object-contain" onError={e => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'block';
                }
              }} />
                  <span className="text-2xl hidden">
                    {emoji}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-0.5 w-full">
                  <div className="font-medium text-xs truncate w-full text-center">{store.name}</div>
                  <div className="text-sm font-semibold text-gray-900">£{store.total.toFixed(2)}</div>
                  {store.savings > 0 && <Badge variant="secondary" className="text-[9px] px-1.5 py-0 bg-green-100 text-green-700 whitespace-nowrap">
                      Save £{store.savings.toFixed(2)}
                    </Badge>}
                </div>
              </TabsTrigger>;
        })}
        </TabsList>

        {stores.map(store => {
        const {
          logo,
          emoji
        } = getSupermarketLogo(store.id);
        return <TabsContent key={store.id} value={store.id} className="space-y-6">
              {/* Store Info Card */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-12 sm:w-20 sm:h-12 flex items-center justify-center flex-shrink-0">
                      <img src={logo} alt={store.name} loading="lazy" className="max-w-full max-h-full object-contain" onError={e => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) {
                      fallback.style.display = 'block';
                    }
                  }} />
                      <span className="text-4xl hidden">
                        {emoji}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg mb-2">{store.name}</h3>
                      <div className="flex flex-col gap-1.5 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="break-words line-clamp-2">{store.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{store.deliveryTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-blue-600">£{store.total.toFixed(2)}</div>
                    <div className="text-sm text-gray-600">{store.items} items</div>
                  </div>
                </div>
              </Card>

              {/* Shopping List Items */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg">Shopping List Items</h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {checkedItems.size} of {currentIngredientsWithPrices.length} collected
                    </Badge>
                    <Button size="sm" variant="outline" onClick={generateOptimizedRoute}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Optimize Route
                    </Button>
                  </div>
                </div>

                {optimizedRoute.length > 0 ? <div className="space-y-6">
                    {optimizedRoute.map((section, index) => <div key={index} className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                          <h4 className="font-medium text-gray-900">{section.category}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {section.items.length} items
                          </Badge>
                        </div>
                        
                        <div className="ml-8 space-y-2">
                          {section.items.map((item, itemIndex) => <div key={itemIndex} className={`flex items-center justify-between p-3 rounded-lg border transition-all ${checkedItems.has(item.name) ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                              <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={() => toggleItem(item.name)}>
                                {checkedItems.has(item.name) ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                                <div className="w-12 h-12 flex-shrink-0">
                                  <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover rounded-md" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                  <div className="text-sm text-gray-600">{item.amount}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                                <div className="text-right">
                                  {loadingPrices ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="font-medium text-gray-900">£{item.price.toFixed(2)}</div>}
                                </div>
                                <Button size="sm" variant="ghost" onClick={e => {
                        e.stopPropagation();
                        removeIngredient(item.name);
                      }} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>)}
                        </div>
                      </div>)}
                  </div> : <div className="space-y-2">
                    {currentIngredientsWithPrices.map((item, index) => <div key={index} className={`flex items-center justify-between p-4 rounded-lg border transition-all ${checkedItems.has(item.name) ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer" onClick={() => toggleItem(item.name)}>
                          {checkedItems.has(item.name) ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />}
                          <div className="w-12 h-12 flex-shrink-0">
                             <img src={item.image} alt={item.name} loading="lazy" className="w-full h-full object-cover rounded-md" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-600">{item.amount}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                          <div className="text-right">
                            {loadingPrices ? <Loader2 className="w-4 h-4 animate-spin" /> : <div className="font-medium text-gray-900">£{item.price.toFixed(2)}</div>}
                          </div>
                          <Button size="sm" variant="ghost" onClick={e => {
                    e.stopPropagation();
                    removeIngredient(item.name);
                  }} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>)}
                  </div>}
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white" onClick={handleAddToBasket} disabled={addingToBasket || loadingPrices || !connectedStores.some(s => s.name.toLowerCase() === activeStore)}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {addingToBasket ? 'Adding to basket...' : `Add to ${store.name} Basket`}
                </Button>
                <Button variant="outline" className="flex-1">
                  Export Shopping List
                </Button>
              </div>
            </TabsContent>;
      })}
      </Tabs>

      {/* AI Shopping Agent */}
      <AIShoppingAgent ingredients={ingredients.map(ingredient => {
      const priceData = ingredientPrices.get(ingredient.name.toLowerCase());
      return {
        name: ingredient.name,
        amount: ingredient.amount,
        prices: Object.keys(storeTotals).map(store => ({
          store,
          price: priceData?.[store]?.price || 0,
          title: ingredient.name,
          url: `https://${store}.com/search?q=${encodeURIComponent(ingredient.name)}`
        }))
      };
    })} connectedStores={connectedStores} onShoppingComplete={results => {
      console.log('AI Shopping completed:', results);
      toast({
        title: "AI Shopping Results",
        description: `Completed shopping tasks for ${results.filter((r: any) => r.success).length} stores.`
      });
    }} />

      {/* Live Weekly Cost Comparison */}
      {totalWeeklyCosts && <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <h3 className="font-semibold text-lg mb-4">Live Weekly Cost Comparison</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stores.map(store => {
          const {
            logo,
            emoji
          } = getSupermarketLogo(store.id);
          return <div key={store.id} className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="w-16 h-10 mx-auto mb-3 flex items-center justify-center">
                    <img src={logo} alt={store.name} loading="lazy" className="max-w-full max-h-full object-contain" onError={e => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'block';
                }
              }} />
                    <span className="text-2xl hidden">
                      {emoji}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{store.name}</div>
                    <div className="text-lg font-bold text-blue-600">
                      £{store.total.toFixed(2)}
                    </div>
                    {store.savings > 0 && <div className="text-xs text-green-600">
                        Save £{store.savings.toFixed(2)}
                      </div>}
                  </div>
                </div>;
        })}
          </div>
        </Card>}
    </div>;
};