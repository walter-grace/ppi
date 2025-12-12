'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ExternalLink, DollarSign, ChevronDown, ChevronUp, Database, TrendingUp, TrendingDown, Minus, AlertCircle, Filter, Handshake, MessageSquare, Camera, Video, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { WatchDatabaseVerification } from './watch-database-verification';
import { formatCurrency, formatNumber } from '@/lib/utils';
// Using img tag instead of Next.js Image for external URLs

type ValuationStatus = 'undervalued' | 'fair_value' | 'overvalued' | 'unknown';

interface ArbitrageOpportunity {
  item_id: string;
  has_arbitrage: boolean;
  valuation_status: ValuationStatus;
  spread_usd?: number;
  spread_pct?: number;
  market_price_usd?: number;
  retail_price_usd?: number;
  all_in_cost_usd: number;
  potential_profit_usd?: number;
  potential_loss_usd?: number;
  risk_level: 'low' | 'medium' | 'high';
  confidence: 'high' | 'medium' | 'low';
  price_source?: string;
  watchcharts_url?: string;
}

interface EbayItem {
  item_id: string;
  title: string;
  price_usd: number;
  shipping_usd: number;
  total_cost_usd: number;
  url: string;
  image_url?: string;
  images?: string[]; // Multiple images from full item details
  condition?: string;
  brand?: string;
  model?: string;
  currency: string;
  arbitrage?: ArbitrageOpportunity;
  watchDbData?: any; // Raw Watch Database response for verification
}

interface EbayResultsProps {
  result: any;
  onNegotiate?: (item: EbayItem, negotiationQuery: string) => void;
  onLoadMore?: (query: string, offset: number, limit: number) => void;
}

type ValuationFilter = 'all' | 'undervalued' | 'fair_value' | 'overvalued' | 'unknown';

