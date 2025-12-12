/**
 * Utilities for parsing AI SDK stream events
 */

export interface StreamEvent {
  type: 'text' | 'tool-call' | 'tool-result' | 'error' | 'done';
  data: any;
  timestamp: number;
}

export interface ToolCallEvent {
  toolCallId: string;
  toolName: string;
  args: Record<string, any>;
}

export interface ToolResultEvent {
  toolCallId: string;
  toolName: string;
  result: any;
  isError?: boolean;
}

/**
 * Parse stream data chunk
 */
export function parseStreamChunk(chunk: string): StreamEvent[] {
  const events: StreamEvent[] = [];
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.slice(6));
        const event = parseStreamData(data);
        if (event) {
          events.push(event);
        }
      } catch (error) {
        // Ignore parse errors
      }
    }
  }

  return events;
}

function parseStreamData(data: any): StreamEvent | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const timestamp = Date.now();

  // Text delta
  if (data.type === 'text-delta' || data.type === 'text') {
    return {
      type: 'text',
      data: data.textDelta || data.text || '',
      timestamp,
    };
  }

  // Tool result (check before tool-call since results also have toolCallId)
  if (data.type === 'tool-result' || data.result) {
    return {
      type: 'tool-result',
      data: {
        toolCallId: data.toolCallId,
        toolName: data.toolName || data.name,
        result: data.result || data.content,
        isError: data.isError || false,
      } as ToolResultEvent,
      timestamp,
    };
  }

  // Error
  if (data.type === 'error' || data.error) {
    return {
      type: 'error',
      data: data.error || data.message || 'Unknown error',
      timestamp,
    };
  }

  // Tool call
  if (data.type === 'tool-call' || data.toolCallId) {
    return {
      type: 'tool-call',
      data: {
        toolCallId: data.toolCallId,
        toolName: data.toolName || data.name,
        args: data.args || data.arguments || {},
      } as ToolCallEvent,
      timestamp,
    };
  }

  return null;
}

/**
 * Extract tool calls from message
 */
export function extractToolCalls(message: any): ToolCallEvent[] {
  if (!message.toolInvocations) {
    return [];
  }

  return message.toolInvocations.map((invocation: any) => ({
    toolCallId: invocation.toolCallId || invocation.id,
    toolName: invocation.toolName || invocation.name,
    args: invocation.args || invocation.arguments || {},
  }));
}

/**
 * Extract tool results from message
 */
export function extractToolResults(message: any): ToolResultEvent[] {
  if (!message.toolInvocations) {
    return [];
  }

  return message.toolInvocations
    .filter((invocation: any) => invocation.result !== undefined)
    .map((invocation: any) => ({
      toolCallId: invocation.toolCallId || invocation.id,
      toolName: invocation.toolName || invocation.name,
      result: invocation.result,
      isError: invocation.isError || false,
    }));
}

