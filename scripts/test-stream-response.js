/**
 * Test script to inspect the actual API stream response
 * Run: node scripts/test-stream-response.js
 */

const http = require('http');

const testMessage = {
  messages: [
    { role: 'user', content: 'Hello, test message' },
  ],
};

const postData = JSON.stringify(testMessage);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('Testing API stream response...\n');
console.log('Sending request:', testMessage);
console.log('');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('');

  let chunks = [];
  let totalLength = 0;

  res.on('data', (chunk) => {
    chunks.push(chunk);
    totalLength += chunk.length;
    
    // Log first chunk immediately
    if (chunks.length === 1) {
      const firstChunk = chunk.toString();
      console.log('First chunk received:');
      console.log(firstChunk.substring(0, 500));
      console.log('');
    }
  });

  res.on('end', () => {
    const fullResponse = Buffer.concat(chunks).toString();
    console.log(`\nTotal chunks: ${chunks.length}`);
    console.log(`Total length: ${totalLength} bytes`);
    console.log('');
    console.log('Full stream content:');
    console.log('='.repeat(80));
    console.log(fullResponse);
    console.log('='.repeat(80));
    console.log('');
    
    // Try to parse stream format
    const lines = fullResponse.split('\n').filter(line => line.trim());
    console.log(`Stream lines: ${lines.length}`);
    if (lines.length > 0) {
      console.log('\nFirst 20 lines:');
      lines.slice(0, 20).forEach((line, idx) => {
        console.log(`${idx + 1}: ${line.substring(0, 200)}`);
      });
    }
    
    // Check for data stream format (should start with numbers like "0:" or "1:")
    const dataStreamPattern = /^\d+:/;
    const dataStreamLines = lines.filter(line => dataStreamPattern.test(line));
    console.log(`\nData stream format lines: ${dataStreamLines.length}`);
    if (dataStreamLines.length > 0) {
      console.log('First 5 data stream lines:');
      dataStreamLines.slice(0, 5).forEach((line, idx) => {
        console.log(`${idx + 1}: ${line.substring(0, 300)}`);
      });
    }
    
    // Check for errors in stream
    if (fullResponse.includes('error') || fullResponse.includes('Error')) {
      console.log('\n⚠️  Error detected in stream!');
      const errorMatch = fullResponse.match(/error[^}]*/i);
      if (errorMatch) {
        console.log('Error snippet:', errorMatch[0].substring(0, 500));
      }
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
  console.error('\nMake sure the dev server is running: npm run dev');
});

req.write(postData);
req.end();

