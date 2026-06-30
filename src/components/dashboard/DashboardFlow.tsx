import React, { useRef, useCallback } from 'react';
import { MealCarousel } from './MealCarousel';
import { ShoppingListSection } from './ShoppingListSection';
import { PriceComparisonBar } from './PriceComparisonBar';
import { FulfilmentOptions } from './FulfilmentOptions';
import { MobileNav } from './MobileNav';
import { usePepestoMealPlan } from '@/hooks/usePepestoMealPlan';
import { useToast } from '@/hooks/use-toast';

interface DashboardFlowProps {
  userProfile: any;
}

export const DashboardFlow: React.FC<DashboardFlowProps> = ({ userProfile }) => {
  const { toast } = useToast();
  const planRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const compareRef = useRef<HTMLDivElement>(null);

  const {
    meals,
    shoppingList,
    priceComparison,
    cheapestStore,
    isGenerating,
    isComparingPrices,
    activeSection,
    setActiveSection,
    generatePlan,
    comparePrices,
    toggleListItem,
    swapMeal,
  } = usePepestoMealPlan(userProfile);

  const handleNavigate = useCallback((section: string) => {
    setActiveSection(section);
    const refs: Record<string, React.RefObject<HTMLDivElement>> = {
      plan: planRef,
      list: listRef,
      compare: compareRef,
    };
    refs[section]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [setActiveSection]);

  const handleCheckout = useCallback((store: string) => {
    toast({
      title: 'Opening checkout...',
      description: `Redirecting to ${store} with your basket`,
    });
    // TODO: Call Pepesto /oneshot for checkout redirect
  }, [toast]);

  const handleCourier = useCallback(() => {
    toast({
      title: 'Courier delivery',
      description: 'Uber Direct integration coming soon',
    });
    // TODO: Call Uber Direct API
  }, [toast]);

  const handleExportList = useCallback((format: 'reminders' | 'pdf' | 'clipboard') => {
    if (format === 'clipboard') {
      const text = shoppingList
        .filter(i => !i.inPantry)
        .map(i => `${i.name} — ${i.quantity}`)
        .join('\n');
      navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: 'Shopping list copied to clipboard' });
    } else {
      toast({ title: 'Export', description: `${format} export coming soon` });
    }
  }, [shoppingList, toast]);

  // Format week label
  const now = new Date();
  const endOfWeek = new Date(now);
  endOfWeek.setDate(now.getDate() + 6);
  const weekLabel = `${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${endOfWeek.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;

  const cheapestPrice = priceComparison.length > 0
    ? [...priceComparison].sort((a, b) => parseFloat(a.totalPounds) - parseFloat(b.totalPounds))[0]?.totalPounds || '0'
    : '0';

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">

        {/* Section 1: Meal Plan */}
        <div ref={planRef}>
          <MealCarousel
            meals={meals}
            onSwapMeal={swapMeal}
            onRegenerateAll={generatePlan}
            isLoading={isGenerating}
            weekLabel={weekLabel}
          />
        </div>

        {/* Divider */}
        <hr className="border-border" />

        {/* Section 2: Shopping List */}
        <div ref={listRef}>
          <ShoppingListSection
            items={shoppingList}
            onToggleItem={toggleListItem}
            isLoading={isGenerating}
          />
        </div>

        {/* Divider */}
        <hr className="border-border" />

        {/* Section 3: Price Comparison */}
        <div ref={compareRef}>
          <PriceComparisonBar
            prices={priceComparison}
            cheapestStore={cheapestStore}
            isLoading={isComparingPrices}
            onSelectStore={(store) => handleCheckout(store)}
          />
        </div>

        {/* Divider */}
        {priceComparison.length > 0 && <hr className="border-border" />}

        {/* Section 4: Fulfilment */}
        {priceComparison.length > 0 && (
          <FulfilmentOptions
            cheapestStore={cheapestStore}
            cheapestPrice={cheapestPrice}
            onCheckout={handleCheckout}
            onCourierDelivery={handleCourier}
            onExportList={handleExportList}
          />
        )}
      </div>

      {/* Mobile bottom nav */}
      <MobileNav
        activeSection={activeSection}
        onNavigate={handleNavigate}
      />
    </div>
  );
};
