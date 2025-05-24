
import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard } from 'lucide-react';

interface ConnectStoresStepProps {
  profile: any;
  onToggleStore: (store: any) => void;
  onUpdateStoreCredentials: (storeName: string, field: string, value: string) => void;
}

export const ConnectStoresStep: React.FC<ConnectStoresStepProps> = ({
  profile,
  onToggleStore,
  onUpdateStoreCredentials
}) => {
  const storeOptions = [
    { 
      name: 'Tesco', 
      logo: '🛒', 
      description: 'Clubcard savings',
      loyaltyCard: 'Clubcard',
      website: 'tesco.com'
    },
    { 
      name: 'Sainsbury\'s', 
      logo: '🛍️', 
      description: 'Nectar points',
      loyaltyCard: 'Nectar Card',
      website: 'sainsburys.co.uk'
    },
    { 
      name: 'Asda', 
      logo: '🏪', 
      description: 'Everyday low prices',
      loyaltyCard: 'ASDA Rewards',
      website: 'asda.com'
    },
    { 
      name: 'Morrisons', 
      logo: '🥬', 
      description: 'Fresh market',
      loyaltyCard: 'More Card',
      website: 'morrisons.com'
    },
    { 
      name: 'Amazon Fresh', 
      logo: '📦', 
      description: 'Prime delivery',
      loyaltyCard: 'Prime Account',
      website: 'amazon.co.uk/fresh'
    },
    { 
      name: 'Ocado', 
      logo: '🚚', 
      description: 'Premium quality',
      loyaltyCard: 'Smart Pass',
      website: 'ocado.com'
    },
    { 
      name: 'Waitrose', 
      logo: '🌟', 
      description: 'Quality & sustainability',
      loyaltyCard: 'myWaitrose',
      website: 'waitrose.com'
    },
    { 
      name: 'M&S Food', 
      logo: '🛍️', 
      description: 'Premium groceries',
      loyaltyCard: 'Sparks Card',
      website: 'marksandspencer.com/food'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Connect Your Stores</h2>
        <p className="text-gray-600">Link your supermarket accounts to compare prices and apply discounts</p>
      </div>
      
      <div className="grid gap-4">
        {storeOptions.map((store) => {
          const isConnected = profile.connectedStores.some(s => s.name === store.name);
          const storeData = profile.connectedStores.find(s => s.name === store.name);
          
          return (
            <div key={store.name} className="space-y-4">
              <div
                onClick={() => onToggleStore(store)}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  isConnected
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{store.logo}</div>
                    <div>
                      <h3 className="font-semibold text-lg">{store.name}</h3>
                      <p className="text-gray-600">{store.description}</p>
                      <p className="text-sm text-gray-500">{store.website}</p>
                    </div>
                  </div>
                  <Checkbox 
                    checked={isConnected}
                    disabled={true}
                  />
                </div>
              </div>

              {isConnected && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard size={16} />
                      <h4 className="font-medium">Connect your {store.name} account</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor={`${store.name}-email`} className="text-xs">Email/Username</Label>
                        <Input
                          id={`${store.name}-email`}
                          type="email"
                          placeholder="your.email@example.com"
                          value={storeData?.credentials?.username || ''}
                          onChange={(e) => onUpdateStoreCredentials(store.name, 'username', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`${store.name}-password`} className="text-xs">Password</Label>
                        <Input
                          id={`${store.name}-password`}
                          type="password"
                          placeholder="••••••••"
                          value={storeData?.credentials?.password || ''}
                          onChange={(e) => onUpdateStoreCredentials(store.name, 'password', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor={`${store.name}-loyalty`} className="text-xs">{store.loyaltyCard} Number (Optional)</Label>
                        <Input
                          id={`${store.name}-loyalty`}
                          placeholder="1234567890"
                          value={storeData?.credentials?.loyaltyCard || ''}
                          onChange={(e) => onUpdateStoreCredentials(store.name, 'loyaltyCard', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          🔒 Your account details are securely encrypted and only used for price comparison and automated shopping.
        </p>
      </div>
    </div>
  );
};
