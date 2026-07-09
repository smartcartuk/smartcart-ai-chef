import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const MARQUEE_ITEMS = [
  'TESCO', "SAINSBURY'S", 'ASDA', 'WAITROSE', 'MORRISONS',
  'COMPARED DAILY', 'REAL PRICES', 'ONE BASKET',
];

const FOOD_FLOATS = [
  { emoji: '🍅', className: 'top-[12%] left-[6%] text-5xl md:text-6xl', delay: '0s' },
  { emoji: '🥦', className: 'top-[22%] right-[8%] text-4xl md:text-5xl', delay: '1.2s' },
  { emoji: '🧀', className: 'bottom-[30%] left-[10%] text-4xl md:text-5xl', delay: '0.6s' },
  { emoji: '🥕', className: 'bottom-[18%] right-[12%] text-5xl md:text-6xl', delay: '1.8s' },
];

export const Hero: React.FC<HeroProps> = ({ onGetStarted, onSignIn }) => {
  return (
    <div className="relative overflow-hidden">

      {/* Floating food elements */}
      {FOOD_FLOATS.map((f, i) => (
        <span
          key={i}
          aria-hidden
          className={`absolute float-slow select-none pointer-events-none opacity-90 ${f.className}`}
          style={{ animationDelay: f.delay }}
        >
          {f.emoji}
        </span>
      ))}

      <div className="container mx-auto px-4 pt-16 md:pt-24 pb-10">
        <div className="max-w-5xl mx-auto text-center">

          {/* Heritage line — Crav's "Est. 1997" move */}
          <p className="section-tag reveal-up">Built for UK families — London to Leeds</p>

          {/* Massive editorial display type */}
          <h1 className="font-display text-[17vw] md:text-[7.5rem] lg:text-[9rem] text-foreground mt-4 reveal-up reveal-delay-1">
            Plan.
            <span className="block text-primary">Compare.</span>
            <span className="block text-accent">Save.</span>
          </h1>

          <p className="text-base md:text-xl text-muted-foreground max-w-xl mx-auto mt-6 leading-relaxed reveal-up reveal-delay-2">
            Your week's meals planned, priced across the Big&nbsp;5 supermarkets,
            and sent straight to checkout. Zero spreadsheets. Zero guesswork.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto mt-8 reveal-up reveal-delay-3">
            <Button
              size="lg"
              className="flex-1 h-13 text-base font-semibold rounded-full"
              onClick={onGetStarted}
            >
              Plan your first week free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-13 text-base rounded-full border-foreground/20"
              onClick={onSignIn}
            >
              Sign in
            </Button>
          </div>
        </div>
      </div>

      {/* Marquee band — supermarkets + promises */}
      <div className="marquee bg-primary text-primary-foreground py-3 mt-8" aria-hidden>
        {[0, 1].map(copy => (
          <div key={copy} className="marquee-content">
            {MARQUEE_ITEMS.map((item, i) => (
              <span key={i} className="font-display text-lg md:text-xl px-6 flex items-center gap-6">
                {item} <span className="text-accent">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Three-step flow — editorial numbered sections */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto space-y-14">
          {[
            {
              n: '01',
              tag: 'YOUR TASTE',
              title: 'Tell us how you eat',
              body: 'Allergies, diets, household size, weekly budget. Thirty seconds, once.',
            },
            {
              n: '02',
              tag: 'OUR MATHS',
              title: 'We price your exact basket',
              body: "Every ingredient matched at Tesco, Sainsbury's, Asda, Waitrose and Morrisons — real shelf prices, refreshed daily.",
            },
            {
              n: '03',
              tag: 'ONE CLICK',
              title: 'Checkout, courier, or list',
              body: 'Pre-filled basket at the cheapest store, an Uber courier who shops for you, or a list for your pocket.',
            },
          ].map((step) => (
            <div key={step.n} className="grid md:grid-cols-[100px_1fr] gap-4 md:gap-8 items-start border-t border-foreground/10 pt-8">
              <span className="font-display text-4xl md:text-5xl text-accent">{step.n}</span>
              <div>
                <p className="section-tag mb-2">{step.tag}</p>
                <h2 className="font-display text-3xl md:text-5xl text-foreground">{step.title}</h2>
                <p className="text-muted-foreground mt-3 max-w-lg leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Honest stat — big editorial closer */}
      <div className="bg-foreground text-background py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="section-tag">The cost-of-living maths</p>
          <p className="font-display text-4xl md:text-6xl mt-4 max-w-3xl mx-auto">
            £118 a week on groceries.
            <span className="text-accent block mt-2">We find where it costs less.</span>
          </p>
          <Button
            size="lg"
            className="mt-8 h-13 px-8 text-base font-semibold rounded-full bg-accent hover:bg-accent/90 text-accent-foreground"
            onClick={onGetStarted}
          >
            Start saving this week
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
