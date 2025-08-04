// Environment Configuration Endpoint
// netlify/functions/env-config.js

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Only expose frontend-safe environment variables
    const envConfig = {
      success: true,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      // Note: Backend API keys (GEMINI_API_KEY, OPENAI_API_KEY, ALPHA_VANTAGE_API_KEY) 
      // are NOT exposed to frontend for security
    };

    // Validate that required env vars exist
    if (!envConfig.SUPABASE_URL || !envConfig.SUPABASE_ANON_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Required environment variables not configured'
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(envConfig),
    };

  } catch (error) {
    console.error('Environment config error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Failed to load environment configuration'
      }),
    };
  }
};