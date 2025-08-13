import { useState } from 'react';

interface AddressSearchResult {
  formatted_address: string;
  place_id: string;
}

export const useAddressSearch = () => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const searchAddress = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      // Mock address suggestions for demonstration
      // In a real app, you would use Google Places API or similar
      const mockSuggestions = [
        `${query} Street, London, UK`,
        `${query} Road, Manchester, UK`,
        `${query} Avenue, Birmingham, UK`,
        `${query} Close, Edinburgh, UK`,
        `${query} Gardens, Cardiff, UK`
      ];

      setSuggestions(mockSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Address search error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectAddress = (address: string) => {
    setShowSuggestions(false);
    setSuggestions([]);
  };

  return {
    suggestions,
    showSuggestions,
    isLoading,
    searchAddress,
    selectAddress
  };
};