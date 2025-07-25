// Get real Bitcoin price from CoinGecko API
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
    // CoinGecko free API - no auth required
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true');
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data.bitcoin.usd;
    const change24h = data.bitcoin.usd_24h_change;

    // Format price nicely
    const formattedPrice = `$${price.toLocaleString()}`;
    const trend = change24h > 0 ? 'rising' : change24h < 0 ? 'falling' : 'stable';
    const changePercent = Math.abs(change24h).toFixed(1);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: {
          price: formattedPrice,
          rawPrice: price,
          trend,
          change24h: changePercent,
          source: 'CoinGecko',
          timestamp: new Date().toISOString(),
          contextualDescription: `${formattedPrice} (${trend} ${changePercent}% in 24h)`
        }
      })
    };

  } catch (error) {
    console.error('Bitcoin API error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        fallback: {
          price: '$67,500',
          source: 'Fallback data',
          timestamp: new Date().toISOString()
        }
      })
    };
  }
};