export function EbayResults({ result, onNegotiate, onLoadMore }: EbayResultsProps) {
  const [showRawData, setShowRawData] = React.useState(false);
  const [valuationFilter, setValuationFilter] = React.useState<ValuationFilter>('all');
  const [allItems, setAllItems] = React.useState<EbayItem[]>(result.items || []);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  
  // Update allItems when result changes (new search)
  React.useEffect(() => {
    // If offset is 0, it's a new search - replace items
    if ((result.offset || 0) === 0) {
      setAllItems(result.items || []);
    } else if (result.items && result.items.length > 0) {
      // Append new items, avoiding duplicates
      setAllItems(prev => {
        const existingIds = new Set(prev.map(i => i.item_id));
        const newItems = result.items.filter((i: EbayItem) => !existingIds.has(i.item_id));
        return [...prev, ...newItems];
      });
    }
  }, [result.items, result.offset]);
  
  if (!result || (!allItems || allItems.length === 0)) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">No items found</div>
        </CardContent>
      </Card>
    );
  }

  const query = result.query || '';
  const totalFound = result.total_found || allItems.length;
  const currentOffset = result.offset !== undefined ? result.offset : allItems.length;
  const limit = result.limit || 20;
  const hasMore = result.has_more !== undefined ? result.has_more : (allItems.length < totalFound);
  
  const handleLoadMore = async () => {
    if (!hasMore || isLoadingMore || !onLoadMore) return;
    
    setIsLoadingMore(true);
    try {
      const nextOffset = allItems.length;
      onLoadMore(query, nextOffset, limit);
    } catch (error) {
      console.error('Error loading more items:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };
  
  // Calculate counts for each valuation status
  const valuationCounts = {
    all: allItems.length,
    undervalued: allItems.filter((i: any) => i.arbitrage?.valuation_status === 'undervalued').length,
    fair_value: allItems.filter((i: any) => i.arbitrage?.valuation_status === 'fair_value').length,
    overvalued: allItems.filter((i: any) => i.arbitrage?.valuation_status === 'overvalued').length,
    unknown: allItems.filter((i: any) => !i.arbitrage || i.arbitrage.valuation_status === 'unknown').length,
  };
  
  // Filter items based on selected filter
  const filteredItems = React.useMemo(() => {
    if (valuationFilter === 'all') return allItems;
    return allItems.filter((item: EbayItem) => {
      if (valuationFilter === 'unknown') {
        return !item.arbitrage || item.arbitrage.valuation_status === 'unknown';
      }
      return item.arbitrage?.valuation_status === valuationFilter;
    });
  }, [allItems, valuationFilter]);
  
  const count = filteredItems.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              eBay Search Results
              {query && (
                <span className="text-sm font-normal text-muted-foreground">
                  for &quot;{query}&quot;
                </span>
              )}
            </CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              {valuationFilter === 'all' ? (
                <>Showing {count} of {totalFound} item{totalFound !== 1 ? 's' : ''} found</>
              ) : (
                <>Showing {count} of {totalFound} item{totalFound !== 1 ? 's' : ''} ({valuationFilter.replace('_', ' ')})</>
              )}
              {hasMore && (
                <span className="ml-2 text-luxury-gold font-semibold">
                  • {totalFound - count} more available
                </span>
              )}
            </div>
          </div>
            <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRawData(!showRawData)}
            className="flex items-center gap-2 text-xs sm:text-xs md:text-sm h-9 sm:h-8 md:h-8 px-3 sm:px-3 md:px-4 min-h-[44px] sm:min-h-0 touch-manipulation"
          >
            <Database className="h-4 w-4" />
            {showRawData ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Data
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                View Data
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {/* Valuation Filter */}
        <div className="mb-3 sm:mb-6 p-3 sm:p-4 md:p-5 bg-muted/50 glass border border-border/50 rounded-lg">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="h-4 w-4 sm:h-4 sm:w-4 md:h-5 md:w-5 text-luxury-gold" />
            <h3 className="text-xs sm:text-sm md:text-base font-semibold">Filter by Valuation</h3>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-2 md:gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            <FilterButton
              filter="all"
              label="All Items"
              count={valuationCounts.all}
              active={valuationFilter === 'all'}
              onClick={() => setValuationFilter('all')}
              className="bg-background/50 border-border hover:border-luxury-gold/50"
            />
            <FilterButton
              filter="undervalued"
              label="Undervalued"
              count={valuationCounts.undervalued}
              active={valuationFilter === 'undervalued'}
              onClick={() => setValuationFilter('undervalued')}
              className="bg-luxury-gold/10 border-luxury-gold/30 hover:border-luxury-gold text-luxury-gold"
              icon={<TrendingUp className="h-3.5 w-3.5" />}
            />
            <FilterButton
              filter="fair_value"
              label="Fair Value"
              count={valuationCounts.fair_value}
              active={valuationFilter === 'fair_value'}
              onClick={() => setValuationFilter('fair_value')}
              className="bg-luxury-platinum/10 border-luxury-platinum/30 hover:border-luxury-platinum text-luxury-platinum"
              icon={<Minus className="h-3.5 w-3.5" />}
            />
            <FilterButton
              filter="overvalued"
              label="Overvalued"
              count={valuationCounts.overvalued}
              active={valuationFilter === 'overvalued'}
              onClick={() => setValuationFilter('overvalued')}
              className="bg-red-500/10 border-red-500/30 hover:border-red-500 text-red-400"
              icon={<TrendingDown className="h-3.5 w-3.5" />}
            />
            {valuationCounts.unknown > 0 && (
              <FilterButton
                filter="unknown"
                label="Unknown"
                count={valuationCounts.unknown}
                active={valuationFilter === 'unknown'}
                onClick={() => setValuationFilter('unknown')}
                className="bg-muted border-border hover:border-muted-foreground text-muted-foreground"
                icon={<AlertCircle className="h-3.5 w-3.5" />}
              />
            )}
          </div>
        </div>
        
        {showRawData && (
          <div className="mb-4 p-4 bg-muted rounded-lg border">
            <div className="font-semibold mb-2 text-sm flex items-center gap-2">
              <Database className="h-4 w-4" />
              Raw eBay API Data
            </div>
            <div className="text-xs space-y-2">
              <div>
                <strong>Response Summary:</strong>
                <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto">
                  {JSON.stringify({
                    success: result.success,
                    query: result.query,
                    count: result.count,
                    total_found: result.total_found,
                    items_count: result.items?.length || 0,
                  }, null, 2)}
                </pre>
              </div>
              <div>
                <strong>Sample Item Data (first item):</strong>
                <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                  {JSON.stringify(result.items?.[0] || {}, null, 2)}
                </pre>
              </div>
              <div>
                <strong>All Items ({result.items?.length || 0}):</strong>
                <pre className="mt-1 p-2 bg-background rounded text-xs overflow-x-auto max-h-96 overflow-y-auto">
                  {JSON.stringify(result.items || [], null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 md:py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-muted/50 border border-border/50 mb-4">
              <Filter className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground" />
            </div>
            <p className="text-sm md:text-base text-muted-foreground font-medium">
              No items found with this filter
            </p>
            <p className="text-xs md:text-sm text-muted-foreground/70 mt-1">
              Try selecting a different valuation filter
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4 md:gap-6 w-full">
              {filteredItems.map((item, index) => (
                <EbayItemCard key={item.item_id} item={item} index={index} onNegotiate={onNegotiate} />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="mt-8 flex justify-center animate-fade-in">
                <Button
                  variant="luxury"
                  size="lg"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold flex items-center gap-3 min-w-[200px] min-h-[52px] sm:min-h-[56px] touch-manipulation active:scale-[0.98]"
                >
                  {isLoadingMore ? (
                    <>
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-luxury-dark rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-luxury-dark rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-luxury-dark rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Items</span>
                      <span className="text-sm opacity-80">
                        ({formatNumber(totalFound - count)} remaining)
                      </span>
                      <ChevronDown className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface FilterButtonProps {
  filter: ValuationFilter;
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  className?: string;
  icon?: React.ReactNode;
}

function FilterButton({ filter, label, count, active, onClick, className, icon }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3 md:px-4 py-2 sm:py-2 md:py-2.5 rounded-lg
        text-xs sm:text-xs md:text-sm font-medium transition-luxury touch-manipulation
        border-2 min-h-[44px] min-w-[44px]
        ${active ? 'ring-2 ring-luxury-gold ring-offset-2 ring-offset-background shadow-lg shadow-luxury-gold/20' : ''}
        ${className || ''}
        ${active ? 'scale-[1.02]' : 'active:scale-105'}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      disabled={count === 0}
    >
      {icon && <span className={active ? 'opacity-100' : 'opacity-70'}>{icon}</span>}
      <span>{label}</span>
      <span className={`
        px-1.5 py-0.5 rounded-full text-[10px] md:text-xs font-bold min-w-[20px] text-center
        ${active ? 'bg-luxury-gold/20 text-luxury-gold' : 'bg-muted text-muted-foreground'}
      `}>
        {count}
      </span>
    </button>
  );
}

function EbayItemCard({ item, index = 0, onNegotiate }: { item: EbayItem; index?: number; onNegotiate?: (item: EbayItem, negotiationQuery: string) => void }) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [currentImageIndex, setCurrentImageIndex] = React.useState(0);
  const [images, setImages] = React.useState<string[]>([]);
  const [loadingImages, setLoadingImages] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState(0);
  const [dragOffset, setDragOffset] = React.useState(0);
  const imageContainerRef = React.useRef<HTMLDivElement>(null);
  const arbitrage = item.arbitrage;
  
  // Initialize images array
  React.useEffect(() => {
    const imageList: string[] = [];
    if (item.image_url) {
      imageList.push(item.image_url);
    }
    if (item.images && item.images.length > 0) {
      // Add additional images, avoiding duplicates
      item.images.forEach(img => {
        if (img && !imageList.includes(img)) {
          imageList.push(img);
        }
      });
    }
    setImages(imageList);
  }, [item.image_url, item.images]);
  
  // Fetch additional images from eBay item details
  const fetchItemImages = async () => {
    if (loadingImages || images.length > 1) return; // Already have multiple or loading
    
    setLoadingImages(true);
    try {
      // Clean item ID (remove v1| prefix if present)
      const cleanItemId = item.item_id.replace(/^v1\|/, '').split('|')[0];
      const response = await fetch(`/api/ebay/item/${cleanItemId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          const allImages = [...images];
          data.images.forEach((img: string) => {
            if (img && !allImages.includes(img)) {
              allImages.push(img);
            }
          });
          setImages(allImages);
        }
      }
    } catch (error) {
      console.error('Error fetching item images:', error);
    } finally {
      setLoadingImages(false);
    }
  };
  
  // Carousel navigation
  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  
  // Touch/Mouse drag handlers for swipe
  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setDragStart(clientX);
    setDragOffset(0);
  };
  
  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - dragStart;
    setDragOffset(diff);
  };
  
  const handleDragEnd = () => {
    if (!isDragging) return;
    
    const threshold = 50; // Minimum drag distance to trigger swipe
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };
  
  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    handleDragEnd();
  };
  
  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    handleDragStart(e.clientX);
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      handleDragMove(e.clientX);
    }
  };
  
  const handleMouseUp = () => {
    handleDragEnd();
  };
  
  const handleMouseLeave = () => {
    if (isDragging) {
      handleDragEnd();
    }
  };
  
  const handleNegotiate = () => {
    if (!onNegotiate) return;
    
    // Build negotiation query with item details
    const negotiationQuery = `What's a fair negotiation price I should offer for this item? 

Item: ${item.title}
Current Listing Price: ${formatCurrency(item.total_cost_usd)} (${formatCurrency(item.price_usd)} + ${formatCurrency(item.shipping_usd)} shipping)
${arbitrage?.market_price_usd ? `Market Value: ${formatCurrency(arbitrage.market_price_usd)}` : ''}
${arbitrage?.valuation_status ? `Valuation Status: ${arbitrage.valuation_status === 'undervalued' ? 'UNDERVALUED - Already a good deal' : arbitrage.valuation_status === 'overvalued' ? 'OVERVALUED - Negotiate aggressively' : 'FAIR VALUE - Standard negotiation'}` : ''}
${arbitrage?.spread_pct ? `Price Difference: ${arbitrage.spread_pct > 0 ? '+' : ''}${formatNumber(arbitrage.spread_pct, 1)}% from market` : ''}
${negotiationSuggestions ? `
Quick Offer Suggestions:
- Aggressive Offer: ${formatCurrency(negotiationSuggestions.aggressive)}
- Fair Offer: ${formatCurrency(negotiationSuggestions.fair)}
- Maximum Price: ${formatCurrency(negotiationSuggestions.max)}
` : ''}

Please provide:
1. A strategic starting offer price (considering the item is ${arbitrage?.valuation_status === 'undervalued' ? 'already undervalued' : arbitrage?.valuation_status === 'overvalued' ? 'overvalued' : 'at fair value'})
2. A target negotiation price range with reasoning
3. Maximum price I should pay and why
4. Specific negotiation strategy and talking points based on the ${arbitrage?.valuation_status === 'undervalued' ? 'undervalued status' : arbitrage?.valuation_status === 'overvalued' ? 'overvaluation' : 'fair market value'}
5. Whether I should negotiate at all or accept the listing price`;

    onNegotiate(item, negotiationQuery);
  };
  
  // Calculate suggested negotiation prices
  const getNegotiationSuggestions = () => {
    if (!arbitrage || !arbitrage.market_price_usd) return null;
    
    const listingPrice = item.total_cost_usd;
    const marketPrice = arbitrage.market_price_usd;
    const status = arbitrage.valuation_status;
    const spreadPct = arbitrage.spread_pct || 0;
    
    let aggressiveOffer: number;
    let fairOffer: number;
    let maxOffer: number;
    
    if (status === 'undervalued') {
      // Item is already undervalued - listing is a good deal
      // Since it's already below market, negotiate modestly
      // All offers should be BELOW listing price
      aggressiveOffer = listingPrice * 0.92; // 8% below listing (try to save a bit more)
      fairOffer = listingPrice * 0.96; // 4% below listing (reasonable ask)
      maxOffer = listingPrice * 0.99; // 1% below listing (still a great deal, don't push too hard)
    } else if (status === 'overvalued') {
      // Item is overvalued - negotiate aggressively
      const overvaluedPct = Math.abs(spreadPct);
      // Calculate discount needed to get closer to market value
      const targetDiscount = Math.min(overvaluedPct * 0.7, 20); // Aim for 70% of overvaluation, max 20%
      
      aggressiveOffer = listingPrice * (1 - targetDiscount / 100); // Aggressive discount
      fairOffer = listingPrice * (1 - targetDiscount * 0.6 / 100); // Moderate discount
      // Max should be at or slightly above market (since listing is overvalued)
      maxOffer = Math.min(listingPrice * 0.95, marketPrice * 1.03);
    } else {
      // Fair value - standard negotiation (5-15% off is typical)
      aggressiveOffer = listingPrice * 0.85; // 15% below listing
      fairOffer = listingPrice * 0.92; // 8% below listing
      maxOffer = listingPrice * 0.97; // 3% below listing
    }
    
    // Ensure offers are in logical order and reasonable
    aggressiveOffer = Math.max(aggressiveOffer, listingPrice * 0.70); // Never more than 30% off
    fairOffer = Math.max(fairOffer, aggressiveOffer); // Fair should be >= aggressive
    maxOffer = Math.max(maxOffer, fairOffer); // Max should be >= fair
    
    // For undervalued items, max should never exceed listing (it's already a deal)
    if (status === 'undervalued') {
      maxOffer = Math.min(maxOffer, listingPrice);
    } else {
      // For others, max shouldn't be way above market
      maxOffer = Math.min(maxOffer, marketPrice * 1.08);
    }
    
    return {
      aggressive: Math.round(aggressiveOffer * 100) / 100,
      fair: Math.round(fairOffer * 100) / 100,
      max: Math.round(maxOffer * 100) / 100,
    };
  };
  
  const negotiationSuggestions = getNegotiationSuggestions();
  
  // Check if this is a watch part
  const isWatchPart = arbitrage?.price_source?.includes('Watch part detected') || 
                      arbitrage?.price_source?.includes('may be a watch part');
  
  const getValuationBadge = () => {
    // Show watch part badge if detected
    if (isWatchPart) {
      return (
        <div className="absolute top-3 right-3 bg-amber-600/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg border border-amber-500/30">
          <AlertCircle className="h-3.5 w-3.5" />
          Watch Part
        </div>
      );
    }
    
    if (!arbitrage || arbitrage.valuation_status === 'unknown') return null;
    
    const status = arbitrage.valuation_status;
    const spreadPct = arbitrage.spread_pct || 0;
    
    if (status === 'undervalued') {
      return (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-luxury-gold to-luxury-gold-light text-luxury-dark px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg border border-luxury-gold/30 animate-pulse-gold">
          <TrendingUp className="h-3.5 w-3.5" />
          {formatNumber(Math.abs(spreadPct), 1)}% Below Market
        </div>
      );
    } else if (status === 'overvalued') {
      return (
        <div className="absolute top-3 right-3 bg-red-600/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg border border-red-500/30">
          <TrendingDown className="h-3.5 w-3.5" />
          {formatNumber(spreadPct, 1)}% Above Market
        </div>
      );
    } else if (status === 'fair_value') {
      return (
        <div className="absolute top-3 right-3 bg-luxury-platinum/90 text-luxury-dark px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg border border-luxury-platinum/30">
          <Minus className="h-3.5 w-3.5" />
          Fair Value
        </div>
      );
    }
    return null;
  };
  
  const getRingColor = () => {
    if (!arbitrage) return '';
    switch (arbitrage.valuation_status) {
      case 'undervalued':
        return 'ring-2 ring-luxury-gold';
      case 'overvalued':
        return 'ring-2 ring-red-500';
      case 'fair_value':
        return 'ring-2 ring-luxury-platinum';
      default:
        return '';
    }
  };
  
  return (
    <div 
      className={`border border-border/50 rounded-xl overflow-hidden hover-lift bg-card/80 glass transition-luxury animate-scale-in ${getRingColor()}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image Carousel Gallery */}
      {images.length > 0 && (
        <div className="relative w-full bg-muted/50 overflow-hidden group">
          {/* Swipeable Carousel Container */}
          <div
            ref={imageContainerRef}
            className="relative h-48 sm:h-56 md:h-64 overflow-hidden cursor-grab active:cursor-grabbing touch-pan-x"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            style={{
              touchAction: 'pan-x',
            }}
          >
            {/* Image Carousel */}
            <div
              className="flex h-full transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}px))`,
                width: `${images.length * 100}%`,
              }}
            >
              {images.map((imageUrl, idx) => (
                <div
                  key={idx}
                  className="w-full h-full flex-shrink-0 relative"
                  style={{ width: `${100 / images.length}%` }}
                >
                  <img
                    src={imageUrl}
                    alt={`${item.title} - Image ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                    draggable={false}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              ))}
            </div>
            
            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 active:bg-black/90 text-white p-2.5 sm:p-2 rounded-full transition-luxury z-20 backdrop-blur-sm touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 active:bg-black/90 text-white p-2.5 sm:p-2 rounded-full transition-luxury z-20 backdrop-blur-sm touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
                </button>
              </>
            )}
            
            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md z-20">
                {currentImageIndex + 1} / {images.length}
              </div>
            )}
            
            {/* Load More Images Button */}
            {images.length === 1 && !loadingImages && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fetchItemImages();
                }}
                className="absolute bottom-2 right-2 bg-luxury-gold/90 hover:bg-luxury-gold text-luxury-dark text-xs font-semibold px-3 py-1.5 rounded-lg transition-luxury z-20 flex items-center gap-1.5 backdrop-blur-sm"
              >
                <Camera className="h-3.5 w-3.5" />
                Load More Images
              </button>
            )}
            
            {loadingImages && (
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg z-20">
                Loading images...
              </div>
            )}
            
            {getValuationBadge()}
          </div>
          
          {/* Thumbnail Strip */}
          {images.length > 1 && (
            <div className="flex gap-1.5 sm:gap-2 p-2 bg-muted/30 overflow-x-auto scrollbar-hide touch-pan-x">
              {images.map((imageUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-luxury touch-manipulation ${
                    idx === currentImageIndex
                      ? 'border-luxury-gold ring-2 ring-luxury-gold/30'
                      : 'border-transparent active:border-luxury-gold/50 opacity-70 active:opacity-100'
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="p-3 sm:p-4 md:p-5 space-y-2.5 sm:space-y-3">
        <h4 className="font-semibold text-sm sm:text-base md:text-base line-clamp-2 min-h-[2.5rem] sm:min-h-[2.75rem] md:min-h-[3rem] leading-snug">
          {item.title}
        </h4>
        
            <div className="flex items-baseline gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-luxury-gold" />
                <span className="text-xl md:text-2xl font-bold text-luxury-gold">
                  {formatCurrency(item.total_cost_usd)}
                </span>
              </div>
              {item.shipping_usd > 0 && (
                <span className="text-xs md:text-sm text-muted-foreground">
                  + {formatCurrency(item.shipping_usd)} shipping
                </span>
              )}
            </div>

        {isWatchPart && (
          <div className="rounded-lg p-3 md:p-4 space-y-2 border border-amber-500/30 bg-amber-500/10">
            <div className="flex items-center gap-1.5 text-xs md:text-sm font-semibold text-amber-400">
              <AlertCircle className="h-4 w-4" />
              Watch Part Detected
            </div>
            <p className="text-xs md:text-sm text-amber-300/80">
              This listing appears to be for a watch part or accessory, not a complete watch. Arbitrage analysis is not available for parts.
            </p>
            {arbitrage?.price_source && (
              <p className="text-[10px] md:text-xs text-amber-300/60 mt-1">
                {arbitrage.price_source}
              </p>
            )}
          </div>
        )}
        
        {arbitrage && arbitrage.valuation_status !== 'unknown' && !isWatchPart && (
          <div className={`rounded-lg p-3 md:p-4 space-y-2 border transition-luxury ${
            arbitrage.valuation_status === 'undervalued' 
              ? 'bg-luxury-gold/10 border-luxury-gold/30'
              : arbitrage.valuation_status === 'overvalued'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-luxury-platinum/10 border-luxury-platinum/30'
          }`}>
            <div className={`flex items-center gap-1.5 text-xs md:text-sm font-semibold ${
              arbitrage.valuation_status === 'undervalued'
                ? 'text-luxury-gold'
                : arbitrage.valuation_status === 'overvalued'
                ? 'text-red-400'
                : 'text-luxury-platinum'
            }`}>
              {arbitrage.valuation_status === 'undervalued' && <TrendingUp className="h-3 w-3" />}
              {arbitrage.valuation_status === 'overvalued' && <TrendingDown className="h-3 w-3" />}
              {arbitrage.valuation_status === 'fair_value' && <Minus className="h-3 w-3" />}
              {arbitrage.valuation_status === 'undervalued' && 'Undervalued - Good Deal!'}
              {arbitrage.valuation_status === 'overvalued' && 'Overvalued - Above Market'}
              {arbitrage.valuation_status === 'fair_value' && 'Fair Value - Market Price'}
            </div>
            {arbitrage.market_price_usd && (
              <div className={`text-xs md:text-sm ${
                arbitrage.valuation_status === 'undervalued'
                  ? 'text-luxury-gold/90'
                  : arbitrage.valuation_status === 'overvalued'
                  ? 'text-red-400/90'
                  : 'text-luxury-platinum/90'
              }`}>
                <span className="font-medium">Market:</span> {formatCurrency(arbitrage.market_price_usd)}
                {arbitrage.potential_profit_usd && (
                  <span className="ml-2 font-bold text-luxury-gold">
                    💰 Profit: {formatCurrency(arbitrage.potential_profit_usd)}
                  </span>
                )}
                {arbitrage.potential_loss_usd && (
                  <span className="ml-2 font-bold text-red-400">
                    ⚠️ Overpriced: {formatCurrency(arbitrage.potential_loss_usd)}
                  </span>
                )}
                {arbitrage.spread_pct && (
                  <span className="ml-2 opacity-75">
                    ({arbitrage.spread_pct > 0 ? '+' : ''}{formatNumber(arbitrage.spread_pct, 1)}%)
                  </span>
                )}
              </div>
            )}
            {arbitrage.retail_price_usd && (
              <div className="text-xs text-muted-foreground">
                Retail/MSRP: {formatCurrency(arbitrage.retail_price_usd)}
              </div>
            )}
            {arbitrage.watchcharts_url && (
              <div className="text-xs mt-1">
                <a 
                  href={arbitrage.watchcharts_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>📊</span>
                  <span>View on WatchCharts</span>
                </a>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-[10px]">
                Risk: {arbitrage.risk_level}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                Confidence: {arbitrage.confidence}
              </Badge>
            </div>
          </div>
        )}

        {item.arbitrage?.price_source?.includes('Watch Database') && (
          <WatchDatabaseVerification item={item} watchDbData={item.watchDbData} />
        )}

        <div className="flex items-center gap-2 flex-wrap pt-2">
          {item.condition && (
            <Badge variant="luxury" className="text-xs sm:text-xs">
              {item.condition}
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs sm:text-xs md:text-sm h-9 sm:h-8 md:h-8 px-3 sm:px-3 md:px-3 hover:text-luxury-gold active:text-luxury-gold transition-luxury touch-manipulation min-h-[44px] sm:min-h-0"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </Button>
        </div>

        {showDetails && (
          <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
            <div><strong>Item ID:</strong> {item.item_id}</div>
            <div><strong>Price:</strong> {formatCurrency(item.price_usd)}</div>
            <div><strong>Shipping:</strong> {formatCurrency(item.shipping_usd)}</div>
            <div><strong>Total:</strong> {formatCurrency(item.total_cost_usd)}</div>
            <div><strong>Currency:</strong> {item.currency}</div>
            {arbitrage && (
              <div className="mt-2 pt-2 border-t border-border">
                <strong>Valuation Analysis:</strong>
                <div className="mt-1 space-y-1">
                  <div className={`font-semibold ${
                    arbitrage.valuation_status === 'undervalued' 
                      ? 'text-green-600' 
                      : arbitrage.valuation_status === 'overvalued'
                      ? 'text-red-600'
                      : arbitrage.valuation_status === 'fair_value'
                      ? 'text-blue-600'
                      : 'text-muted-foreground'
                  }`}>
                    Status: {
                      arbitrage.valuation_status === 'undervalued' && '🎯 Undervalued (Good Deal)'
                    }
                    {arbitrage.valuation_status === 'overvalued' && '⚠️ Overvalued (Above Market)'}
                    {arbitrage.valuation_status === 'fair_value' && '⚖️ Fair Value (Market Price)'}
                    {arbitrage.valuation_status === 'unknown' && '❓ Unknown (No Market Data)'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Listing Price:</div>
                      <div className="font-semibold">{formatCurrency(item.price_usd)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Shipping:</div>
                      <div className="font-semibold">{formatCurrency(item.shipping_usd)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">All-in Cost:</div>
                      <div className="font-semibold">{formatCurrency(arbitrage.all_in_cost_usd)}</div>
                    </div>
                    {arbitrage.market_price_usd && (
                      <div>
                        <div className="text-muted-foreground">Market Price:</div>
                        <div className="font-semibold">{formatCurrency(arbitrage.market_price_usd)}</div>
                      </div>
                    )}
                    {arbitrage.retail_price_usd && (
                      <div>
                        <div className="text-muted-foreground">Retail/MSRP:</div>
                        <div className="font-semibold">{formatCurrency(arbitrage.retail_price_usd)}</div>
                      </div>
                    )}
                  </div>
                  {arbitrage.spread_usd !== undefined && (
                    <div className={`p-2 rounded ${
                      arbitrage.valuation_status === 'undervalued'
                        ? 'bg-green-50 dark:bg-green-950'
                        : arbitrage.valuation_status === 'overvalued'
                        ? 'bg-red-50 dark:bg-red-950'
                        : 'bg-blue-50 dark:bg-blue-950'
                    }`}>
                      <div className={`font-semibold ${
                        arbitrage.valuation_status === 'undervalued'
                          ? 'text-green-700 dark:text-green-300'
                          : arbitrage.valuation_status === 'overvalued'
                          ? 'text-red-700 dark:text-red-300'
                          : 'text-blue-700 dark:text-blue-300'
                      }`}>
                        {arbitrage.valuation_status === 'undervalued' && arbitrage.potential_profit_usd && (
                          <>Potential Profit: {formatCurrency(arbitrage.potential_profit_usd)}</>
                        )}
                        {arbitrage.valuation_status === 'overvalued' && arbitrage.potential_loss_usd && (
                          <>Overpriced by: {formatCurrency(arbitrage.potential_loss_usd)}</>
                        )}
                        {arbitrage.valuation_status === 'fair_value' && (
                          <>At Market Price</>
                        )}
                      </div>
                      {arbitrage.spread_pct !== undefined && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Spread: {arbitrage.spread_pct > 0 ? '+' : ''}{formatNumber(arbitrage.spread_pct, 1)}% from market
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-[10px]">
                      Risk: {arbitrage.risk_level}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Confidence: {arbitrage.confidence}
                    </Badge>
                  </div>
                  {arbitrage.price_source && (
                    <div className="text-[10px] text-muted-foreground">
                      Price Source: {arbitrage.price_source}
                    </div>
                  )}
                </div>
              </div>
            )}
            {item.image_url && (
              <div className="mt-2">
                <strong>Image URL:</strong>
                <div className="text-[10px] break-all text-muted-foreground mt-1">
                  {item.image_url}
                </div>
              </div>
            )}
            <div className="mt-2">
              <strong>Raw Data:</strong>
              <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto max-h-40 overflow-y-auto">
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {(item.brand || item.model) && (
          <div className="text-xs text-muted-foreground">
            {item.brand && <span>{item.brand}</span>}
            {item.brand && item.model && <span> • </span>}
            {item.model && <span>{item.model}</span>}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-3">
          {/* Negotiator Button */}
          {onNegotiate && arbitrage && arbitrage.market_price_usd && (
            <Button
              variant="luxury"
              size="sm"
              onClick={handleNegotiate}
              className="w-full text-xs sm:text-xs md:text-sm font-semibold flex items-center justify-center gap-2 h-11 sm:h-10 md:h-10 min-h-[44px] touch-manipulation active:scale-[0.98]"
            >
              <Handshake className="h-4 w-4 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
              Use Negotiator
            </Button>
          )}
          
          {/* Quick Negotiation Suggestions */}
          {negotiationSuggestions && (
            <div className="p-3 bg-luxury-gold/5 border border-luxury-gold/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-luxury-gold">
                <Handshake className="h-3.5 w-3.5" />
                Quick Offer Suggestions
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Aggressive:</span>
                  <div className="flex flex-col items-end">
                    <span className="font-semibold text-luxury-gold">{formatCurrency(negotiationSuggestions.aggressive)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatNumber(((item.total_cost_usd - negotiationSuggestions.aggressive) / item.total_cost_usd) * 100, 1)}% off listing
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Fair Offer:</span>
                  <div className="flex flex-col items-end">
                    <span className="font-semibold text-luxury-platinum">{formatCurrency(negotiationSuggestions.fair)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatNumber(((item.total_cost_usd - negotiationSuggestions.fair) / item.total_cost_usd) * 100, 1)}% off listing
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Max Price:</span>
                  <div className="flex flex-col items-end">
                    <span className="font-semibold text-foreground">{formatCurrency(negotiationSuggestions.max)}</span>
                    {negotiationSuggestions.max < item.total_cost_usd ? (
                      <span className="text-[10px] text-muted-foreground">
                        {formatNumber(((item.total_cost_usd - negotiationSuggestions.max) / item.total_cost_usd) * 100, 1)}% off listing
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {formatNumber(((negotiationSuggestions.max - item.total_cost_usd) / item.total_cost_usd) * 100, 1)}% above listing
                      </span>
                    )}
                  </div>
                </div>
                {arbitrage?.valuation_status === 'undervalued' && (
                  <div className="mt-2 pt-2 border-t border-luxury-gold/20">
                    <p className="text-[10px] text-muted-foreground italic">
                      💡 This item is already undervalued. Consider accepting listing price or negotiating modestly.
                    </p>
                  </div>
                )}
                {arbitrage?.valuation_status === 'overvalued' && (
                  <div className="mt-2 pt-2 border-t border-red-500/20">
                    <p className="text-[10px] text-muted-foreground italic">
                      ⚠️ This item is overvalued. Negotiate aggressively or consider other options.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs sm:text-xs md:text-sm font-medium text-luxury-gold active:text-luxury-gold-light transition-luxury border border-luxury-gold/30 rounded-lg px-4 py-2.5 sm:py-2 md:py-2 active:bg-luxury-gold/10 active:border-luxury-gold min-h-[44px] sm:min-h-0 touch-manipulation active:scale-[0.98]"
          >
            View on eBay
            <ExternalLink className="h-4 w-4 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}

