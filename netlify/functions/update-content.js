const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to get real data based on pulse type
async function getRealData(pulseType, specificType) {
  try {
    switch (pulseType) {
      case 'crypto':
        if (specificType.includes('btc')) {
          const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
          const data = await response.json();
          return {
            value: `${data.bitcoin.usd.toLocaleString()}`,
            context: `${data.bitcoin.usd_24h_change > 0 ? 'rising' : 'falling'} ${Math.abs(data.bitcoin.usd_24h_change).toFixed(1)}% in 24h`,
            source: 'https://coingecko.com/en/coins/bitcoin'
          };
        }
        break;
        
      case 'date':
        const now = new Date();
        if (specificType.includes('year')) {
          return {
            value: now.getFullYear().toString(),
            context: 'current year',
            source: 'System date'
          };
        } else if (specificType.includes('date')) {
          return {
            value: now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
            context: 'current date',
            source: 'System date'
          };
        }
        break;
        
      case 'weather':
        // For now, return placeholder - we'll add weather API next
        return {
          value: 'sunny with 24°C',
          context: 'current weather conditions',
          source: 'Weather service'
        };
        
      default:
        return null;
    }
  } catch (error) {
    console.error('Error fetching real data:', error);
    return null;
  }
}

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
    const { 
      pulseType, 
      specificType, 
      currentValue, 
      articleContext, 
      promptTemplate,
      surroundingText 
    } = JSON.parse(event.body);

    console.log('Updating pulse:', { pulseType, specificType, currentValue });

    // First, try to get real data
    const realData = await getRealData(pulseType, specificType);
    
    if (realData) {
      // We have real data, use it directly with minimal AI processing
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 150,
          responseMimeType: "application/json",
        },
      });

      const contextPrompt = `Update this text naturally with new data while preserving tone and context.

Original text: "${currentValue}"
New data: "${realData.value}" (${realData.context})
Surrounding context: "${surroundingText}"

Return JSON: {"updatedValue": "updated text that flows naturally", "reasoning": "brief explanation"}`;

      const result = await model.generateContent(contextPrompt);
      const responseText = result.response.text();
      
      let aiResult;
      try {
        aiResult = JSON.parse(responseText);
      } catch (parseError) {
        // Fallback: use real data directly if AI parsing fails
        aiResult = {
          updatedValue: realData.value,
          reasoning: 'Used real data directly due to AI parsing error'
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          originalValue: currentValue,
          updatedValue: aiResult.updatedValue,
          source: realData.source,
          reasoning: aiResult.reasoning || 'Updated with real-time data',
          timestamp: new Date().toISOString(),
          dataSource: 'real-time',
        }),
      };
      
    } else {
      // Fallback to AI-only update (original logic)
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 200,
          responseMimeType: "application/json",
        },
      });

      // Create dynamic prompt based on pulse type
      let updatePrompt = '';
      
      switch (pulseType) {
        case 'crypto':
          updatePrompt = `Update the Bitcoin price in this text. Current text: "${currentValue}". Context: "${surroundingText}". 
          Get the current Bitcoin price and update the text naturally. Return: {"updatedValue": "new text", "source": "data source URL", "reasoning": "why this update"}`;
          break;
          
        case 'weather':
          updatePrompt = `Update the weather information in this text. Current text: "${currentValue}". Context: "${surroundingText}". 
          Provide current weather for the mentioned location. Return: {"updatedValue": "new text", "source": "weather source", "reasoning": "why this update"}`;
          break;
          
        case 'date':
          updatePrompt = `Update the date/year reference in this text. Current text: "${currentValue}". Context: "${surroundingText}". 
          Update to current date/year as appropriate. Return: {"updatedValue": "new text", "source": "current date", "reasoning": "why this update"}`;
          break;
          
        default:
          updatePrompt = `${promptTemplate}. Current text: "${currentValue}". Context: "${surroundingText}". 
          Return: {"updatedValue": "new text", "source": "data source", "reasoning": "why this update"}`;
      }

      const result = await model.generateContent(updatePrompt);
      const responseText = result.response.text();

      let updateResult;
      try {
        updateResult = JSON.parse(responseText);
      } catch (parseError) {
        throw new Error('Could not parse update response as JSON');
      }

      // Validate the response has required fields
      if (!updateResult.updatedValue) {
        throw new Error('No updatedValue in response');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          originalValue: currentValue,
          updatedValue: updateResult.updatedValue,
          source: updateResult.source || 'AI generated',
          reasoning: updateResult.reasoning || 'Content update',
          timestamp: new Date().toISOString(),
          dataSource: 'ai-generated',
        }),
      };
    }

  } catch (error) {
    console.error('Error updating content:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to update content',
      }),
    };
  }
};