// Universal Data Sources Engine
// Centralized data fetching for all pulse types
// netlify/functions/data-sources.js

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Universal data fetcher that intelligently routes requests to appropriate sources
 * @param {string} pulseType - The category of data (crypto, weather, stock, etc.)
 * @param {string} specificType - Detailed identifier (crypto:btc:price)
 * @param {Object} context - Additional context for data fetching
 * @returns {Object} Standardized data response
 */
async function fetchUniversalData(pulseType, specificType, context = {}) {
  const result = {
    value: null,
    context: '',
    source: '',
    confidence: 'low',
    metadata: {},
    fetchedAt: new Date().toISOString(),
    dataType: pulseType
  };

  try {
    switch (pulseType) {
      case 'crypto':
        return await fetchCryptoData(specificType, context, result);
      
      case 'weather':
        return await fetchWeatherData(specificType, context, result);
      
      case 'stock':
        return await fetchStockData(specificType, context, result);
      
      case 'date':
        return await fetchDateData(specificType, context, result);
      
      case 'population':
      case 'sports':
      case 'news':
      case 'technology':
      case 'social':
      case 'financial':
      case 'other':
        return await fetchAIResearchData(pulseType, specificType, context, result);
      
      default:
        throw new Error(`Unsupported pulse type: ${pulseType}`);
    }
  } catch (error) {
    console.error(`Error fetching ${pulseType} data:`, error);
    result.error = error.message;
    result.confidence = 'error';
    return result;
  }
}

/**
 * Cryptocurrency data fetcher
 */
async function fetchCryptoData(specificType, context, result) {
  const cryptoMap = {
    'crypto:btc:price': 'bitcoin',
    'crypto:bitcoin:price': 'bitcoin',
    'crypto:eth:price': 'ethereum',
    'crypto:ethereum:price': 'ethereum'
  };

  const coinId = cryptoMap[specificType] || 'bitcoin';
  
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_last_updated_at=true`
  );
  
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  
  const data = await response.json();
  const coinData = data[coinId];
  
  if (!coinData) {
    throw new Error(`No data found for ${coinId}`);
  }
  
  result.value = `$${coinData.usd.toLocaleString()}`;
  result.context = `${coinData.usd_24h_change > 0 ? 'up' : 'down'} ${Math.abs(coinData.usd_24h_change).toFixed(1)}% in 24h`;
  result.source = 'https://coingecko.com';
  result.confidence = 'high';
  result.metadata = {
    rawPrice: coinData.usd,
    change24h: coinData.usd_24h_change,
    marketCap: coinData.usd_market_cap,
    lastUpdated: coinData.last_updated_at,
    trend: coinData.usd_24h_change > 0 ? 'bullish' : 'bearish'
  };
  
  return result;
}

/**
 * Weather data fetcher
 */
async function fetchWeatherData(specificType, context, result) {
  const API_KEY = process.env.OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    return await fetchAIResearchData('weather', specificType, context, result);
  }
  
  // Extract location from specificType or context
  const location = extractLocation(specificType, context) || 'Adelaide,AU';
  
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${API_KEY}&units=metric`
  );
  
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  result.value = `${data.weather[0].description} with ${Math.round(data.main.temp)}°C`;
  result.context = `feels like ${Math.round(data.main.feels_like)}°C, ${data.main.humidity}% humidity`;
  result.source = 'OpenWeatherMap';
  result.confidence = 'high';
  result.metadata = {
    temperature: data.main.temp,
    feelsLike: data.main.feels_like,
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    windSpeed: data.wind?.speed,
    cityName: data.name,
    country: data.sys.country,
    condition: data.weather[0].main
  };
  
  return result;
}

/**
 * Stock data fetcher (placeholder - requires premium API)
 */
async function fetchStockData(specificType, context, result) {
  // For now, use AI research for stock data
  // TODO: Integrate with Alpha Vantage, Yahoo Finance, or similar API when available
  return await fetchAIResearchData('stock', specificType, context, result);
}

/**
 * Date/time data fetcher
 */
