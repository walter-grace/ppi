'use client';

import React from 'react';
import { UIMessage } from 'ai';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DebugPanelProps {
  messages: UIMessage[];
  isLoading: boolean;
  error?: Error | null;
}

export function DebugPanel({ messages, isLoading, error }: DebugPanelProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50"
      >
        🔍 Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-20 right-4 w-96 max-h-96 overflow-auto z-50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Debug Panel</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-xs">
        <div>
          <div className="font-semibold mb-1">Status:</div>
          <div className="flex gap-2">
            <Badge variant={isLoading ? 'default' : 'secondary'}>
              {isLoading ? 'Loading' : 'Idle'}
            </Badge>
            {error && <Badge variant="destructive">Error</Badge>}
          </div>
        </div>

        <div>
          <div className="font-semibold mb-1">Messages: {messages.length}</div>
          <div className="space-y-2 max-h-40 overflow-auto">
            {messages.map((msg, idx) => (
              <div key={msg.id || idx} className="border rounded p-2">
                <div className="font-medium text-xs mb-1">
                  {msg.role} {msg.id && `(${msg.id.substring(0, 8)})`}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {msg.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '(empty)'}
                </div>
                {msg.parts?.some((p: any) => p.type?.startsWith('tool-')) && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {msg.parts?.filter((p: any) => p.type?.startsWith('tool-')).length || 0} tool(s)
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div>
            <div className="font-semibold mb-1 text-destructive">Error:</div>
            <pre className="text-xs bg-destructive/10 p-2 rounded overflow-auto">
              {error.message}
            </pre>
          </div>
        )}

        <div>
          <div className="font-semibold mb-1">Message Details:</div>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
            {JSON.stringify(
              messages.map((m) => ({
                role: m.role,
                content: m.parts?.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('').substring(0, 50) || '',
                hasToolParts: !!m.parts?.some((p: any) => p.type?.startsWith('tool-')),
                toolCount: m.parts?.filter((p: any) => p.type?.startsWith('tool-')).length || 0,
              })),
              null,
              2
            )}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

