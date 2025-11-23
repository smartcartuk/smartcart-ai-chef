import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Users, DollarSign } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MealOption {
  id: string;
  name: string;
  image: string;
  estimatedCost: number;
  mealType: string;
  ingredients: any[];
  prepTime: string;
  servings: number;
  difficulty?: string;
}

interface MealOptionsGridProps {
  mealOptions: MealOption[];
  selectedIds: string[];
  onToggleSelection: (id: string) => void;
  mealTypes: string[];
}

export const MealOptionsGrid: React.FC<MealOptionsGridProps> = ({
  mealOptions,
  selectedIds,
  onToggleSelection,
  mealTypes
}) => {
  const [activeTab, setActiveTab] = useState<string>(mealTypes[0] || 'breakfast');
  const [sortBy, setSortBy] = useState<'cost' | 'time' | 'name'>('cost');

  // Filter meals by type
  const getFilteredMeals = (type: string) => {
    return mealOptions.filter(meal => meal.mealType === type);
  };

  // Sort meals
  const sortMeals = (meals: MealOption[]) => {
    return [...meals].sort((a, b) => {
      if (sortBy === 'cost') return a.estimatedCost - b.estimatedCost;
      if (sortBy === 'time') return parseInt(a.prepTime) - parseInt(b.prepTime);
      return a.name.localeCompare(b.name);
    });
  };

  const renderMealCard = (meal: MealOption) => {
    const isSelected = selectedIds.includes(meal.id);
    
    return (
      <Card 
        key={meal.id}
        className={`cursor-pointer transition-all hover:shadow-lg ${
          isSelected ? 'ring-2 ring-primary shadow-lg' : ''
        }`}
        onClick={() => onToggleSelection(meal.id)}
      >
        <div className="relative">
          <img 
            src={meal.image || '/placeholder.svg'} 
            alt={meal.name}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <div className="absolute top-2 right-2">
            <div 
              className="bg-white rounded-full p-2 shadow-md"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelection(meal.id);
              }}
            >
              <Checkbox checked={isSelected} />
            </div>
          </div>
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="bg-white/90 text-primary font-semibold">
              £{meal.estimatedCost.toFixed(2)}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{meal.name}</h3>
          
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{meal.prepTime || '30'} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{meal.servings} servings</span>
            </div>
            {meal.difficulty && (
              <Badge variant="outline" className="text-xs">
                {meal.difficulty}
              </Badge>
            )}
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            {meal.ingredients.length} ingredients
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Select Your Meals</h2>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cost">Price (Low to High)</SelectItem>
            <SelectItem value="time">Prep Time</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${mealTypes.length}, 1fr)` }}>
          {mealTypes.map(type => (
            <TabsTrigger key={type} value={type} className="capitalize">
              {type}
              <Badge variant="secondary" className="ml-2">
                {getFilteredMeals(type).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {mealTypes.map(type => (
          <TabsContent key={type} value={type} className="mt-6">
            {getFilteredMeals(type).length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No {type} options available</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortMeals(getFilteredMeals(type)).map(renderMealCard)}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
