import { supabase } from '@/integrations/supabase/client';

/**
 * One-time utility to update a user's Suggestic user ID
 * This is useful when connecting an existing Suggestic account
 */
export async function updateSuggesticUserId(suggesticUserId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        suggestic_user_id: suggesticUserId,
        // Clear the JWT token so it gets regenerated with the new user ID
        suggestic_jwt_token: null,
        suggestic_jwt_expires_at: null
      })
      .eq('id', user.id);

    if (error) {
      console.error('Failed to update Suggestic user ID:', error);
      return { success: false, error: error.message };
    }

    console.log('✓ Successfully updated Suggestic user ID');
    return { success: true };
  } catch (error) {
    console.error('Error updating Suggestic user ID:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
