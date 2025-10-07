import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, ShoppingCart } from 'lucide-react';

interface MealPlanConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipes: any[];
  shoppingStrategy?: any;
  connectedStores: any[];
}

export const MealPlanConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  recipes,
  shoppingStrategy,
  connectedStores 
}: MealPlanConfirmationModalProps) => {
  const totalCost = recipes.reduce((sum, recipe) => sum + (recipe.estimatedCost || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Confirm Your Weekly Meal Plan
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3">
            {recipes.map((recipe, index) => (
              <Card key={index} className="p-3">
                <div className="flex gap-3">
                  {recipe.image && (
                    <img src={recipe.image} alt={recipe.name} className="w-16 h-16 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">Day {index + 1}: {recipe.name}</h4>
                        <p className="text-sm text-muted-foreground">Serves {recipe.servings}</p>
                      </div>
                      <span className="font-semibold">£{recipe.estimatedCost?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Separator />

          <div className="space-y-2">
            <h3 className="font-semibold">Shopping Strategy</h3>
            {connectedStores.length > 0 ? (
              <div className="grid gap-2">
                {connectedStores.map((store, index) => (
                  <Card key={index} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        <span className="font-medium">{store.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">Items will be added to cart</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No stores connected. Items will be optimized for best prices.</p>
            )}
          </div>

          <Separator />

          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Estimated Cost:</span>
            <span>£{totalCost.toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={onConfirm}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Confirm & Add to Carts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
