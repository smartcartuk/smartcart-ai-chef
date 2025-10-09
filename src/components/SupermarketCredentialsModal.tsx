import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Store, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveConnectedStores } from '@/utils/profileService';

interface SupermarketCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (credentials: any) => void;
  initialCredentials?: any;
}

export const SupermarketCredentialsModal: React.FC<SupermarketCredentialsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialCredentials = {}
}) => {
  const [credentials, setCredentials] = useState(initialCredentials);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const STORES = [
    { id: 'tesco', name: 'Tesco', status: 'active' },
    { id: 'sainsburys', name: 'Sainsbury\'s', status: 'active' },
    { id: 'asda', name: 'ASDA', status: 'active' },
    { id: 'aldi', name: 'Aldi', status: 'beta' }
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Transform credentials object into array format for database
      const storesToSave = Object.entries(credentials)
        .filter(([_, creds]: [string, any]) => creds?.username && creds?.password)
        .map(([storeId, creds]: [string, any]) => {
          const store = STORES.find(s => s.id === storeId);
          return {
            name: store?.name || storeId,
            credentials: {
              username: creds.username,
              password: creds.password,
              loyaltyCard: creds.loyaltyCard
            },
            has_loyalty_card: Boolean(creds.loyaltyCard)
          };
        });

      // Save to database
      const result = await saveConnectedStores(storesToSave);
      
      if (result.success) {
        onSave(credentials);
        toast({ 
          title: "Success", 
          description: `${storesToSave.length} store(s) connected successfully` 
        });
        onClose();
      } else {
        toast({ 
          title: "Error", 
          description: result.error || "Failed to save credentials",
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to save credentials",
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Store Account Credentials
          </DialogTitle>
          <DialogDescription>
            Connect your supermarket accounts for automatic basket creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {STORES.map(store => (
            <Card key={store.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    {store.name}
                    <Badge variant={store.status === 'active' ? 'secondary' : 'outline'}>
                      {store.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Username/Email</Label>
                    <Input
                      value={credentials[store.id]?.username || ''}
                      onChange={(e) => setCredentials(prev => ({
                        ...prev,
                        [store.id]: { ...prev[store.id], username: e.target.value }
                      }))}
                      placeholder="Enter username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords[store.id] ? 'text' : 'password'}
                        value={credentials[store.id]?.password || ''}
                        onChange={(e) => setCredentials(prev => ({
                          ...prev,
                          [store.id]: { ...prev[store.id], password: e.target.value }
                        }))}
                        placeholder="Enter password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPasswords(prev => ({ ...prev, [store.id]: !prev[store.id] }))}
                      >
                        {showPasswords[store.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Credentials'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};