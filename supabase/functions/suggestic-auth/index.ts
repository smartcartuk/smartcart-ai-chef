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

    let suggesticUserId = existingProfile?.suggestic_user_id || profile?.suggestic_user_id;

    // If user already has a Suggestic user ID (in DB or request), use it
    if (suggesticUserId) {
      console.log('✓ Using existing Suggestic user ID:', suggesticUserId);
    }
    // Create Suggestic user if doesn't exist and action explicitly requests it
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

    // Update profile with Suggestic user ID
    console.log('Saving Suggestic user ID to profile:', suggesticUserId);

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        suggestic_user_id: suggesticUserId,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile with Suggestic user ID:', updateError);
      throw new Error('Failed to save Suggestic user ID');
    }

    console.log('✓ Successfully saved Suggestic user ID');

    // Setup user program and restrictions with dietary preferences
    if (action === 'create-user') {
      console.log('Setting up Suggestic program and restrictions...');
      await setupUserProgram(SUGGESTIC_API_KEY, suggesticUserId, profile);
    }

    return new Response(
      JSON.stringify({
        success: true,
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

/**
 * Setup user program and restrictions in Suggestic
 */
async function setupUserProgram(apiKey: string, suggesticUserId: string, profile: any) {
  // Map dietary preferences to Suggestic program
  const dietaryPreferences = profile?.dietary_preferences || [];
  const allergies = profile?.allergies || [];
  
  // Determine program based on dietary preferences
  let program = 'omnivore'; // Default
  if (dietaryPreferences.includes('Vegan')) program = 'vegan';
  else if (dietaryPreferences.includes('Vegetarian')) program = 'vegetarian';
  else if (dietaryPreferences.includes('Pescatarian')) program = 'pescatarian';
  else if (dietaryPreferences.includes('Keto')) program = 'keto';
  else if (dietaryPreferences.includes('Paleo')) program = 'paleo';
  
  // Map allergies to restriction slugs
  const allergyMapping: { [key: string]: string } = {
    'Nuts': 'tree-nuts',
    'Peanuts': 'peanuts',
    'Shellfish': 'shellfish',
    'Fish': 'fish',
    'Eggs': 'eggs',
    'Dairy': 'dairy',
    'Soy': 'soy',
    'Wheat': 'wheat',
    'Gluten': 'gluten',
    'Sesame': 'sesame'
  };
  
  const restrictionSlugs = allergies
    .map((allergy: string) => allergyMapping[allergy])
    .filter(Boolean);
  
  // Add dietary restrictions
  if (dietaryPreferences.includes('Gluten-Free') && !restrictionSlugs.includes('gluten')) {
    restrictionSlugs.push('gluten');
  }
  if (dietaryPreferences.includes('Dairy-Free') && !restrictionSlugs.includes('dairy')) {
    restrictionSlugs.push('dairy');
  }
  
  try {
    // Update user restrictions (allergies)
    if (restrictionSlugs.length > 0) {
      const updateRestrictionsQuery = `
        mutation UpdateRestrictions($restrictions: [String]!) {
          updateUserRestrictions(restrictions: $restrictions) {
            success
            message
          }
        }
      `;
      
      const restrictionsResponse = await fetch('https://production.suggestic.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'sg-user': suggesticUserId,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: updateRestrictionsQuery,
          variables: { restrictions: restrictionSlugs }
        })
      });
      
      const restrictionsData = await restrictionsResponse.json();
      if (restrictionsData.data?.updateUserRestrictions?.success) {
        console.log(`✓ Set user restrictions: ${restrictionSlugs.join(', ')}`);
      }
    }
    
    // Set meal plan program
    const updateProgramQuery = `
      mutation UpdateProgram($program: String!) {
        updateMyProgram(program: $program) {
          success
          message
        }
      }
    `;
    
    const programResponse = await fetch('https://production.suggestic.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'sg-user': suggesticUserId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: updateProgramQuery,
        variables: { program }
      })
    });
    
    const programData = await programResponse.json();
    if (programData.data?.updateMyProgram?.success) {
      console.log(`✓ Set user program: ${program}`);
    }
    
    // Configure meal plan settings
    const householdSize = profile?.household_size || 2;
    const weeklyBudget = profile?.weekly_budget || 50;
    const calorieTarget = Math.round(2000 * (householdSize / 2)); // Scale based on household
    
    const updateSettingsQuery = `
      mutation UpdateSettings($caloriesTarget: Int) {
        profileMealPlanSettings(caloriesTarget: $caloriesTarget) {
          success
          message
        }
      }
    `;
    
    const settingsResponse = await fetch('https://production.suggestic.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'sg-user': suggesticUserId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: updateSettingsQuery,
        variables: { caloriesTarget: calorieTarget }
      })
    });
    
    const settingsData = await settingsResponse.json();
    if (settingsData.data?.profileMealPlanSettings?.success) {
      console.log(`✓ Set meal plan settings: ${calorieTarget} cal/day target`);
    }
    
    console.log('✅ Suggestic program setup complete');
  } catch (error) {
    console.error('⚠️ Failed to setup Suggestic program (non-critical):', error);
    // Don't throw - this is not critical to user creation
  }
}
