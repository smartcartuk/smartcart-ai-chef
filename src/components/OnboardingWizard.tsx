import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, ChevronLeft, Users, Leaf, PiggyBank, Store, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: any) => void;
}

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Pescatarian', 'Halal', 'Kosher',
  'Keto', 'Low carb', 'Mediterranean', 'Dairy-free', 'Gluten-free',
];

const ALLERGY_OPTIONS = [
  'Nuts', 'Peanuts', 'Dairy', 'Eggs', 'Soy', 'Wheat/Gluten',
  'Shellfish', 'Fish', 'Sesame', 'Celery', 'Mustard', 'Lupin',
];

const STORE_OPTIONS = [
  { name: 'Tesco', domain: 'tesco.com', color: '#00539F' },
  { name: "Sainsbury's", domain: 'sainsburys.co.uk', color: '#F06C00' },
  { name: 'Asda', domain: 'asda.com', color: '#78BE20' },
  { name: 'Waitrose', domain: 'waitrose.com', color: '#006B3A' },
  { name: 'Morrisons', domain: 'groceries.morrisons.com', color: '#006836' },
];

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { id: 'lunch', label: 'Lunch', emoji: '☀️' },
  { id: 'dinner', label: 'Dinner', emoji: '🌙' },
  { id: 'snack', label: 'Snacks', emoji: '🍎' },
];

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ isOpen, onClose, onComplete }) => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    full_name: '',
    postcode: '',
    household_size: 2,
    weekly_budget: 50,
    dietary_preferences: [] as string[],
    allergies: [] as string[],
    meal_types: ['breakfast', 'lunch', 'dinner'] as string[],
    preferred_supermarkets: ['tesco', 'asda', 'sainsburys'] as string[],
    preferred_fulfilment: 'delivery' as string,
  });

  const steps = [
    { title: 'Your household', icon: Users, subtitle: 'Who are you cooking for?' },
    { title: 'Dietary needs', icon: Leaf, subtitle: 'Any preferences or allergies?' },
    { title: 'Your budget', icon: PiggyBank, subtitle: 'How much do you want to spend?' },
    { title: 'Your stores', icon: Store, subtitle: 'Where do you usually shop?' },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const toggleItem = (item: string, field: 'dietary_preferences' | 'allergies' | 'meal_types' | 'preferred_supermarkets') => {
    setProfile(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // Save to database
        const { error } = await supabase.from('profiles').upsert({
          id: session.user.id,
          full_name: profile.full_name,
          postcode: profile.postcode,
          household_size: profile.household_size,
          weekly_budget: profile.weekly_budget,
          dietary_preferences: profile.dietary_preferences,
          allergies: profile.allergies,
          meal_types: profile.meal_types,
          preferred_supermarkets: profile.preferred_supermarkets,
          preferred_fulfilment: profile.preferred_fulfilment,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error('Profile save error:', error);
          // Continue anyway — don't block the user
        }
      }

      toast({ title: 'All set!', description: 'Generating your personalised meal plan...' });
      onComplete(profile);
    } catch (err: any) {
      console.error('Onboarding error:', err);
      // Still complete — the profile data is in state even if DB save fails
      onComplete(profile);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">{steps[currentStep].title}</h2>
            <p className="text-sm text-muted-foreground">{steps[currentStep].subtitle}</p>
            <Progress value={progress} className="mt-3 h-1.5" />
          </div>

          {/* Step 1: Household */}
          {currentStep === 0 && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="ob-name" className="text-sm">Your name</Label>
                <Input
                  id="ob-name"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="First name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="ob-postcode" className="text-sm">Postcode</Label>
                <Input
                  id="ob-postcode"
                  value={profile.postcode}
                  onChange={(e) => setProfile(prev => ({ ...prev, postcode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. SW1A 1AA"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm">Household size</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <button
                      key={n}
                      onClick={() => setProfile(prev => ({ ...prev, household_size: n }))}
                      className={`w-11 h-11 rounded-lg border-2 font-medium text-sm transition-colors ${
                        profile.household_size === n
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Which meals do you want to plan?</Label>
                <div className="flex gap-2 mt-2">
                  {MEAL_TYPES.map(meal => (
                    <button
                      key={meal.id}
                      onClick={() => toggleItem(meal.id, 'meal_types')}
                      className={`flex-1 py-2.5 px-2 rounded-lg border-2 text-center transition-colors ${
                        profile.meal_types.includes(meal.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <span className="text-lg">{meal.emoji}</span>
                      <p className="text-[10px] font-medium mt-0.5">{meal.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Dietary needs */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <Label className="text-sm">Dietary preferences</Label>
                <p className="text-xs text-muted-foreground mb-2">Select all that apply, or skip</p>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map(pref => (
                    <button
                      key={pref}
                      onClick={() => toggleItem(pref.toLowerCase(), 'dietary_preferences')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        profile.dietary_preferences.includes(pref.toLowerCase())
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/30'
                      }`}
                    >
                      {pref}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm">Allergies or intolerances</Label>
                <p className="text-xs text-muted-foreground mb-2">We'll exclude these from all recipes</p>
                <div className="flex flex-wrap gap-2">
                  {ALLERGY_OPTIONS.map(allergy => (
                    <button
                      key={allergy}
                      onClick={() => toggleItem(allergy.toLowerCase(), 'allergies')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        profile.allergies.includes(allergy.toLowerCase())
                          ? 'border-red-400 bg-red-50 text-red-600'
                          : 'border-border text-muted-foreground hover:border-red-200'
                      }`}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div>
                <Label className="text-sm">Weekly grocery budget</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  We'll plan meals that fit within this
                </p>

                <div className="text-center mb-4">
                  <span className="text-4xl font-semibold text-primary">
                    £{profile.weekly_budget}
                  </span>
                  <span className="text-sm text-muted-foreground">/week</span>
                </div>

                <input
                  type="range"
                  min="20"
                  max="200"
                  step="5"
                  value={profile.weekly_budget}
                  onChange={(e) => setProfile(prev => ({ ...prev, weekly_budget: Number(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>£20</span>
                  <span>£200</span>
                </div>
              </div>

              <Card className="bg-primary/5 border-primary/10">
                <CardContent className="p-4">
                  <p className="text-sm text-foreground">
                    {profile.weekly_budget <= 40
                      ? '💪 Budget-friendly — we\'ll focus on value meals and own-brand products'
                      : profile.weekly_budget <= 80
                        ? '👍 Mid-range — good variety with a mix of brands and fresh ingredients'
                        : '✨ Flexible — more premium ingredients and wider recipe choice'}
                  </p>
                </CardContent>
              </Card>

              <div>
                <Label className="text-sm">Preferred delivery method</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { id: 'delivery', label: 'Home delivery', emoji: '🚛' },
                    { id: 'click_collect', label: 'Click & collect', emoji: '🏪' },
                    { id: 'courier', label: 'Uber courier', emoji: '🚗' },
                    { id: 'self_shop', label: 'Shop myself', emoji: '🛒' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setProfile(prev => ({ ...prev, preferred_fulfilment: opt.id }))}
                      className={`p-3 rounded-lg border-2 text-left transition-colors ${
                        profile.preferred_fulfilment === opt.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <span className="text-lg">{opt.emoji}</span>
                      <p className="text-xs font-medium mt-1">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Store preferences */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Where do you usually shop?</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  We'll compare prices across these stores
                </p>
                <div className="space-y-2">
                  {STORE_OPTIONS.map(store => {
                    const storeKey = store.name.toLowerCase().replace("'s", 's').replace(' ', '');
                    const isSelected = profile.preferred_supermarkets.includes(storeKey);
                    return (
                      <button
                        key={store.name}
                        onClick={() => toggleItem(storeKey, 'preferred_supermarkets')}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        <span
                          className="text-sm font-bold w-8"
                          style={{ color: store.color }}
                        >
                          {store.name.charAt(0)}
                        </span>
                        <span className="text-sm font-medium flex-1 text-left">{store.name}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
              disabled={currentStep === 0 || isSaving}
              className="text-muted-foreground"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>

            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === currentStep ? 'bg-primary' : i < currentStep ? 'bg-primary/40' : 'bg-border'
                  }`}
                />
              ))}
            </div>

            <Button onClick={handleNext} disabled={isSaving}>
              {isSaving
                ? 'Saving...'
                : currentStep === steps.length - 1
                  ? 'Generate plan'
                  : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
