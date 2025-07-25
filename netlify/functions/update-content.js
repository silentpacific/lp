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
    const { 
      pulseType, 
      specificType, 
      currentValue, 
      articleContext, 
      promptTemplate,
      surroundingText 
    } = JSON.parse(event.body);

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
      }),
    };

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