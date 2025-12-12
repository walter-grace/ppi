/**
 * Test the simple API endpoint to isolate the issue
 */
const http = require('http');

const testMessage = {
  messages: [
    { role: 'user', content: 'Say hello in one sentence' },
  ],
};

const postData = JSON.stringify(testMessage);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/chat/test',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

console.log('Testing simple OpenRouter API (no tools)...\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  console.log('');

  let chunks = [];
  const decoder = new TextDecoder();

  res.on('data', (chunk) => {
    chunks.push(chunk);
    const text = decoder.decode(chunk, { stream: true });
    console.log('Chunk received:', text.substring(0, 200));
  });

  res.on('end', () => {
    const fullResponse = Buffer.concat(chunks).toString();
    console.log(`\nTotal length: ${fullResponse.length} bytes`);
    console.log('Full response:', fullResponse.substring(0, 500));
    
    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS - Stream is working!');
    } else {
      console.log('\n❌ ERROR - Check the response above');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
  console.error('\nMake sure the dev server is running: npm run dev');
});

req.write(postData);
req.end();

