import { describe, it, expect } from 'vitest';

/**
 * Integration test to verify the actual API response format
 * This helps us understand what data structure the UI needs to handle
 */
describe('Chat API Integration - Response Format', () => {
  it('should return a streaming response with correct headers', async () => {
    // This test verifies the response format that the UI will receive
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Hello, test message' },
        ],
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    
    // The response should be a stream
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();

    if (reader) {
      const decoder = new TextDecoder();
      let chunks: string[] = [];
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          chunks.push(chunk);
        }
        
        const fullResponse = chunks.join('');
        console.log('API Response chunks:', chunks.length);
        console.log('First chunk:', chunks[0]?.substring(0, 200));
        
        // The response should contain data stream format
        // Format: 0:"text" or 0:"tool-call" etc.
        expect(fullResponse.length).toBeGreaterThan(0);
      } finally {
        reader.releaseLock();
      }
    }
  });

  it('should handle tool calls in response', async () => {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Search eBay for Rolex watches' },
        ],
      }),
    });

    expect(response.status).toBe(200);
    
    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let hasToolCall = false;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          // Check for tool-call markers in the stream
          if (chunk.includes('tool-call') || chunk.includes('tool-result')) {
            hasToolCall = true;
            console.log('Found tool call/result in stream:', chunk.substring(0, 300));
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      // If tools are available, we might see tool calls
      // This is informational, not a hard requirement
      console.log('Tool call detected:', hasToolCall);
    }
  });
});

