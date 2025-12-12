/**
 * Test script to test the API with an eBay search query
 * This should trigger tool usage
 */

// Use built-in fetch (Node.js 18+)

async function testEbayQuery() {
  console.log('🧪 Testing API with eBay search query (should trigger tools)...\n');

  const API_URL = 'http://localhost:3000/api/chat';
  const testMessage = 'Search eBay for Rolex watches';

  try {
    console.log(`📤 Sending request: "${testMessage}"`);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: testMessage },
        ],
      }),
    });

    console.log(`\n📥 Status: ${response.status}`);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.body) {
      console.error('❌ Error: Response body is null.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = [];
    let fullContent = '';

    console.log('\n📦 Reading stream chunks...');
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      chunks.push(chunk);
      fullContent += chunk;
      
      // Log first few chunks
      if (chunks.length <= 3) {
        console.log(`Chunk ${chunks.length} (first 200 chars):`, chunk.substring(0, 200));
      }
    }

    console.log(`\n✅ Total chunks: ${chunks.length}`);
    console.log(`✅ Total length: ${fullContent.length} bytes`);

    // Check for errors
    if (fullContent.includes('"error"')) {
      console.error('\n❌ ERROR detected in stream!');
      const errorMatch = fullContent.match(/"error"\s*:\s*"([^"]+)"/);
      if (errorMatch) {
        console.error(`   Error message: ${errorMatch[1]}`);
      }
    } else if (response.status === 200) {
      console.log('\n✅ SUCCESS - Stream received!');
      console.log('First 500 chars of response:');
      console.log(fullContent.substring(0, 500));
    } else {
      console.error(`\n❌ Unexpected status: ${response.status}`);
      console.log('Full response:', fullContent);
    }

  } catch (error) {
    console.error('❌ Error during API test:', error);
  }
}

testEbayQuery();

