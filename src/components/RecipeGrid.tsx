
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw } from 'lucide-react';
import { RecipeCard } from '@/components/RecipeCard';

interface Ingredient {
  name: string;
  amount: string;
  price?: number;
  product_url?: string;
}

interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

interface Recipe {
  day: string;
  recipe_name: string;
  ingredients: string[] | Ingredient[];
  instructions: string | string[];
  estimated_price?: number;
  estimated_cost?: number;
  cost_per_meal?: number;
  image?: string;
  description?: string;
  nutritional_info?: NutritionalInfo;
}

interface RecipeGridProps {
  recipes: Recipe[];
  expandedRecipes: Set<number>;
  regeneratingIndex: number | null;
  onToggleDetails: (index: number) => void;
  onAddToPlan: (recipe: Recipe) => void;
  onRegenerateSingleRecipe: (index: number) => void;
}

export const RecipeGrid: React.FC<RecipeGridProps> = ({
  recipes,
  expandedRecipes,
  regeneratingIndex,
  onToggleDetails,
  onAddToPlan,
  onRegenerateSingleRecipe
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe, index) => (
        <div key={index} className="relative">
          <RecipeCard
            recipe={recipe}
            index={index}
            isExpanded={expandedRecipes.has(index)}
            onToggleDetails={onToggleDetails}
            onAddToPlan={onAddToPlan}
            estimatedPrice={recipe.estimated_price}
          />
          <div className="absolute top-2 right-2">
            <Button
              onClick={() => onRegenerateSingleRecipe(index)}
              disabled={regeneratingIndex === index}
              size="sm"
              variant="outline"
              className="bg-white/90 hover:bg-white"
            >
              {regeneratingIndex === index ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
