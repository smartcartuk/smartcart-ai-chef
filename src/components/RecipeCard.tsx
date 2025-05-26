
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Recipe {
  day: string;
  recipe_name: string;
  ingredients: string[];
  instructions: string;
  estimated_price?: number;
  image?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  index: number;
  isExpanded: boolean;
  onToggleDetails: (index: number) => void;
  onAddToPlan: (recipe: Recipe) => void;
  estimatedPrice?: number;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  index,
  isExpanded,
  onToggleDetails,
  onAddToPlan,
  estimatedPrice
}) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video overflow-hidden">
        <img 
          src={recipe.image} 
          alt={recipe.recipe_name}
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">
              {recipe.day}
            </Badge>
            {estimatedPrice !== undefined && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                £{estimatedPrice.toFixed(2)}
              </Badge>
            )}
          </div>
          <h3 className="font-bold text-lg">{recipe.recipe_name}</h3>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={() => onToggleDetails(index)}
            variant="outline" 
            size="sm"
            className="flex-1"
          >
            {isExpanded ? 'Hide Details' : 'View Recipe'}
          </Button>
          <Button 
            onClick={() => onAddToPlan(recipe)}
            size="sm"
            className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600"
          >
            Add to Plan
          </Button>
        </div>

        {isExpanded && (
          <div className="pt-3 border-t border-gray-100 space-y-3">
            <div>
              <h4 className="font-semibold text-sm mb-2">Ingredients:</h4>
              <ul className="text-sm space-y-1">
                {recipe.ingredients.map((ingredient, idx) => (
                  <li key={idx} className="flex items-center">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                    {ingredient}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-sm mb-2">Instructions:</h4>
              <p className="text-sm text-gray-600">{recipe.instructions}</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
