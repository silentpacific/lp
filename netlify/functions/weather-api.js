// Get real weather data from OpenWeatherMap
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { city = 'Adelaide', country = 'AU' } = event.queryStringParameters || {};
    
    // OpenWeatherMap free API - sign up at openweathermap.org
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    
    if (!API_KEY) {
      throw new Error('OpenWeatherMap API key not configured');
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&appid=${API_KEY}&units=metric`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    const weather = {
      condition: data.weather[0].description,
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      city: data.name,
      country: data.sys.country
    };

    const formattedWeather = `${weather.condition} with ${weather.temperature}°C`;
    const detailedWeather = `${weather.condition} with ${weather.temperature}°C (feels like ${weather.feelsLike}°C, ${weather.humidity}% humidity)`;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          simple: formattedWeather,
          detailed: detailedWeather,
          raw: weather,
          source: 'OpenWeatherMap',
          timestamp: new Date().toISOString(),
          location: `${weather.city}, ${weather.country}`
        }
      })
    };

  } catch (error) {
    console.error('Weather API error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        fallback: {
          simple: 'sunny with 22°C',
          detailed: 'sunny with 22°C (pleasant conditions)',
          source: 'Fallback data',
          timestamp: new Date().toISOString()
        }
      })
    };
  }
};