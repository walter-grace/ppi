'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Search, Database, Camera, Video } from 'lucide-react';

interface SamplePromptsProps {
  onPromptSelect: (prompt: string) => void;
  isLoading?: boolean;
}

const samplePrompts = [
  {
    category: 'Discover Deals',
    icon: Search,
    prompts: [
      'Find undervalued Rolex Submariner watches on eBay',
      'Search for PSA 10 Charizard cards with arbitrage potential',
      'Discover Omega Speedmaster deals under $5K',
      'Find vintage luxury watches below market value',
    ],
    premium: false,
  },
  {
    category: 'Market Intelligence',
    icon: Database,
    prompts: [
      'What luxury watch brands are trending?',
      'Check market value for Rolex reference 116610LN',
      'Analyze Rolex market trends',
      'Get comprehensive watch database insights',
    ],
    premium: false,
  },
  {
    category: 'Smart Analysis',
    icon: Sparkles,
    prompts: [
      'Find Rolex watches under $10K with profit potential',
      'Analyze PSA 10 Pokemon card prices for opportunities',
      'Compare eBay prices vs market value instantly',
      'Discover the best arbitrage opportunities right now',
    ],
    premium: false,
  },
  {
    category: 'Premium Photo Analysis',
    icon: Camera,
    prompts: [
      'Upload a photo of your watch for instant analysis',
      'Analyze a watch from a photo to get market value',
      'Get AI-powered identification from your watch image',
      'Upload trading card photo for PSA grade estimation',
    ],
    premium: true,
  },
];

export function SamplePrompts({ onPromptSelect, isLoading }: SamplePromptsProps) {
  return (
    <div className="space-y-6 md:space-y-8">
      {samplePrompts.map((category, catIndex) => {
        const Icon = category.icon;
        return (
          <div key={category.category} className="space-y-3 md:space-y-4 animate-slide-up" style={{ animationDelay: `${catIndex * 100}ms` }}>
            <div className="flex items-center gap-2.5 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-luxury-gold/10 border border-luxury-gold/20">
                <Icon className="h-4 w-4 md:h-5 md:w-5 text-luxury-gold" />
              </div>
              <h3 className="text-sm md:text-base font-semibold text-foreground">{category.category}</h3>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {category.prompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant={category.premium ? "luxury" : "luxury-outline"}
                  size="sm"
                  onClick={() => onPromptSelect(prompt)}
                  disabled={isLoading}
                  className={`text-xs md:text-sm h-auto py-2.5 md:py-3 px-4 md:px-5 whitespace-normal text-left hover-lift transition-luxury group ${
                    category.premium ? 'relative' : ''
                  }`}
                >
                  <span className="group-hover:text-luxury-dark transition-luxury flex items-center gap-2">
                    {category.premium && <Sparkles className="h-3 w-3 shrink-0" />}
                    {prompt}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

