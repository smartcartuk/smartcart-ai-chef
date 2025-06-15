
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  image?: string;
  description?: string;
  nutritional_info?: NutritionalInfo;
  cost_per_meal?: number;
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
  // Helper function to format ingredients
  const formatIngredient = (ingredient: string | Ingredient) => {
    if (typeof ingredient === 'string') {
      return ingredient;
    }
    return `${ingredient.amount} ${ingredient.name}`;
  };

  // Helper function to format instructions
  const formatInstructions = (instructions: string | string[]) => {
    if (typeof instructions === 'string') {
      return instructions;
    }
    return instructions.join(' ');
  };

  // Get the actual price to display
  const displayPrice = recipe.estimated_cost || recipe.cost_per_meal || recipe.estimated_price || estimatedPrice || 0;

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
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              £{displayPrice.toFixed(2)}
            </Badge>
          </div>
          <h3 className="font-bold text-lg">{recipe.recipe_name}</h3>
          {recipe.description && (
            <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
          )}
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
          <div className="pt-3 border-t border-gray-100 space-y-4">
            {/* Ingredients Section */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Ingredients:</h4>
              <ul className="text-sm space-y-2">
                {recipe.ingredients.map((ingredient, idx) => {
                  if (typeof ingredient === 'object' && 'name' in ingredient) {
                    return (
                      <li key={idx} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                          <span>{formatIngredient(ingredient)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {ingredient.price && (
                            <span className="text-xs text-gray-500">£{ingredient.price.toFixed(2)}</span>
                          )}
                          {ingredient.product_url && (
                            <a 
                              href={ingredient.product_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                            >
                              Buy
                            </a>
                          )}
                        </div>
                      </li>
                    );
                  }
                  return (
                    <li key={idx} className="flex items-center">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                      {formatIngredient(ingredient)}
                    </li>
                  );
                })}
              </ul>
            </div>
            
            {/* Instructions Section */}
            <div>
              <h4 className="font-semibold text-sm mb-2">Instructions:</h4>
              <div className="text-sm text-gray-600">
                {typeof recipe.instructions === 'string' ? (
                  <p>{recipe.instructions}</p>
                ) : (
                  <ol className="list-decimal list-inside space-y-1">
                    {recipe.instructions.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            {/* Nutritional Information */}
            {recipe.nutritional_info && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Nutritional Breakdown:</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {recipe.nutritional_info.calories && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Calories:</span> {recipe.nutritional_info.calories}
                    </div>
                  )}
                  {recipe.nutritional_info.protein && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Protein:</span> {recipe.nutritional_info.protein}g
                    </div>
                  )}
                  {recipe.nutritional_info.carbs && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Carbs:</span> {recipe.nutritional_info.carbs}g
                    </div>
                  )}
                  {recipe.nutritional_info.fat && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Fat:</span> {recipe.nutritional_info.fat}g
                    </div>
                  )}
                  {recipe.nutritional_info.fiber && (
                    <div className="bg-gray-50 p-2 rounded">
                      <span className="font-medium">Fiber:</span> {recipe.nutritional_info.fiber}g
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cost Information */}
            <div className="bg-green-50 p-3 rounded">
              <h4 className="font-semibold text-sm mb-1">Cost Information:</h4>
              <div className="text-sm text-green-700">
                <div>Per meal: £{displayPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
