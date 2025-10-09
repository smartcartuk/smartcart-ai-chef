import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Bot, ShoppingCart, AlertCircle, CheckCircle2, Loader2, ExternalLink, Brain, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AutonomousShoppingService } from '@/utils/autonomousShoppingService';

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
    credentials?: {
      username: string;
      password: string;
    };
  }>;
  onShoppingComplete?: (results?: any) => void;
}

interface ShoppingTask {
  store: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  itemCount: number;
  estimatedSavings: number;
  basketUrl?: string;
  substitutionsMade?: Array<{
    original: string;
    substitute: string;
    reason: string;
  }>;
  autonomousActions?: string[];
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [historyInsights, setHistoryInsights] = useState<any>(null);
  const { toast } = useToast();

  // Load user preferences and history on mount
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const prefs = await AutonomousShoppingService.getPreferences(user.id);
        const insights = await AutonomousShoppingService.getHistoryInsights(user.id);
        setUserPreferences(prefs);
        setHistoryInsights(insights);
      }
    };
    loadUserData();
  }, []);

  const startAIShopping = async () => {
    setIsProcessing(true);
    setProgress(0);
    setAgentStatus('analyzing');
    setCurrentTask('🤖 Autonomous AI analyzing your shopping list with learning...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Step 1: Autonomous AI Analysis with Learning
      const { data: plan, error: analysisError } = await supabase.functions.invoke('ai-shopping-agent', {
        body: {
          action: 'autonomous-analyze',
          ingredients,
          connectedStores: connectedStores.map(s => ({ name: s.name })),
          userId: user.id
        }
      });

      if (analysisError) throw analysisError;

      console.log('Autonomous AI Plan:', plan);

      // Store session ID for tracking
      setSessionId(plan.sessionId);

      // Create shopping tasks from autonomous plan
      const tasks: ShoppingTask[] = plan.primaryPlan.stores.map((storePlan: any) => ({
        store: storePlan.store,
        status: 'pending' as const,
        itemCount: storePlan.items.length,
        estimatedSavings: storePlan.estimatedSavings || 0,
        substitutionsMade: [],
        autonomousActions: []
      }));

      setShoppingTasks(tasks);
      setProgress(30);

      // Step 2: Autonomous Execution (Parallel across all stores)
      setAgentStatus('shopping');
      setCurrentTask('🚀 Autonomously executing shopping across all stores...');
      setProgress(50);

      // Execute all stores in parallel (truly autonomous)
      const executePromises = plan.primaryPlan.stores.map(async (storePlan: any) => {
        const storeInfo = connectedStores.find(s => s.name === storePlan.store);

        if (!storeInfo?.credentials) {
          console.warn(`No credentials for ${storePlan.store}, skipping...`);
          return null;
        }

        // Update task status to processing
        setShoppingTasks(prev => prev.map(task => 
          task.store === storePlan.store ? { ...task, status: 'processing' } : task
        ));

        try {
          const { data: result, error: execError } = await supabase.functions.invoke('ai-shopping-agent', {
            body: {
              action: 'autonomous-execute',
              store: storePlan.store,
              items: storePlan.items,
              credentials: storeInfo.credentials,
              sessionId: plan.sessionId
            }
          });

          if (execError) throw execError;

          // Update task with results including substitutions and autonomous actions
          setShoppingTasks(prev => prev.map(task => 
            task.store === storePlan.store 
              ? { 
                  ...task, 
                  status: 'completed',
                  basketUrl: result.basketUrl,
                  substitutionsMade: result.substitutionsMade || [],
                  autonomousActions: result.autonomousActions || []
                } 
              : task
          ));

          toast({
            title: `✓ Autonomous shopping completed at ${storePlan.store}`,
            description: `${result.itemsAdded} items added. ${result.substitutionsMade?.length || 0} substitutions made.`,
          });

          return { store: storePlan.store, ...result };

        } catch (error) {
          console.error(`Autonomous execution error at ${storePlan.store}:`, error);
          
          setShoppingTasks(prev => prev.map(task => 
            task.store === storePlan.store ? { ...task, status: 'failed' } : task
          ));

          toast({
            title: `✗ Autonomous execution failed at ${storePlan.store}`,
            description: error instanceof Error ? error.message : 'Failed to complete shopping',
            variant: 'destructive'
          });

          return null;
        }
      });

      // Wait for all stores to complete
      const results = await Promise.allSettled(executePromises);
      const successfulResults = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value !== null)
        .map(r => r.value);

      setProgress(90);

      // Step 3: Learn from this session
      setCurrentTask('🧠 Learning from this shopping session...');
      
      const totalCost = successfulResults.reduce((sum, r) => sum + (r.totalCost || 0), 0);
      const totalSavings = shoppingTasks.reduce((sum, task) => sum + task.estimatedSavings, 0);

      await supabase.functions.invoke('ai-shopping-agent', {
        body: {
          action: 'learn',
          sessionResults: {
            storesUsed: successfulResults.map(r => r.store),
            totalCost,
            totalSavings
          },
          userId: user.id,
          sessionId: plan.sessionId
        }
      });

      // Step 4: Complete
      setProgress(100);
      setAgentStatus('completed');
      setCurrentTask('✅ Autonomous shopping completed successfully!');

      const completedCount = shoppingTasks.filter(t => t.status === 'completed').length;

      // Refresh user data
      const updatedPrefs = await AutonomousShoppingService.getPreferences(user.id);
      const updatedInsights = await AutonomousShoppingService.getHistoryInsights(user.id);
      setUserPreferences(updatedPrefs);
      setHistoryInsights(updatedInsights);

      toast({
        title: '🎉 Autonomous AI Shopping Complete!',
        description: `Shopped at ${completedCount} stores. Estimated savings: £${totalSavings.toFixed(2)}. Agent has learned from this session.`,
      });

      onShoppingComplete?.();

    } catch (error) {
      console.error('Autonomous AI Shopping Agent error:', error);
      setAgentStatus('idle');
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to complete autonomous shopping',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: ShoppingTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <ShoppingCart className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Learning Dashboard */}
      {historyInsights && historyInsights.totalSessions > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">Learning from Your Shopping Habits</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Total Sessions</div>
                <div className="font-semibold text-lg">{historyInsights.totalSessions}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Avg Cost</div>
                <div className="font-semibold text-lg">£{historyInsights.averageCost.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Total Saved</div>
                <div className="font-semibold text-lg text-green-600">
                  <TrendingDown className="inline h-4 w-4 mr-1" />
                  £{historyInsights.totalSavings.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Preferred Store</div>
                <div className="font-semibold text-lg">
                  {historyInsights.mostUsedStores[0]?.store || 'N/A'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Agent Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-blue-600" />
              <CardTitle>Autonomous AI Shopping Agent</CardTitle>
            </div>
            <Badge variant={agentStatus === 'idle' ? 'secondary' : agentStatus === 'completed' ? 'default' : 'outline'}>
              {agentStatus === 'idle' && 'Ready'}
              {agentStatus === 'analyzing' && 'Analyzing...'}
              {agentStatus === 'shopping' && 'Shopping...'}
              {agentStatus === 'completed' && 'Completed'}
            </Badge>
          </div>
          <CardDescription>
            Click "Start AI Shopping" to let the autonomous AI agent shop across multiple stores, make smart substitutions, and learn from your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {connectedStores.length} stores connected
            </span>
            <Button
              onClick={startAIShopping}
              disabled={isProcessing || ingredients.length === 0 || connectedStores.length === 0}
              className="flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  <span>Start AI Shopping</span>
                </>
              )}
            </Button>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{currentTask}</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {shoppingTasks.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium">Shopping Tasks</h4>
              {shoppingTasks.map((task) => (
                <div key={task.store} className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3 flex-1">
                      {getStatusIcon(task.status)}
                      <div className="flex-1">
                        <p className="font-medium">{task.store}</p>
                        <p className="text-sm text-gray-500">
                          {task.itemCount} items • Save £{task.estimatedSavings.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    {task.status === 'completed' && task.basketUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={task.basketUrl} target="_blank" rel="noopener noreferrer">
                          View Basket <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Show autonomous actions taken */}
                  {task.autonomousActions && task.autonomousActions.length > 0 && (
                    <Alert className="ml-8">
                      <Bot className="h-4 w-4" />
                      <AlertTitle>Autonomous Actions</AlertTitle>
                      <AlertDescription>
                        {task.autonomousActions.map((action, idx) => (
                          <div key={idx} className="text-xs">• {action}</div>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Show substitutions made */}
                  {task.substitutionsMade && task.substitutionsMade.length > 0 && (
                    <Alert className="ml-8 border-yellow-200 bg-yellow-50">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertTitle className="text-yellow-800">Smart Substitutions</AlertTitle>
                      <AlertDescription className="text-yellow-700">
                        {task.substitutionsMade.map((sub, idx) => (
                          <div key={idx} className="text-sm">
                            {sub.original} → {sub.substitute}
                            <span className="text-xs ml-2 text-yellow-600">({sub.reason})</span>
                          </div>
                        ))}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
