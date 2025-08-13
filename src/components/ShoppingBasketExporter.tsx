import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShoppingCart, Download, ExternalLink, Calendar, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addItemsToBasket, formatItemsForBasket } from '@/utils/shoppingBasketService';

interface ShoppingBasketExporterProps {
  shoppingItems: any;
  userCredentials: any;
  connectedStores: any[];
}

export const ShoppingBasketExporter: React.FC<ShoppingBasketExporterProps> = ({
  shoppingItems,
  userCredentials,
  connectedStores
}) => {
  const [exportStatus, setExportStatus] = useState<{[key: string]: 'pending' | 'loading' | 'success' | 'error'}>({});
  const { toast } = useToast();

  const availableStores = [
    { id: 'tesco', name: 'Tesco', status: 'active' },
    { id: 'sainsburys', name: 'Sainsbury\'s', status: 'active' },
    { id: 'asda', name: 'ASDA', status: 'active' },
    { id: 'aldi', name: 'Aldi', status: 'beta' }
  ];

  const handleExportToStore = async (storeId: string) => {
    const credentials = userCredentials[storeId];
    if (!credentials?.username || !credentials?.password) {
      toast({
        title: "Missing credentials",
        description: `Please set up your ${availableStores.find(s => s.id === storeId)?.name} credentials first.`,
        variant: "destructive"
      });
      return;
    }

    setExportStatus(prev => ({ ...prev, [storeId]: 'loading' }));

    try {
      const items = formatItemsForBasket(shoppingItems);
      const result = await addItemsToBasket(storeId, credentials, items);

      if (result.success) {
        setExportStatus(prev => ({ ...prev, [storeId]: 'success' }));
        toast({
          title: "Basket created successfully!",
          description: result.message || `Items added to your ${availableStores.find(s => s.id === storeId)?.name} basket.`
        });

        if (result.basketUrl) {
          window.open(result.basketUrl, '_blank');
        }
      } else {
        throw new Error(result.error || 'Failed to create basket');
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus(prev => ({ ...prev, [storeId]: 'error' }));
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: "destructive"
      });
    }
  };

  const exportToPDF = () => {
    if (!shoppingItems) return;
    
    const itemsText = Object.entries(shoppingItems).map(([category, items]: [string, any]) => {
      return `${category.toUpperCase()}:\n${items?.map((item: any) => `- ${item.name || item} (${item.amount || '1'})`).join('\n') || ''}`;
    }).join('\n\n');

    const blob = new Blob([itemsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Shopping list downloaded!" });
  };

  const totalItems = Object.values(shoppingItems || {}).reduce((total: number, items: any) => {
    return total + (Array.isArray(items) ? items.length : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Export Shopping List
          </CardTitle>
          <CardDescription>
            Export your shopping list to connected stores or download as PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Ready to export {String(totalItems)} items from your weekly meal plan
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h4 className="font-medium">Export to Stores</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableStores.map(store => {
                const isConnected = connectedStores.some(s => s.name === store.id);
                const status = exportStatus[store.id] || 'pending';
                
                return (
                  <div key={store.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{store.name}</span>
                      <Badge variant={store.status === 'active' ? 'secondary' : 'outline'}>
                        {store.status}
                      </Badge>
                      {!isConnected && (
                        <Badge variant="outline">Not connected</Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={!isConnected || status === 'loading'}
                      onClick={() => handleExportToStore(store.id)}
                      variant={status === 'success' ? 'secondary' : 'default'}
                    >
                      {status === 'loading' && 'Exporting...'}
                      {status === 'success' && <CheckCircle className="h-4 w-4" />}
                      {status === 'pending' && <ExternalLink className="h-4 w-4" />}
                      {status === 'error' && 'Retry'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Other Export Options</h4>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Download as Text
              </Button>
              <Button variant="outline" disabled>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Delivery
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};