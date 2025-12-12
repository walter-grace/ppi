/**
 * Simple test endpoint to isolate the OpenRouter issue
 * This bypasses MCP and tools to test if OpenRouter works at all
 */

import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[Test] Starting simple OpenRouter test...');
    console.log('[Test] API Key present:', !!process.env.OPENROUTER_API_KEY);
    
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({
        error: 'OPENROUTER_API_KEY not set',
      }, { status: 500 });
    }
    
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY!,
    });
    
    const result = await streamText({
      model: openrouter('anthropic/claude-3-5-sonnet'),
      prompt: 'Say hello in one sentence.',
    });
    
    console.log('[Test] streamText result type:', typeof result);
    console.log('[Test] Result keys:', result ? Object.keys(result) : []);
    console.log('[Test] Result prototype keys:', result ? Object.getOwnPropertyNames(Object.getPrototypeOf(result)) : []);
    console.log('[Test] Has toUIMessageStreamResponse:', typeof (result as any)?.toUIMessageStreamResponse === 'function');
    console.log('[Test] Has toTextStreamResponse:', typeof (result as any)?.toTextStreamResponse === 'function');
    console.log('[Test] Has toDataStream:', typeof (result as any)?.toDataStream === 'function');
    console.log('[Test] Has toResponse:', typeof (result as any)?.toResponse === 'function');
    console.log('[Test] Result constructor:', result?.constructor?.name);
    
    // Try to find any method that might convert to response
    if (result) {
      const allProps = Object.getOwnPropertyNames(result);
      const allProtoProps = Object.getOwnPropertyNames(Object.getPrototypeOf(result));
      const allMethods = [...allProps, ...allProtoProps].filter(prop => 
        typeof (result as any)[prop] === 'function' && 
        (prop.includes('stream') || prop.includes('response') || prop.includes('Response'))
      );
      console.log('[Test] Methods with stream/response:', allMethods);
    }
    
    if (!result) {
      return NextResponse.json({
        error: 'streamText returned null/undefined',
      }, { status: 500 });
    }
    
    // Try v5 API methods
    if (typeof (result as any).toUIMessageStreamResponse === 'function') {
      return (result as any).toUIMessageStreamResponse();
    }
    if (typeof (result as any).toTextStreamResponse === 'function') {
      return (result as any).toTextStreamResponse();
    }
    
    return NextResponse.json({
      error: 'No valid stream response method found (toUIMessageStreamResponse or toTextStreamResponse)',
      resultType: typeof result,
      resultKeys: result ? Object.keys(result) : [],
      resultPrototypeKeys: result ? Object.getOwnPropertyNames(Object.getPrototypeOf(result)) : [],
      resultConstructor: result?.constructor?.name,
      resultString: String(result).substring(0, 500),
    }, { status: 500 });
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      name: error.name,
      cause: error.cause,
    }, { status: 500 });
  }
}

