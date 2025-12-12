'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface NextJSError {
  type: 'build' | 'runtime' | 'type';
  message: string;
  file?: string;
  line?: number;
  column?: number;
  stack?: string;
}

export function ErrorPanel() {
  const [errors, setErrors] = useState<NextJSError[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 3;

    async function fetchErrors() {
      if (!mounted) return;
      
      try {
        const response = await fetch('/api/devtools/errors');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (mounted) {
          setErrors(data.errors || []);
          retryCount = 0; // Reset on success
        }
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          // Stop polling after max retries
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        // Silently fail - don't spam console
      } finally {
        if (mounted && retryCount < maxRetries) {
          setLoading(false);
        }
      }
    }

    // Initial fetch
    fetchErrors();
    
    // Only poll if we successfully got errors or haven't hit max retries
    // Note: Next.js DevTools MCP doesn't expose errors, so this will typically return empty
    const interval = setInterval(() => {
      if (retryCount < maxRetries) {
        fetchErrors();
      } else {
        // Stop polling after max retries to reduce noise
        clearInterval(interval);
      }
    }, 60000); // Poll every 60 seconds (less aggressive)

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Don't show panel if no errors and not loading
  if (errors.length === 0 && !loading) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border-destructive shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Next.js Errors ({errors.length})
            </CardTitle>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-muted-foreground hover:text-foreground"
            >
              {isOpen ? <X className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            </button>
          </div>
        </CardHeader>
        {isOpen && (
          <CardContent className="space-y-2 max-h-96 overflow-y-auto">
            {errors.map((error, index) => (
              <div key={index} className="border rounded-lg p-3 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={error.type === 'runtime' ? 'destructive' : 'secondary'}>
                    {error.type}
                  </Badge>
                  {error.file && (
                    <span className="text-muted-foreground">
                      {error.file}
                      {error.line && `:${error.line}`}
                    </span>
                  )}
                </div>
                <div className="font-medium">{error.message}</div>
                {error.stack && (
                  <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                    {error.stack}
                  </pre>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}

