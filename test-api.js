// Test your Gemini API key safely using environment variables
require('dotenv').config(); // Load from .env file

const https = require('https');

// Get API key from environment variable (safe way)
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GEMINI_API_KEY not found in environment variables!');
  console.log('Make sure your .env file contains: GEMINI_API_KEY="your_key_here"');
  process.exit(1);
}

console.log('API key found, testing...');

const postData = JSON.stringify({
  contents: [
    {
      parts: [
        { text: "Say hello" }
      ]
    }
  ]
});

const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('SUCCESS! API key works');
    } else {
      console.log('ERROR! API key invalid');
      console.log('Response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(postData);
req.end();