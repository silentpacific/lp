// Server-side demo data endpoint with REAL API integration
// netlify/functions/demo-data.js

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
    console.log('Fetching REAL demo data from APIs...');

    // Fetch real data for all demos in parallel
    const [teslaData, weatherData, bitcoinData] = await Promise.allSettled([
      fetchRealTeslaData(),
      fetchRealWeatherData(),
      fetchRealBitcoinData()
    ]);

    const demos = {
      tesla: teslaData.status === 'fulfilled' ? teslaData.value : getFallbackTesla(),
      weather: weatherData.status === 'fulfilled' ? weatherData.value : getFallbackWeather(),
      bitcoin: bitcoinData.status === 'fulfilled' ? bitcoinData.value : getFallbackBitcoin(),
      lastUpdated: new Date().toISOString(),
      dataSource: 'real_apis'
    };

    // Log what happened
    const successCount = [teslaData, weatherData, bitcoinData].filter(d => d.status === 'fulfilled').length;
    console.log(`Successfully fetched ${successCount}/3 real data sources`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        demos,
        generatedAt: new Date().toISOString(),
        realDataSources: successCount,
        fallbackUsed: successCount < 3
      }),
    };

  } catch (error) {
    console.error('Demo data generation error:', error);
    
    return {
      statusCode: 200, // Return 200 with fallback data
      headers,
      body: JSON.stringify({
        success: true,
        demos: {
          tesla: getFallbackTesla(),
          weather: getFallbackWeather(),
          bitcoin: getFallbackBitcoin(),
          lastUpdated: new Date().toISOString(),
          dataSource: 'fallback'
        },
        fallback: true,
        error: error.message,
        generatedAt: new Date().toISOString()
      }),
    };
  }
};

/**
 * Fetch real Tesla stock data using Alpha Vantage API
 * You can also use Yahoo Finance, IEX Cloud, or Polygon.io
 */
async function fetchRealTeslaData() {
  try {
    // Using Alpha Vantage API (free tier available)
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!API_KEY) {
      console.log('No Alpha Vantage API key, trying alternative...');
      return await fetchTeslaFromYahooFinance();
    }

    const response = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=TSLA&apikey=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }

    const data = await response.json();
    const quote = data['Global Quote'];
    
    if (!quote || !quote['05. price']) {
      throw new Error('Invalid Alpha Vantage response format');
    }

    const currentPrice = parseFloat(quote['05. price']);
    const previousClose = parseFloat(quote['08. previous close']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    const direction = changePercent >= 0 ? 'up' : 'down';
    
    const content = `Tesla shares closed at <span class="live-highlight">$${currentPrice.toFixed(2)}</span> on Friday, <span class="live-highlight">${direction} ${Math.abs(changePercent).toFixed(1)}%</span> from Thursday's close of <span class="live-highlight">$${previousClose.toFixed(2)}</span>. The electric vehicle manufacturer continues to navigate market volatility amid earnings expectations.`;
    
    return {
      content,
      metadata: {
        currentPrice: currentPrice.toFixed(2),
        direction,
        percentChange: Math.abs(changePercent).toFixed(1),
        previousPrice: previousClose.toFixed(2),
        source: 'Alpha Vantage API',
        lastUpdate: new Date().toISOString(),
        symbol: 'TSLA'
      }
    };

  } catch (error) {
    console.error('Alpha Vantage Tesla fetch failed:', error);
    // Try Yahoo Finance as backup
    return await fetchTeslaFromYahooFinance();
  }
}

/**
 * Backup Tesla data from Yahoo Finance (no API key required)
 */
