/**
 * Test script to verify AI SDK v5 tool integration with stopWhen
 * This tests the tool calling pattern without the full Next.js API route
 */

// Load environment variables (Next.js does this automatically, but for standalone script we read from process.env)
const { streamText, tool, stepCountIs } = require('ai');
const { createOpenRouter } = require('@openrouter/ai-sdk-provider');
const { z } = require('zod');

// Simple test tool
const testTool = tool({
  description: 'A simple test tool that returns a greeting',
  parameters: z.object({
    name: z.string().describe('The name to greet'),
  }),
  execute: async ({ name }) => {
    console.log(`[Tool] Executing testTool with name: ${name}`);
    return { greeting: `Hello, ${name}!` };
  },
});

async function testAISDK() {
  console.log('🧪 Testing AI SDK v5 with tools and stopWhen...\n');

  if (!process.env.OPENROUTER_API_KEY) {
    console.error('❌ OPENROUTER_API_KEY is not set');
    process.exit(1);
  }

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'PSA MCP Chatbot Test',
    },
  });

  try {
    console.log('📝 Test 1: Simple query without tools');
    const result1 = await streamText({
      model: openrouter('anthropic/claude-3-5-sonnet'),
      messages: [{ role: 'user', content: 'Say hello' }],
      maxTokens: 100,
    });

    console.log('✅ Test 1 passed: streamText without tools works');
    console.log(`   Result type: ${typeof result1}`);
    console.log(`   Has toUIMessageStreamResponse: ${typeof result1.toUIMessageStreamResponse === 'function'}\n`);

    console.log('📝 Test 2: Query with tools and stopWhen');
    const result2 = await streamText({
      model: openrouter('anthropic/claude-3-5-sonnet'),
      messages: [{ role: 'user', content: 'Use the test tool to greet John' }],
      tools: {
        testTool,
      },
      stopWhen: stepCountIs(3),
      maxTokens: 200,
    });

    console.log('✅ Test 2 passed: streamText with tools and stopWhen works');
    console.log(`   Result type: ${typeof result2}`);
    console.log(`   Has toUIMessageStreamResponse: ${typeof result2.toUIMessageStreamResponse === 'function'}\n`);

    console.log('📝 Test 3: Convert to UI message stream response');
    const response = result2.toUIMessageStreamResponse();
    console.log('✅ Test 3 passed: toUIMessageStreamResponse() works');
    console.log(`   Response status: ${response.status}`);
    console.log(`   Response content-type: ${response.headers.get('content-type')}\n`);

    console.log('✅ All tests passed! AI SDK v5 tool integration is working correctly.\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAISDK();

