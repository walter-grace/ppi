'use client';

import React from 'react';
import { UIMessage } from 'ai';
import { MessageContent } from './message-content';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Bot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NextJSDevToolsResults } from '@/components/mcp-results/nextjs-devtools-results';
import { WatchDatabaseResults } from '@/components/mcp-results/watch-database-results';
import { EbayResults } from '@/components/mcp-results/ebay-results';
import { GenericToolResult } from '@/components/mcp-results/generic-tool-result';
import { SuggestionPrompts } from './suggestion-prompts';

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  onPromptSelect?: (prompt: string) => void;
  onNegotiate?: (item: any, negotiationQuery: string) => void;
  onLoadMore?: (query: string, offset: number, limit: number) => void;
}

// Helper to extract text content from UIMessage parts (v2 API)
function getMessageText(message: UIMessage): string {
  const textParts = message.parts?.filter((p: any) => p.type === 'text') || [];
  return textParts.map((p: any) => p.text || '').join('');
}

// Helper to extract tool invocations from UIMessage parts (v2 API)
// In v2, tool parts have type 'tool-${toolName}' or are dynamic tools
function getToolInvocations(message: UIMessage): any[] {
  const toolParts = message.parts?.filter((p: any) => {
    const type = p.type || '';
    return type.startsWith('tool-') || type === 'dynamic-tool';
  }) || [];
  
  // Group tool parts by toolCallId to create complete invocations
  const invocations = new Map<string, any>();
  
  for (const part of toolParts) {
    const p = part as any; // Type assertion for tool part
    const toolCallId = p.toolCallId || p.id || 'unknown';
    
    if (!invocations.has(toolCallId)) {
      // Extract tool name from type (e.g., 'tool-search_ebay' -> 'search_ebay')
      let toolName = 'unknown';
      if (p.type?.startsWith('tool-')) {
        toolName = p.type.replace('tool-', '');
      } else if (p.toolName) {
        toolName = p.toolName;
      }
      
      invocations.set(toolCallId, {
        toolCallId,
        toolName,
        args: p.input || {},
        result: p.output,
        state: p.state || (p.output ? 'output-available' : p.input ? 'input-available' : 'input-streaming'),
      });
    } else {
      // Merge additional data into existing invocation
      const existing = invocations.get(toolCallId)!;
      if (p.input && !existing.args) {
        existing.args = p.input;
      }
      if (p.output && !existing.result) {
        existing.result = p.output;
        existing.state = 'output-available';
      }
    }
  }
  
  return Array.from(invocations.values());
}

