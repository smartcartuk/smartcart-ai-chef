import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Target, AlertTriangle, Zap, Calendar } from 'lucide-react';
import { getPriceTrends, getEnhancedRealTimePrices } from '@/utils/enhancedPriceService';
import { useToast } from '@/hooks/use-toast';

interface PriceAnalyticsDashboardProps {
  ingredients: Array<{ name: string; amount: string }>;
  selectedStores?: string[];
}

interface TrendData {
  date: string;
  price: number;
  store: string;
}

interface PriceAlert {
  id: string;
  ingredient: string;
  store: string;
  currentPrice: number;
  targetPrice: number;
  triggered: boolean;
  type: 'price_drop' | 'target_reached' | 'volatile';
}

interface MarketInsight {
  type: 'trend' | 'opportunity' | 'alert';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const PriceAnalyticsDashboard: React.FC<PriceAnalyticsDashboardProps> = ({
  ingredients,
  selectedStores = ['tesco', 'sainsburys', 'asda', 'aldi']
}) => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsight[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Generate mock market insights
  const generateMarketInsights = (ingredient: string): MarketInsight[] => {
    return [
      {
        type: 'opportunity',
        title: 'Price Drop Alert',
        description: `${ingredient} prices at Aldi dropped 15% this week`,
        impact: 'high',
        actionable: true
      },
      {
        type: 'trend',
        title: 'Seasonal Pattern',
        description: `${ingredient} typically 20% cheaper in next month`,
        impact: 'medium',
        actionable: true
      },
      {
        type: 'alert',
        title: 'Volatile Pricing',
        description: `${ingredient} prices fluctuating significantly across stores`,
        impact: 'medium',
        actionable: false
      }
    ];
  };

  // Fetch price trends for selected ingredient
  const fetchPriceTrends = async (ingredient: string) => {
    if (!ingredient) return;
    
    setIsLoading(true);
    try {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const trendsPromises = selectedStores.map(async (store) => {
        const trends = await getPriceTrends(ingredient, store, daysBack);
        return trends.map(trend => ({
          date: new Date(trend.recordedAt).toLocaleDateString(),
          price: Number(trend.price),
          store
        }));
      });

      const allTrends = await Promise.all(trendsPromises);
      const flatTrends = allTrends.flat();
      
      // If no real data, generate mock data for demo
      if (flatTrends.length === 0) {
        const mockTrends = generateMockTrendData(ingredient, selectedStores, daysBack);
        setTrendData(mockTrends);
      } else {
        setTrendData(flatTrends);
      }

      // Generate insights and alerts
      setMarketInsights(generateMarketInsights(ingredient));
      generatePriceAlerts(ingredient);
      
    } catch (error) {
      console.error('Error fetching price trends:', error);
      toast({
        title: "Error",
        description: "Failed to fetch price trends",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock trend data for demo
  const generateMockTrendData = (ingredient: string, stores: string[], days: number): TrendData[] => {
    const basePrice = 1.5 + Math.random() * 3;
    const data: TrendData[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      stores.forEach(store => {
        const variance = (Math.random() - 0.5) * 0.4;
        const storeMultiplier = store === 'aldi' ? 0.9 : store === 'waitrose' ? 1.15 : 1.0;
        const price = Math.max(0.5, basePrice * storeMultiplier + variance);
        
        data.push({
          date: date.toLocaleDateString(),
          price: Number(price.toFixed(2)),
          store
        });
      });
    }
    
    return data;
  };

  // Generate price alerts
  const generatePriceAlerts = (ingredient: string) => {
    const alerts: PriceAlert[] = [
      {
        id: '1',
        ingredient,
        store: 'aldi',
        currentPrice: 1.25,
        targetPrice: 1.50,
        triggered: true,
        type: 'price_drop'
      },
      {
        id: '2',
        ingredient,
        store: 'tesco',
        currentPrice: 2.10,
        targetPrice: 2.00,
        triggered: false,
        type: 'target_reached'
      }
    ];
    setPriceAlerts(alerts);
  };

  // Calculate price statistics
  const calculateStats = () => {
    if (trendData.length === 0) return null;

    const prices = trendData.map(d => d.price);
    const currentAvg = prices.slice(-7).reduce((a, b) => a + b, 0) / Math.min(7, prices.length);
    const previousAvg = prices.slice(-14, -7).reduce((a, b) => a + b, 0) / Math.min(7, prices.slice(-14, -7).length);
    const change = currentAvg - previousAvg;
    const changePercent = (change / previousAvg) * 100;

    return {
      currentAvg: currentAvg.toFixed(2),
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(1),
      isIncreasing: change > 0,
      min: Math.min(...prices).toFixed(2),
      max: Math.max(...prices).toFixed(2)
    };
  };

  // Store comparison data
  const getStoreComparison = () => {
    if (trendData.length === 0) return [];

    const storeAvgs = selectedStores.map(store => {
      const storePrices = trendData.filter(d => d.store === store).map(d => d.price);
      const avg = storePrices.reduce((a, b) => a + b, 0) / storePrices.length;
      return { store, avgPrice: Number(avg.toFixed(2)) };
    });

    return storeAvgs.sort((a, b) => a.avgPrice - b.avgPrice);
  };

  useEffect(() => {
    if (selectedIngredient) {
      fetchPriceTrends(selectedIngredient);
    }
  }, [selectedIngredient, timeRange]);

  const stats = calculateStats();
  const storeComparison = getStoreComparison();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Price Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Advanced price analysis and market insights for smarter shopping
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={selectedIngredient} onValueChange={setSelectedIngredient}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select ingredient to analyze" />
              </SelectTrigger>
              <SelectContent>
                {ingredients.map((ingredient, index) => (
                  <SelectItem key={index} value={ingredient.name}>
                    {ingredient.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange as any}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 Days</SelectItem>
                <SelectItem value="30d">30 Days</SelectItem>
                <SelectItem value="90d">90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedIngredient && (
            <Tabs defaultValue="trends" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="trends">Price Trends</TabsTrigger>
                <TabsTrigger value="comparison">Store Analysis</TabsTrigger>
                <TabsTrigger value="alerts">Alerts</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="trends" className="space-y-4">
                {stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Current Avg</div>
                      <div className="text-2xl font-bold">£{stats.currentAvg}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">7-day Change</div>
                      <div className={`text-2xl font-bold flex items-center gap-1 ${stats.isIncreasing ? 'text-red-600' : 'text-green-600'}`}>
                        {stats.isIncreasing ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                        {stats.changePercent}%
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Lowest</div>
                      <div className="text-2xl font-bold text-green-600">£{stats.min}</div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">Highest</div>
                      <div className="text-2xl font-bold text-red-600">£{stats.max}</div>
                    </Card>
                  </div>
                )}

                <Card className="p-4">
                  <h4 className="font-medium mb-4">Price Trend - {selectedIngredient}</h4>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`£${value}`, 'Price']} />
                        {selectedStores.map((store, index) => (
                          <Line 
                            key={store}
                            type="monotone" 
                            dataKey="price" 
                            stroke={COLORS[index % COLORS.length]}
                            data={trendData.filter(d => d.store === store)}
                            name={store}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h4 className="font-medium mb-4">Average Prices by Store</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={storeComparison}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="store" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`£${value}`, 'Avg Price']} />
                          <Bar dataKey="avgPrice" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium mb-4">Market Share Distribution</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={storeComparison}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="avgPrice"
                            label={({store}) => store}
                          >
                            {storeComparison.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4">
                <div className="space-y-3">
                  {priceAlerts.map((alert) => (
                    <Card key={alert.id} className={`p-4 ${alert.triggered ? 'border-green-500 bg-green-50' : 'border-orange-500 bg-orange-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className={`h-5 w-5 ${alert.triggered ? 'text-green-600' : 'text-orange-600'}`} />
                          <div>
                            <div className="font-medium">{alert.ingredient} at {alert.store}</div>
                            <div className="text-sm text-muted-foreground">
                              Current: £{alert.currentPrice} | Target: £{alert.targetPrice}
                            </div>
                          </div>
                        </div>
                        <Badge variant={alert.triggered ? 'default' : 'secondary'}>
                          {alert.triggered ? 'Triggered' : 'Watching'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="insights" className="space-y-4">
                <div className="space-y-3">
                  {marketInsights.map((insight, index) => (
                    <Card key={index} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <Zap className={`h-5 w-5 mt-1 ${
                            insight.impact === 'high' ? 'text-red-500' : 
                            insight.impact === 'medium' ? 'text-orange-500' : 'text-blue-500'
                          }`} />
                          <div className="flex-1">
                            <div className="font-medium">{insight.title}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {insight.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={insight.impact === 'high' ? 'destructive' : 'secondary'}>
                            {insight.impact} impact
                          </Badge>
                          {insight.actionable && (
                            <Button size="sm" variant="outline">
                              Take Action
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};