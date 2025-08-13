import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Users, Target, ShoppingCart } from 'lucide-react';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState({
    personalDetails: { name: '', email: '', household: 2, budget: 80 },
    dietaryPreferences: { diet: 'omnivore', allergies: [], cuisines: [] },
    connectedStores: {},
    preferences: { notifications: true, priceAlerts: true }
  });

  const steps = [
    { title: 'Personal Details', icon: Users },
    { title: 'Dietary Preferences', icon: Target },
    { title: 'Connect Stores', icon: ShoppingCart }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      onComplete(data);
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Welcome to MealPlanner Pro</h2>
            <p className="text-muted-foreground">Let's get you set up in just a few steps</p>
            <Progress value={progress} className="mt-4" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
                {steps[currentStep].title}
              </CardTitle>
              <CardDescription>Step {currentStep + 1} of {steps.length}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <input 
                      className="w-full p-2 border rounded"
                      value={data.personalDetails.name}
                      onChange={(e) => setData(prev => ({
                        ...prev,
                        personalDetails: { ...prev.personalDetails, name: e.target.value }
                      }))}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <input 
                      type="email"
                      className="w-full p-2 border rounded"
                      value={data.personalDetails.email}
                      onChange={(e) => setData(prev => ({
                        ...prev,
                        personalDetails: { ...prev.personalDetails, email: e.target.value }
                      }))}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Diet Type</label>
                    <select 
                      className="w-full p-2 border rounded"
                      value={data.dietaryPreferences.diet}
                      onChange={(e) => setData(prev => ({
                        ...prev,
                        dietaryPreferences: { ...prev.dietaryPreferences, diet: e.target.value }
                      }))}
                    >
                      <option value="omnivore">Omnivore</option>
                      <option value="vegetarian">Vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="keto">Keto</option>
                    </select>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="text-center">
                  <h3 className="font-medium">Connect Your Store Accounts</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    You can connect your supermarket accounts later to enable automatic basket creation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Complete Setup' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};