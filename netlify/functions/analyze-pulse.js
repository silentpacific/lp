const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { selectedText, articleContent } = JSON.parse(event.body);

    if (!selectedText || !articleContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing selectedText or articleContent' }),
      };
    }

    // Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are an expert content analyst for automated updates. Analyze this selected text from a blog article.

SELECTED TEXT: "${selectedText}"

FULL ARTICLE CONTEXT: "${articleContent.substring(0, 800)}..."

Analyze what type of content this is and how it should be automatically updated. Return ONLY a JSON object with this exact structure:

{
  "pulseType": "crypto|weather|population|news|sports|date|stock|wildlife|other",
  "specificType": "detailed identifier like 'crypto:btc:price' or 'weather:adelaide:current'",
  "updateFrequency": 60,
  "reasoning": "brief explanation of why this frequency makes sense",
  "dataSource": "specific API or reliable website to get updates",
  "promptTemplate": "how to instruct AI to update this text while maintaining context and tone",
  "confidence": "low|medium|high",
  "currentValue": "the actual dynamic value that will change",
  "contextualHints": "what surrounding words/phrases help identify this content type"
}

EXAMPLES:
- "$67,500" in crypto article → {"pulseType": "crypto", "specificType": "crypto:btc:price", "updateFrequency": 60, "currentValue": "$67,500"}
- "sunny with 22°C" → {"pulseType": "weather", "specificType": "weather:adelaide:current", "updateFrequency": 360, "currentValue": "sunny with 22°C"}
- "this year (2025)" → {"pulseType": "date", "specificType": "date:current_year", "updateFrequency": 1440, "currentValue": "2025"}
- "47 whales spotted" → {"pulseType": "wildlife", "specificType": "wildlife:sa_whales:count", "updateFrequency": 10080, "currentValue": "47"}

Be specific about data sources (CoinGecko, OpenWeatherMap, etc.) and make update frequencies realistic.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the JSON response
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      throw new Error('Could not parse AI response as JSON');
    }

    // Validate required fields
    const requiredFields = ['pulseType', 'specificType', 'updateFrequency', 'reasoning', 'dataSource', 'promptTemplate'];
    for (const field of requiredFields) {
      if (!analysis[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure updateFrequency is a number
    analysis.updateFrequency = parseInt(analysis.updateFrequency);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis,
        selectedText,
        rawResponse: responseText, // For debugging
      }),
    };

  } catch (error) {
    console.error('Error analyzing pulse:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to analyze pulse',
        details: error.stack,
      }),
    };
  }
};