import { describe, it, expect } from 'vitest';
import {
  parseStreamChunk,
  extractToolCalls,
  extractToolResults,
} from '@/lib/streaming/stream-parser';

describe('Stream Parser', () => {
  describe('parseStreamChunk', () => {
    it('should parse text delta events', () => {
      const chunk = 'data: {"type":"text-delta","textDelta":"Hello"}\n';
      const events = parseStreamChunk(chunk);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('text');
      expect(events[0].data).toBe('Hello');
    });

    it('should parse tool call events', () => {
      const chunk = 'data: {"type":"tool-call","toolCallId":"123","toolName":"search_ebay","args":{"query":"watch"}}\n';
      const events = parseStreamChunk(chunk);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('tool-call');
      expect(events[0].data.toolCallId).toBe('123');
      expect(events[0].data.toolName).toBe('search_ebay');
      expect(events[0].data.args.query).toBe('watch');
    });

    it('should parse tool result events', () => {
      const chunk = 'data: {"type":"tool-result","toolCallId":"123","result":{"success":true}}\n';
      const events = parseStreamChunk(chunk);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('tool-result');
      expect(events[0].data.toolCallId).toBe('123');
      expect(events[0].data.result.success).toBe(true);
    });

    it('should parse multiple events', () => {
      const chunk = 'data: {"type":"text-delta","textDelta":"Hello"}\ndata: {"type":"text-delta","textDelta":" World"}\n';
      const events = parseStreamChunk(chunk);
      
      expect(events).toHaveLength(2);
      expect(events[0].data).toBe('Hello');
      expect(events[1].data).toBe(' World');
    });

    it('should handle invalid JSON gracefully', () => {
      const chunk = 'data: invalid json\n';
      const events = parseStreamChunk(chunk);
      
      expect(events).toHaveLength(0);
    });

    it('should ignore non-data lines', () => {
      const chunk = 'event: message\ndata: {"type":"text-delta","textDelta":"Hello"}\n';
      const events = parseStreamChunk(chunk);
      
      expect(events).toHaveLength(1);
    });
  });

  describe('extractToolCalls', () => {
    it('should extract tool calls from message', () => {
      const message = {
        toolInvocations: [
          {
            toolCallId: '123',
            toolName: 'search_ebay',
            args: { query: 'watch' },
          },
        ],
      };

      const toolCalls = extractToolCalls(message);
      
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].toolCallId).toBe('123');
      expect(toolCalls[0].toolName).toBe('search_ebay');
    });

    it('should return empty array if no tool invocations', () => {
      const message = {};
      const toolCalls = extractToolCalls(message);
      expect(toolCalls).toHaveLength(0);
    });

    it('should handle alternative property names', () => {
      const message = {
        toolInvocations: [
          {
            id: '123',
            name: 'search_ebay',
            arguments: { query: 'watch' },
          },
        ],
      };

      const toolCalls = extractToolCalls(message);
      expect(toolCalls).toHaveLength(1);
      expect(toolCalls[0].toolCallId).toBe('123');
    });
  });

  describe('extractToolResults', () => {
    it('should extract tool results from message', () => {
      const message = {
        toolInvocations: [
          {
            toolCallId: '123',
            toolName: 'search_ebay',
            result: { success: true, items: [] },
          },
        ],
      };

      const results = extractToolResults(message);
      
      expect(results).toHaveLength(1);
      expect(results[0].toolCallId).toBe('123');
      expect(results[0].result.success).toBe(true);
    });

    it('should filter out invocations without results', () => {
      const message = {
        toolInvocations: [
          {
            toolCallId: '123',
            toolName: 'search_ebay',
          },
          {
            toolCallId: '456',
            toolName: 'analyze_watch',
            result: { success: true },
          },
        ],
      };

      const results = extractToolResults(message);
      expect(results).toHaveLength(1);
      expect(results[0].toolCallId).toBe('456');
    });

    it('should handle error results', () => {
      const message = {
        toolInvocations: [
          {
            toolCallId: '123',
            toolName: 'search_ebay',
            result: { error: 'Failed' },
            isError: true,
          },
        ],
      };

      const results = extractToolResults(message);
      expect(results[0].isError).toBe(true);
    });
  });
});

