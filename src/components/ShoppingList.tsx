
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, Circle, ShoppingCart, MapPin, Clock } from 'lucide-react';
import { WebhookResponse } from '@/utils/webhookService';
import { getSupermarketLogo } from '@/utils/supermarketLogos';
import { getIngredientImage } from '@/utils/recipeImageGenerator';
import { addItemsToBasket, formatItemsForBasket } from '@/utils/shoppingBasketService';
import { useToast } from '@/hooks/use-toast';

interface ShoppingListProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
  recipes?: any[];
  totalWeeklyCosts?: any;
}

// Helper function to capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  return str.split(' ').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
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
  const { toast } = useToast();

  // Extract ingredients from recipes with proper image handling
  const ingredients = React.useMemo(() => {
    const allIngredients: Array<{ name: string; amount: string; store: string; price: number; image: string }> = [];
    
    recipes.forEach(recipe => {
      if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ingredient => {
          const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name;
          const ingredientAmount = typeof ingredient === 'string' ? '1 unit' : (ingredient.amount || '1 unit');
          
          if (ingredientName) {
            // Add ingredient for each store with estimated prices
            const stores = ['tesco', 'sainsburys', 'asda', 'aldi'];
            stores.forEach(store => {
              const basePrice = Math.random() * 3 + 1; // Random price between £1-4
              const storeMultiplier = store === 'aldi' ? 0.9 : store === 'asda' ? 0.95 : store === 'sainsburys' ? 1.05 : 1;
              
              allIngredients.push({
                name: capitalizeWords(ingredientName),
                amount: ingredientAmount,
                store: store,
                price: basePrice * storeMultiplier,
                image: getIngredientImage(ingredientName)
              });
            });
          }
        });
      }
    });
    
    return allIngredients;
  }, [recipes]);

  // Store information with enhanced data
  const stores = [
    { 
      id: 'tesco', 
      name: 'Tesco', 
      total: totalWeeklyCosts?.tesco || 47.85,
      items: ingredients.filter(item => item.store === 'tesco').length,
      savings: 0,
      deliveryTime: '2-3 hours',
      address: '123 High Street, Your Area'
    },
    { 
      id: 'sainsburys', 
      name: 'Sainsbury\'s', 
      total: totalWeeklyCosts?.sainsburys || 52.30,
      items: ingredients.filter(item => item.store === 'sainsburys').length,
      savings: totalWeeklyCosts ? Math.max(0, (totalWeeklyCosts.sainsburys - (totalWeeklyCosts.tesco || 47.85))) : 4.45,
      deliveryTime: '3-4 hours',
      address: '456 Main Road, Your Area'
    },
    { 
      id: 'asda', 
      name: 'ASDA', 
      total: totalWeeklyCosts?.asda || 44.20,
      items: ingredients.filter(item => item.store === 'asda').length,
      savings: totalWeeklyCosts ? Math.max(0, ((totalWeeklyCosts.tesco || 47.85) - totalWeeklyCosts.asda)) : 3.65,
      deliveryTime: '2-4 hours',
      address: '789 Shopping Centre, Your Area'
    },
    { 
      id: 'aldi', 
      name: 'Aldi', 
      total: totalWeeklyCosts?.aldi || 39.95,
      items: ingredients.filter(item => item.store === 'aldi').length,
      savings: totalWeeklyCosts ? Math.max(0, ((totalWeeklyCosts.tesco || 47.85) - totalWeeklyCosts.aldi)) : 7.90,
      deliveryTime: '4-6 hours',
      address: '321 Budget Lane, Your Area'
    }
  ];

  const currentStore = stores.find(store => store.id === activeStore) || stores[0];
  const currentIngredients = ingredients.filter(item => item.store === activeStore);

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
      items: currentIngredients.filter(ingredient => 
        items.some(item => ingredient.name.toLowerCase().includes(item))
      )
    })).filter(section => section.items.length > 0);

    setOptimizedRoute(route);
  };

  const handleAddToBasket = async () => {
    if (!userProfile?.connectedStores?.length) {
      toast({
        title: "No connected stores",
        description: "Please connect your supermarket accounts first.",
        variant: "destructive"
      });
      return;
    }

    const connectedStore = userProfile.connectedStores.find(
      (store: any) => store.name.toLowerCase() === activeStore
    );

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
      const shoppingItems = currentIngredients.map(item => ({
        name: item.name,
        quantity: item.amount
      }));

      const result = await addItemsToBasket(
        activeStore,
        connectedStore.credentials,
        shoppingItems
      );

      if (result.success) {
        toast({
          title: "Items added to basket!",
          description: `Successfully added ${shoppingItems.length} items to your ${currentStore.name} basket.`,
        });
        
        if (result.basketUrl) {
          window.open(result.basketUrl, '_blank');
        }
      } else {
        throw new Error(result.error || 'Failed to add items to basket');
      }
    } catch (error) {
      console.error('Error adding to basket:', error);
      toast({
        title: "Failed to add to basket",
        description: "There was an error adding items to your basket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAddingToBasket(false);
    }
  };

  useEffect(() => {
    generateOptimizedRoute();
  }, [activeStore, currentIngredients]);

  return (
    <div className="space-y-6">
      {/* Shopping List Header */}
      <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Shopping List</h2>
            <p className="text-gray-600 mt-1">
              Optimized for your weekly meal plan with live price comparisons
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {currentIngredients.length}
              </div>
              <div className="text-sm text-gray-600">Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                £{currentStore.total.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Store Selection Tabs */}
      <Tabs value={activeStore} onValueChange={setActiveStore}>
        <TabsList className="grid w-full grid-cols-4 bg-white border shadow-sm">
          {stores.map(store => {
            const { logo, emoji } = getSupermarketLogo(store.id);
            return (
              <TabsTrigger 
                key={store.id}
                value={store.id}
                className="flex flex-col items-center space-y-1 p-3 data-[state=active]:bg-blue-50 data-[state=active]:border-blue-200"
              >
                <div className="flex items-center justify-center w-16 h-10 mb-1">
                  <img 
                    src={logo} 
                    alt={store.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) {
                        fallback.style.display = 'block';
                      }
                    }}
                  />
                  <span 
                    className="text-2xl hidden" 
                  >
                    {emoji}
                  </span>
                </div>
                <div className="text-center min-w-0 space-y-0.5">
                  <div className="font-medium text-xs truncate">{store.name}</div>
                  <div className="text-xs text-gray-600">£{store.total.toFixed(2)}</div>
                  {store.savings > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-green-100 text-green-700">
                      Save £{store.savings.toFixed(2)}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {stores.map(store => {
          const { logo, emoji } = getSupermarketLogo(store.id);
          return (
            <TabsContent key={store.id} value={store.id} className="space-y-6">
              {/* Store Info Card */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-12 flex items-center justify-center flex-shrink-0">
                      <img 
                        src={logo} 
                        alt={store.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'block';
                          }
                        }}
                      />
                      <span 
                        className="text-4xl hidden"
                      >
                        {emoji}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{store.name}</h3>
                      <div className="flex flex-col space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{store.address}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4 flex-shrink-0" />
                          <span>{store.deliveryTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-4">
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
                      {checkedItems.size} of {currentIngredients.length} collected
                    </Badge>
                    <Button size="sm" variant="outline" onClick={generateOptimizedRoute}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Optimize Route
                    </Button>
                  </div>
                </div>

                {optimizedRoute.length > 0 ? (
                  <div className="space-y-6">
                    {optimizedRoute.map((section, index) => (
                      <div key={index} className="space-y-3">
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
                          {section.items.map((item, itemIndex) => (
                            <div 
                              key={itemIndex}
                              className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                                checkedItems.has(item.name) 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => toggleItem(item.name)}
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                {checkedItems.has(item.name) ? (
                                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                                <div className="w-12 h-12 flex-shrink-0">
                                  <img 
                                    src={item.image} 
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-900">
                                    {item.name}
                                  </div>
                                  <div className="text-sm text-gray-600">{item.amount}</div>
                                </div>
                              </div>
                              
                              <div className="text-right flex-shrink-0 ml-4">
                                <div className="font-medium text-gray-900">£{item.price.toFixed(2)}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentIngredients.map((item, index) => (
                      <div 
                        key={index}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer ${
                          checkedItems.has(item.name) 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => toggleItem(item.name)}
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {checkedItems.has(item.name) ? (
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                          <div className="w-12 h-12 flex-shrink-0">
                            <img 
                              src={item.image} 
                              alt={item.name}
                              className="w-full h-full object-cover rounded-md"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900">
                              {item.name}
                            </div>
                            <div className="text-sm text-gray-600">{item.amount}</div>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className="font-medium text-gray-900">£{item.price.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button 
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
                  onClick={handleAddToBasket}
                  disabled={addingToBasket}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {addingToBasket ? 'Adding...' : `Add to ${store.name} Basket`}
                </Button>
                <Button variant="outline" className="flex-1">
                  Export Shopping List
                </Button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Live Weekly Cost Comparison */}
      {totalWeeklyCosts && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
          <h3 className="font-semibold text-lg mb-4">Live Weekly Cost Comparison</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stores.map(store => {
              const { logo, emoji } = getSupermarketLogo(store.id);
              return (
                <div key={store.id} className="text-center p-4 bg-white rounded-lg shadow-sm">
                  <div className="w-16 h-10 mx-auto mb-3 flex items-center justify-center">
                    <img 
                      src={logo} 
                      alt={store.name}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) {
                          fallback.style.display = 'block';
                        }
                      }}
                    />
                    <span 
                      className="text-2xl hidden"
                    >
                      {emoji}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{store.name}</div>
                    <div className="text-lg font-bold text-blue-600">
                      £{store.total.toFixed(2)}
                    </div>
                    {store.savings > 0 && (
                      <div className="text-xs text-green-600">
                        Save £{store.savings.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
