// Robust Analyze Pulse Function with Universal Data Model and Error Handling
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

    console.log('Universal Engine Analysis:', { 
      mode, 
      selectedTextLength: selectedText.length,
      hasGeminiKey: !!process.env.GEMINI_API_KEY 
    });

    // Check if Gemini API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.log('No Gemini API key - using fallback analysis');
      return await fallbackAnalysis(selectedText, articleContent, articleTitle, headers);
    }

    if (mode === 'full_article_scan') {
      return await analyzeFullArticleWithUniversalModel(articleContent, articleTitle, headers);
    } else {
      return await analyzeSinglePulseWithUniversalModel(selectedText, articleContent, articleTitle, headers);
    }

  } catch (error) {
    console.error('Error analyzing pulse:', error);
    
    // Try fallback analysis if main analysis fails
    try {
      const { selectedText, articleContent, articleTitle } = JSON.parse(event.body);
      console.log('Main analysis failed, trying fallback...');
      return await fallbackAnalysis(selectedText, articleContent, articleTitle, headers);
    } catch (fallbackError) {
      console.error('Fallback analysis also failed:', fallbackError);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: error.message || 'Failed to analyze pulse',
          fallbackError: fallbackError.message,
          details: 'Both main and fallback analysis failed'
        }),
      };
    }
  }
};

/**
 * Fallback analysis using simple pattern matching when AI fails
 */
async function fallbackAnalysis(selectedText, articleContent, articleTitle, headers) {
  console.log('Running fallback pattern-based analysis...');
  
  try {
    const facts = [];
    const clusters = [];
    
    // Simple pattern matching for common fact types
    const patterns = [
      // Currency amounts
      {
        regex: /\$[\d,]+(?:\.\d+)?\s*(?:billion|trillion|million|thousand)?/gi,
        kind: 'metric',
        subject: 'financial',
        metric: 'currency_amount',
        source: 'Financial Reports API',
        updates_every: '6 months',
        confidence: 'Medium'
      },
      // Years
      {
        regex: /\b(19|20)\d{2}\b/g,
        kind: 'time',
        subject: 'general',
        metric: 'year_reference',
        source: 'System Date',
        updates_every: '1 year',
        confidence: 'High'
      },
      // Percentages
      {
        regex: /\d+(?:\.\d+)?%/g,
        kind: 'computed',
        subject: 'general',
        metric: 'percentage',
        source: 'Calculated Value',
        updates_every: '1 day',
        confidence: 'Medium'
      },
      // Temperatures
      {
        regex: /\d+(?:\.\d+)?°[CF]?/g,
        kind: 'metric',
        subject: 'weather',
        metric: 'temperature',
        source: 'OpenWeatherMap API',
        updates_every: '3 hours',
        confidence: 'Medium'
      },
      // Crypto mentions
      {
        regex: /bitcoin|btc|ethereum|eth|crypto/gi,
        kind: 'subject',
        subject: 'crypto',
        metric: 'mention',
        source: 'CoinGecko API',
        updates_every: '1 hour',
        confidence: 'Low'
      }
    ];
    
    let factId = 1;
    
    patterns.forEach(pattern => {
      const matches = articleContent.match(pattern.regex);
      if (matches) {
        matches.forEach(match => {
          const fact = {
            id: `fact-${factId++}`,
            kind: pattern.kind,
            title: `${capitalize(pattern.subject)} — ${pattern.metric}`,
            value: createValueObject(pattern.kind, match),
            subject: pattern.subject,
            metric: pattern.metric,
            geo: 'unspecified',
            source: pattern.source,
            updates_every: pattern.updates_every,
            confidence: pattern.confidence,
            depends_on: [],
            original_text: match
          };
          facts.push(fact);
        });
      }
    });
    
    // Create simple clusters for related facts
    const factsBySubject = {};
    facts.forEach(fact => {
      if (!factsBySubject[fact.subject]) {
        factsBySubject[fact.subject] = [];
      }
      factsBySubject[fact.subject].push(fact);
    });
    
    Object.entries(factsBySubject).forEach(([subject, subjectFacts], index) => {
      if (subjectFacts.length > 1) {
        clusters.push({
          id: `cluster-${index + 1}`,
          title: `${capitalize(subject)} — related data points`,
          relation: 'composition',
          members: subjectFacts.map(f => f.id),
          primary: subjectFacts[0].id,
          facts: subjectFacts,
          summary: `${subjectFacts.length} related ${subject} facts`,
          stale_when: 'data source updates'
        });
      }
    });
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis: {
          facts: facts,
          clusters: clusters,
          totalFacts: facts.length,
          totalClusters: clusters.length
        },
        mode: 'fallback_analysis',
        totalFound: facts.length,
        universalDataModel: true,
        fallback: true,
        timestamp: new Date().toISOString()
      }),
    };
    
  } catch (error) {
    console.error('Fallback analysis error:', error);
    throw new Error(`Fallback analysis failed: ${error.message}`);
  }
}

