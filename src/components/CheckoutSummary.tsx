import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle2, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CheckoutSummaryProps {
  basketUrls: { [store: string]: string };
  totalCosts: { [store: string]: number };
  onMarkAsOrdered?: () => void;
}

export const CheckoutSummary = ({ basketUrls, totalCosts, onMarkAsOrdered }: CheckoutSummaryProps) => {
  const { toast } = useToast();

  const handleMarkAsOrdered = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const totalCost = Object.values(totalCosts).reduce((sum, cost) => sum + cost, 0);
      
      const { error } = await supabase
        .from('order_history')
        .insert({
          user_id: user.id,
          week_start: new Date().toISOString().split('T')[0],
          meal_plan_data: {},
          basket_urls: basketUrls,
          total_cost: totalCost
        });

      if (error) throw error;

      toast({
        title: "Order Marked Complete! 🎉",
        description: "Your order has been saved to history"
      });

      onMarkAsOrdered?.();
    } catch (error: any) {
      console.error('Error marking order:', error);
      toast({
        title: "Error",
        description: "Failed to save order history",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-6 w-6" />
          Your Shopping Carts Ready
        </h2>
        {onMarkAsOrdered && (
          <Button onClick={handleMarkAsOrdered} variant="outline">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Mark as Ordered
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(basketUrls).map(([store, url]) => (
          <Card key={store} className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{store}</h3>
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Estimated Total:</span>
                  <span className="font-semibold">£{totalCosts[store]?.toFixed(2) || '0.00'}</span>
                </div>
              </div>

              <Button asChild className="w-full">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  Go to {store} Checkout
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 bg-primary/5">
        <p className="text-sm text-center">
          💡 Tip: Items have been added to your carts. Complete checkout on each store's website to finalize your orders.
        </p>
      </Card>
    </div>
  );
};
