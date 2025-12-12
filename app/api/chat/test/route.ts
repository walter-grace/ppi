/**
 * Simple test endpoint to isolate the OpenRouter issue
 * This tests OpenRouter without MCP tools
 */
import { streamText } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    console.log('[Test API] Testing OpenRouter without tools...');
    console.log('[Test API] Messages:', messages.length);
    
    // Test 1: Simple streamText without tools
    const result = await streamText({
      model: openrouter('anthropic/claude-3-5-sonnet'),
      messages,
      // Note: maxTokens removed - not available in AI SDK v5 streamText API
      // Token limits should be set on the model configuration if needed
    });
    
    console.log('[Test API] streamText completed');
    console.log('[Test API] Result type:', typeof result);
    console.log('[Test API] Result keys:', result ? Object.keys(result) : []);
    console.log('[Test API] All properties:', result ? Object.getOwnPropertyNames(result) : []);
    console.log('[Test API] Prototype methods:', result ? Object.getOwnPropertyNames(Object.getPrototypeOf(result)) : []);
    
    // Check for different possible methods (v5 API)
    const hasToUIMessageStreamResponse = typeof (result as any)?.toUIMessageStreamResponse === 'function';
    const hasToTextStreamResponse = typeof (result as any)?.toTextStreamResponse === 'function';
    const hasToDataStream = typeof (result as any)?.toDataStream === 'function';
    const hasToResponse = typeof (result as any)?.toResponse === 'function';
    const hasBaseStream = !!(result as any)?.baseStream;
    
    console.log('[Test API] Methods check:', {
      hasToUIMessageStreamResponse,
      hasToTextStreamResponse,
      hasToDataStream,
      hasToResponse,
      hasBaseStream,
    });
    
    // AI SDK v5 uses toUIMessageStreamResponse() instead of toDataStreamResponse()
    if (hasToUIMessageStreamResponse) {
      console.log('[Test API] Using toUIMessageStreamResponse()');
      return (result as any).toUIMessageStreamResponse();
    }
    
    // Fallback to toTextStreamResponse if available
    if (hasToTextStreamResponse) {
      console.log('[Test API] Using toTextStreamResponse()');
      return (result as any).toTextStreamResponse();
    }
    
    return NextResponse.json({
      error: 'No valid stream method found',
      resultType: typeof result,
      resultKeys: result ? Object.keys(result) : [],
      allProperties: result ? Object.getOwnPropertyNames(result) : [],
      prototypeMethods: result ? Object.getOwnPropertyNames(Object.getPrototypeOf(result)) : [],
      hasToUIMessageStreamResponse,
      hasToTextStreamResponse,
      hasToDataStream,
      hasToResponse,
      hasBaseStream,
    }, { status: 500 });
  } catch (error: any) {
    console.error('[Test API] Error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      name: error.name,
    }, { status: 500 });
  }
}

