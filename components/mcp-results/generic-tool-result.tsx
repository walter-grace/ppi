'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface GenericToolResultProps {
  toolName: string;
  result: any;
}

export function GenericToolResult({ toolName, result }: GenericToolResultProps) {
  const [isOpen, setIsOpen] = useState(false);
  const resultString = JSON.stringify(result, null, 2);
  const isLarge = resultString.length > 500;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge variant="outline">{toolName}</Badge>
            {isLarge && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                {isOpen ? (
                  <>
                    <ChevronDown className="h-3 w-3" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-3 w-3" />
                    Expand
                  </>
                )}
              </button>
            )}
          </div>
          {isLarge && isOpen && (
            <pre className="text-xs bg-muted p-4 rounded overflow-x-auto mt-2 max-h-96 overflow-y-auto">
              {resultString}
            </pre>
          )}
          {!isLarge && (
            <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
              {resultString}
            </pre>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

