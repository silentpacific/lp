exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { dataType } = JSON.parse(event.body);
    
    let prompt;
    switch (dataType) {
      case 'tesla':
        prompt = `Get Tesla's current stock price information. Please provide:
1. Current stock price in USD
2. Previous day's closing price
3. Percentage change and direction (up/down)
4. The specific source where you found this information

Respond ONLY with valid JSON in this exact format:
{
  "price": "$XXX.XX",
  "previous": "$XXX.XX", 
  "change": "up/down X.X%",
  "source": "specific source name and date"
}`;
        break;
        
      case 'weather':
        prompt = `Get current weather information for Adelaide, Australia. Please provide:
1. Current weather condition and temperature in Celsius
2. Yesterday's temperature for comparison
3. How today compares to yesterday (X degrees warmer/cooler/same)
4. The specific source where you found this information

Respond ONLY with valid JSON in this exact format:
{
  "current": "weather condition at XXC",
  "yesterday": "XXC", 
  "comparison": "X degrees warmer/cooler",
  "source": "specific source name and date"
}`;
        break;
        
      case 'bitcoin':
        prompt = `Get Bitcoin's current price information. Please provide:
1. Current Bitcoin price in USD
2. 24-hour percentage change with gain/loss direction
3. Current market trend description (momentum/movement type)
4. The specific source where you found this information

Respond ONLY with valid JSON in this exact format:
{
  "price": "$XXX,XXX",
  "change": "X.X% gain/loss",
  "trend": "market trend description",
  "source": "specific source name and date"
}`;
        break;
        
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid data type' })
        };
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const responseText = data.choices[0].message.content;
    
    // Clean up any markdown formatting
    const cleanText = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsedData = JSON.parse(cleanText);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(parsedData)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch data',
        details: error.message 
      })
    };
  }
};