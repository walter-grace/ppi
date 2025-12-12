'use client';

import { useState, useEffect, useCallback } from 'react';
import { UIMessage } from 'ai';
import { extractToolCalls, extractToolResults, type ToolCallEvent, type ToolResultEvent } from '@/lib/streaming/stream-parser';

export interface MCPStreamState {
  activeToolCalls: Map<string, ToolCallEvent>;
  completedToolResults: Map<string, ToolResultEvent>;
  isLoading: boolean;
}

export function useMCPStream(messages: UIMessage[]) {
  const [state, setState] = useState<MCPStreamState>({
    activeToolCalls: new Map(),
    completedToolResults: new Map(),
    isLoading: false,
  });

  useEffect(() => {
    const activeCalls = new Map<string, ToolCallEvent>();
    const completedResults = new Map<string, ToolResultEvent>();

    // Process all messages to extract tool calls and results
    for (const message of messages) {
      if (message.role === 'assistant') {
        const toolCalls = extractToolCalls(message);
        const toolResults = extractToolResults(message);

        // Add active tool calls
        for (const toolCall of toolCalls) {
          activeCalls.set(toolCall.toolCallId, toolCall);
        }

        // Move completed results and remove from active
        for (const toolResult of toolResults) {
          completedResults.set(toolResult.toolCallId, toolResult);
          activeCalls.delete(toolResult.toolCallId);
        }
      }
    }

    // Check if we're loading (has active tool calls or last message is assistant without tool results)
    const lastMessage = messages[messages.length - 1];
    const isLoading = 
      activeCalls.size > 0 ||
      (lastMessage?.role === 'assistant' &&
       lastMessage?.parts?.some((p: any) => p.type?.startsWith('tool-') && !p.output));

    setState({
      activeToolCalls: activeCalls,
      completedToolResults: completedResults,
      isLoading,
    });
  }, [messages]);

  const getToolCall = useCallback((toolCallId: string): ToolCallEvent | undefined => {
    return state.activeToolCalls.get(toolCallId) || undefined;
  }, [state]);

  const getToolResult = useCallback((toolCallId: string): ToolResultEvent | undefined => {
    return state.completedToolResults.get(toolCallId);
  }, [state]);

  const getActiveToolCallsForTool = useCallback((toolName: string): ToolCallEvent[] => {
    return Array.from(state.activeToolCalls.values()).filter(
      (call) => call.toolName === toolName
    );
  }, [state]);

  return {
    ...state,
    getToolCall,
    getToolResult,
    getActiveToolCallsForTool,
  };
}

