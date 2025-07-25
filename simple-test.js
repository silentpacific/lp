require('dotenv').config();

console.log('Testing environment variables...');
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY);
console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY exists:', !!process.env.SUPABASE_ANON_KEY);

if (process.env.GEMINI_API_KEY) {
  console.log('API key starts with:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');
  console.log('API key length:', process.env.GEMINI_API_KEY.length);
} else {
  console.log('No API key found!');
}