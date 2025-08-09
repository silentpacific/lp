// Enhanced Analyze Pulse Function with Universal Data Model
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

    console.log('Analyzing with Universal Data Model:', { mode, selectedTextLength: selectedText.length });

    if (mode === 'full_article_scan') {
      return await analyzeFullArticleWithUniversalModel(articleContent, articleTitle, headers);
    } else {
      return await analyzeSinglePulseWithUniversalModel(selectedText, articleContent, articleTitle, headers);
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
 * Analyze entire article using Universal Data Model
 */
async function analyzeFullArticleWithUniversalModel(articleContent, articleTitle, headers) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are the LivePulse Universal Semantic Engine. Analyze this article and extract facts using the universal data model.

ARTICLE TITLE: "${articleTitle}"
ARTICLE CONTENT: "${articleContent}"

TASK: Extract ALL facts that could change over time and structure them using the universal data model.

UNIVERSAL DATA MODEL:

Fact Structure:
{
  "id": "unique_identifier",
  "kind": "metric|time|subject|qualifier|computed",
  "title": "human-readable label",
  "value": {
    // For metric: {"num": 5.8, "unit": "trillion", "currency": "USD"}
    // For time: {"year": 2024} or {"range": "2021-2024"}
    // For computed: {"abs": "$0.82T", "pct": 16.5, "direction": "up"}
    // For qualifier: {"text": "extraordinary", "intensity": "high"}
    // For subject: {"text": "eCommerce"}
  },
  "subject": "canonical_subject", // e.g. "ecommerce", "bitcoin", "tesla"
  "metric": "canonical_metric", // e.g. "global_sales", "price", "population"
  "geo": "geographic_scope", // e.g. "global", "US", "Adelaide"
  "source": "data_source_name",
  "updates_every": "frequency_text", // e.g. "1 hour", "6 months"
  "confidence": "High|Medium|Low",
  "depends_on": [], // Will be populated during clustering
  "original_text": "exact_text_from_article"
}

Cluster Structure:
{
  "id": "cluster_identifier",
  "title": "Subject — Metric + relation (timeframe)",
  "relation": "comparison|trend|forecast|composition|dependency",
  "members": ["fact_id1", "fact_id2"],
  "primary": "primary_fact_id",
  "summary": "one-line computed takeaway",
  "stale_when": "conditions that force recheck"
}

FACT KIND CLASSIFICATION:
- **metric**: Numbers with units/currency ($4.98 trillion, 25°C, 15%)
- **time**: Years, dates, temporal references (2021, "this year", "recent years")
- **computed**: Changes, comparisons, calculations (up 3.2%, +$0.82T, direction)
- **qualifier**: Descriptive adjectives (extraordinary, significant, massive)
- **subject**: Main entities/topics (eCommerce, Bitcoin, Tesla, companies)

CANONICAL NORMALIZATION:
- Subjects: ecommerce, bitcoin, tesla, apple, amazon, etc.
- Metrics: global_sales, price, market_cap, population, temperature, etc.
- Geography: global, US, Australia, Adelaide, Sydney, etc.

SMART UPDATE FREQUENCIES:
- Financial figures (annual/quarterly): 3-6 months
- Crypto prices: 1 hour
- Stock prices: 1 day  
- Weather: 3 hours
- Population: 1 year
- Year references: 1 year
- Technology versions: 6 months

CLUSTERING RULES:
Create clusters when facts have:
1. Mathematical relationships (price → percentage → direction)
2. Temporal dependencies (current vs historical)
3. Contextual links (same subject+metric, different timeframes)

Return JSON with this exact structure:
{
  "facts": [
    {
      "id": "fact-1",
      "kind": "metric",
      "title": "eCommerce — global online retail sales",
      "value": {"num": 4.98, "unit": "trillion", "currency": "USD"},
      "subject": "ecommerce",
      "metric": "global_online_retail_sales", 
      "geo": "global",
      "source": "Financial Reports API",
      "updates_every": "6 months",
      "confidence": "High",
      "depends_on": [],
      "original_text": "$4.98 trillion"
    }
  ],
  "clusters": [
    {
      "id": "cluster-1",
      "title": "eCommerce — online retail sales growth (2021 → 2024)",
      "relation": "trend",
      "members": ["fact-1", "fact-2", "fact-3"],
      "primary": "fact-2",
      "summary": "ecommerce global sales grew from 4.98T to 5.8T",
      "stale_when": "quarterly financial reports"
    }
  ]
}

CRITICAL: Extract ALL dynamic facts. Find relationships. Create smart clusters. Use canonical naming.`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Clean up response
    responseText = responseText.trim();
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    }

    let analysisData;
    try {
      analysisData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Raw Response:', responseText);
      throw new Error('Could not parse AI response as JSON');
    }

    // Enhance facts with additional processing
    const enhancedFacts = analysisData.facts.map((fact, index) => ({
      ...fact,
      id: fact.id || `fact-${index + 1}`,
      updates_every: fact.updates_every || getSmartUpdateFrequency(fact.kind, fact.subject, fact.original_text),
      source: fact.source || getSmartDataSource(fact.kind, fact.subject, fact.original_text),
      confidence: fact.confidence || 'Medium'
    }));

    // Enhanced clusters with dependency mapping
    const enhancedClusters = analysisData.clusters.map((cluster, index) => {
      const clusterFacts = enhancedFacts.filter(fact => cluster.members.includes(fact.id));
      
      return {
        ...cluster,
        id: cluster.id || `cluster-${index + 1}`,
        facts: clusterFacts,
        primary: cluster.primary || clusterFacts[0]?.id,
        title: cluster.title || generateClusterTitle(clusterFacts),
        summary: cluster.summary || generateClusterSummary(clusterFacts),
        stale_when: cluster.stale_when || 'data source updates'
      };
    });

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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Universal analysis failed'
      }),
    };
  }
}

/**
 * Analyze single selected text using Universal Data Model
 */
async function analyzeSinglePulseWithUniversalModel(selectedText, articleContent, articleTitle, headers) {
  // For now, analyze the full article but focus on the selected text
  // This could be optimized to only analyze the specific selection
  return await analyzeFullArticleWithUniversalModel(articleContent, articleTitle, headers);
}

/**
 * Smart update frequency determination
 */
function getSmartUpdateFrequency(kind, subject, originalText) {
  // Year references
  if (kind === 'time' && /\b(19|20)\d{2}\b/.test(originalText)) {
    return '1 year';
  }
  
  // Quarterly data
  if (/\b(Q[1-4]|quarter|quarterly)\b/i.test(originalText)) {
    return '3 months';
  }
  
  // Financial amounts
  if (kind === 'metric' && /\$[\d,]+(\.\d+)?\s*(billion|trillion|million)/i.test(originalText)) {
    if (/\b(annual|yearly)\b/i.test(originalText)) return '1 year';
    if (/\b(quarterly)\b/i.test(originalText)) return '3 months';
    return '6 months';
  }
  
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
    'ecommerce': '6 months'
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
function getSmartDataSource(kind, subject, originalText) {
  // Crypto sources
  if (['bitcoin', 'ethereum', 'crypto'].includes(subject) || /bitcoin|ethereum|crypto/i.test(originalText)) {
    return 'CoinGecko API';
  }
  
  // Stock sources
  if (['tesla', 'apple', 'amazon', 'google', 'microsoft'].includes(subject) || /stock|shares|NYSE|NASDAQ/i.test(originalText)) {
    return 'Alpha Vantage API';
  }
  
  // Weather sources
  if (subject === 'weather' || /°[CF]|degrees|temperature|weather/i.test(originalText)) {
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
  
  // Population data
  if (subject === 'population' || /population|residents|people/i.test(originalText)) {
    return 'Census Bureau API';
  }
  
  // eCommerce data
  if (subject === 'ecommerce' || /ecommerce|e-commerce|online.*sales/i.test(originalText)) {
    return 'Financial Reports API';
  }
  
  return 'Manual Research';
}

/**
 * Generate cluster title from facts
 */
function generateClusterTitle(facts) {
  if (!facts.length) return 'Unknown Cluster';
  
  const primaryFact = facts[0];
  const timeRefs = facts.filter(f => f.kind === 'time').map(f => f.value.year || f.value.range);
  
  if (timeRefs.length > 1) {
    const years = timeRefs.filter(t => !isNaN(t)).sort();
    const timeRange = years.length > 1 ? ` (${years[0]} → ${years[years.length - 1]})` : '';
    return `${capitalize(primaryFact.subject)} — ${primaryFact.metric}${timeRange}`;
  }
  
  return `${capitalize(primaryFact.subject)} — ${primaryFact.metric}`;
}

/**
 * Generate cluster summary from facts
 */
function generateClusterSummary(facts) {
  if (!facts.length) return 'Related data points';
  
  const metricFacts = facts.filter(f => f.kind === 'metric');
  const computedFacts = facts.filter(f => f.kind === 'computed');
  
  if (metricFacts.length >= 2) {
    const latest = metricFacts[metricFacts.length - 1];
    const earliest = metricFacts[0];
    return `${latest.subject} ${latest.metric} data with ${metricFacts.length} related values`;
  }
  
  if (computedFacts.length > 0) {
    const change = computedFacts[0];
    return `${change.subject} showing ${change.value.direction || 'change'} trend`;
  }
  
  return `Related ${facts[0].subject} data points`;
}

/**
 * Utility function to capitalize strings
 */
function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}