async function fetchDateData(specificType, context, result) {
  const now = new Date();
  
  switch (specificType) {
    case 'date:current_year':
    case 'date:year':
      result.value = now.getFullYear().toString();
      result.context = 'current year';
      break;
      
    case 'date:current_month':
    case 'date:month':
      result.value = now.toLocaleDateString('en-US', { month: 'long' });
      result.context = 'current month';
      break;
      
    case 'date:current_date':
    case 'date:today':
      result.value = now.toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
      result.context = 'current date';
      break;
      
    case 'date:current_time':
    case 'date:time':
      result.value = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      result.context = 'current time';
      break;
      
    default:
      result.value = now.toLocaleDateString('en-US');
      result.context = 'current date';
  }
  
  result.source = 'System date/time';
  result.confidence = 'high';
  result.metadata = {
    timestamp: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    epoch: now.getTime()
  };
  
  return result;
}

/**
 * AI-powered research for complex or unsupported data types
 */
async function fetchAIResearchData(pulseType, specificType, context, result) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 400,
        responseMimeType: "application/json",
      },
    });

    const researchPrompt = `You are a research assistant providing current, accurate data for content updates.

PULSE TYPE: ${pulseType}
SPECIFIC TYPE: ${specificType}
CONTEXT: "${JSON.stringify(context)}"

Research and provide the most current, factual information for this data type.

Return JSON with this exact structure:
{
  "value": "the specific updated value/number/fact",
  "context": "additional context or trend information", 
  "source": "reliable source name or URL",
  "reasoning": "brief explanation of the data and why it's current",
  "confidence": "high|medium|low",
  "metadata": {
    "dataQuality": "official|estimated|calculated",
    "lastUpdate": "when this data was last officially updated",
    "reliability": "high|medium|low"
  }
}

EXAMPLES BY TYPE:
- stock:tesla:price → {"value": "$248.50", "context": "down 2.1% today", "source": "Financial markets"}
- population:sydney:total → {"value": "5.4 million", "context": "greater metro area", "source": "Australian Bureau of Statistics"}
- sports:nfl:superbowl_winner → {"value": "Kansas City Chiefs", "context": "2024 champions", "source": "NFL official records"}
- news:inflation:australia → {"value": "3.4%", "context": "annual rate Q4 2024", "source": "Reserve Bank of Australia"}

Focus on current, verifiable data with specific numbers where possible.`;

    const result_ai = await model.generateContent(researchPrompt);
    const responseText = result_ai.response.text();
    
    let aiData;
    try {
      aiData = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error('Could not parse AI research response');
    }
    
    // Validate AI response
    if (!aiData.value) {
      throw new Error('AI research returned no value');
    }
    
    result.value = aiData.value;
    result.context = aiData.context || '';
    result.source = aiData.source || 'AI Research';
    result.confidence = aiData.confidence || 'medium';
    result.metadata = {
      researchMethod: 'ai-powered',
      reasoning: aiData.reasoning,
      dataQuality: aiData.metadata?.dataQuality || 'estimated',
      reliability: aiData.metadata?.reliability || 'medium',
      lastUpdate: aiData.metadata?.lastUpdate || 'unknown'
    };
    
    return result;
    
  } catch (error) {
    console.error('AI research error:', error);
    throw new Error(`AI research failed: ${error.message}`);
  }
}

/**
 * Extract location from specificType or context
 */
function extractLocation(specificType, context) {
  // Try to extract from specificType first
  const typeMatch = specificType.match(/weather:([^:]+)/);
  if (typeMatch) {
    return typeMatch[1];
  }
  
  // Try to extract from context
  const locationPatterns = [
    /weather in ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+weather/gi,
    /in ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g,
    /at ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
  ];
  
  const contextText = JSON.stringify(context);
  
  for (const pattern of locationPatterns) {
    const matches = contextText.match(pattern);
    if (matches && matches[0]) {
      const location = matches[0].replace(/(weather|in|at)\s*/gi, '').trim();
      if (location && !['the', 'and', 'or', 'but', 'with'].includes(location.toLowerCase())) {
        return location;
      }
    }
  }
  
  return null;
}

/**
 * Main handler for data source requests
 */
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
    const { pulseType, specificType, context = {} } = JSON.parse(event.body);

    if (!pulseType || !specificType) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Missing required parameters: pulseType and specificType' 
        }),
      };
    }

    console.log('Fetching data for:', { pulseType, specificType });

    const data = await fetchUniversalData(pulseType, specificType, context);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data,
        requestInfo: {
          pulseType,
          specificType,
          processedAt: new Date().toISOString()
        }
      }),
    };

  } catch (error) {
    console.error('Universal data source error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to fetch data',
        details: error.stack,
      }),
    };
  }
};

// Export the main function for use by other modules
exports.fetchUniversalData = fetchUniversalData;