import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { WebhookResponse } from '@/utils/webhookService';
import { SupermarketCredentialsModal } from '@/components/SupermarketCredentialsModal';
import { addItemsToBasket, formatItemsForBasket } from '@/utils/shoppingBasketService';
import { useRealTimePricing } from '@/hooks/useRealTimePricing';
import { useToast } from '@/hooks/use-toast';
import { ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { MatchedProductsModal } from '@/components/MatchedProductsModal';

interface ShoppingListProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
  recipes?: any[];
}

interface ShoppingItem {
  name: string;
  amount: string;
  price: number;
  store: string;
  checked: boolean;
  category: string;
  url?: string;
  image?: string;
  storePrices?: {[key: string]: number};
  storeProducts?: {[key: string]: { price: number; url?: string; title?: string; image?: string }};
  matchedProduct?: {
    title: string;
    price: string;
    source: string;
    url?: string;
    image?: string;
  };
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ 
  userProfile, 
  generatedData, 
  recipes = [] 
}) => {
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [shoppingItems, setShoppingItems] = useState<{[key: string]: ShoppingItem[]}>({});
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [isAddingToBasket, setIsAddingToBasket] = useState(false);
  const [basketUrl, setBasketUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const [showMatchedProductsModal, setShowMatchedProductsModal] = useState(false);
  const [matchedProducts, setMatchedProducts] = useState<any[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Extract ingredients from recipes for real-time pricing
  const ingredients = React.useMemo(() => {
    const allIngredients: Array<{ name: string; amount: string }> = [];
    
    recipes.forEach(recipe => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name;
          const ingredientAmount = typeof ingredient === 'string' ? '1 unit' : (ingredient.amount || '1 unit');
          
          if (ingredientName) {
            // Avoid duplicates
            const exists = allIngredients.find(item => item.name.toLowerCase() === ingredientName.toLowerCase());
            if (!exists) {
              allIngredients.push({
                name: ingredientName,
                amount: ingredientAmount
              });
            }
          }
        });
      }
    });
    
    return allIngredients;
  }, [recipes]);

  // Use real-time pricing hook
  const { pricedIngredients, storeTotals, isLoading: isPricingLoading, error: pricingError, refetchPrices } = useRealTimePricing(ingredients);

  // Convert priced ingredients to shopping items format
  useEffect(() => {
    if (pricedIngredients.length > 0) {
      console.log('🔄 Converting priced ingredients to shopping items:', pricedIngredients);
      
      const categorized: {[key: string]: ShoppingItem[]} = {};
      
      pricedIngredients.forEach(pricedItem => {
        const category = categorizeIngredient(pricedItem.name);
        if (!categorized[category]) {
          categorized[category] = [];
        }

        // Create store-specific pricing data
        const storePrices: {[key: string]: number} = {};
        const storeProducts: {[key: string]: { price: number; url?: string; title?: string; image?: string }} = {};
        
        pricedItem.prices.forEach(priceData => {
          storePrices[priceData.store] = priceData.price;
          storeProducts[priceData.store] = {
            price: priceData.price,
            url: priceData.url,
            title: priceData.title,
            image: priceData.image
          };
        });

        const bestPrice = pricedItem.bestPrice || pricedItem.prices[0];
        
        categorized[category].push({
          name: pricedItem.name,
          amount: pricedItem.amount,
          price: bestPrice?.price || 2.50,
          store: bestPrice?.store || 'tesco',
          checked: false,
          category,
          url: bestPrice?.url,
          image: bestPrice?.image,
          storePrices,
          storeProducts
        });
      });
      
      setShoppingItems(categorized);
      console.log('✅ Shopping items updated with live pricing:', categorized);
    }
  }, [pricedIngredients]);

  const handleItemCheck = (category: string, index: number) => {
    const key = `${category}-${index}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    
    const newCheckedItems: {[key: string]: boolean} = {};
    Object.entries(shoppingItems).forEach(([category, items]) => {
      items
        .filter(item => selectedStore === 'all' || item.store === selectedStore)
        .forEach((item, index) => {
          const key = `${category}-${index}`;
          newCheckedItems[key] = newSelectAll;
        });
    });
    setCheckedItems(newCheckedItems);
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getStoreColor = (store: string) => {
    const colors = {
      'tesco': 'bg-blue-100 text-blue-700',
      'sainsburys': 'bg-orange-100 text-orange-700', 
      'asda': 'bg-green-100 text-green-700',
      'aldi': 'bg-purple-100 text-purple-700'
    };
    return colors[store.toLowerCase() as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

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

    const targetSupermarket = selectedStore === 'all' 
      ? (getBestStore()?.store || 'tesco') 
      : selectedStore;

    const savedCredentials = userProfile?.connectedStores?.find(
      (store: any) => store.name.toLowerCase() === targetSupermarket.toLowerCase()
    );

    if (savedCredentials?.credentials?.username && savedCredentials?.credentials?.password) {
      await processBasketAddition(targetSupermarket, {
        username: savedCredentials.credentials.username,
        password: savedCredentials.credentials.password
      }, items);
    } else {
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
      ? (getBestStore()?.store || 'tesco') 
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

  const getBestStore = () => {
    if (Object.keys(storeTotals).length === 0) return null;
    
    const entries = Object.entries(storeTotals);
    return entries.reduce((best, [store, cost]) => 
      cost < best.cost ? { store, cost } : best
    , { store: entries[0][0], cost: entries[0][1] });
  };

  const bestStore = getBestStore();
  const currentTotalCost = selectedStore === 'all' 
    ? (bestStore?.cost || 0)
    : storeTotals[selectedStore] || 0;

  const availableStores = Object.keys(storeTotals).length > 0 ? Object.keys(storeTotals) : ['tesco', 'sainsburys', 'asda', 'aldi'];
  const totalItems = Object.values(shoppingItems).flat().length;

  if (isPricingLoading) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading live prices from Google Shopping...</span>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            Fetching real-time prices from Tesco, Sainsbury's, Asda, and Aldi
          </p>
        </Card>
      </div>
    );
  }

  if (pricingError) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Live Price Lookup Error</h2>
            <p className="text-red-600 mb-4">{pricingError}</p>
            <Button onClick={refetchPrices}>Retry Live Price Lookup</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shopping List Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Live Shopping List</h2>
            <p className="text-gray-600 mt-1">
              Real-time prices from Google Shopping • {recipes.length || 7} meal plan recipes
            </p>
            {bestStore && (
              <p className="text-sm text-green-600 mt-1 font-medium">
                💡 Best deal: Shop at {bestStore.store.charAt(0).toUpperCase() + bestStore.store.slice(1)} for £{bestStore.cost.toFixed(2)} total
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
            {Object.keys(storeTotals).length > 1 && (
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  £{(Math.max(...Object.values(storeTotals)) - Math.min(...Object.values(storeTotals))).toFixed(2)}
                </div>
                <div className="text-sm text-gray-600">Live Savings</div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Store Comparison */}
      {Object.keys(storeTotals).length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Live Weekly Cost Comparison</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(storeTotals).map(([store, cost]) => (
              <div key={store} className={`text-center p-4 rounded-lg border-2 ${
                bestStore?.store === store ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className={`text-lg font-bold ${bestStore?.store === store ? 'text-green-700' : 'text-gray-900'}`}>
                  £{cost.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 capitalize">{store}</div>
                {bestStore?.store === store && (
                  <Badge className="mt-1 text-xs bg-green-100 text-green-700">
                    Best Deal 🏆
                  </Badge>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" size="sm" onClick={refetchPrices}>
              <Loader2 className="w-4 h-4 mr-2" />
              Refresh Live Prices
            </Button>
          </div>
        </Card>
      )}

      {/* Filter Options and Select All */}
      <div className="flex flex-wrap items-center justify-between gap-4">
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
        
        {totalItems > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSelectAll}
          >
            {selectAll ? 'Deselect All' : 'Select All'}
          </Button>
        )}
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
                  
                  // Get store-specific product data for selected store or best store
                  const displayStore = selectedStore === 'all' ? item.store : selectedStore;
                  const storeProduct = item.storeProducts?.[displayStore];
                  
                  // Check if this is a "No Match" item
                  const isNoMatch = storeProduct?.title?.includes('(No Match)') || !storeProduct?.url;
                  
                  return (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border transition-all ${
                        isChecked 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-white border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleItemCheck(category, index)}
                          className="flex-shrink-0 mt-1"
                        />
                        
                        {storeProduct?.image && !isNoMatch && (
                          <img 
                            src={storeProduct.image} 
                            alt={storeProduct.title || item.name}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {storeProduct?.url && !isNoMatch ? (
                                  <a 
                                    href={storeProduct.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`font-medium hover:underline ${isChecked ? 'line-through text-gray-500' : 'text-blue-600'}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {storeProduct.title || item.name}
                                    <ExternalLink className="w-3 h-3 inline ml-1" />
                                  </a>
                                ) : (
                                  <span className={`font-medium ${isChecked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                    {storeProduct?.title || item.name}
                                  </span>
                                )}
                                <Badge variant="outline" className={`text-xs ${getStoreColor(displayStore)}`}>
                                  {displayStore}
                                </Badge>
                                {isNoMatch && (
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-700">
                                    No Match
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>Amount: {item.amount}</span>
                                <Badge className={`text-xs ${isNoMatch ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                  {isNoMatch ? 'Fallback Price' : 'Live via Google Shopping'}
                                </Badge>
                              </div>
                              
                              {/* Show prices for all stores */}
                              {item.storePrices && Object.keys(item.storePrices).length > 1 && (
                                <div className="flex items-center space-x-2 mt-2">
                                  {Object.entries(item.storePrices).map(([store, price]) => (
                                    <div key={store} className="flex items-center space-x-1">
                                      <span className="text-xs text-gray-500 capitalize">{store}:</span>
                                      <span className={`text-xs font-medium ${displayStore === store ? 'text-green-600' : 'text-gray-600'}`}>
                                        £{typeof price === 'number' ? price.toFixed(2) : price}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <div className={`font-semibold ${isChecked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                £{(storeProduct?.price || item.price).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        ))}
      </div>

      {/* Show message if no items */}
      {totalItems === 0 && !isPricingLoading && (
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
            Finish Order at {selectedStore === 'all' ? (bestStore?.store || 'Tesco') : selectedStore}
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
        supermarket={selectedStore === 'all' ? (bestStore?.store || 'Tesco') : selectedStore}
        isLoading={isAddingToBasket}
      />

      <MatchedProductsModal
        isOpen={showMatchedProductsModal}
        onClose={() => setShowMatchedProductsModal(false)}
        onProceedToBasket={handleProceedToBasket}
        items={matchedProducts}
        basketUrl={basketUrl}
        supermarket={selectedStore === 'all' ? (bestStore?.store || 'tesco') : selectedStore}
      />
    </div>
  );
};

const categorizeIngredient = (ingredient: string | any): string => {
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
