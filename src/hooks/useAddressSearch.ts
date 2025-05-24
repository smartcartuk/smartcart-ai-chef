
import { useState } from 'react';

export const useAddressSearch = () => {
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }

    // Mock API call - in real app would use postcode.io or similar
    const mockAddresses = [
      '123 High Street, London, SW1A 1AA',
      '456 Queen\'s Road, London, SW1A 1AB',
      '789 King\'s Avenue, London, SW1A 1AC',
      '321 Prince Street, London, SW1A 1AD',
      '654 Royal Lane, London, SW1A 1AE'
    ].filter(addr => 
      addr.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().includes('sw1a')
    );

    setAddressSuggestions(mockAddresses);
    setShowAddressSuggestions(true);
  };

  const selectAddress = (address: string, updateAddress: (field: string, value: string) => void) => {
    const parts = address.split(', ');
    updateAddress('street', parts[0] || '');
    updateAddress('city', parts[1] || '');
    updateAddress('postcode', parts[2] || '');
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
  };

  return {
    addressSuggestions,
    showAddressSuggestions,
    searchAddresses,
    selectAddress
  };
};
