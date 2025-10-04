import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id?: string;
  full_name: string;
  email: string;
  address: {
    street: string;
    city: string;
    postcode: string;
  };
  household_size: number;
  weekly_budget: number;
  dietary_preferences: string[];
  allergies: string[];
}

export interface ConnectedStore {
  name: string;
  credentials: {
    username: string;
    password: string;
    loyaltyCard?: string;
  };
  has_loyalty_card?: boolean;
}

export const saveUserProfile = async (profile: UserProfile): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: profile.full_name,
        email: profile.email,
        address: profile.address,
        household_size: profile.household_size,
        weekly_budget: profile.weekly_budget,
        dietary_preferences: profile.dietary_preferences,
        allergies: profile.allergies,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error saving profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in saveUserProfile:', error);
    return { success: false, error: error.message };
  }
};

export const saveConnectedStores = async (stores: ConnectedStore[]): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Delete existing stores for this user
    await supabase
      .from('connected_stores')
      .delete()
      .eq('user_id', user.id);

    // Insert new stores
    const storesData = stores.map(store => ({
      user_id: user.id,
      name: store.name,
      has_loyalty_card: Boolean(store.credentials?.loyaltyCard)
    }));

    const { error } = await supabase
      .from('connected_stores')
      .insert(storesData);

    if (error) {
      console.error('Error saving stores:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error in saveConnectedStores:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error in getUserProfile:', error);
    return { success: false, error: error.message };
  }
};

export const getConnectedStores = async (): Promise<{ success: boolean; data?: any[]; error?: string }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase
      .from('connected_stores')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching stores:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Error in getConnectedStores:', error);
    return { success: false, error: error.message };
  }
};
