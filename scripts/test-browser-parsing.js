/**
 * Test to simulate what the browser's useChat hook does
 * This helps identify why parsing fails
 */

// Simulate the stream format we're receiving
const sampleStream = `data: {"type":"start"}

data: {"type":"start-step"}

data: {"type":"text-start","id":"gen-123"}

data: {"type":"text-delta","id":"gen-123","delta":"Hello"}

data: {"type":"tool-input-available","toolCallId":"tool_123","toolName":"search_ebay","input":{"query":"test"}}

data: {"type":"tool-output-available","toolCallId":"tool_123","output":{"success":true,"items":[]}}

data: {"type":"finish"}

data: [DONE]`;

console.log('🧪 Testing stream parsing (simulating useChat behavior)...\n');

// Simulate what useChat does - parse data stream
function parseDataStream(stream) {
  const lines = stream.split('\n').filter(l => l.trim());
  const events = [];
  
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const jsonStr = line.substring(5).trim();
      
      // Handle [DONE] marker
      if (jsonStr === '[DONE]') {
        events.push({ type: 'done' });
        continue;
      }
      
      try {
        const data = JSON.parse(jsonStr);
        events.push(data);
      } catch (e) {
        console.error(`❌ Failed to parse line: ${line.substring(0, 100)}`);
        console.error(`   Error: ${e.message}`);
        return null;
      }
    } else if (line.startsWith('code:')) {
      console.error(`❌ Found code: line (this might cause "Invalid code data" error):`);
      console.error(`   ${line}`);
      return null;
    }
  }
  
  return events;
}

const events = parseDataStream(sampleStream);

if (events) {
  console.log('✅ Stream parsed successfully!');
  console.log(`   Found ${events.length} events`);
  console.log(`   Event types: ${events.map(e => e.type || 'done').join(', ')}`);
} else {
  console.log('❌ Stream parsing failed');
}

// Test with actual problematic format
console.log('\n🧪 Testing with actual stream format from API...');

async function testActualStream() {
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullContent += decoder.decode(value, { stream: true });
    }

    console.log('📥 Received stream, testing parsing...');
    const events = parseDataStream(fullContent);
    
    if (events) {
      console.log('✅ Actual stream parsed successfully!');
      console.log(`   Found ${events.length} events`);
    } else {
      console.log('❌ Actual stream parsing failed');
      console.log('   First 500 chars:', fullContent.substring(0, 500));
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testActualStream();

