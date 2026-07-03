import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, ShoppingCart, Clock, PiggyBank } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted, onSignIn }) => {
  const stores = [
    { name: 'Tesco', color: '#00539F' },
    { name: "Sainsbury's", color: '#F06C00' },
    { name: 'Asda', color: '#78BE20' },
    { name: 'Waitrose', color: '#006B3A' },
    { name: 'Morrisons', color: '#006836' },
  ];

  return (
    <div className="min-h-[85vh] flex flex-col justify-center">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-foreground tracking-tight leading-[1.1]">
              Plan your meals.
              <br />
              <span className="text-primary">Find the cheapest store.</span>
              <br />
              Shop in one click.
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
              SmartCart plans your week's dinners, compares prices across the UK's Big 5 supermarkets, and sends you straight to checkout.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Button
              size="lg"
              className="flex-1 h-13 text-base font-medium"
              onClick={onGetStarted}
            >
              Plan your first week free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-13 text-base"
              onClick={onSignIn}
            >
              Sign in
            </Button>
          </div>

          <div className="pt-4">
            <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wider">
              Comparing prices across
            </p>
            <div className="flex justify-center items-center gap-6 flex-wrap">
              {stores.map(store => (
                <span
                  key={store.name}
                  className="text-sm font-medium"
                  style={{ color: store.color }}
                >
                  {store.name}
                </span>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">Tell us your diet & budget</p>
              <p className="text-xs text-muted-foreground">Allergies, household size, weekly budget — we plan around you</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <PiggyBank className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">We find the cheapest store</p>
              <p className="text-xs text-muted-foreground">Real daily prices from all 5 supermarkets, compared automatically</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">Checkout or get it delivered</p>
              <p className="text-xs text-muted-foreground">Redirect to store, Uber courier, or export your list</p>
            </div>
          </div>

          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground">
              The average UK family spends <span className="font-semibold text-foreground">£118/week</span> on groceries.
              <br />
              SmartCart finds the store where your exact basket costs least.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