async function fetchTeslaFromYahooFinance() {
  try {
    // Yahoo Finance query API (unofficial but widely used)
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/TSLA?range=2d&interval=1d'
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data.chart.result[0];
    
    if (!result || !result.meta || !result.indicators) {
      throw new Error('Invalid Yahoo Finance response');
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const changePercent = ((currentPrice - previousClose) / previousClose) * 100;
    const direction = changePercent >= 0 ? 'up' : 'down';
    
    const content = `Tesla shares closed at <span class="live-highlight">$${currentPrice.toFixed(2)}</span> on Friday, <span class="live-highlight">${direction} ${Math.abs(changePercent).toFixed(1)}%</span> from Thursday's close of <span class="live-highlight">$${previousClose.toFixed(2)}</span>. The electric vehicle manufacturer continues to navigate market volatility amid earnings expectations.`;
    
    return {
      content,
      metadata: {
        currentPrice: currentPrice.toFixed(2),
        direction,
        percentChange: Math.abs(changePercent).toFixed(1),
        previousPrice: previousClose.toFixed(2),
        source: 'Yahoo Finance API',
        lastUpdate: new Date().toISOString(),
        symbol: 'TSLA'
      }
    };

  } catch (error) {
    console.error('Yahoo Finance Tesla fetch failed:', error);
    throw error;
  }
}

/**
 * Fetch real weather data for Adelaide using completely FREE APIs (no signup required)
 */
async function fetchRealWeatherData() {
  try {
    // First try: Open-Meteo API (completely free, no API key, no signup)
    return await fetchWeatherFromOpenMeteo();
  } catch (error) {
    console.error('Open-Meteo weather fetch failed:', error);
    
    try {
      // Backup: WeatherAPI.com free tier (no signup for basic data)
      return await fetchWeatherFromWeatherAPI();
    } catch (backupError) {
      console.error('WeatherAPI backup failed:', backupError);
      throw backupError;
    }
  }
}

/**
 * Fetch weather from Open-Meteo (completely free, no signup, no API key)
 */
async function fetchWeatherFromOpenMeteo() {
  try {
    // Adelaide coordinates
    const lat = -34.9285;
    const lon = 138.6007;
    
    // Get current weather
    const currentResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&timezone=Australia/Adelaide`
    );

    if (!currentResponse.ok) {
      throw new Error(`Open-Meteo current API error: ${currentResponse.status}`);
    }

    const currentData = await currentResponse.json();
    
    // Get yesterday's weather for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const historicalResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&start_date=${yesterdayStr}&end_date=${yesterdayStr}&daily=temperature_2m_max&timezone=Australia/Adelaide`
    );

    let yesterdayTemp = 19; // fallback
    if (historicalResponse.ok) {
      const historicalData = await historicalResponse.json();
      if (historicalData.daily && historicalData.daily.temperature_2m_max && historicalData.daily.temperature_2m_max[0]) {
        yesterdayTemp = Math.round(historicalData.daily.temperature_2m_max[0]);
      }
    }

    const currentTemp = Math.round(currentData.current_weather.temperature);
    const windSpeed = currentData.current_weather.windspeed;
    
    // Map weather codes to descriptions
    const weatherCodes = {
      0: 'clear skies',
      1: 'mainly clear',
      2: 'partly cloudy',
      3: 'overcast',
      45: 'foggy',
      48: 'foggy',
      51: 'light drizzle',
      53: 'moderate drizzle',
      55: 'dense drizzle',
      61: 'slight rain',
      63: 'moderate rain',
      65: 'heavy rain',
      80: 'rain showers',
      95: 'thunderstorm'
    };
    
    const condition = weatherCodes[currentData.current_weather.weathercode] || 'partly cloudy';
    const difference = currentTemp - yesterdayTemp;
    
    const comparison = difference > 0 
      ? `${Math.abs(difference)} degrees warmer`
      : difference < 0 
      ? `${Math.abs(difference)} degrees cooler`
      : 'the same temperature';
    
    const content = `Adelaide is experiencing <span class="live-highlight">${condition} at ${currentTemp}°C</span> today, which is <span class="live-highlight">${comparison}</span> than yesterday's high of <span class="live-highlight">${yesterdayTemp}°C</span>. Perfect conditions for the weekend markets downtown.`;
    
    return {
      content,
      metadata: {
        currentTemp,
        condition,
        comparison,
        yesterdayTemp,
        windSpeed: windSpeed,
        source: 'Open-Meteo API (Free)',
        lastUpdate: new Date().toISOString(),
        city: 'Adelaide'
      }
    };

  } catch (error) {
    console.error('Open-Meteo fetch failed:', error);
    throw error;
  }
}

/**
 * Backup weather from WeatherAPI.com free tier (no signup for basic current weather)
 */