/**
 * Create value object based on fact kind
 */
function createValueObject(kind, text) {
  switch (kind) {
    case 'metric':
      if (text.includes('$')) {
        const num = parseFloat(text.replace(/[$,]/g, ''));
        const unit = text.match(/(billion|trillion|million|thousand)/i)?.[0] || '';
        return { num, unit, currency: 'USD' };
      } else if (text.includes('°')) {
        const num = parseFloat(text);
        return { num, unit: '°C', currency: null };
      } else if (text.includes('%')) {
        const num = parseFloat(text);
        return { num, unit: '%', currency: null };
      }
      return { num: parseFloat(text) || 0, unit: '', currency: null };
    
    case 'time':
      const year = parseInt(text);
      if (year && year > 1900 && year < 2100) {
        return { year };
      }
      return { text };
    
    case 'computed':
      if (text.includes('%')) {
        return { pct: parseFloat(text), direction: 'neutral', abs: null };
      }
      return { text };
    
    default:
      return { text };
  }
}

/**
 * Analyze entire article using Universal Data Model with enhanced error handling
 */
async function analyzeFullArticleWithUniversalModel(articleContent, articleTitle, headers) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 3000, // Reduced from 4000 to be safer
      },
    });

    // Truncate content if too long to avoid token limits
    const maxContentLength = 2000;
    const truncatedContent = articleContent.length > maxContentLength 
      ? articleContent.substring(0, maxContentLength) + '...'
      : articleContent;

    const prompt = `You are the LivePulse Universal Semantic Engine. Analyze this article and extract facts using the universal data model.

ARTICLE TITLE: "${articleTitle}"
ARTICLE CONTENT: "${truncatedContent}"

Extract ALL facts that could change over time and structure them using the universal data model.

FACT STRUCTURE - Return facts with this exact structure:
{
  "id": "fact-1",
  "kind": "metric|time|subject|qualifier|computed",
  "title": "Subject — Metric description",
  "value": {
    // For metric: {"num": 5.8, "unit": "trillion", "currency": "USD"}
    // For time: {"year": 2024} or {"text": "recent years"}
    // For computed: {"pct": 16.5, "direction": "up", "abs": "$0.82T"}
    // For qualifier: {"text": "extraordinary", "intensity": "high"}
    // For subject: {"text": "eCommerce"}
  },
  "subject": "ecommerce", // canonical: ecommerce, bitcoin, tesla, weather, etc
  "metric": "global_sales", // canonical: price, sales, temperature, etc
  "geo": "global", // global, US, Australia, city names
  "source": "Financial Reports API",
  "updates_every": "6 months",
  "confidence": "High",
  "original_text": "exact text from article"
}

FACT KINDS:
- metric: Numbers with units ($4.98 trillion, 25°C, 15%)
- time: Years, dates (2021, "this year", "recent years")  
- computed: Changes, comparisons (up 3.2%, direction)
- qualifier: Descriptive words (extraordinary, significant)
- subject: Main entities (eCommerce, Bitcoin, Tesla)

SMART UPDATE FREQUENCIES:
- Crypto: "1 hour"
- Stocks: "1 day"
- Weather: "3 hours"
- Years: "1 year"
- Financial data: "6 months"

Return ONLY valid JSON with this structure (no other text):
{
  "facts": [array of fact objects],
  "clusters": [array of cluster objects - can be empty for now]
}

IMPORTANT: Your response must be ONLY the JSON object above. Do not include any explanatory text, markdown formatting, or code blocks. Start directly with { and end with }.

Focus on finding clear, quantifiable facts. Be conservative - only extract obvious dynamic facts.`;

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

    let analysisData;
    try {
      analysisData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw Response Length:', responseText.length);
      console.error('Raw Response Preview:', responseText.substring(0, 200));
      
      // Try to find JSON within the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          console.log('Attempting to parse extracted JSON...');
          analysisData = JSON.parse(jsonMatch[0]);
          console.log('Successfully parsed extracted JSON');
        } catch (retryError) {
          console.error('Retry parse failed:', retryError);
          throw new Error('Could not parse AI response as JSON after extraction attempt');
        }
      } else {
        console.error('No JSON structure found in response');
        throw new Error('No valid JSON found in AI response');
      }
    }

    // Validate and enhance the response
    if (!analysisData.facts) {
      analysisData.facts = [];
    }
    if (!analysisData.clusters) {
      analysisData.clusters = [];
    }

    // Enhance facts with additional processing
    const enhancedFacts = analysisData.facts.map((fact, index) => ({
      id: fact.id || `fact-${index + 1}`,
      kind: fact.kind || 'metric',
      title: fact.title || `Unknown Fact ${index + 1}`,
      value: fact.value || { text: fact.original_text || 'Unknown' },
      subject: fact.subject || 'general',
      metric: fact.metric || 'value',
      geo: fact.geo || 'unspecified',
      source: fact.source || getSmartDataSource(fact.kind, fact.subject, fact.original_text),
      updates_every: fact.updates_every || getSmartUpdateFrequency(fact.kind, fact.subject, fact.original_text),
      confidence: fact.confidence || 'Medium',
      depends_on: fact.depends_on || [],
      original_text: fact.original_text || fact.title || 'Unknown text'
    }));

    // Simple clustering for enhanced facts
    const enhancedClusters = createSimpleClusters(enhancedFacts);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        analysis: {
          facts: enhancedFacts,
          clusters: enhancedClusters,
          totalFacts: enhancedFacts.length,
          totalClusters: enhancedClusters.length
        },
        mode: 'full_article_scan',
        totalFound: enhancedFacts.length,
        universalDataModel: true,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('Universal model analysis error:', error);
    
    // If AI analysis fails, try fallback
    console.log('AI analysis failed, trying fallback analysis...');
    throw error; // This will trigger the fallback in the main handler
  }
}

