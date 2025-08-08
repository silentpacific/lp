// Working Analyze Pulse Function - Minimal Version
// netlify/functions/analyze-pulse.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.handler = async (event, context) => {
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
    const { selectedText, articleContent, articleTitle, mode = 'single_pulse' } = JSON.parse(event.body);

    if (!selectedText || !articleContent) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing selectedText or articleContent' }),
      };
    }

    console.log('Analyzing pulse:', { mode, selectedTextLength: selectedText.length });

    if (mode === 'full_article_scan') {
      return await analyzeFullArticle(articleContent, articleTitle, headers);
    } else {
      return await analyzeSinglePulse(selectedText, articleContent, articleTitle, headers);
    }

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

/**
 * Analyze entire article for multiple pulse points
 */
async function analyzeFullArticle(articleContent, articleTitle, headers) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash"
    });

    const prompt = `Analyze this article and identify ALL facts that could change over time and need automatic updates.

ARTICLE: "${articleContent}"

Look for:
- Prices and monetary amounts (including words like "billion", "million", "trillion")
- Dates and years (2021, 2024, etc.)
- Statistics and percentages
- Weather data and temperatures
- Population figures
- Sports scores and rankings
- Technology versions
- Market data
- Any numerical facts that become outdated

For each fact found, return this format:
{
  "text": "the exact text that should be dynamic",
  "type": "crypto|weather|stock|date|population|sports|news|other",
  "confidence": "high|medium|low",
  "reason": "why this should update"
}

Return ONLY a JSON array of pulse points. Find ALL dynamic facts, not just prices.

Example response:
[
  {
    "text": "$4.98 trillion",
    "type": "financial",
    "confidence": "high",
    "reason": "Sales figures change annually"
  },
  {
    "text": "2021",
    "type": "date",
    "confidence": "high", 
    "reason": "Year reference that becomes outdated"
  }
]`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean up response
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    }
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/```\s*/g, '').replace(/```\s*$/g, '');
    }

    let pulsePoints;
    try {
      pulsePoints = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw Response:', responseText);
      throw new Error('Could not parse AI response as JSON');
    }

    // Convert to expected format
    const analysis = {
      pulsePoints: pulsePoints.map((pulse, index) => ({
        id: `pulse-${index + 1}`,
        selectedText: pulse.text,
        dynamicPart: pulse.text,
        pulseType: pulse.type,
        confidence: pulse.confidence === 'high' ? 0.9 : pulse.confidence === 'medium' ? 0.7 : 0.5,
        currentValue: pulse.text,
        dataSource: getDataSource(pulse.type),
        updateFrequency: getUpdateFrequency(pulse.type),
        reasoning: pulse.reason
      }))
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis,
        mode: 'full_article_scan',
        totalFound: pulsePoints.length
      }),
    };

  } catch (error) {
    console.error('Full article analysis error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Analysis failed'
      }),
    };
  }
}

/**
 * Analyze single selected text (fallback to full article for now)
 */
async function analyzeSinglePulse(selectedText, articleContent, articleTitle, headers) {
  return await analyzeFullArticle(articleContent, articleTitle, headers);
}

/**
 * Get appropriate data source for pulse type
 */
function getDataSource(pulseType) {
  const sources = {
    'crypto': 'CoinGecko API',
    'financial': 'Financial APIs',
    'weather': 'OpenWeatherMap',
    'date': 'System Date',
    'stock': 'Alpha Vantage',
    'population': 'Census Data',
    'sports': 'Sports APIs',
    'news': 'News APIs',
    'other': 'Manual Research'
  };
  return sources[pulseType] || 'Manual Research';
}

/**
 * Get update frequency for pulse type
 */
function getUpdateFrequency(pulseType) {
  const frequencies = {
    'crypto': 60,      // 1 hour
    'financial': 240,  // 4 hours
    'weather': 180,    // 3 hours
    'date': 1440,      // 1 day
    'stock': 240,      // 4 hours
    'population': 43200, // 1 month
    'sports': 60,      // 1 hour
    'news': 240,       // 4 hours
    'other': 1440      // 1 day
  };
  return frequencies[pulseType] || 1440;
}