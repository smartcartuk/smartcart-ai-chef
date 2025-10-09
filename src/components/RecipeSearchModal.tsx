import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecipeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: any) => void;
  userProfile: any;
  dayIndex?: number;
}

export const RecipeSearchModal = ({ isOpen, onClose, onSelectRecipe, userProfile, dayIndex }: RecipeSearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Enter a search term",
        description: "Please enter what you're looking for",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('spoonacular-meal-planner', {
        body: {
          action: 'search',
          query: searchQuery,
          userPreferences: {
            dietaryPreferences: userProfile.dietary_preferences || [],
            allergies: userProfile.allergies || [],
            householdSize: userProfile.household_size || 2,
            weeklyBudget: userProfile.weekly_budget || 80
          }
        }
      });

      if (error) throw error;

      if (data.success && data.recipes) {
        setSearchResults(data.recipes);
      } else {
        throw new Error('No recipes found');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search recipes",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectRecipe = (recipe: any) => {
    onSelectRecipe(recipe);
    onClose();
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Search for a Recipe {dayIndex !== undefined && `(Day ${dayIndex + 1})`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="e.g. 'chicken curry', 'pasta', 'salmon'"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="grid gap-4 mt-4">
            {searchResults.map((recipe, index) => (
              <Card key={index} className="p-4 cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleSelectRecipe(recipe)}>
                <div className="flex gap-4">
                  {recipe.image && (
                    <img src={recipe.image} alt={recipe.name} className="w-24 h-24 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{recipe.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>⏱️ {recipe.prepTime + recipe.cookTime} mins</span>
                      <span>💷 £{recipe.estimatedCost?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