async function fetchWeatherFromWeatherAPI() {
  try {
    // WeatherAPI.com provides limited free access without API key for current weather
    // Note: This is a fallback and may have limitations
    const response = await fetch(
      'https://wttr.in/Adelaide?format=j1'
    );

    if (!response.ok) {
      throw new Error(`wttr.in API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.current_condition || !data.current_condition[0]) {
      throw new Error('Invalid wttr.in response format');
    }

    const current = data.current_condition[0];
    const currentTemp = Math.round(parseFloat(current.temp_C));
    const condition = current.weatherDesc[0].value.toLowerCase();
    
    // Get yesterday's temp from weather history if available
    let yesterdayTemp = 19; // fallback
    if (data.weather && data.weather.length > 1) {
      yesterdayTemp = Math.round(parseFloat(data.weather[1].maxtempC));
    }
    
    const difference = currentTemp - yesterdayTemp;
    
    const comparison = difference > 0 
      ? `${Math.abs(difference)} degrees warmer`
      : difference < 0 
      ? `${Math.abs(difference)} degrees cooler`
      : 'the same temperature';
    
    const content = `Adelaide is experiencing <span class="live-highlight">${condition} at ${currentTemp}°C</span> today, which is <span class="live-highlight">${comparison}</span> than yesterday's high of <span class="live-highlight">${yesterdayTemp}°C</span>. Perfect conditions for the weekend markets downtown.`;
    
    return {
      content,
      metadata: {
        currentTemp,
        condition,
        comparison,
        yesterdayTemp,
        humidity: current.humidity,
        windSpeed: parseFloat(current.windspeedKmph),
        source: 'wttr.in API (Free)',
        lastUpdate: new Date().toISOString(),
        city: 'Adelaide'
      }
    };

  } catch (error) {
    console.error('wttr.in fetch failed:', error);
    throw error;
  }
}

/**
 * Fetch real Bitcoin data using CoinGecko API (free, no API key required)
 */
async function fetchRealBitcoinData() {
  try {
    // CoinGecko free API - no authentication required
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true'
    );

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const bitcoin = data.bitcoin;
    
    if (!bitcoin || typeof bitcoin.usd !== 'number') {
      throw new Error('Invalid CoinGecko response format');
    }

    const currentPrice = Math.round(bitcoin.usd);
    const change24h = bitcoin.usd_24h_change;
    
    let trend;
    if (change24h > 5) trend = 'strong bullish momentum';
    else if (change24h > 1) trend = 'positive momentum';
    else if (change24h > -1) trend = 'sideways movement';
    else if (change24h > -4) trend = 'downward pressure';
    else trend = 'bearish sentiment';
    
    const changeText = `${Math.abs(change24h).toFixed(1)}% ${change24h >= 0 ? 'gain' : 'loss'}`;
    
    const content = `Bitcoin is trading at <span class="live-highlight">$${currentPrice.toLocaleString()}</span> as of this morning, showing <span class="live-highlight">${trend}</span> with a <span class="live-highlight">${changeText}</span> over the past 24 hours. Institutional adoption continues to drive market sentiment.`;
    
    return {
      content,
      metadata: {
        currentPrice: currentPrice.toLocaleString(),
        trend,
        changeText,
        rawChange: change24h,
        marketCap: bitcoin.usd_market_cap,
        source: 'CoinGecko API',
        lastUpdate: new Date().toISOString(),
        symbol: 'BTC'
      }
    };

  } catch (error) {
    console.error('CoinGecko Bitcoin fetch failed:', error);
    throw error;
  }
}

/**
 * Fallback data generators (used when APIs fail)
 */
function getFallbackTesla() {
  // Use realistic but static fallback data
  const prices = [267.45, 251.33, 289.76, 243.22, 278.90];
  const currentPrice = prices[Math.floor(Math.random() * prices.length)];
  const previousPrice = 248.50;
  const change = ((currentPrice - previousPrice) / previousPrice) * 100;
  const direction = change >= 0 ? 'up' : 'down';
  
  return {
    content: `Tesla shares closed at <span class="live-highlight">$${currentPrice}</span> on Friday, <span class="live-highlight">${direction} ${Math.abs(change).toFixed(1)}%</span> from Thursday's close of <span class="live-highlight">$${previousPrice}</span>. The electric vehicle manufacturer continues to navigate market volatility amid earnings expectations.`,
    metadata: {
      currentPrice: currentPrice.toString(),
      direction,
      percentChange: Math.abs(change).toFixed(1),
      previousPrice: previousPrice.toString(),
      source: 'Fallback data (APIs unavailable)',
      lastUpdate: new Date().toISOString()
    }
  };
}

function getFallbackWeather() {
  const conditions = ['partly cloudy', 'sunny', 'clear skies', 'mild conditions'];
  const temps = [18, 22, 25, 19, 21];
  const currentTemp = temps[Math.floor(Math.random() * temps.length)];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const yesterdayTemp = 19;
  const difference = currentTemp - yesterdayTemp;
  
  const comparison = difference > 0 
    ? `${Math.abs(difference)} degrees warmer`
    : difference < 0 
    ? `${Math.abs(difference)} degrees cooler`
    : 'the same temperature';
  
  return {
    content: `Adelaide is experiencing <span class="live-highlight">${condition} at ${currentTemp}°C</span> today, which is <span class="live-highlight">${comparison}</span> than yesterday's high of <span class="live-highlight">${yesterdayTemp}°C</span>. Perfect conditions for the weekend markets downtown.`,
    metadata: {
      currentTemp,
      condition,
      comparison,
      yesterdayTemp,
      source: 'Fallback data (APIs unavailable)',
      lastUpdate: new Date().toISOString()
    }
  };
}

function getFallbackBitcoin() {
  const prices = [72340, 68250, 75120, 69800, 71500];
  const changes = [7.3, -2.1, 4.8, -1.2, 3.5];
  const currentPrice = prices[Math.floor(Math.random() * prices.length)];
  const change24h = changes[Math.floor(Math.random() * changes.length)];
  
  let trend;
  if (change24h > 5) trend = 'strong bullish momentum';
  else if (change24h > 1) trend = 'positive momentum';
  else if (change24h > -1) trend = 'sideways movement';
  else trend = 'downward pressure';
  
  const changeText = `${Math.abs(change24h).toFixed(1)}% ${change24h >= 0 ? 'gain' : 'loss'}`;
  
  return {
    content: `Bitcoin is trading at <span class="live-highlight">$${currentPrice.toLocaleString()}</span> as of this morning, showing <span class="live-highlight">${trend}</span> with a <span class="live-highlight">${changeText}</span> over the past 24 hours. Institutional adoption continues to drive market sentiment.`,
    metadata: {
      currentPrice: currentPrice.toLocaleString(),
      trend,
      changeText,
      rawChange: change24h,
      source: 'Fallback data (APIs unavailable)',
      lastUpdate: new Date().toISOString()
    }
  };
}