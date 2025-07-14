import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Bot, ShoppingCart, Zap, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AIShoppingAgentProps {
  ingredients: Array<{
    name: string;
    amount: string;
    prices: Array<{
      store: string;
      price: number;
      url?: string;
      title?: string;
    }>;
  }>;
  connectedStores: Array<{
    name: string;
    credentials: {
      username: string;
      password: string;
    };
  }>;
  onShoppingComplete: (results: any) => void;
}

interface ShoppingTask {
  id: string;
  store: string;
  items: Array<{ name: string; amount: string; price: number }>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  basketUrl?: string;
  totalSaved?: number;
}

export const AIShoppingAgent: React.FC<AIShoppingAgentProps> = ({
  ingredients,
  connectedStores,
  onShoppingComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState<string>('');
  const [shoppingTasks, setShoppingTasks] = useState<ShoppingTask[]>([]);
  const [agentStatus, setAgentStatus] = useState<'idle' | 'analyzing' | 'shopping' | 'completed'>('idle');
  const { toast } = useToast();

  const startAIShopping = async () => {
    if (connectedStores.length === 0) {
      toast({
        title: "No Connected Stores",
        description: "Please connect at least one supermarket account to use the AI shopping agent.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setAgentStatus('analyzing');
    setCurrentTask('AI agent analyzing shopping options...');

    try {
      // Step 1: AI Analysis
      setProgress(20);
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('ai-shopping-agent', {
        body: {
          action: 'analyze',
          ingredients,
          connectedStores: connectedStores.map(store => ({ name: store.name }))
        }
      });

      if (analysisError) throw analysisError;

      const recommendations = analysisData.recommendations;
      setCurrentTask('Creating optimized shopping plan...');
      setProgress(40);

      // Step 2: Create shopping tasks
      const tasks: ShoppingTask[] = recommendations.map((rec: any, index: number) => ({
        id: `task-${index}`,
        store: rec.store,
        items: rec.items,
        status: 'pending' as const,
        totalSaved: rec.estimatedSavings
      }));

      setShoppingTasks(tasks);
      setAgentStatus('shopping');
      setCurrentTask('Executing shopping tasks...');
      setProgress(60);

      // Step 3: Execute shopping for each store
      const results = [];
      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const storeCredentials = connectedStores.find(store => 
          store.name.toLowerCase() === task.store.toLowerCase()
        )?.credentials;

        if (!storeCredentials) continue;

        // Update task status
        setShoppingTasks(prev => prev.map(t => 
          t.id === task.id ? { ...t, status: 'processing' } : t
        ));

        setCurrentTask(`Adding items to ${task.store} basket...`);

        try {
          const { data: shoppingData, error: shoppingError } = await supabase.functions.invoke('ai-shopping-agent', {
            body: {
              action: 'execute',
              store: task.store,
              items: task.items,
              credentials: storeCredentials
            }
          });

          if (shoppingError) throw shoppingError;

          // Update task as completed
          setShoppingTasks(prev => prev.map(t => 
            t.id === task.id ? { 
              ...t, 
              status: 'completed',
              basketUrl: shoppingData.basketUrl 
            } : t
          ));

          results.push({
            store: task.store,
            success: true,
            basketUrl: shoppingData.basketUrl,
            itemsAdded: task.items.length
          });

        } catch (error) {
          console.error(`Failed to shop at ${task.store}:`, error);
          setShoppingTasks(prev => prev.map(t => 
            t.id === task.id ? { ...t, status: 'failed' } : t
          ));
          
          results.push({
            store: task.store,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }

        setProgress(60 + ((i + 1) / tasks.length) * 30);
      }

      setProgress(100);
      setAgentStatus('completed');
      setCurrentTask('Shopping completed!');
      
      toast({
        title: "AI Shopping Completed",
        description: `Successfully processed ${results.filter(r => r.success).length} of ${results.length} stores.`
      });

      onShoppingComplete(results);

    } catch (error) {
      console.error('AI Shopping Agent error:', error);
      toast({
        title: "AI Shopping Failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: ShoppingTask['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />;
      default: return <div className="h-4 w-4 rounded-full bg-muted" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          AI Shopping Agent
        </CardTitle>
        <CardDescription>
          Let AI automatically find the best deals and add items to your baskets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={agentStatus === 'idle' ? 'secondary' : 'default'}>
              {agentStatus}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {connectedStores.length} store{connectedStores.length !== 1 ? 's' : ''} connected
            </span>
          </div>
          
          <Button 
            onClick={startAIShopping}
            disabled={isProcessing || connectedStores.length === 0}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            {isProcessing ? 'Processing...' : 'Start AI Shopping'}
          </Button>
        </div>

        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>{currentTask}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {shoppingTasks.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Shopping Tasks</h4>
            {shoppingTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  {getStatusIcon(task.status)}
                  <div>
                    <div className="font-medium">{task.store}</div>
                    <div className="text-sm text-muted-foreground">
                      {task.items.length} items
                      {task.totalSaved && ` • Save £${task.totalSaved.toFixed(2)}`}
                    </div>
                  </div>
                </div>
                
                {task.basketUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a href={task.basketUrl} target="_blank" rel="noopener noreferrer">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      View Basket
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};