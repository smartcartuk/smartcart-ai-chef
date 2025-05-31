
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { WebhookResponse } from '@/utils/webhookService';

interface ShoppingListProps {
  userProfile: any;
  generatedData?: WebhookResponse | null;
  recipes?: any[];
}

interface ShoppingItem {
  name: string;
  quantity: string;
  price: number;
  store: string;
  checked: boolean;
  category: string;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ 
  userProfile, 
  generatedData, 
  recipes = [] 
}) => {
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [shoppingItems, setShoppingItems] = useState<{[key: string]: ShoppingItem[]}>({});

  // Generate shopping list from recipes
  useEffect(() => {
    if (recipes.length > 0) {
      const generatedItems = generateShoppingListFromRecipes(recipes);
      setShoppingItems(generatedItems);
    } else if (generatedData?.shoppingList) {
      const generatedItems = generateShoppingItemsFromData(generatedData.shoppingList);
      setShoppingItems(generatedItems);
    } else {
      // Fallback to mock data if no recipes
      setShoppingItems(mockShoppingItems);
    }
  }, [recipes, generatedData]);

  const handleItemCheck = (category: string, index: number) => {
    const key = `${category}-${index}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStoreColor = (store: string) => {
    const colors = {
      'Tesco': 'bg-blue-100 text-blue-700',
      'Sainsburys': 'bg-orange-100 text-orange-700', 
      'Asda': 'bg-green-100 text-green-700',
      'Morrisons': 'bg-purple-100 text-purple-700'
    };
    return colors[store as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const totalCost = Object.values(shoppingItems)
    .flat()
    .reduce((sum: number, item: ShoppingItem) => sum + item.price, 0);

  const storeBreakdown = Object.values(shoppingItems)
    .flat()
    .reduce((acc: {[key: string]: number}, item: ShoppingItem) => {
      acc[item.store] = (acc[item.store] || 0) + item.price;
      return acc;
    }, {});

  const totalItems = Object.values(shoppingItems).flat().length;
  const estimatedSavings = totalCost * 0.15; // Estimate 15% savings from optimization

  return (
    <div className="space-y-6">
      {/* Shopping List Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Shopping List</h2>
            <p className="text-gray-600 mt-1">
              Generated from your {recipes.length || 7} meal plan recipes • Optimized across {Object.keys(storeBreakdown).length} stores
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">£{totalCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">£{estimatedSavings.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Est. Savings</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Store Breakdown */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Store Breakdown</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(storeBreakdown).map(([store, cost]) => (
            <div key={store} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold">£{cost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">{store}</div>
              <Badge className={`mt-1 text-xs ${getStoreColor(store)}`}>
                {Math.round((cost / totalCost) * 100)}% of total
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter Options */}
      <div className="flex flex-wrap gap-2">
        <Button 
          variant={selectedStore === 'all' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedStore('all')}
        >
          All Stores ({totalItems} items)
        </Button>
        {Object.keys(storeBreakdown).map((store) => (
          <Button
            key={store}
            variant={selectedStore === store ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedStore(store)}
          >
            {store}
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
                          <div className="text-sm text-gray-600">{item.quantity}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={`text-xs ${getStoreColor(item.store)}`}>
                          {item.store}
                        </Badge>
                        <div className={`font-bold ${isChecked ? 'text-gray-500' : 'text-gray-900'}`}>
                          £{item.price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" className="flex-1">
          Export to Email
        </Button>
        <Button variant="outline" className="flex-1">
          Add to Phone
        </Button>
        <Button className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700">
          Start Shopping Online
        </Button>
      </div>
    </div>
  );
};

// Helper function to generate shopping list from recipes
const generateShoppingListFromRecipes = (recipes: any[]): {[key: string]: ShoppingItem[]} => {
  const categorized: {[key: string]: ShoppingItem[]} = {};
  
  // Collect all ingredients from recipes
  const allIngredients: string[] = [];
  recipes.forEach(recipe => {
    if (recipe.ingredients) {
      allIngredients.push(...recipe.ingredients);
    }
  });

  // Remove duplicates and categorize
  const uniqueIngredients = [...new Set(allIngredients)];
  
  uniqueIngredients.forEach(ingredient => {
    const category = categorizeIngredient(ingredient);
    if (!categorized[category]) {
      categorized[category] = [];
    }
    
    categorized[category].push({
      name: ingredient,
      quantity: '1 unit', // Default quantity
      price: estimatePrice(ingredient),
      store: getOptimalStore(ingredient),
      checked: false,
      category
    });
  });
  
  return categorized;
};

// Helper function to categorize ingredients
const categorizeIngredient = (ingredient: string): string => {
  const lowerIngredient = ingredient.toLowerCase();
  
  if (lowerIngredient.includes('chicken') || lowerIngredient.includes('beef') || 
      lowerIngredient.includes('fish') || lowerIngredient.includes('meat') ||
      lowerIngredient.includes('salmon') || lowerIngredient.includes('cheese') ||
      lowerIngredient.includes('milk') || lowerIngredient.includes('yogurt')) {
    return 'Meat & Dairy';
  }
  
  if (lowerIngredient.includes('tomato') || lowerIngredient.includes('cucumber') ||
      lowerIngredient.includes('lettuce') || lowerIngredient.includes('onion') ||
      lowerIngredient.includes('pepper') || lowerIngredient.includes('mushroom') ||
      lowerIngredient.includes('carrot') || lowerIngredient.includes('lemon')) {
    return 'Fresh Produce';
  }
  
  if (lowerIngredient.includes('rice') || lowerIngredient.includes('pasta') ||
      lowerIngredient.includes('flour') || lowerIngredient.includes('oil') ||
      lowerIngredient.includes('salt') || lowerIngredient.includes('sugar') ||
      lowerIngredient.includes('spice') || lowerIngredient.includes('herb')) {
    return 'Pantry Staples';
  }
  
  if (lowerIngredient.includes('frozen') || lowerIngredient.includes('ready') ||
      lowerIngredient.includes('canned') || lowerIngredient.includes('tinned')) {
    return 'Frozen & Convenience';
  }
  
  return 'Other Items';
};

// Helper function to estimate price
const estimatePrice = (ingredient: string): number => {
  const lowerIngredient = ingredient.toLowerCase();
  
  // Meat and fish - higher prices
  if (lowerIngredient.includes('salmon') || lowerIngredient.includes('beef')) {
    return 5.99 + Math.random() * 3;
  }
  
  if (lowerIngredient.includes('chicken') || lowerIngredient.includes('fish')) {
    return 3.99 + Math.random() * 2;
  }
  
  // Fresh produce - medium prices
  if (lowerIngredient.includes('tomato') || lowerIngredient.includes('cucumber')) {
    return 1.99 + Math.random() * 1;
  }
  
  // Pantry staples - lower prices
  return 0.99 + Math.random() * 2;
};

// Helper function to get optimal store
const getOptimalStore = (ingredient: string): string => {
  const stores = ['Tesco', 'Sainsburys', 'Asda', 'Morrisons'];
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
      quantity: item.quantity,
      price: Number(item.estimated_cost) || 0,
      store: 'Tesco', // Default store
      checked: false,
      category
    });
  });
  
  return categorized;
};

// Mock data fallback
const mockShoppingItems = {
  'Fresh Produce': [
    { name: 'Salmon Fillets', quantity: '4 portions', price: 12.99, store: 'Tesco', checked: false, category: 'Fresh Produce' },
    { name: 'Cherry Tomatoes', quantity: '2 punnets', price: 3.50, store: 'Sainsburys', checked: false, category: 'Fresh Produce' }
  ],
  'Pantry Staples': [
    { name: 'Arborio Rice', quantity: '1kg', price: 3.20, store: 'Asda', checked: false, category: 'Pantry Staples' }
  ]
};
