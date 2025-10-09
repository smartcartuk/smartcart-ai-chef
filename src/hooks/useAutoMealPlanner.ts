import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getMealPlan, saveMealPlan } from '@/utils/mealPlanService';
import { useToast } from '@/hooks/use-toast';

export const useAutoMealPlanner = (userProfile: any) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMeals, setGeneratedMeals] = useState<any>(null);
  const { toast } = useToast();

  const generateMealPlan = async () => {
    if (!userProfile) return;

    setIsGenerating(true);
    console.log('🤖 Auto-generating AI meal plan for user profile:', userProfile);

    try {
      // Call Spoonacular meal planner for real recipe data
      const { data, error } = await supabase.functions.invoke('spoonacular-meal-planner', {
        body: {
          userPreferences: {
            dietaryPreferences: userProfile.dietary_preferences || [],
            allergies: userProfile.allergies || [],
            householdSize: userProfile.household_size || 2,
            weeklyBudget: userProfile.weekly_budget || 80,
            address: userProfile.address
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate meal plan');
      }

      console.log('✅ AI meal plan generated:', data.meals);

      // Save to database
      await saveMealPlan(data.meals);

      setGeneratedMeals(data);

      toast({
        title: "Meal Plan Generated! 🎉",
        description: `Created ${data.meals.length} personalized recipes with prices`,
      });

      return data;
    } catch (error: any) {
      console.error('❌ Error generating meal plan:', error);
      toast({
        title: "Generation Error",
        description: error.message || "Failed to generate meal plan. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const loadOrGenerateMealPlan = async () => {
    if (!userProfile) return;

    // Check if meal plan exists for current week
    const today = new Date();
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    const weekStart = monday.toISOString().split('T')[0];

    // Try to load existing meal plan for this week
    const result = await getMealPlan(new Date(weekStart));
    
    if (result.success && result.data?.data?.meals && result.data?.data?.meals.length > 0) {
      console.log('📥 Loading existing meal plan for week starting:', weekStart);
      setGeneratedMeals({ meals: result.data.data.meals });
      return result.data.data;
    }

    // If no meal plan exists for this week, generate a new one
    console.log('🆕 No meal plan found for current week, generating new one...');
    toast({
      title: "Generating Your Meal Plan...",
      description: "Creating personalized recipes with AI",
    });
    
    return await generateMealPlan();
  };

  useEffect(() => {
    if (userProfile) {
      loadOrGenerateMealPlan();
    }
  }, [userProfile]);

  return {
    isGenerating,
    generatedMeals,
    generateMealPlan,
    loadOrGenerateMealPlan
  };
};