export function ChatMessages({ messages, isLoading, onPromptSelect, onNegotiate, onLoadMore }: ChatMessagesProps) {
  // Debug: Log message structure
  React.useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      console.log('[ChatMessages] Rendering', messages.length, 'messages');
      messages.forEach((msg, idx) => {
        const textContent = getMessageText(msg);
        const toolInvocations = getToolInvocations(msg);
        console.log(`[ChatMessages] Message ${idx}:`, {
          role: msg.role,
          partsCount: msg.parts?.length || 0,
          textContentLength: textContent.length,
          toolInvocationsCount: toolInvocations.length,
        });
      });
    }
  }, [messages]);

  return (
    <div className="space-y-6 animate-fade-in">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={cn(
            'flex gap-3 md:gap-4 animate-slide-up',
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          {message.role === 'assistant' && (
            <Avatar className="h-9 w-9 md:h-10 md:w-10 shrink-0 border-2 border-luxury-gold/30 ring-2 ring-luxury-gold/10">
              <AvatarFallback className="bg-luxury-gold/10">
                <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-luxury-gold" />
              </AvatarFallback>
            </Avatar>
          )}
          
          <div
            className={cn(
              'flex flex-col gap-2 max-w-[85%] md:max-w-[80%]',
              message.role === 'user' ? 'items-end' : 'items-start'
            )}
          >
            <div
              className={cn(
                'rounded-xl px-4 py-3 md:px-5 md:py-4 transition-luxury shadow-sm',
                message.role === 'user'
                  ? 'bg-gradient-to-br from-luxury-gold to-luxury-gold-light text-luxury-dark font-medium shadow-lg shadow-luxury-gold/20'
                  : 'bg-muted/80 glass border border-border/50 hover:border-luxury-gold/20'
              )}
            >
              <MessageContent content={getMessageText(message)} />
            </div>
            
            {getToolInvocations(message).length > 0 && (
              <div className="w-full space-y-2">
                {getToolInvocations(message).map((toolPart: any, idx: number) => (
                  <ToolCallDisplay key={toolPart.toolCallId || `tool-${idx}`} toolInvocation={toolPart} onNegotiate={onNegotiate} onLoadMore={onLoadMore} />
                ))}
              </div>
            )}
            
            {/* Show suggestion prompts for assistant messages with results */}
            {message.role === 'assistant' && onPromptSelect && (
              <SuggestionPrompts
                messageContent={getMessageText(message)}
                toolResults={getToolInvocations(message)}
                onPromptSelect={onPromptSelect}
                isLoading={isLoading}
              />
            )}
          </div>

          {message.role === 'user' && (
            <Avatar className="h-9 w-9 md:h-10 md:w-10 shrink-0 border-2 border-luxury-platinum/30 ring-2 ring-luxury-platinum/10">
              <AvatarFallback className="bg-luxury-platinum/10">
                <User className="h-4 w-4 md:h-5 md:w-5 text-luxury-platinum" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      ))}
      
      {isLoading && (
        <div className="flex gap-3 md:gap-4 justify-start animate-slide-up">
          <Avatar className="h-9 w-9 md:h-10 md:w-10 shrink-0 border-2 border-luxury-gold/30 ring-2 ring-luxury-gold/10 animate-pulse-gold">
            <AvatarFallback className="bg-luxury-gold/10">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-luxury-gold" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 items-start max-w-[85%] md:max-w-[80%]">
            <div className="rounded-xl px-4 py-3 md:px-5 md:py-4 bg-muted/80 glass border border-border/50">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-luxury-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolCallDisplay({ toolInvocation, onNegotiate, onLoadMore }: { toolInvocation: any; onNegotiate?: (item: any, negotiationQuery: string) => void; onLoadMore?: (query: string, offset: number, limit: number) => void }) {
  const toolName = toolInvocation.toolName || 'unknown';
  const args = toolInvocation.args || {};
  const result = toolInvocation.result;

  return (
    <div className="rounded-lg border border-border/50 bg-card/80 glass p-3 md:p-4 text-sm transition-luxury hover:border-luxury-gold/30">
      <div className="font-semibold mb-2 text-luxury-gold flex items-center gap-2">
        <span>🔧</span>
        <span>{toolName.replace('nextjs_', '').replace('watchdb_', '')}</span>
      </div>
      {Object.keys(args).length > 0 && (
        <div className="text-muted-foreground mb-2">
          <div className="font-medium">Parameters:</div>
          <pre className="text-xs mt-1 overflow-x-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
      )}
      {result && (
        <div className="mt-2">
          <div className="font-medium mb-1">Result:</div>
          <ToolResultDisplay toolName={toolName} result={result} onNegotiate={onNegotiate} onLoadMore={onLoadMore} />
        </div>
      )}
    </div>
  );
}

function ToolResultDisplay({ toolName, result, onNegotiate, onLoadMore }: { toolName: string; result: any; onNegotiate?: (item: any, negotiationQuery: string) => void; onLoadMore?: (query: string, offset: number, limit: number) => void }) {
  // Route to specialized components based on tool name
  if (toolName === 'search_ebay' || toolName.includes('search_ebay')) {
    return <EbayResults result={result} onNegotiate={onNegotiate} onLoadMore={onLoadMore} />;
  }
  
  if (toolName.startsWith('nextjs_')) {
    return <NextJSDevToolsResults toolName={toolName} result={result} />;
  }
  
  if (toolName.startsWith('watchdb_')) {
    return <WatchDatabaseResults toolName={toolName} result={result} />;
  }

  // Generic JSON display
  return <GenericToolResult toolName={toolName} result={result} />;
}

