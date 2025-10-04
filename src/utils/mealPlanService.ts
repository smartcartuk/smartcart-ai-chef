import { supabase } from '@/integrations/supabase/client';

export const saveMealPlan = async (meals: any[], weekStart?: Date): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const week = weekStart || new Date();
    // Get the Monday of the current week
    const monday = new Date(week);
    monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
    
    const weekStartDate = monday.toISOString().split('T')[0];

    // Check if meal plan exists for this week
    const { data: existing } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', weekStartDate)
      .single();

    const mealPlanData = {
      user_id: user.id,
      week_start: weekStartDate,
      data: { meals },
      updated_at: new Date().toISOString()
    };

    let error;
    if (existing) {
      // Update existing plan
      ({ error } = await supabase
        .from('meal_plans')
        .update(mealPlanData)
        .eq('id', existing.id));
    } else {
      // Insert new plan
      ({ error } = await supabase
        .from('meal_plans')
        .insert(mealPlanData));
    }

    if (error) {
      console.error('Error saving meal plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in saveMealPlan:', error);
    return { success: false, error: error.message };
  }
};

export const getMealPlan = async (weekStart?: Date): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const week = weekStart || new Date();
    const monday = new Date(week);
    monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
    
    const weekStartDate = monday.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStartDate)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching meal plan:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || null };
  } catch (error: any) {
    console.error('Error in getMealPlan:', error);
    return { success: false, error: error.message };
  }
};

export const getAllMealPlans = async (): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false });

    if (error) {
      console.error('Error fetching meal plans:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error in getAllMealPlans:', error);
    return { success: false, error: error.message };
  }
};

export const saveShoppingList = async (items: any[], weekStart?: Date): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const week = weekStart || new Date();
    const monday = new Date(week);
    monday.setDate(monday.getDate() - monday.getDay() + (monday.getDay() === 0 ? -6 : 1));
    
    const weekStartDate = monday.toISOString().split('T')[0];

    // Check if shopping list exists for this week
    const { data: existing } = await supabase
      .from('shopping_lists')
      .select('id')
      .eq('user_id', user.id)
      .eq('week_start', weekStartDate)
      .single();

    const shoppingListData = {
      user_id: user.id,
      week_start: weekStartDate,
      items: { items },
      updated_at: new Date().toISOString()
    };

    let error;
    if (existing) {
      ({ error } = await supabase
        .from('shopping_lists')
        .update(shoppingListData)
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase
        .from('shopping_lists')
        .insert(shoppingListData));
    }

    if (error) {
      console.error('Error saving shopping list:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in saveShoppingList:', error);
    return { success: false, error: error.message };
  }
};
