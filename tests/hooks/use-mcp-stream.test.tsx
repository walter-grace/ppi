import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMCPStream } from '@/hooks/use-mcp-stream';
import type { UIUIMessage } from 'ai';

describe('useMCPStream', () => {
  it('should track active tool calls', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        toolInvocations: [
          {
            toolCallId: 'call-1',
            toolName: 'search_ebay',
            args: { query: 'watch' },
          },
        ],
      },
    ];

    const { result } = renderHook(() => useMCPStream(messages));

    expect(result.current.activeToolCalls.size).toBe(1);
    expect(result.current.activeToolCalls.has('call-1')).toBe(true);
  });

  it('should track completed tool results', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        toolInvocations: [
          {
            toolCallId: 'call-1',
            toolName: 'search_ebay',
            args: { query: 'watch' },
            result: { success: true, items: [] },
          },
        ],
      },
    ];

    const { result } = renderHook(() => useMCPStream(messages));

    expect(result.current.activeToolCalls.size).toBe(0);
    expect(result.current.completedToolResults.size).toBe(1);
    expect(result.current.completedToolResults.has('call-1')).toBe(true);
  });

  it('should detect loading state', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        toolInvocations: [
          {
            toolCallId: 'call-1',
            toolName: 'search_ebay',
            args: { query: 'watch' },
            // No result yet - still loading
          },
        ],
      },
    ];

    const { result } = renderHook(() => useMCPStream(messages));

    expect(result.current.isLoading).toBe(true);
  });

  it('should provide getToolCall helper', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        toolInvocations: [
          {
            toolCallId: 'call-1',
            toolName: 'search_ebay',
            args: { query: 'watch' },
            result: { success: true },
          },
        ],
      },
    ];

    const { result } = renderHook(() => useMCPStream(messages));

    const toolCall = result.current.getToolCall('call-1');
    expect(toolCall?.toolName).toBe('search_ebay');
  });

  it('should filter active tool calls by tool name', () => {
    const messages: UIMessage[] = [
      {
        id: '1',
        role: 'assistant',
        content: '',
        toolInvocations: [
          {
            toolCallId: 'call-1',
            toolName: 'search_ebay',
            args: { query: 'watch' },
          },
          {
            toolCallId: 'call-2',
            toolName: 'analyze_watch',
            args: { title: 'test' },
          },
        ],
      },
    ];

    const { result } = renderHook(() => useMCPStream(messages));

    const ebayCalls = result.current.getActiveToolCallsForTool('search_ebay');
    expect(ebayCalls).toHaveLength(1);
    expect(ebayCalls[0].toolCallId).toBe('call-1');
  });
});

