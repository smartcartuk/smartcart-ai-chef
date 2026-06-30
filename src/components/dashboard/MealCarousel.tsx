import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Shuffle } from 'lucide-react';

interface Meal {
  day: string;
  recipe_name: string;
  estimated_cost?: number;
  image?: string;
  prep_time?: number;
  servings?: number;
  kg_token?: string;
}

interface MealCarouselProps {
  meals: Meal[];
  onSwapMeal: (index: number) => void;
  onRegenerateAll: () => void;
  isLoading?: boolean;
  weekLabel?: string;
}

const DAY_COLORS = [
  'bg-amber-50 border-amber-100',
  'bg-blue-50 border-blue-100',
  'bg-pink-50 border-pink-100',
  'bg-emerald-50 border-emerald-100',
  'bg-purple-50 border-purple-100',
  'bg-red-50 border-red-100',
  'bg-teal-50 border-teal-100',
];

const FOOD_EMOJIS = ['🍳', '🍝', '🍛', '🥗', '🐟', '🌮', '🍲'];

export const MealCarousel: React.FC<MealCarouselProps> = ({
  meals,
  onSwapMeal,
  onRegenerateAll,
  isLoading,
  weekLabel,
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-foreground">This week's plan</h2>
          {weekLabel && (
            <p className="text-xs text-muted-foreground">{weekLabel}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerateAll}
          disabled={isLoading}
          className="text-xs text-muted-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
          New plan
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
        {isLoading ? (
          Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="min-w-[140px] h-[180px] rounded-xl bg-muted animate-pulse flex-shrink-0 snap-start"
            />
          ))
        ) : (
          meals.map((meal, i) => (
            <Card
              key={i}
              className={`min-w-[140px] flex-shrink-0 overflow-hidden border snap-start cursor-pointer group hover:shadow-md transition-shadow ${DAY_COLORS[i % 7]}`}
              onClick={() => onSwapMeal(i)}
            >
              {meal.image ? (
                <div className="h-[80px] overflow-hidden">
                  <img
                    src={meal.image}
                    alt={meal.recipe_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-[80px] flex items-center justify-center text-3xl">
                  {FOOD_EMOJIS[i % 7]}
                </div>
              )}
              <div className="p-3 space-y-1">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {meal.day}
                </p>
                <p className="text-xs font-medium text-foreground leading-snug line-clamp-2">
                  {meal.recipe_name}
                </p>
                {meal.estimated_cost && (
                  <p className="text-[11px] font-medium text-primary">
                    £{meal.estimated_cost.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white/90 rounded-full p-1 shadow-sm">
                  <Shuffle className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  );
};
