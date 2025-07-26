// Universal Analyze Pulse with Semantic Cluster Detection
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
      // Scan entire article for multiple pulse points and clusters
      return await analyzeFullArticle(articleContent, articleTitle, headers);
    } else {
      // Analyze single selected text for pulse point and relationships
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
 * Analyze a single selected text for pulse points and semantic relationships
 */
async function analyzeSinglePulse(selectedText, articleContent, articleTitle, headers) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.1, // Low temperature for precise analysis
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 1500,
      responseMimeType: "application/json",
    },
  });

  const smartAnalysisPrompt = `You are a precision content analyzer for the LivePulse semantic engine. Your job is to analyze selected text and identify:
1. The exact dynamic part that should update
2. Any related data points that must update together (semantic clusters)
3. Mathematical or logical relationships between data points

SELECTED TEXT: "${selectedText}"
ARTICLE TITLE: "${articleTitle || 'Unknown'}"
ARTICLE CONTEXT: "${articleContent.substring(0, 1000)}..."

TASK: Identify the smallest possible dynamic part AND any related data points that must update as a cluster.

EXAMPLES OF SEMANTIC CLUSTERS:

Example 1 - Financial Cluster:
Selected: "Tesla shares closed at $248.50 on Friday, down 3.2% from Thursday's close of $257.75"
Analysis: THREE related pulse points that must update together:
- Primary: "$248.50" (current price)
- Dependent: "3.2%" (calculated from price change)  
- Dependent: "down" (direction based on price comparison)
- Reference: "$257.75" (previous close - static until next trading day)

Example 2 - Weather Comparison Cluster:
Selected: "Adelaide is experiencing sunny weather with 25°C, a pleasant 5 degrees warmer than yesterday's 20°C"
Analysis: THREE related pulse points:
- Primary: "25°C" (current temperature)
- Dependent: "5 degrees warmer" (calculated difference)
- Dependent: "pleasant" (descriptor based on comparison)
- Reference: "20°C" (yesterday's temp - updates daily)

Example 3 - Simple Single Pulse:
Selected: "Bitcoin is currently trading at $67,500"
Analysis: ONE pulse point:
- Single: "$67,500" (no mathematical relationships to other data)

ANALYSIS INSTRUCTIONS:
1. Extract surrounding sentences (2-3 sentences before and after)
2. Identify the full paragraph containing the selected text
3. Determine if this is a single pulse or part of a semantic cluster
4. If cluster: identify all related data points and their relationships
5. Specify mathematical/logical rules for dependent calculations

Return JSON with this exact structure:

{
  "analysisType": "single_pulse|semantic_cluster",
  "pulsePoints": [
    {
      "dynamicPart": "the exact text that updates",
      "staticPrefix": "text before dynamic part",
      "staticSuffix": "text after dynamic part", 
      "fullSelection": "complete original selected text",
      "pulseType": "crypto|weather|population|stock|date|sports|news|technology|other",
      "specificType": "detailed identifier like 'crypto:btc:price'",
      "role": "primary|dependent|reference",
      "updateFrequency": 60,
      "reasoning": "why this should update at this frequency",
      "dataSource": "where to get updated data",
      "confidence": "high|medium|low",
      "action": "associated verb (fell, rose, increased)",
      "subject": "what this relates to (Tesla stock, weather)",
      "emotion": "emotional context if present",
      "entity": "who/what is affected",
      "sentence": "complete sentence containing this pulse",
      "surroundingText": "2-3 sentences before and after for context",
      "paragraph": "full paragraph containing this pulse"
    }
  ],
  "semanticCluster": {
    "clusterId": "unique identifier if this is a cluster",
    "clusterName": "descriptive name like 'Tesla Stock Price Movement'",
    "clusterType": "mathematical|temporal|comparative|descriptive",
    "primaryPulseIndex": 0,
    "relationships": [
      {
        "sourcePulseIndex": 0,
        "targetPulseIndex": 1,
        "relationshipType": "percentage_change|direction|comparison|reference_point",
        "calculationRule": "specific mathematical or logical rule",
        "dependencyOrder": 1
      }
    ],
    "semanticRule": "natural language explanation of relationships"
  },
  "contextAnalysis": {
    "articleThemes": ["main topics covered in article"],
    "contentCategory": "factual|opinion|descriptive|comparative",
    "updatePriority": "critical|important|moderate|low",
    "temporalReferences": ["time-related phrases found"],
    "comparativeElements": ["comparative phrases found"]
  }
}

FREQUENCY GUIDELINES:
- Financial markets: 60-240 minutes (1-4 hours)
- Crypto prices: 60-120 minutes (1-2 hours)  
- Weather: 180-360 minutes (3-6 hours)
- Sports scores: 60-1440 minutes (1 hour to 1 day)
- Population/demographics: 43200-525600 minutes (monthly to yearly)
- Date references: 1440 minutes (daily)

RELATIONSHIP TYPES:
- percentage_change: Target calculates percentage from source values
- direction: Target determines up/down/stable from source comparison  
- comparison: Target describes relative difference (warmer/cooler, higher/lower)
- reference_point: Source provides baseline for calculations
- calculation: Target derives value through mathematical formula

Be extremely precise about text boundaries and mathematical relationships.`;

  const result = await model.generateContent(smartAnalysisPrompt);
  const responseText = result.response.text();

  let analysis;
  try {
    analysis = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', responseText);
    throw new Error('Could not parse AI response as JSON');
  }

  // Validate the analysis
  if (!analysis.pulsePoints || !Array.isArray(analysis.pulsePoints) || analysis.pulsePoints.length === 0) {
    throw new Error('No pulse points identified in analysis');
  }

  // Validate each pulse point
  for (const pulse of analysis.pulsePoints) {
    const requiredFields = ['dynamicPart', 'pulseType', 'specificType', 'updateFrequency'];
    for (const field of requiredFields) {
      if (!pulse[field]) {
        throw new Error(`Missing required field: ${field} in pulse point`);
      }
    }
    
    // Ensure updateFrequency is reasonable
    pulse.updateFrequency = Math.max(15, Math.min(525600, parseInt(pulse.updateFrequency)));
  }

  // Add metadata
  analysis.metadata = {
    analyzedAt: new Date().toISOString(),
    articleTitle: articleTitle,
    analysisVersion: '3.0-semantic-clusters',
    selectedTextLength: selectedText.length,
    articleLength: articleContent.length,
    mode: 'single_pulse'
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      analysis,
      selectedText,
      rawResponse: responseText
    }),
  };
}

