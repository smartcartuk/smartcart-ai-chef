import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, profile } = await req.json();
    const SUGGESTIC_API_KEY = Deno.env.get('SUGGESTIC_API_KEY');

    if (!SUGGESTIC_API_KEY) {
      throw new Error('SUGGESTIC_API_KEY not configured');
    }

    // Check if user already has a Suggestic account
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('suggestic_user_id, suggestic_jwt_token, suggestic_jwt_expires_at')
      .eq('id', user.id)
      .single();

    // If token exists and is still valid, return it
    if (
      existingProfile?.suggestic_jwt_token &&
      existingProfile?.suggestic_jwt_expires_at &&
      new Date(existingProfile.suggestic_jwt_expires_at) > new Date()
    ) {
      console.log('✓ Using existing valid JWT token');
      return new Response(
        JSON.stringify({
          success: true,
          jwt: existingProfile.suggestic_jwt_token,
          suggesticUserId: existingProfile.suggestic_user_id,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let suggesticUserId = existingProfile?.suggestic_user_id;

    // If user already has a Suggestic user ID, use it
    if (suggesticUserId) {
      console.log('✓ Using existing Suggestic user ID:', suggesticUserId);
    }
    // Create Suggestic user if doesn't exist
    else if (action === 'create-user') {
      console.log('Creating new Suggestic user...');
      
      const createUserMutation = `
        mutation CreateUser($email: String!, $name: String!) {
          createUser(email: $email, name: $name) {
            success
            user {
              id
              email
            }
          }
        }
      `;

      const createUserResponse = await fetch('https://production.suggestic.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${SUGGESTIC_API_KEY}`,
        },
        body: JSON.stringify({
          query: createUserMutation,
          variables: {
            email: profile?.email || user.email,
            name: profile?.full_name || user.email?.split('@')[0] || 'User',
          },
        }),
      });

      const createUserData = await createUserResponse.json();
      
      if (createUserData.errors) {
        console.error('Failed to create Suggestic user:', createUserData.errors);
        throw new Error(`Failed to create Suggestic user: ${JSON.stringify(createUserData.errors)}`);
      }
      
      if (!createUserData.data?.createUser?.success) {
        console.error('Suggestic user creation unsuccessful:', createUserData);
        throw new Error('Failed to create Suggestic user');
      }

      suggesticUserId = createUserData.data.createUser.user.id;
      console.log('✓ Created Suggestic user:', suggesticUserId);
    }

    if (!suggesticUserId) {
      throw new Error('No Suggestic user ID available. Call with action: create-user first.');
    }

    // Get JWT token for the user
    console.log('Generating JWT token for user:', suggesticUserId);
    
    const loginMutation = `
      mutation Login($userId: String!) {
        login(userId: $userId) {
          jwt
        }
      }
    `;

    const loginResponse = await fetch('https://production.suggestic.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${SUGGESTIC_API_KEY}`,
      },
      body: JSON.stringify({
        query: loginMutation,
        variables: {
          userId: suggesticUserId,
        },
      }),
    });

    const loginData = await loginResponse.json();
    
    if (loginData.errors) {
      console.error('Failed to get JWT token:', loginData.errors);
      throw new Error(`Failed to authenticate with Suggestic: ${JSON.stringify(loginData.errors)}`);
    }
    
    if (!loginData.data?.login?.jwt) {
      console.error('Suggestic login unsuccessful:', loginData);
      throw new Error('Failed to authenticate with Suggestic');
    }

    const jwt = loginData.data.login.jwt;
    
    // JWT tokens typically expire in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 23); // Set to 23 hours to be safe

    // Update profile with Suggestic credentials
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        suggestic_user_id: suggesticUserId,
        suggestic_jwt_token: jwt,
        suggestic_jwt_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      throw new Error('Failed to save Suggestic credentials');
    }

    console.log('✓ Successfully authenticated and saved JWT token');

    return new Response(
      JSON.stringify({
        success: true,
        jwt,
        suggesticUserId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Suggestic auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
