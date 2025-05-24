
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, MapPin, Search } from 'lucide-react';

interface PersonalDetailsStepProps {
  profile: any;
  setProfile: (updater: (prev: any) => any) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  addressSuggestions: string[];
  showAddressSuggestions: boolean;
  onAddressSearch: (query: string) => void;
  onAddressSelect: (address: string) => void;
}

export const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  profile,
  setProfile,
  showPassword,
  setShowPassword,
  addressSuggestions,
  showAddressSuggestions,
  onAddressSearch,
  onAddressSelect
}) => {
  const updateAddress = (field: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Create Your Account</h2>
        <p className="text-gray-600">Let's start with your personal details</p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={profile.name}
            onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter your full name"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={profile.email}
            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your email"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={profile.password}
              onChange={(e) => setProfile(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Create a secure password"
              className="mt-1 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MapPin size={20} />
            Your Address
          </h3>
          
          <div className="relative">
            <Label htmlFor="address-search">Search by postcode or start typing your address</Label>
            <div className="relative">
              <Input
                id="address-search"
                value={profile.address.street}
                onChange={(e) => {
                  updateAddress('street', e.target.value);
                  onAddressSearch(e.target.value);
                }}
                placeholder="SW1A 1AA or 10 Downing Street..."
                className="mt-1 pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
            
            {showAddressSuggestions && addressSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {addressSuggestions.map((address, index) => (
                  <button
                    key={index}
                    onClick={() => onAddressSelect(address)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    {address}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={profile.address.city}
                onChange={(e) => updateAddress('city', e.target.value)}
                placeholder="London"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="postcode">Postcode</Label>
              <Input
                id="postcode"
                value={profile.address.postcode}
                onChange={(e) => updateAddress('postcode', e.target.value)}
                placeholder="SW1A 1AA"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="household">Household Size</Label>
              <Input
                id="household"
                type="number"
                min="1"
                max="8"
                value={profile.householdSize}
                onChange={(e) => setProfile(prev => ({ ...prev, householdSize: parseInt(e.target.value) }))}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="budget">Weekly Budget (£)</Label>
              <Input
                id="budget"
                type="number"
                min="20"
                max="200"
                value={profile.weeklyBudget}
                onChange={(e) => setProfile(prev => ({ ...prev, weeklyBudget: parseInt(e.target.value) }))}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
