import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUGGESTIC_API_KEY = Deno.env.get('SUGGESTIC_API_KEY');
    if (!SUGGESTIC_API_KEY) {
      throw new Error('SUGGESTIC_API_KEY is not configured');
    }

    console.log('Testing Suggestic API connection...');

    // Simple query to test authentication
    const testQuery = `
      query TestConnection {
        myProfile {
          id
          programName
        }
      }
    `;

    const response = await fetch('https://production.suggestic.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${SUGGESTIC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: testQuery })
    });

    const data = await response.json();

    console.log('Suggestic API response:', JSON.stringify(data, null, 2));

    if (data.errors) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'API key authentication failed',
          details: data.errors,
          message: 'Your Suggestic API key may be invalid or expired'
        }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Suggestic API connection successful!',
        profile: data.data?.myProfile
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Suggestic test error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
