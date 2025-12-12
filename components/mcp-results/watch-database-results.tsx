'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Watch, Search, List } from 'lucide-react';

interface WatchDatabaseResultsProps {
  toolName: string;
  result: any;
}

export function WatchDatabaseResults({ toolName, result }: WatchDatabaseResultsProps) {
  if (toolName.includes('search') || toolName.includes('reference')) {
    return <WatchSearchResults result={result} />;
  }
  
  if (toolName.includes('makes') || toolName.includes('brands')) {
    return <WatchMakesResults result={result} />;
  }

  return <GenericDisplay result={result} />;
}

function WatchSearchResults({ result }: { result: any }) {
  const watches = result?.watches || result?.data || result?.results || (Array.isArray(result) ? result : []);
  const count = result?.count || watches.length;

  if (watches.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">No watches found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Watch Search Results ({count})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {watches.slice(0, 10).map((watch: any, index: number) => (
            <div key={index} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Watch className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{watch.brand || watch.make || 'Unknown Brand'}</div>
                    {watch.model && (
                      <div className="text-sm text-muted-foreground">{watch.model}</div>
                    )}
                  </div>
                </div>
              </div>
              {watch.reference && (
                <div className="text-xs">
                  <span className="text-muted-foreground">Reference: </span>
                  <span className="font-mono">{watch.reference}</span>
                </div>
              )}
              {watch.year && (
                <Badge variant="outline" className="text-xs">
                  {watch.year}
                </Badge>
              )}
              {watch.movement_type && (
                <div className="text-xs text-muted-foreground">
                  Movement: {watch.movement_type}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function WatchMakesResults({ result }: { result: any }) {
  const makes = result?.makes || result?.data || result?.results || (Array.isArray(result) ? result : []);
  const count = result?.count || makes.length;

  if (makes.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground">No watch brands found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <List className="h-5 w-5" />
          Watch Brands ({count})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {makes.slice(0, 50).map((make: any, index: number) => {
            const name = typeof make === 'string' ? make : make.name || make.make || make.brand;
            return (
              <Badge key={index} variant="secondary">
                {name}
              </Badge>
            );
          })}
        </div>
        {makes.length > 50 && (
          <div className="text-xs text-muted-foreground mt-2">
            Showing first 50 of {makes.length} brands
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GenericDisplay({ result }: { result: any }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}

