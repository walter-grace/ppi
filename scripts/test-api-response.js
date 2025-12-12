/**
 * Test script to check the actual API response format
 * Run: node scripts/test-api-response.js
 */

const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API response...\n');
    
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

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    console.log('\nReading stream...\n');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let chunks = [];
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      chunks.push(chunk);
      fullText += chunk;
      
      // Log first few chunks
      if (chunks.length <= 3) {
        console.log(`Chunk ${chunks.length}:`, chunk.substring(0, 200));
      }
    }

    console.log(`\nTotal chunks: ${chunks.length}`);
    console.log(`Total length: ${fullText.length}`);
    console.log('\nFirst 500 chars of response:');
    console.log(fullText.substring(0, 500));
    
    // Check for error indicators
    if (fullText.includes('error') || fullText.includes('Error')) {
      console.log('\n⚠️  Error detected in response!');
      const errorMatch = fullText.match(/error[^}]*/i);
      if (errorMatch) {
        console.log('Error snippet:', errorMatch[0].substring(0, 200));
      }
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAPI();

