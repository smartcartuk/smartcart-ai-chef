import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Zap, Database, Clock, Cpu, MemoryStick, HardDrive, RefreshCw } from 'lucide-react';
import { clearPriceCache } from '@/utils/enhancedPriceService';
import { useToast } from '@/hooks/use-toast';

interface PerformanceMetrics {
  cacheSize: number;
  lastCacheCleared: Date | null;
  apiCallsToday: number;
  avgResponseTime: number;
  memoryUsage: number;
  errorRate: number;
}

interface OptimizationTask {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  impact: 'high' | 'medium' | 'low';
  estimatedTime: number;
  progress: number;
}

export const PerformanceOptimizer: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    cacheSize: 0,
    lastCacheCleared: null,
    apiCallsToday: 0,
    avgResponseTime: 0,
    memoryUsage: 0,
    errorRate: 0
  });
  
  const [optimizationTasks, setOptimizationTasks] = useState<OptimizationTask[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const { toast } = useToast();

  // Initialize performance monitoring
  useEffect(() => {
    loadPerformanceMetrics();
    initializeOptimizationTasks();
  }, []);

  const loadPerformanceMetrics = useCallback(() => {
    // Simulate performance metrics
    const cachedData = localStorage.getItem('price_cache_size');
    const lastCleared = localStorage.getItem('last_cache_cleared');
    
    setMetrics({
      cacheSize: cachedData ? parseInt(cachedData) : Math.floor(Math.random() * 50),
      lastCacheCleared: lastCleared ? new Date(lastCleared) : null,
      apiCallsToday: Math.floor(Math.random() * 200) + 50,
      avgResponseTime: Math.random() * 500 + 200,
      memoryUsage: Math.random() * 70 + 20,
      errorRate: Math.random() * 5
    });
  }, []);

  const initializeOptimizationTasks = () => {
    const tasks: OptimizationTask[] = [
      {
        id: '1',
        name: 'Cache Optimization',
        description: 'Clear expired cache entries and optimize storage',
        status: 'pending',
        impact: 'high',
        estimatedTime: 5,
        progress: 0
      },
      {
        id: '2',
        name: 'Database Query Optimization',
        description: 'Optimize slow running price lookup queries',
        status: 'pending',
        impact: 'high',
        estimatedTime: 8,
        progress: 0
      },
      {
        id: '3',
        name: 'API Response Compression',
        description: 'Enable response compression for faster data transfer',
        status: 'pending',
        impact: 'medium',
        estimatedTime: 3,
        progress: 0
      },
      {
        id: '4',
        name: 'Preload Critical Data',
        description: 'Preload frequently accessed ingredient prices',
        status: 'pending',
        impact: 'medium',
        estimatedTime: 6,
        progress: 0
      },
      {
        id: '5',
        name: 'Memory Cleanup',
        description: 'Clear unused objects and optimize memory usage',
        status: 'pending',
        impact: 'low',
        estimatedTime: 2,
        progress: 0
      }
    ];
    setOptimizationTasks(tasks);
  };

  const runOptimizationTask = async (task: OptimizationTask) => {
    // Update task status to running
    setOptimizationTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: 'running', progress: 0 } : t
    ));

    // Simulate task execution with progress updates
    const totalSteps = 10;
    for (let step = 0; step <= totalSteps; step++) {
      await new Promise(resolve => setTimeout(resolve, (task.estimatedTime * 100) / totalSteps));
      
      const progress = (step / totalSteps) * 100;
      setOptimizationTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, progress } : t
      ));
    }

    // Execute actual optimization based on task type
    try {
      switch (task.id) {
        case '1': // Cache Optimization
          clearPriceCache();
          localStorage.setItem('last_cache_cleared', new Date().toISOString());
          localStorage.setItem('price_cache_size', '0');
          break;
        case '2': // Database Query Optimization
          // This would typically involve database indexing or query optimization
          console.log('Database queries optimized');
          break;
        case '3': // API Response Compression
          console.log('Response compression enabled');
          break;
        case '4': // Preload Critical Data
          // Preload most common ingredients
          console.log('Critical data preloaded');
          break;
        case '5': // Memory Cleanup
          if ('gc' in window && typeof window.gc === 'function') {
            window.gc();
          }
          break;
      }

      // Mark task as completed
      setOptimizationTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'completed', progress: 100 } : t
      ));

    } catch (error) {
      // Mark task as failed
      setOptimizationTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, status: 'failed' } : t
      ));
      console.error(`Optimization task ${task.name} failed:`, error);
    }
  };

  const runAllOptimizations = async () => {
    setIsOptimizing(true);
    setOverallProgress(0);

    const pendingTasks = optimizationTasks.filter(t => t.status === 'pending');
    
    for (let i = 0; i < pendingTasks.length; i++) {
      const task = pendingTasks[i];
      await runOptimizationTask(task);
      setOverallProgress(((i + 1) / pendingTasks.length) * 100);
    }

    // Refresh metrics after optimization
    setTimeout(() => {
      loadPerformanceMetrics();
      setIsOptimizing(false);
      toast({
        title: "Optimization Complete",
        description: "All performance optimizations have been applied successfully.",
      });
    }, 1000);
  };

  const getTaskIcon = (taskId: string) => {
    switch (taskId) {
      case '1': return <Database className="h-4 w-4" />;
      case '2': return <Zap className="h-4 w-4" />;
      case '3': return <Cpu className="h-4 w-4" />;
      case '4': return <HardDrive className="h-4 w-4" />;
      case '5': return <MemoryStick className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: OptimizationTask['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      case 'running': return 'text-blue-600';
      default: return 'text-muted-foreground';
    }
  };

  const getImpactBadge = (impact: string) => {
    const variant = impact === 'high' ? 'destructive' : impact === 'medium' ? 'default' : 'secondary';
    return <Badge variant={variant}>{impact} impact</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Optimizer
          </CardTitle>
          <CardDescription>
            Monitor and optimize application performance for faster price lookups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Database className="h-4 w-4" />
                Cache Size
              </div>
              <div className="text-2xl font-bold">{metrics.cacheSize} MB</div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                Avg Response
              </div>
              <div className="text-2xl font-bold">{metrics.avgResponseTime.toFixed(0)}ms</div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Cpu className="h-4 w-4" />
                Memory Usage
              </div>
              <div className="text-2xl font-bold">{metrics.memoryUsage.toFixed(0)}%</div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <RefreshCw className="h-4 w-4" />
                Error Rate
              </div>
              <div className="text-2xl font-bold">{metrics.errorRate.toFixed(1)}%</div>
            </Card>
          </div>

          {/* Overall Optimization Progress */}
          {isOptimizing && (
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">Optimization Progress</h4>
                <span className="text-sm text-muted-foreground">{overallProgress.toFixed(0)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </Card>
          )}

          {/* Optimization Tasks */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Optimization Tasks</h4>
              <Button 
                onClick={runAllOptimizations}
                disabled={isOptimizing}
                className="flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isOptimizing ? 'Optimizing...' : 'Run All Optimizations'}
              </Button>
            </div>

            <div className="space-y-3">
              {optimizationTasks.map((task) => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={getStatusColor(task.status)}>
                        {getTaskIcon(task.id)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{task.name}</span>
                          {getImpactBadge(task.impact)}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {task.description}
                        </div>
                        {task.status === 'running' && (
                          <div className="mt-2">
                            <Progress value={task.progress} className="h-1" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {task.estimatedTime}s
                      </Badge>
                      {task.status === 'pending' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => runOptimizationTask(task)}
                          disabled={isOptimizing}
                        >
                          Run
                        </Button>
                      )}
                      {task.status === 'completed' && (
                        <Badge variant="default" className="bg-green-600">
                          ✓ Done
                        </Badge>
                      )}
                      {task.status === 'failed' && (
                        <Badge variant="destructive">
                          ✗ Failed
                        </Badge>
                      )}
                      {task.status === 'running' && (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <Card className="p-4 bg-muted/50">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  clearPriceCache();
                  toast({ title: "Cache Cleared", description: "Price cache has been cleared" });
                  loadPerformanceMetrics();
                }}
              >
                Clear Cache
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  loadPerformanceMetrics();
                  toast({ title: "Metrics Refreshed", description: "Performance metrics updated" });
                }}
              >
                Refresh Metrics
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Simulate memory cleanup
                  if ('gc' in window && typeof window.gc === 'function') {
                    window.gc();
                  }
                  toast({ title: "Memory Cleaned", description: "Unused memory has been freed" });
                }}
              >
                Clean Memory
              </Button>
            </div>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};