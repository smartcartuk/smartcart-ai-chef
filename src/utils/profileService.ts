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
    console.log('🔍 Checking authentication...');
    
    // First check if we have a session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return { success: false, error: 'Please sign in to continue' };
    }
    
    if (!sessionData?.session) {
      console.error('No active session');
      return { success: false, error: 'Please sign in to continue' };
    }

    const userId = sessionData.session.user.id;
    console.log('✅ User authenticated:', userId);
    console.log('💾 Saving profile data...');

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        full_name: profile.full_name,
        email: profile.email,
        address: profile.address,
        household_size: profile.household_size,
        weekly_budget: profile.weekly_budget,
        dietary_preferences: profile.dietary_preferences,
        allergies: profile.allergies,
        updated_at: new Date().toISOString()
      })
      .select();

    if (error) {
      console.error('❌ Error saving profile:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Profile saved successfully:', data);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in saveUserProfile:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
  }
};

export const saveConnectedStores = async (stores: ConnectedStore[]): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('💾 Saving connected stores...');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Delete existing stores for this user
    await supabase
      .from('connected_stores')
      .delete()
      .eq('user_id', user.id);

    // Insert new stores with encrypted credentials
    const storesData = stores.map(store => ({
      user_id: user.id,
      name: store.name,
      has_loyalty_card: Boolean(store.credentials?.loyaltyCard),
      credentials: store.credentials ? {
        username: store.credentials.username,
        password: store.credentials.password,
        loyaltyCard: store.credentials.loyaltyCard
      } : null
    }));

    const { error } = await supabase
      .from('connected_stores')
      .insert(storesData);

    if (error) {
      console.error('❌ Error saving stores:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Stores saved successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Exception in saveConnectedStores:', error);
    return { success: false, error: error.message || 'Unknown error occurred' };
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
