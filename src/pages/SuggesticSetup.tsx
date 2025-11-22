import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { updateSuggesticUserId } from '@/utils/updateSuggesticUserId';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export default function SuggesticSetup() {
  const [userId, setUserId] = useState('6fe68eca-d534-4297-9ccc-5c69cfd1ef5d');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleUpdate = async () => {
    if (!userId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Suggestic user ID",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateSuggesticUserId(userId.trim());
      
      if (result.success) {
        toast({
          title: "Success! 🎉",
          description: "Your Suggestic user ID has been updated. You can now use the shopping list feature.",
        });
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast({
          title: "Update Failed",
          description: result.error || "Failed to update Suggestic user ID",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connect Suggestic Account</CardTitle>
          <CardDescription>
            Enter your existing Suggestic user ID to enable the shopping list feature
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="userId" className="text-sm font-medium">
              Suggestic User ID
            </label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="6fe68eca-d534-4297-9ccc-5c69cfd1ef5d"
              className="font-mono text-sm"
            />
          </div>
          
          <Button 
            onClick={handleUpdate} 
            disabled={isUpdating}
            className="w-full"
          >
            {isUpdating ? 'Updating...' : 'Update Suggestic User ID'}
          </Button>
          
          <Button 
            onClick={() => navigate('/')} 
            variant="outline"
            className="w-full"
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
