import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, BellRing, TrendingDown, Target, Zap, Settings, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NotificationRule {
  id: string;
  ingredient: string;
  type: 'price_drop' | 'target_price' | 'store_deal' | 'seasonal_low';
  threshold?: number;
  targetPrice?: number;
  stores: string[];
  enabled: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'price_alert' | 'deal' | 'trend' | 'recommendation';
  timestamp: Date;
  read: boolean;
  actionable: boolean;
  data?: any;
}

interface SmartNotificationsProps {
  ingredients?: string[];
  onNotificationAction?: (notification: Notification) => void;
}

export const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  ingredients = [],
  onNotificationAction
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationRules, setNotificationRules] = useState<NotificationRule[]>([]);
  const [newRule, setNewRule] = useState<Partial<NotificationRule>>({
    type: 'price_drop',
    stores: ['tesco', 'sainsburys', 'asda', 'aldi'],
    enabled: true,
    frequency: 'instant'
  });
  const [showAddRule, setShowAddRule] = useState(false);
  const { toast } = useToast();

  // Mock notifications for demo
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        title: '🎯 Price Drop Alert',
        message: 'Broccoli at Aldi dropped to £0.89 (15% off)',
        type: 'price_alert',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false,
        actionable: true,
        data: { ingredient: 'broccoli', store: 'aldi', price: 0.89, savings: 0.15 }
      },
      {
        id: '2',
        title: '💡 Smart Recommendation',
        message: 'Switch to Aldi for this week\'s shopping to save £8.50',
        type: 'recommendation',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        actionable: true,
        data: { recommendedStore: 'aldi', savings: 8.50 }
      },
      {
        id: '3',
        title: '📈 Market Trend',
        message: 'Tomato prices expected to rise 12% next week',
        type: 'trend',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        read: true,
        actionable: false,
        data: { ingredient: 'tomatoes', trend: 'increasing', percentage: 12 }
      },
      {
        id: '4',
        title: '🔥 Limited Deal',
        message: 'Sainsbury\'s 20% off all vegetables - ends today',
        type: 'deal',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
        read: true,
        actionable: true,
        data: { store: 'sainsburys', discount: 20, category: 'vegetables' }
      }
    ];
    setNotifications(mockNotifications);

    // Mock notification rules
    const mockRules: NotificationRule[] = [
      {
        id: '1',
        ingredient: 'broccoli',
        type: 'price_drop',
        threshold: 10,
        stores: ['aldi', 'tesco'],
        enabled: true,
        frequency: 'instant'
      },
      {
        id: '2',
        ingredient: 'chicken breast',
        type: 'target_price',
        targetPrice: 3.50,
        stores: ['sainsburys', 'asda'],
        enabled: true,
        frequency: 'daily'
      }
    ];
    setNotificationRules(mockRules);
  }, []);

  const handleMarkAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const handleNotificationAction = (notification: Notification) => {
    handleMarkAsRead(notification.id);
    onNotificationAction?.(notification);

    // Show appropriate action based on notification type
    switch (notification.type) {
      case 'price_alert':
        toast({
          title: "Price Alert Activated",
          description: `Added ${notification.data.ingredient} to your shopping list at ${notification.data.store}`,
        });
        break;
      case 'recommendation':
        toast({
          title: "Recommendation Applied",
          description: `Switched preferred store to ${notification.data.recommendedStore}`,
        });
        break;
      case 'deal':
        toast({
          title: "Deal Saved",
          description: `Added ${notification.data.store} deal to your alerts`,
        });
        break;
    }
  };

  const handleAddRule = () => {
    if (!newRule.ingredient || !newRule.type) {
      toast({
        title: "Invalid Rule",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const rule: NotificationRule = {
      id: Math.random().toString(36).substr(2, 9),
      ingredient: newRule.ingredient!,
      type: newRule.type!,
      threshold: newRule.threshold,
      targetPrice: newRule.targetPrice,
      stores: newRule.stores || ['tesco', 'sainsburys', 'asda', 'aldi'],
      enabled: true,
      frequency: newRule.frequency || 'instant'
    };

    setNotificationRules(prev => [...prev, rule]);
    setNewRule({
      type: 'price_drop',
      stores: ['tesco', 'sainsburys', 'asda', 'aldi'],
      enabled: true,
      frequency: 'instant'
    });
    setShowAddRule(false);

    toast({
      title: "Notification Rule Added",
      description: `You'll be notified about ${rule.ingredient} price changes`,
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    setNotificationRules(prev => prev.filter(r => r.id !== ruleId));
    toast({
      title: "Rule Deleted",
      description: "Notification rule has been removed",
    });
  };

  const toggleRuleEnabled = (ruleId: string) => {
    setNotificationRules(prev => prev.map(r => 
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ));
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_alert': return <TrendingDown className="h-4 w-4 text-green-600" />;
      case 'deal': return <Zap className="h-4 w-4 text-orange-600" />;
      case 'trend': return <Target className="h-4 w-4 text-blue-600" />;
      case 'recommendation': return <Bell className="h-4 w-4 text-purple-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Smart Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddRule(!showAddRule)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </CardTitle>
          <CardDescription>
            Get intelligent alerts for price drops, deals, and market trends
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Rule Form */}
          {showAddRule && (
            <Card className="p-4 bg-muted/50">
              <h4 className="font-medium mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Create Notification Rule
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ingredient">Ingredient</Label>
                  <Select value={newRule.ingredient} onValueChange={(value) => setNewRule(prev => ({ ...prev, ingredient: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ingredient" />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredients.map((ingredient, index) => (
                        <SelectItem key={index} value={ingredient}>
                          {ingredient}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Alert Type</Label>
                  <Select value={newRule.type} onValueChange={(value: any) => setNewRule(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price_drop">Price Drop (%)</SelectItem>
                      <SelectItem value="target_price">Target Price</SelectItem>
                      <SelectItem value="store_deal">Store Deal</SelectItem>
                      <SelectItem value="seasonal_low">Seasonal Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {newRule.type === 'price_drop' && (
                  <div className="space-y-2">
                    <Label htmlFor="threshold">Drop Threshold (%)</Label>
                    <Input
                      type="number"
                      value={newRule.threshold || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                      placeholder="e.g. 10"
                    />
                  </div>
                )}

                {newRule.type === 'target_price' && (
                  <div className="space-y-2">
                    <Label htmlFor="targetPrice">Target Price (£)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newRule.targetPrice || ''}
                      onChange={(e) => setNewRule(prev => ({ ...prev, targetPrice: Number(e.target.value) }))}
                      placeholder="e.g. 2.50"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select value={newRule.frequency} onValueChange={(value: any) => setNewRule(prev => ({ ...prev, frequency: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instant">Instant</SelectItem>
                      <SelectItem value="daily">Daily Digest</SelectItem>
                      <SelectItem value="weekly">Weekly Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleAddRule}>
                  Add Rule
                </Button>
                <Button variant="outline" onClick={() => setShowAddRule(false)}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          {/* Recent Notifications */}
          <div className="space-y-4">
            <h4 className="font-medium">Recent Notifications</h4>
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card key={notification.id} className={`p-4 ${!notification.read ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1">
                        <div className="font-medium">{notification.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {getTimeAgo(notification.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!notification.read && (
                        <Badge variant="secondary" className="h-6">
                          New
                        </Badge>
                      )}
                      {notification.actionable && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleNotificationAction(notification)}
                        >
                          Act Now
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Notification Rules */}
          <div className="space-y-4">
            <h4 className="font-medium">Active Rules</h4>
            <div className="space-y-3">
              {notificationRules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={() => toggleRuleEnabled(rule.id)}
                      />
                      <div>
                        <div className="font-medium capitalize">
                          {rule.ingredient} - {rule.type.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {rule.type === 'price_drop' && `Alert when price drops ${rule.threshold}%`}
                          {rule.type === 'target_price' && `Alert when price reaches £${rule.targetPrice}`}
                          {rule.type === 'store_deal' && 'Alert for store deals'}
                          {rule.type === 'seasonal_low' && 'Alert for seasonal lows'}
                          {' • '}
                          {rule.stores.join(', ')} • {rule.frequency}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};