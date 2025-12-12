/**
 * Test script to test 3 sample prompts
 */

// Use built-in fetch (Node.js 18+)

const prompts = [
  {
    name: 'Simple greeting',
    message: 'Hello, how are you?',
    expectedTools: false,
  },
  {
    name: 'eBay search',
    message: 'Find PSA 10 Charizard cards on eBay',
    expectedTools: true,
    expectedTool: 'search_ebay',
  },
  {
    name: 'Watch search',
    message: 'Search eBay for Rolex Submariner watches',
    expectedTools: true,
    expectedTool: 'search_ebay',
  },
];

async function testPrompt(prompt, index) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Test ${index + 1}/3: ${prompt.name}`);
  console.log(`Message: "${prompt.message}"`);
  console.log(`${'='.repeat(60)}\n`);

  const API_URL = 'http://localhost:3000/api/chat';

  try {
    console.log(`📤 Sending request...`);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: prompt.message },
        ],
      }),
    });

    console.log(`📥 Status: ${response.status}`);
    console.log(`📥 Content-Type: ${response.headers.get('content-type')}`);

    if (!response.body) {
      console.error('❌ Error: Response body is null.');
      return { success: false, error: 'No response body' };
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = [];
    let fullContent = '';
    let hasError = false;
    let hasText = false;
    let hasToolCall = false;

    console.log(`📦 Reading stream...`);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      chunks.push(chunk);
      fullContent += chunk;

      // Check for errors
      if (chunk.includes('"error"') || chunk.includes('errorText')) {
        hasError = true;
      }
      // Check for text content
      if (chunk.includes('"type":"text-delta"') || chunk.includes('"type":"text-start"')) {
        hasText = true;
      }
      // Check for tool calls
      if (chunk.includes('"type":"tool-call"') || chunk.includes('tool-')) {
        hasToolCall = true;
      }
    }

    console.log(`✅ Total chunks: ${chunks.length}`);
    console.log(`✅ Total length: ${fullContent.length} bytes`);

    // Parse results
    const lines = fullContent.split('\n').filter(line => line.trim() && line.startsWith('data:'));
    const dataEvents = lines.map(line => {
      try {
        const jsonStr = line.replace('data: ', '');
        return JSON.parse(jsonStr);
      } catch {
        return null;
      }
    }).filter(Boolean);

    console.log(`\n📊 Stream Analysis:`);
    console.log(`   - Data events: ${dataEvents.length}`);
    console.log(`   - Has text: ${hasText}`);
    console.log(`   - Has tool call: ${hasToolCall}`);
    console.log(`   - Has error: ${hasError}`);

    // Check for specific event types
    const eventTypes = dataEvents.map(e => e.type).filter(Boolean);
    const uniqueTypes = [...new Set(eventTypes)];
    console.log(`   - Event types: ${uniqueTypes.join(', ')}`);

    // Extract text content if available
    const textDeltas = dataEvents.filter(e => e.type === 'text-delta').map(e => e.delta).join('');
    if (textDeltas) {
      console.log(`\n💬 Response preview: "${textDeltas.substring(0, 100)}${textDeltas.length > 100 ? '...' : ''}"`);
    }

    // Check for errors
    const errorEvents = dataEvents.filter(e => e.type === 'error' || e.errorText);
    if (errorEvents.length > 0) {
      console.error(`\n❌ ERROR detected:`);
      errorEvents.forEach(e => {
        console.error(`   - ${e.errorText || e.error || JSON.stringify(e)}`);
      });
      return { success: false, error: errorEvents[0].errorText || 'Unknown error' };
    }

    // Validate expectations
    if (prompt.expectedTools && !hasToolCall) {
      console.warn(`\n⚠️  Expected tool call but none found`);
    }

    if (response.status === 200 && hasText && !hasError) {
      console.log(`\n✅ SUCCESS - Stream is working!`);
      return { success: true, hasText, hasToolCall };
    } else {
      console.error(`\n❌ FAILED - Check the response above`);
      return { success: false, status: response.status, hasText, hasError };
    }

  } catch (error) {
    console.error(`❌ Error during test:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🧪 Testing 3 Sample Prompts\n');
  console.log('Make sure the dev server is running on http://localhost:3000\n');

  const results = [];

  for (let i = 0; i < prompts.length; i++) {
    const result = await testPrompt(prompts[i], i);
    results.push({ prompt: prompts[i].name, ...result });
    
    // Wait a bit between tests
    if (i < prompts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(60)}\n`);

  results.forEach((result, i) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${i + 1}. ${result.prompt}: ${status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const passed = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`\n✅ Passed: ${passed}/${total}`);

  if (passed === total) {
    console.log('\n🎉 All tests passed! The UI should be working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

runAllTests();