/**
 * Analyze entire article for multiple pulse points and clusters
 */
async function analyzeFullArticle(articleContent, articleTitle, headers) {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2000,
      responseMimeType: "application/json",
    },
  });

  const fullArticlePrompt = `You are analyzing an entire article to identify ALL potential pulse points and semantic clusters.

ARTICLE TITLE: "${articleTitle || 'Unknown'}"
ARTICLE CONTENT: "${articleContent}"

TASK: Scan the entire article and identify:
1. All dynamic facts that could benefit from automatic updates
2. Related facts that form semantic clusters
3. Priority ranking for each pulse point

Look for these content types:
- Numbers that change over time (prices, statistics, counts)
- Dates and temporal references  
- Comparative statements with specific values
- Market data, weather data, population figures
- Sports scores, financial metrics
- Any factual data that becomes outdated

IMPORTANT: Only identify facts that would genuinely benefit from automatic updates. Skip:
- Historical data that shouldn't change
- Opinions or subjective statements  
- One-time events that are now fixed in history
- Generic statements without specific values

Return JSON with this structure:

{
  "articleAnalysis": {
    "title": "article title",
    "contentLength": ${articleContent.length},
    "mainTopics": ["identified themes"],
    "contentType": "news|analysis|guide|opinion|technical",
    "updatePotential": "high|medium|low"
  },
  "pulsePoints": [
    {
      "text": "exact text to be made dynamic",
      "dynamicPart": "specific part that updates",
      "staticContext": "surrounding static text",
      "pulseType": "crypto|weather|stock|date|population|sports|news|other",
      "specificType": "detailed identifier",
      "updateFrequency": 60,
      "priority": "critical|important|moderate|low",
      "reasoning": "why this should be updated",
      "confidence": "high|medium|low",
      "location": {
        "sentence": "full sentence containing the pulse",
        "paragraph": "full paragraph containing the pulse",
        "position": "early|middle|late"
      }
    }
  ],
  "semanticClusters": [
    {
      "clusterName": "descriptive name",
      "pulseIndices": [0, 1, 2],
      "clusterType": "mathematical|temporal|comparative",
      "relationships": [
        {
          "sourceIndex": 0,
          "targetIndex": 1,
          "relationshipType": "percentage_change|direction|comparison",
          "calculationRule": "mathematical rule"
        }
      ],
      "priority": "critical|important|moderate|low"
    }
  ],
  "recommendations": {
    "totalPulsePoints": 5,
    "highPriority": 2,
    "clustersIdentified": 1,
    "updateStrategy": "aggressive|moderate|conservative",
    "estimatedImpact": "high|medium|low"
  }
}

Focus on finding 3-10 high-quality pulse points rather than many low-quality ones.`;

  const result = await model.generateContent(fullArticlePrompt);
  const responseText = result.response.text();

  let analysis;
  try {
    analysis = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse full article analysis:', responseText);
    throw new Error('Could not parse full article analysis as JSON');
  }

  // Add metadata
  analysis.metadata = {
    analyzedAt: new Date().toISOString(),
    articleTitle: articleTitle,
    analysisVersion: '3.0-full-article-scan',
    mode: 'full_article_scan'
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      analysis,
      mode: 'full_article_scan',
      rawResponse: responseText
    }),
  };
}