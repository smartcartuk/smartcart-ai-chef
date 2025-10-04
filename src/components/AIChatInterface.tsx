import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Sparkles, ShoppingCart, ChefHat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { saveMealPlan } from '@/utils/mealPlanService';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type?: 'meal-plan' | 'shopping-strategy';
  data?: any;
}

interface AIChatInterfaceProps {
  userProfile: any;
  onMealPlanGenerated?: (meals: any[]) => void;
  onShoppingStrategy?: (strategy: any) => void;
}

export const AIChatInterface = ({ userProfile, onMealPlanGenerated, onShoppingStrategy }: AIChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm your SmartCart AI assistant. I can help you with:\n\n🍳 Creating personalized meal plans\n🛒 Optimizing your shopping strategy\n💰 Finding the best deals\n🔄 Suggesting recipe substitutions\n\nWhat would you like help with today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const quickActions = [
    { label: 'Create Weekly Meal Plan', icon: ChefHat, action: 'meal-plan' },
    { label: 'Optimize My Shopping', icon: ShoppingCart, action: 'optimize-shopping' }
  ];

  const handleQuickAction = async (action: string) => {
    if (action === 'meal-plan') {
      setInput('Create a weekly meal plan for me based on my preferences');
      handleSend('Create a weekly meal plan for me based on my preferences');
    } else if (action === 'optimize-shopping') {
      setInput('Help me optimize my shopping to save money');
      handleSend('Help me optimize my shopping to save money');
    }
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Determine if this is a meal planning or shopping request
      const isMealPlan = textToSend.toLowerCase().includes('meal') || 
                         textToSend.toLowerCase().includes('recipe') ||
                         textToSend.toLowerCase().includes('cook');
      
      const isShopping = textToSend.toLowerCase().includes('shop') ||
                        textToSend.toLowerCase().includes('save') ||
                        textToSend.toLowerCase().includes('deal');

      if (isMealPlan) {
        const { data, error } = await supabase.functions.invoke('ai-meal-planner', {
          body: {
            userPreferences: {
              dietaryPreferences: userProfile?.dietary_preferences || [],
              allergies: userProfile?.allergies || [],
              householdSize: userProfile?.household_size || 2,
              weeklyBudget: userProfile?.weekly_budget || 50,
              connectedStores: []
            },
            conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
          }
        });

        if (error) throw error;

        if (data.success) {
          // Save meal plan to database
          const saveResult = await saveMealPlan(data.meals);
          
          const assistantMessage: Message = {
            role: 'assistant',
            content: data.message || "I've created a personalized meal plan for you with real recipes and beautiful images!",
            type: 'meal-plan',
            data: data.meals
          };
          setMessages(prev => [...prev, assistantMessage]);
          
          if (onMealPlanGenerated && data.meals) {
            onMealPlanGenerated(data.meals);
          }

          toast({
            title: "Meal Plan Generated & Saved!",
            description: `Created ${data.meals?.length || 0} authentic recipes. Total cost: £${data.totalCost?.toFixed(2) || 0}. ${saveResult.success ? 'Saved to your profile.' : ''}`,
          });
        }
      } else if (isShopping) {
        const { data, error } = await supabase.functions.invoke('ai-shopping-assistant', {
          body: {
            action: 'analyze',
            conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
          }
        });

        if (error) throw error;

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          type: data.strategy ? 'shopping-strategy' : undefined,
          data: data.strategy
        };
        setMessages(prev => [...prev, assistantMessage]);

        if (data.strategy && onShoppingStrategy) {
          onShoppingStrategy(data.strategy);
        }
      } else {
        // General conversation
        const { data, error } = await supabase.functions.invoke('ai-shopping-assistant', {
          body: {
            action: 'chat',
            conversationHistory: messages.map(m => ({ role: m.role, content: m.content }))
          }
        });

        if (error) throw error;

        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error('AI Chat error:', error);
      
      let errorMessage = 'Sorry, I encountered an error. Please try again.';
      if (error.message?.includes('429')) {
        errorMessage = 'I am getting too many requests right now. Please wait a moment and try again.';
      } else if (error.message?.includes('402')) {
        errorMessage = 'AI credits have been exhausted. Please add credits to continue using AI features.';
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: errorMessage
      }]);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <div className="p-4 border-b bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Shopping Assistant</h3>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {message.type === 'meal-plan' && message.data && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-semibold mb-1">Meal Plan Preview:</p>
                    <div className="text-xs space-y-1">
                      {message.data.slice(0, 3).map((meal: any, i: number) => (
                        <div key={i}>• {meal.name} ({meal.day})</div>
                      ))}
                      {message.data.length > 3 && <div>...and {message.data.length - 3} more</div>}
                    </div>
                  </div>
                )}

                {message.type === 'shopping-strategy' && message.data && (
                  <div className="mt-2 pt-2 border-t">
                    <p className="text-xs font-semibold mb-1">Potential Savings: £{message.data.total_estimated_savings?.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {messages.length === 1 && (
        <div className="p-4 border-t space-y-2">
          <p className="text-xs text-muted-foreground mb-2">Quick Actions:</p>
          <div className="flex gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.action)}
                className="flex-1"
              >
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about meals, shopping, or savings..."
            disabled={isLoading}
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </Card>
  );
};