/**
 * Create simple clusters from facts
 */
function createSimpleClusters(facts) {
  const clusters = [];
  const factsBySubject = {};
  
  // Group facts by subject
  facts.forEach(fact => {
    if (!factsBySubject[fact.subject]) {
      factsBySubject[fact.subject] = [];
    }
    factsBySubject[fact.subject].push(fact);
  });
  
  // Create clusters for subjects with multiple facts
  Object.entries(factsBySubject).forEach(([subject, subjectFacts], index) => {
    if (subjectFacts.length > 1) {
      clusters.push({
        id: `cluster-${index + 1}`,
        title: `${capitalize(subject)} — related data points`,
        relation: 'composition',
        members: subjectFacts.map(f => f.id),
        primary: subjectFacts[0].id,
        facts: subjectFacts,
        summary: `${subjectFacts.length} related ${subject} facts`,
        stale_when: 'data source updates'
      });
    }
  });
  
  return clusters;
}

/**
 * Analyze single selected text (simplified for now)
 */
async function analyzeSinglePulseWithUniversalModel(selectedText, articleContent, articleTitle, headers) {
  // For now, just analyze the full article but could be optimized
  return await analyzeFullArticleWithUniversalModel(articleContent, articleTitle, headers);
}

/**
 * Smart update frequency determination
 */
function getSmartUpdateFrequency(kind, subject, originalText) {
  // Subject-based frequencies
  const subjectFrequencies = {
    'bitcoin': '1 hour',
    'ethereum': '1 hour', 
    'crypto': '1 hour',
    'tesla': '1 day',
    'apple': '1 day',
    'stock': '1 day',
    'weather': '3 hours',
    'population': '1 year',
    'ecommerce': '6 months',
    'financial': '6 months'
  };
  
  if (subjectFrequencies[subject]) {
    return subjectFrequencies[subject];
  }
  
  // Kind-based defaults
  const kindDefaults = {
    'metric': '1 day',
    'time': '1 day', 
    'computed': '1 day',
    'qualifier': '1 week',
    'subject': '1 month'
  };
  
  return kindDefaults[kind] || '1 day';
}

/**
 * Smart data source assignment
 */
function getSmartDataSource(kind, subject, originalText = '') {
  // Crypto sources
  if (['bitcoin', 'ethereum', 'crypto'].includes(subject) || /bitcoin|ethereum|crypto/i.test(originalText)) {
    return 'CoinGecko API';
  }
  
  // Stock sources
  if (['tesla', 'apple', 'amazon', 'google', 'microsoft'].includes(subject) || /stock|shares/i.test(originalText)) {
    return 'Alpha Vantage API';
  }
  
  // Weather sources
  if (subject === 'weather' || /°[CF]|degrees|temperature/i.test(originalText)) {
    return 'OpenWeatherMap API';
  }
  
  // Date/time sources
  if (kind === 'time' || /\b(19|20)\d{2}\b/.test(originalText)) {
    return 'System Date';
  }
  
  // Financial data
  if (/\$[\d,]+(\.\d+)?\s*(billion|trillion|million)/i.test(originalText)) {
    return 'Financial Reports API';
  }
  
  return 'Manual Research';
}

/**
 * Utility function to capitalize strings
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}