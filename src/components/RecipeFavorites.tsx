import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RecipeFavoritesProps {
  onAddToWeek?: (recipe: any) => void;
}

export const RecipeFavorites = ({ onAddToWeek }: RecipeFavoritesProps) => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('recipe_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error: any) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recipe_favorites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.id !== id));
      toast({
        title: "Removed from Favorites",
        description: "Recipe has been removed"
      });
    } catch (error: any) {
      console.error('Error removing favorite:', error);
      toast({
        title: "Error",
        description: "Failed to remove favorite",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Loading favorites...</div>;
  }

  if (favorites.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
        <p className="text-muted-foreground">
          Start adding recipes to your favorites to see them here
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Heart className="h-6 w-6 fill-primary text-primary" />
        Your Favorite Recipes
      </h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {favorites.map((favorite) => {
          const recipe = favorite.recipe_data;
          return (
            <Card key={favorite.id} className="p-4">
              <div className="space-y-3">
                {recipe.image && (
                  <img src={recipe.image} alt={recipe.name} className="w-full h-32 object-cover rounded" />
                )}
                <div>
                  <h3 className="font-semibold">{recipe.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">{recipe.description}</p>
                </div>
                <div className="flex gap-2">
                  {onAddToWeek && (
                    <Button size="sm" className="flex-1" onClick={() => onAddToWeek(recipe)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add to Week
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleRemoveFavorite(favorite.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
