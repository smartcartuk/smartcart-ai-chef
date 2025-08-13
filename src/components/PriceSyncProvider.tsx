import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getEnhancedRealTimePrices, normalizeIngredientName } from '@/utils/enhancedPriceService';

interface PriceSyncContextType {
  issyncing: boolean;
  lastSyncTime: Date | null;
  syncProgress: number;
  totalIngredients: number;
  syncedIngredients: number;
  startSync: (ingredients: string[]) => Promise<void>;
}

const PriceSyncContext = createContext<PriceSyncContextType | undefined>(undefined);

export const usePriceSync = () => {
  const context = useContext(PriceSyncContext);
  if (!context) {
    throw new Error('usePriceSync must be used within a PriceSyncProvider');
  }
  return context;
};

interface PriceSyncProviderProps {
  children: React.ReactNode;
}

export const PriceSyncProvider: React.FC<PriceSyncProviderProps> = ({ children }) => {
  const [issyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [totalIngredients, setTotalIngredients] = useState(0);
  const [syncedIngredients, setSyncedIngredients] = useState(0);

  // Common ingredients that should always have fresh prices
  const commonIngredients = [
    'chicken breast', 'beef mince', 'salmon fillet', 'eggs', 'milk', 'butter',
    'bread', 'rice', 'pasta', 'potatoes', 'onions', 'carrots', 'tomatoes',
    'cheese', 'yogurt', 'oil', 'flour', 'sugar', 'garlic', 'broccoli'
  ];

  const startSync = async (ingredients: string[] = commonIngredients) => {
    if (issyncing) return;

    setIsSyncing(true);
    setTotalIngredients(ingredients.length);
    setSyncedIngredients(0);
    setSyncProgress(0);

    console.log('🔄 Starting background price sync for', ingredients.length, 'ingredients');

    try {
      // Sync prices in batches to avoid overwhelming the API
      const batchSize = 5;
      const stores = ['tesco', 'sainsburys', 'asda', 'aldi', 'morrisons', 'lidl'];

      for (let i = 0; i < ingredients.length; i += batchSize) {
        const batch = ingredients.slice(i, i + batchSize);
        
        // Process batch in parallel
        await Promise.all(
          batch.map(async (ingredient) => {
            try {
              // Check if we have recent prices (less than 1 hour old)
              const { data: existingPrices } = await supabase
                .from('prices')
                .select('*')
                .eq('ingredient_name', normalizeIngredientName(ingredient))
                .gte('last_updated', new Date(Date.now() - 60 * 60 * 1000).toISOString());

              if (!existingPrices || existingPrices.length < stores.length) {
                // Fetch fresh prices
                await getEnhancedRealTimePrices(ingredient, '1', stores);
                console.log(`✅ Synced prices for: ${ingredient}`);
              } else {
                console.log(`⏭️ Skipped ${ingredient} (recent prices available)`);
              }

              setSyncedIngredients(prev => prev + 1);
              setSyncProgress(((i + batch.indexOf(ingredient) + 1) / ingredients.length) * 100);
            } catch (error) {
              console.error(`❌ Failed to sync prices for ${ingredient}:`, error);
            }
          })
        );

        // Small delay between batches to be respectful to external APIs
        if (i + batchSize < ingredients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setLastSyncTime(new Date());
      console.log('✅ Background price sync completed');
    } catch (error) {
      console.error('❌ Background price sync failed:', error);
    } finally {
      setIsSyncing(false);
      setSyncProgress(100);
    }
  };

  // Auto-sync on mount and every 30 minutes
  useEffect(() => {
    // Initial sync after 5 seconds to not block app startup
    const initialTimeout = setTimeout(() => {
      startSync();
    }, 5000);

    // Regular sync every 30 minutes
    const interval = setInterval(() => {
      startSync();
    }, 30 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  // Listen for real-time updates and trigger sync if needed
  useEffect(() => {
    const channel = supabase
      .channel('price-sync-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meal_plans'
        },
        (payload) => {
          console.log('New meal plan detected, syncing ingredient prices...');
          // Extract ingredients from new meal plan and sync their prices
          try {
            const mealPlanData = payload.new.data;
            if (mealPlanData?.meals) {
              const ingredients: string[] = mealPlanData.meals.flatMap((meal: any) => 
                meal.ingredients?.map((ing: any) => 
                  typeof ing === 'string' ? ing : ing?.name
                ).filter((name): name is string => Boolean(name)) || []
              );
              
              if (ingredients.length > 0) {
                const uniqueIngredients = [...new Set(ingredients)];
                startSync(uniqueIngredients); // Remove duplicates
              }
            }
          } catch (error) {
            console.error('Error processing meal plan for price sync:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const value: PriceSyncContextType = {
    issyncing,
    lastSyncTime,
    syncProgress,
    totalIngredients,
    syncedIngredients,
    startSync
  };

  return (
    <PriceSyncContext.Provider value={value}>
      {children}
    </PriceSyncContext.Provider>
  );
};