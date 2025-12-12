/**
 * Simple test endpoint to isolate the OpenRouter issue
 * This bypasses MCP and tools to test if OpenRouter works at all
 */

import { streamText } from 'ai';
import { openrouter } from '@openrouter/ai-sdk-provider';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('[Test] Starting simple OpenRouter test...');
    console.log('[Test] API Key present:', !!process.env.OPENROUTER_API_KEY);
    
    const result = await streamText({
      model: openrouter('anthropic/claude-3-5-sonnet'),
      prompt: 'Say hello in one sentence.',
    });
    
    console.log('[Test] streamText result type:', typeof result);
    console.log('[Test] Result keys:', result ? Object.keys(result) : []);
    console.log('[Test] Has toUIMessageStreamResponse:', typeof result?.toUIMessageStreamResponse === 'function');
    console.log('[Test] Has toTextStreamResponse:', typeof result?.toTextStreamResponse === 'function');
    
    if (!result || (typeof result.toUIMessageStreamResponse !== 'function' && typeof result.toTextStreamResponse !== 'function')) {
      return NextResponse.json({
        error: 'Invalid result from streamText',
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : [],
        hasToUIMessageStreamResponse: typeof result?.toUIMessageStreamResponse === 'function',
        hasToTextStreamResponse: typeof result?.toTextStreamResponse === 'function',
      }, { status: 500 });
    }
    
    // Use toUIMessageStreamResponse if available, otherwise toTextStreamResponse
    if (typeof result.toUIMessageStreamResponse === 'function') {
      return result.toUIMessageStreamResponse();
    } else if (typeof result.toTextStreamResponse === 'function') {
      return result.toTextStreamResponse();
    } else {
      return NextResponse.json({ error: 'No valid stream response method found' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[Test] Error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
      name: error.name,
    }, { status: 500 });
  }
}

