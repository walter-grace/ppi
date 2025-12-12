'use client';

import { Button } from '@/components/ui/button';
import { Sparkles, Search, RefreshCw, TrendingDown, Eye, Watch, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestionPromptsProps {
  messageContent: string;
  toolResults?: any;
  onPromptSelect: (prompt: string) => void;
  isLoading?: boolean;
}

export function SuggestionPrompts({ 
  messageContent, 
  toolResults,
  onPromptSelect, 
  isLoading 
}: SuggestionPromptsProps) {
  const suggestions: Array<{ text: string; icon?: any; variant?: 'default' | 'outline' | 'secondary' }> = [];

  // Knowledge base of related watches/products
  const getRelatedProducts = (brand?: string, model?: string, reference?: string, productType?: string): string[] => {
    const related: string[] = [];
    
    // Detect product type
    const isTradingCard = productType?.toLowerCase().includes('card') || 
                         messageContent.toLowerCase().includes('psa') ||
                         messageContent.toLowerCase().includes('charizard') ||
                         messageContent.toLowerCase().includes('pokemon');
    
    if (isTradingCard) {
      // Trading card suggestions
      if (messageContent.toLowerCase().includes('charizard')) {
        related.push('PSA 10 Charizard cards');
        related.push('Pokemon cards PSA 10');
      } else if (messageContent.toLowerCase().includes('pokemon')) {
        related.push('PSA 10 Pokemon cards');
        related.push('Vintage Pokemon cards');
      } else {
        related.push('PSA 10 trading cards');
        related.push('Graded trading cards');
      }
      return related.slice(0, 3);
    }
    
    // Watch suggestions (default)
    if (!brand && !model) return related;
    
    const brandLower = brand?.toLowerCase() || '';
    const modelLower = model?.toLowerCase() || '';
    const refLower = reference?.toLowerCase() || '';
    
    // GMT-Master II variants
    if (modelLower.includes('gmt-master') || refLower.includes('126710') || refLower.includes('126720')) {
      if (!refLower.includes('blnr') && !refLower.includes('batgirl')) {
        related.push('Rolex GMT-Master II Batgirl 126710BLNR');
      }
      if (!refLower.includes('blro') && !refLower.includes('pepsi')) {
        related.push('Rolex GMT-Master II Pepsi 126710BLRO');
      }
      if (!refLower.includes('grnr') && !refLower.includes('bruce wayne')) {
        related.push('Rolex GMT-Master II Bruce Wayne 126710GRNR');
      }
      if (!refLower.includes('vtnr') && !refLower.includes('sprite')) {
        related.push('Rolex GMT-Master II Sprite 126720VTNR');
      }
    }
    
    // Rolex popular models
    if (brandLower === 'rolex') {
      if (!modelLower.includes('submariner')) {
        related.push('Rolex Submariner');
      }
      if (!modelLower.includes('datejust')) {
        related.push('Rolex Datejust');
      }
      if (!modelLower.includes('daytona')) {
        related.push('Rolex Daytona');
      }
      if (!modelLower.includes('explorer')) {
        related.push('Rolex Explorer');
      }
      if (!modelLower.includes('yacht-master')) {
        related.push('Rolex Yacht-Master');
      }
    }
    
    // Omega popular models
    if (brandLower === 'omega') {
      if (!modelLower.includes('speedmaster')) {
        related.push('Omega Speedmaster');
      }
      if (!modelLower.includes('seamaster')) {
        related.push('Omega Seamaster');
      }
      if (!modelLower.includes('constellation')) {
        related.push('Omega Constellation');
      }
    }
    
    // TAG Heuer popular models
    if (brandLower.includes('tag') || brandLower.includes('heuer')) {
      if (!modelLower.includes('carrera')) {
        related.push('TAG Heuer Carrera');
      }
      if (!modelLower.includes('aquaracer')) {
        related.push('TAG Heuer Aquaracer');
      }
    }
    
    // Seiko popular models
    if (brandLower === 'seiko') {
      if (!modelLower.includes('presage')) {
        related.push('Seiko Presage');
      }
      if (!modelLower.includes('prospex')) {
        related.push('Seiko Prospex');
      }
    }
    
    return related.slice(0, 3); // Limit to 3 related watches
  };

  // Detect multiple watches in video/image analysis
  const multipleWatchesMatch = messageContent.match(/The video contains (\d+) different watches/i);
  if (multipleWatchesMatch) {
    const watchCount = parseInt(multipleWatchesMatch[1]);
    
    if (watchCount > 1) {
      // Extract individual watch info from structured format
      const watches: Array<{ ref?: string; model?: string; nickname?: string; brand?: string }> = [];
      
      // Try to extract each watch's details from "Watch 1:", "Watch 2:", etc.
      const watchSections = messageContent.split(/Watch \d+:/i);
      watchSections.slice(1).forEach((section) => {
        const refMatch = section.match(/Reference:\s*([^\n]+)/i);
        const modelMatch = section.match(/Model:\s*([^\n]+)/i);
        const brandMatch = section.match(/Brand:\s*([^\n]+)/i);
        const nicknameMatch = section.match(/(?:known as|nicknamed|")([^"]+)(?:")/i) ||
                               section.match(/GMT-Master II "([^"]+)"/i) ||
                               section.match(/(Batgirl|Pepsi|Sprite|Bruce Wayne)/i);
        
        const ref = refMatch?.[1]?.trim();
        const model = modelMatch?.[1]?.trim();
        const brand = brandMatch?.[1]?.trim();
        const nickname = nicknameMatch?.[1]?.trim();
        
        // Skip if reference says "Not visible" or "Unknown"
        if (ref && !ref.toLowerCase().includes('not visible') && !ref.toLowerCase().includes('unknown')) {
          watches.push({
            ref,
            model,
            brand,
            nickname,
          });
        }
      });

      // Add suggestions for each watch (limit to 3 to avoid clutter)
      watches.slice(0, 3).forEach((watch) => {
        if (watch.ref) {
          // Build a descriptive name
          let watchName = '';
          if (watch.nickname) {
            watchName = watch.nickname;
          } else if (watch.brand && watch.model) {
            watchName = `${watch.brand} ${watch.model} ${watch.ref}`;
          } else if (watch.ref) {
            watchName = watch.ref;
          }
          
          if (watchName) {
            suggestions.push({
              text: `Search eBay for ${watchName}`,
              icon: Search,
              variant: 'outline' as const,
            });
          }
        }
      });

      // Add general suggestion if we have multiple watches
      if (watches.length > 1) {
        suggestions.push({
          text: `Compare all ${watchCount} watches`,
          icon: Sparkles,
          variant: 'default' as const,
        });
      }
      
      // Add related watches suggestions based on the first watch
      if (watches.length > 0) {
        const firstWatch = watches[0];
        const relatedProducts = getRelatedProducts(
          firstWatch.brand, 
          firstWatch.model, 
          firstWatch.ref,
          'watch'
        );
        relatedProducts.forEach((relatedProduct) => {
          suggestions.push({
            text: `Browse ${relatedProduct}`,
            icon: Watch,
            variant: 'outline' as const,
          });
        });
      }
    }
  }

  // Detect eBay search results
  if (toolResults) {
    const ebayResult = toolResults.find((r: any) => r.toolName === 'search_ebay' || r.toolName?.includes('search_ebay'));
    if (ebayResult?.result) {
      const items = ebayResult.result.items || [];
      const arbitrageData = items.filter((item: any) => item.arbitrage);
      
      // Count valuation statuses
      const undervalued = arbitrageData.filter((item: any) => 
        item.arbitrage?.valuation_status === 'undervalued'
      ).length;
      const overvalued = arbitrageData.filter((item: any) => 
        item.arbitrage?.valuation_status === 'overvalued'
      ).length;
      const fairValue = arbitrageData.filter((item: any) => 
        item.arbitrage?.valuation_status === 'fair_value'
      ).length;

      // If all items are overvalued, suggest finding better deals
      if (overvalued > 0 && undervalued === 0) {
        suggestions.push({
          text: 'Find better deals (undervalued items)',
          icon: TrendingDown,
          variant: 'default' as const,
        });
      }

      // If there are undervalued items, suggest viewing them
      if (undervalued > 0) {
        suggestions.push({
          text: `Show ${undervalued} undervalued item${undervalued > 1 ? 's' : ''}`,
          icon: Eye,
          variant: 'default' as const,
        });
      }

      // If there are fair value items
      if (fairValue > 0) {
        suggestions.push({
          text: `Show ${fairValue} fair value item${fairValue > 1 ? 's' : ''}`,
          icon: Eye,
          variant: 'outline' as const,
        });
      }

      // Suggest refining search
      if (items.length > 0) {
        const query = ebayResult.args?.query || '';
        if (query) {
          suggestions.push({
            text: 'Refine search with different terms',
            icon: RefreshCw,
            variant: 'outline' as const,
          });
          
          // Extract brand/model from query to suggest related watches
          const queryLower = query.toLowerCase();
          let detectedBrand: string | undefined;
          let detectedModel: string | undefined;
          
          // Detect common brands
          if (queryLower.includes('rolex')) detectedBrand = 'Rolex';
          else if (queryLower.includes('omega')) detectedBrand = 'Omega';
          else if (queryLower.includes('tag') || queryLower.includes('heuer')) detectedBrand = 'TAG Heuer';
          else if (queryLower.includes('seiko')) detectedBrand = 'Seiko';
          
          // Detect common models
          if (queryLower.includes('gmt-master') || queryLower.includes('gmt master')) detectedModel = 'GMT-Master II';
          else if (queryLower.includes('submariner')) detectedModel = 'Submariner';
          else if (queryLower.includes('datejust')) detectedModel = 'Datejust';
          else if (queryLower.includes('speedmaster')) detectedModel = 'Speedmaster';
          else if (queryLower.includes('seamaster')) detectedModel = 'Seamaster';
          
          // Suggest related watches/products
          if (detectedBrand || detectedModel) {
            const relatedProducts = getRelatedProducts(detectedBrand, detectedModel, undefined, 'watch');
            relatedProducts.forEach((relatedProduct) => {
              suggestions.push({
                text: `Search eBay for ${relatedProduct}`,
                icon: Watch,
                variant: 'outline' as const,
              });
            });
          }
          
          // Also suggest trading cards if not already a card search
          if (!queryLower.includes('card') && !queryLower.includes('psa') && !queryLower.includes('pokemon')) {
            suggestions.push({
              text: 'Search eBay for PSA graded trading cards',
              icon: Package,
              variant: 'outline' as const,
            });
          }
        }
      }
    }
  }

  // Detect single watch analysis (only if we haven't already handled multiple watches)
  if (!multipleWatchesMatch) {
    const hasWatchAnalysis = messageContent.includes('Brand Name:') || 
                             messageContent.includes('Reference Number:') ||
                             messageContent.includes('watch from the video') ||
                             messageContent.includes('watch image') ||
                             messageContent.includes('Primary Watch');
    
    if (hasWatchAnalysis) {
      // Extract watch details for single watch
      const refMatch = messageContent.match(/Reference Number:\s*([^\n]+)/i) ||
                      messageContent.match(/Reference:\s*([^\n]+)/i);
      const brandMatch = messageContent.match(/Brand Name:\s*([^\n]+)/i) ||
                        messageContent.match(/Brand:\s*([^\n]+)/i);
      const modelMatch = messageContent.match(/Model Name:\s*([^\n]+)/i) ||
                        messageContent.match(/Model:\s*([^\n]+)/i);
      
      // Check for nickname
      const nicknameMatch = messageContent.match(/(Batgirl|Pepsi|Sprite|Bruce Wayne|Batman)/i);
      
      if (refMatch && refMatch[1] && 
          !refMatch[1].toLowerCase().includes('not visible') && 
          !refMatch[1].toLowerCase().includes('unknown')) {
        const ref = refMatch[1].trim();
        const nickname = nicknameMatch?.[1];
        
        if (nickname) {
          suggestions.push({
            text: `Search eBay for ${nickname} (${ref})`,
            icon: Search,
            variant: 'default' as const,
          });
        } else {
          suggestions.push({
            text: `Search eBay for reference ${ref}`,
            icon: Search,
            variant: 'default' as const,
          });
        }
      }
      
      if (brandMatch && modelMatch) {
        const brand = brandMatch[1].trim();
        const model = modelMatch[1].trim();
        if (brand.toLowerCase() !== 'not visible' && 
            model.toLowerCase() !== 'not visible' &&
            brand.toLowerCase() !== 'unknown' &&
            model.toLowerCase() !== 'unknown') {
          suggestions.push({
            text: `Search eBay for ${brand} ${model} watches`,
            icon: Search,
            variant: 'outline' as const,
          });
          
          // Add related watches/products suggestions
          const relatedProducts = getRelatedProducts(brand, model, refMatch?.[1]?.trim(), 'watch');
          relatedProducts.forEach((relatedProduct) => {
            suggestions.push({
              text: `Search eBay for ${relatedProduct}`,
              icon: Watch,
              variant: 'outline' as const,
            });
          });
          
          // Add brand-level suggestion
          if (brand.toLowerCase() === 'rolex' || brand.toLowerCase() === 'omega' || brand.toLowerCase() === 'tag heuer') {
            suggestions.push({
              text: `Search eBay for ${brand} watches`,
              icon: Watch,
              variant: 'outline' as const,
            });
          }
        }
      }
    }
  }

  // If no specific suggestions, add general ones
  if (suggestions.length === 0) {
    if (messageContent.toLowerCase().includes('ebay') || messageContent.toLowerCase().includes('search')) {
      suggestions.push({
        text: 'Search for more items',
        icon: Search,
        variant: 'outline' as const,
      });
    }
  }

  // Limit to 6 suggestions max (increased to show more related products)
  const displaySuggestions = suggestions.slice(0, 6);

  if (displaySuggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {displaySuggestions.map((suggestion, index) => {
        const Icon = suggestion.icon;
        return (
          <Button
            key={index}
            variant={suggestion.variant || 'outline'}
            size="sm"
            onClick={() => onPromptSelect(suggestion.text)}
            disabled={isLoading}
            className={cn(
              "text-xs h-auto py-1.5 px-3 whitespace-normal text-left",
              suggestion.variant === 'default' && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
          >
            {Icon && <Icon className="h-3 w-3 mr-1.5 inline" />}
            {suggestion.text}
          </Button>
        );
      })}
    </div>
  );
}

