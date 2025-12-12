/**
 * Test script to verify the stream format from /api/chat
 * This helps diagnose the "Invalid code data" error
 */

async function testStreamFormat() {
  console.log('🧪 Testing /api/chat stream format...\n');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'Search eBay for Rolex Submariner watches' },
        ],
      }),
    });

    console.log('📥 Response Status:', response.status);
    console.log('📥 Response Headers:');
    const headers = Object.fromEntries(response.headers.entries());
    console.log('   Content-Type:', headers['content-type']);
    console.log('   Content-Encoding:', headers['content-encoding'] || 'none');
    console.log('   Transfer-Encoding:', headers['transfer-encoding'] || 'none');
    console.log('');

    if (!response.body) {
      console.error('❌ No response body!');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = [];
    let fullContent = '';
    let lineCount = 0;
    let dataLineCount = 0;
    let codeLineCount = 0;
    let errorLineCount = 0;

    console.log('📦 Reading stream...\n');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      chunks.push(chunk);
      fullContent += chunk;

      // Count different line types
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          lineCount++;
          if (line.startsWith('data:')) {
            dataLineCount++;
          } else if (line.startsWith('code:')) {
            codeLineCount++;
            console.log('⚠️  Found code line:', line.substring(0, 100));
          } else if (line.startsWith('error:')) {
            errorLineCount++;
            console.log('❌ Found error line:', line.substring(0, 100));
          }
        }
      }

      // Log first few chunks
      if (chunks.length <= 3) {
        console.log(`📄 Chunk ${chunks.length} (${chunk.length} bytes):`);
        console.log(chunk.substring(0, 200) + (chunk.length > 200 ? '...' : ''));
        console.log('');
      }
    }

    console.log('✅ Stream reading complete!\n');
    console.log('📊 Stream Statistics:');
    console.log(`   Total chunks: ${chunks.length}`);
    console.log(`   Total length: ${fullContent.length} bytes`);
    console.log(`   Total lines: ${lineCount}`);
    console.log(`   Data lines (data:): ${dataLineCount}`);
    console.log(`   Code lines (code:): ${codeLineCount}`);
    console.log(`   Error lines (error:): ${errorLineCount}`);
    console.log('');

    // Analyze stream format
    const lines = fullContent.split('\n').filter(l => l.trim());
    console.log('📋 First 20 lines:');
    lines.slice(0, 20).forEach((line, idx) => {
      const prefix = line.substring(0, 10);
      console.log(`   ${idx + 1}. ${prefix}${line.length > 10 ? '...' : ''}`);
    });
    console.log('');

    // Check for problematic patterns
    console.log('🔍 Checking for issues...');
    
    // Check for code: lines (these might cause "Invalid code data" error)
    if (codeLineCount > 0) {
      console.log(`   ⚠️  Found ${codeLineCount} code: lines - this might be the issue!`);
      const codeLines = lines.filter(l => l.startsWith('code:'));
      console.log('   Code lines found:');
      codeLines.slice(0, 5).forEach((line, idx) => {
        console.log(`      ${idx + 1}. ${line.substring(0, 100)}`);
      });
    } else {
      console.log('   ✅ No code: lines found');
    }

    // Check for malformed JSON in data lines
    let malformedJsonCount = 0;
    lines.filter(l => l.startsWith('data:')).forEach((line, idx) => {
      try {
        const jsonStr = line.substring(5).trim(); // Remove 'data: ' prefix
        if (jsonStr) {
          JSON.parse(jsonStr);
        }
      } catch (e) {
        malformedJsonCount++;
        if (malformedJsonCount <= 3) {
          console.log(`   ⚠️  Malformed JSON at line ${idx + 1}: ${line.substring(0, 100)}`);
        }
      }
    });

    if (malformedJsonCount === 0) {
      console.log('   ✅ All data: lines contain valid JSON');
    } else {
      console.log(`   ⚠️  Found ${malformedJsonCount} malformed JSON lines`);
    }

    // Check stream protocol
    const hasStartEvent = fullContent.includes('"type":"start"');
    const hasToolEvents = fullContent.includes('"type":"tool-');
    const hasTextEvents = fullContent.includes('"type":"text-');

    console.log('');
    console.log('🔍 Stream Protocol Analysis:');
    console.log(`   Has start event: ${hasStartEvent ? '✅' : '❌'}`);
    console.log(`   Has tool events: ${hasToolEvents ? '✅' : '❌'}`);
    console.log(`   Has text events: ${hasTextEvents ? '✅' : '❌'}`);

    if (hasStartEvent && (hasToolEvents || hasTextEvents)) {
      console.log('   ✅ Stream appears to be UI Message Stream format');
    } else {
      console.log('   ⚠️  Stream format might not be UI Message Stream');
    }

    // Try to parse as UI message stream
    console.log('');
    console.log('🧪 Testing stream parsing...');
    try {
      // This simulates what useChat does
      const dataLines = lines.filter(l => l.startsWith('data:'));
      const events = dataLines.map(line => {
        try {
          return JSON.parse(line.substring(5).trim());
        } catch (e) {
          return null;
        }
      }).filter(e => e !== null);

      console.log(`   ✅ Successfully parsed ${events.length} events`);
      console.log(`   Event types: ${[...new Set(events.map(e => e.type))].join(', ')}`);
    } catch (e) {
      console.log(`   ❌ Failed to parse stream: ${e.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testStreamFormat().catch(console.error);

