'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Database, ChevronDown, ChevronUp } from 'lucide-react';

interface WatchDatabaseVerificationProps {
  item: {
    item_id: string;
    title: string;
    brand?: string;
    model?: string;
    arbitrage?: {
      price_source?: string;
      market_price_usd?: number;
      retail_price_usd?: number;
    };
  };
  watchDbData?: any; // Raw Watch Database response
}

export function WatchDatabaseVerification({ item, watchDbData }: WatchDatabaseVerificationProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  if (!watchDbData && !item.arbitrage?.price_source?.includes('Watch Database')) {
    return null; // Don't show if no Watch Database data
  }
  
  return (
    <Card className="mt-2 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Database className="h-4 w-4" />
            Watch Database Verification
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 px-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Show
              </>
            )}
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          Source: {item.arbitrage?.price_source || 'Watch Database MCP'}
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 space-y-2">
          <div className="text-xs">
            <div className="font-semibold mb-1">Search Query:</div>
            <div className="text-muted-foreground">
              Brand: {item.brand || 'N/A'} | Model: {item.model || 'N/A'}
            </div>
          </div>
          
          {item.arbitrage?.market_price_usd && (
            <div className="text-xs">
              <div className="font-semibold mb-1">Market Price:</div>
              <div className="text-green-600 font-semibold">
                ${item.arbitrage.market_price_usd.toFixed(2)}
              </div>
            </div>
          )}
          
          {item.arbitrage?.retail_price_usd && (
            <div className="text-xs">
              <div className="font-semibold mb-1">Retail Price:</div>
              <div className="text-blue-600 font-semibold">
                ${item.arbitrage.retail_price_usd.toFixed(2)}
              </div>
            </div>
          )}
          
          {watchDbData && (
            <div className="mt-2 pt-2 border-t border-border">
              <div className="font-semibold mb-1 text-xs">Raw Watch Database Response:</div>
              <pre className="text-[10px] p-2 bg-muted rounded overflow-x-auto max-h-60 overflow-y-auto">
                {JSON.stringify(watchDbData, null, 2)}
              </pre>
            </div>
          )}
          
          {!watchDbData && (
            <div className="text-xs text-muted-foreground italic">
              Raw data not available. Check server logs for Watch Database response.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

