import { supabase } from '@/integrations/supabase/client';

export interface SuggesticAuthResult {
  success: boolean;
  jwt?: string;
  suggesticUserId?: string;
  error?: string;
}

/**
 * Ensures the user has a valid Suggestic JWT token.
 * Creates a Suggestic account if needed, or refreshes the JWT if expired.
 */
export async function ensureSuggesticAuth(profile?: any): Promise<SuggesticAuthResult> {
  try {
    console.log('Ensuring Suggestic authentication...');
    
    const { data, error } = await supabase.functions.invoke('suggestic-auth', {
      body: {
        action: 'create-user',
        profile,
      },
    });

    if (error) {
      console.error('Failed to authenticate with Suggestic:', error);
      return {
        success: false,
        error: error.message || 'Failed to authenticate with Suggestic',
      };
    }

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Failed to authenticate with Suggestic',
      };
    }

    console.log('✓ Suggestic authentication successful');
    return {
      success: true,
      jwt: data.jwt,
      suggesticUserId: data.suggesticUserId,
    };
  } catch (error) {
    console.error('Suggestic auth error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Checks if the user has valid Suggestic credentials.
 */
export async function hasSuggesticAuth(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('suggestic_jwt_token, suggestic_jwt_expires_at')
      .eq('id', user.id)
      .single();

    if (!profile?.suggestic_jwt_token) return false;

    // Check if token is expired
    if (profile.suggestic_jwt_expires_at) {
      const expiresAt = new Date(profile.suggestic_jwt_expires_at);
      if (expiresAt < new Date()) {
        console.log('Suggestic JWT token expired');
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error checking Suggestic auth:', error);
    return false;
  }
}
