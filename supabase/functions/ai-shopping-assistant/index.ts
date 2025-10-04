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
    const { action, ingredients, stores, conversationHistory = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`AI Shopping Assistant - Action: ${action}`);

    const systemPrompt = `You are an expert shopping optimization assistant for SmartCart.
Your role is to help users save money and optimize their grocery shopping across multiple stores.

Available Stores: ${stores?.map(s => s.name).join(', ') || 'Tesco, Sainsbury\'s, Asda'}

Capabilities:
1. Analyze ingredient lists and recommend optimal shopping strategies
2. Find best deals and substitutions
3. Suggest multi-store shopping plans to maximize savings
4. Provide price comparisons and trends
5. Recommend when to buy items based on typical pricing patterns

Be conversational, helpful, and focus on practical money-saving advice.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits in your workspace settings.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    // If analyzing ingredients, provide structured recommendations
    if (action === 'analyze' && ingredients) {
      const analysisPrompt = `Analyze these ingredients and provide shopping recommendations: ${ingredients.map(i => i.name).join(', ')}. 
      Consider which stores typically have best prices for each category and suggest a shopping strategy.`;
      
      const analysisResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: analysisPrompt }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'provide_shopping_strategy',
                description: 'Provide optimized shopping strategy',
                parameters: {
                  type: 'object',
                  properties: {
                    recommendations: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          store: { type: 'string' },
                          items: { type: 'array', items: { type: 'string' } },
                          estimated_savings: { type: 'number' },
                          reasoning: { type: 'string' }
                        }
                      }
                    },
                    total_estimated_savings: { type: 'number' },
                    shopping_tips: { type: 'array', items: { type: 'string' } }
                  },
                  required: ['recommendations', 'total_estimated_savings', 'shopping_tips']
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'provide_shopping_strategy' } }
        }),
      });

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        const toolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall) {
          const strategy = JSON.parse(toolCall.function.arguments);
          return new Response(
            JSON.stringify({
              success: true,
              message: assistantMessage,
              strategy: strategy
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: assistantMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-shopping-assistant:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
