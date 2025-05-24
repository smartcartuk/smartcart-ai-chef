
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface ShoppingListProps {
  userProfile: any;
}

const mockShoppingItems = {
  'Fresh Produce': [
    { name: 'Salmon Fillets', quantity: '4 portions', price: 12.99, store: 'Tesco', checked: false },
    { name: 'Cherry Tomatoes', quantity: '2 punnets', price: 3.50, store: 'Sainsburys', checked: false },
    { name: 'Cucumber', quantity: '2 pieces', price: 1.20, store: 'Asda', checked: false },
    { name: 'Mixed Mushrooms', quantity: '500g', price: 2.80, store: 'Tesco', checked: false },
    { name: 'Lemons', quantity: '4 pieces', price: 1.60, store: 'Asda', checked: false }
  ],
  'Pantry Staples': [
    { name: 'Arborio Rice', quantity: '1kg', price: 3.20, store: 'Asda', checked: false },
    { name: 'Quinoa', quantity: '500g', price: 4.50, store: 'Sainsburys', checked: false },
    { name: 'Coconut Milk', quantity: '2 tins', price: 2.40, store: 'Tesco', checked: false },
    { name: 'Tahini', quantity: '1 jar', price: 3.99, store: 'Sainsburys', checked: false }
  ],
  'Meat & Dairy': [
    { name: 'Beef Mince', quantity: '500g', price: 5.20, store: 'Asda', checked: false },
    { name: 'Chicken Breast', quantity: '2 portions', price: 6.50, store: 'Tesco', checked: false },
    { name: 'Parmesan Cheese', quantity: '200g', price: 4.80, store: 'Sainsburys', checked: false },
    { name: 'Greek Yogurt', quantity: '1 large pot', price: 2.20, store: 'Asda', checked: false }
  ],
  'Frozen & Convenience': [
    { name: 'Cod Fillets', quantity: '4 portions', price: 8.99, store: 'Tesco', checked: false },
    { name: 'Frozen Peas', quantity: '1kg bag', price: 2.00, store: 'Asda', checked: false },
    { name: 'Lasagne Sheets', quantity: '1 pack', price: 1.85, store: 'Sainsburys', checked: false }
  ]
};

export const ShoppingList: React.FC<ShoppingListProps> = ({ userProfile }) => {
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});
  const [selectedStore, setSelectedStore] = useState<string>('all');

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

  const totalCost = Object.values(mockShoppingItems)
    .flat()
    .reduce((sum, item) => sum + item.price, 0);

  const storeBreakdown = Object.values(mockShoppingItems)
    .flat()
    .reduce((acc, item) => {
      acc[item.store] = (acc[item.store] || 0) + item.price;
      return acc;
    }, {} as {[key: string]: number});

  return (
    <div className="space-y-6">
      {/* Shopping List Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Smart Shopping List</h2>
            <p className="text-gray-600 mt-1">
              Optimized across {Object.keys(storeBreakdown).length} stores for maximum savings
            </p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">£{totalCost.toFixed(2)}</div>
              <div className="text-sm text-gray-600">Total Cost</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">£8.40</div>
              <div className="text-sm text-gray-600">You Save</div>
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
          All Stores
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
        {Object.entries(mockShoppingItems).map(([category, items]) => (
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
