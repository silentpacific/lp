// Universal Analyze Pulse with Enhanced Semantic Cluster Detection
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
 * Enhanced clustering rules detection
 * Adds semantic analysis, entity recognition, and contextual glue detection
 * to existing mathematical relationship detection
 */
function enhanceClusteringAnalysis(baseAnalysis, articleContent, selectedText) {
  // Add enhanced clustering detection without removing existing logic
  const enhancedRules = {
    // Semantic analysis patterns
    semanticPatterns: {
      subjectReferences: ['it', 'this', 'they', 'these', 'those', 'the company', 'the stock', 'the price'],
      contextualGlue: ['like', 'towards', 'representing', 'compared to', 'relative to', 'in contrast to', 'similar to', 'unlike'],
      temporalConnectors: ['meanwhile', 'simultaneously', 'at the same time', 'concurrently', 'while', 'during'],
      causalConnectors: ['because', 'due to', 'as a result', 'consequently', 'therefore', 'leading to']
    },
    
    // Entity recognition patterns  
    entityPatterns: {
      companies: /\b([A-Z][a-z]+ (?:Inc|Corp|Ltd|LLC|Company|Co)\.?|Apple|Google|Microsoft|Tesla|Amazon|Meta)\b/g,
      currencies: /\$[\d,]+\.?\d*|€[\d,]+\.?\d*|£[\d,]+\.?\d*|¥[\d,]+\.?\d*/g,
      percentages: /\d+\.?\d*%/g,
      numbers: /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g,
      timeReferences: /\b(?:today|yesterday|tomorrow|this (?:week|month|quarter|year)|last (?:week|month|quarter|year))\b/gi
    }
  };

  // Extract entities from the article
  const extractedEntities = extractEntitiesFromText(articleContent, enhancedRules.entityPatterns);
  
  // Find semantic connections
  const semanticConnections = findSemanticConnections(selectedText, articleContent, enhancedRules.semanticPatterns);
  
  // Enhance existing cluster analysis
  if (baseAnalysis.semanticCluster) {
    baseAnalysis.semanticCluster.enhancedFeatures = {
      extractedEntities,
      semanticConnections,
      contextualGlueDetected: semanticConnections.contextualGlue.length > 0,
      entityReferencesDetected: semanticConnections.entityReferences.length > 0,
      crossReferenceStrength: calculateCrossReferenceStrength(semanticConnections),
      clusterConfidenceScore: calculateClusterConfidence(baseAnalysis, semanticConnections, extractedEntities)
    };
  }

  return baseAnalysis;
}

/**
 * Extract named entities from text using enhanced patterns
 */
function extractEntitiesFromText(text, entityPatterns) {
  const entities = {
    companies: [],
    currencies: [],
    percentages: [],
    numbers: [],
    timeReferences: []
  };

  // Extract each entity type
  Object.keys(entityPatterns).forEach(entityType => {
    const matches = text.match(entityPatterns[entityType]) || [];
    entities[entityType] = [...new Set(matches)]; // Remove duplicates
  });

  // Advanced entity linking - find co-occurrences
  entities.coOccurrences = findEntityCoOccurrences(text, entities);
  
  return entities;
}

/**
 * Find co-occurring entities within sentence boundaries
 */
function findEntityCoOccurrences(text, entities) {
  const sentences = text.split(/[.!?]+/);
  const coOccurrences = [];

  sentences.forEach((sentence, index) => {
    const sentenceEntities = {};
    
    // Find all entity types in this sentence
    Object.keys(entities).forEach(entityType => {
      if (entityType === 'coOccurrences') return;
      
      sentenceEntities[entityType] = entities[entityType].filter(entity => 
        sentence.toLowerCase().includes(entity.toLowerCase())
      );
    });

    // If multiple entity types found, record co-occurrence
    const entityTypes = Object.keys(sentenceEntities).filter(type => 
      sentenceEntities[type].length > 0
    );

    if (entityTypes.length > 1) {
      coOccurrences.push({
        sentenceIndex: index,
        sentence: sentence.trim(),
        entities: sentenceEntities,
        entityTypes: entityTypes,
        strength: entityTypes.length
      });
    }
  });

  return coOccurrences;
}

/**
 * Find semantic connections using contextual analysis  
 */
function findSemanticConnections(selectedText, articleContent, semanticPatterns) {
  const connections = {
    subjectReferences: [],
    contextualGlue: [],
    temporalConnectors: [],
    causalConnectors: [],
    crossReferences: []
  };

  // Find the paragraph containing selected text
  const paragraphs = articleContent.split(/\n\s*\n/);
  const selectedParagraph = paragraphs.find(p => p.includes(selectedText)) || '';
  
  // Get surrounding paragraphs for broader context
  const selectedParagraphIndex = paragraphs.findIndex(p => p.includes(selectedText));
  const contextParagraphs = paragraphs.slice(
    Math.max(0, selectedParagraphIndex - 1),
    Math.min(paragraphs.length, selectedParagraphIndex + 2)
  ).join('\n\n');

  // Detect each type of semantic connection
  Object.keys(semanticPatterns).forEach(patternType => {
    const patterns = semanticPatterns[patternType];
    
    patterns.forEach(pattern => {
      // Check in selected paragraph first
      if (selectedParagraph.toLowerCase().includes(pattern.toLowerCase())) {
        connections[patternType].push({
          pattern: pattern,
          location: 'selected_paragraph',
          context: extractPatternContext(selectedParagraph, pattern),
          strength: 3 // High strength for same paragraph
        });
      }
      
      // Check in surrounding context
      else if (contextParagraphs.toLowerCase().includes(pattern.toLowerCase())) {
        connections[patternType].push({
          pattern: pattern,
          location: 'surrounding_context',
          context: extractPatternContext(contextParagraphs, pattern),
          strength: 2 // Medium strength for surrounding context
        });
      }
      
      // Check in broader article
      else if (articleContent.toLowerCase().includes(pattern.toLowerCase())) {
        connections[patternType].push({
          pattern: pattern,
          location: 'article_wide',
          context: extractPatternContext(articleContent, pattern),
          strength: 1 // Lower strength for article-wide
        });
      }
    });
  });

  // Find cross-references between paragraphs
  connections.crossReferences = findCrossReferences(selectedText, paragraphs, selectedParagraphIndex);

  return connections;
}

/**
 * Extract context around a pattern match
 */
function extractPatternContext(text, pattern) {
  const index = text.toLowerCase().indexOf(pattern.toLowerCase());
  if (index === -1) return '';
  
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + pattern.length + 50);
  
  return text.substring(start, end).trim();
}

/**
 * Find cross-references between paragraphs
 */
function findCrossReferences(selectedText, paragraphs, selectedIndex) {
  const crossReferences = [];
  
  // Extract key terms from selected text (nouns and significant words)
  const keyTerms = extractKeyTerms(selectedText);
  
  paragraphs.forEach((paragraph, index) => {
    if (index === selectedIndex) return; // Skip the selected paragraph
    
    const matchingTerms = keyTerms.filter(term => 
      paragraph.toLowerCase().includes(term.toLowerCase())
    );
    
    if (matchingTerms.length > 0) {
      crossReferences.push({
        paragraphIndex: index,
        distance: Math.abs(index - selectedIndex),
        matchingTerms: matchingTerms,
        snippet: paragraph.substring(0, 100) + '...',
        strength: Math.max(1, 4 - Math.abs(index - selectedIndex)) // Closer = stronger
      });
    }
  });
  
  return crossReferences.sort((a, b) => b.strength - a.strength);
}

/**
 * Extract key terms from text for cross-referencing
 */
function extractKeyTerms(text) {
  // Simple key term extraction - could be enhanced with NLP
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
  
  return words
    .filter(word => word.length > 3 && !stopWords.has(word))
    .filter(word => /^[a-zA-Z]+$/.test(word)) // Only alphabetic words
    .slice(0, 10); // Limit to top 10 terms
}

/**
 * Calculate cross-reference strength score
 */
function calculateCrossReferenceStrength(semanticConnections) {
  let totalStrength = 0;
  let connectionCount = 0;

  Object.keys(semanticConnections).forEach(connectionType => {
    if (connectionType === 'crossReferences') {
      // Special handling for cross-references
      totalStrength += semanticConnections[connectionType].reduce((sum, ref) => sum + ref.strength, 0);
      connectionCount += semanticConnections[connectionType].length;
    } else {
      totalStrength += semanticConnections[connectionType].reduce((sum, conn) => sum + conn.strength, 0);
      connectionCount += semanticConnections[connectionType].length;
    }
  });

  return connectionCount > 0 ? totalStrength / connectionCount : 0;
}

/**
 * Calculate overall cluster confidence score
 */
function calculateClusterConfidence(baseAnalysis, semanticConnections, extractedEntities) {
  let confidence = 0;

  // Base mathematical relationships (existing logic)
  if (baseAnalysis.semanticCluster && baseAnalysis.semanticCluster.relationships) {
    confidence += baseAnalysis.semanticCluster.relationships.length * 0.3;
  }

  // Entity co-occurrences
  confidence += extractedEntities.coOccurrences.length * 0.2;

  // Semantic connections strength
  const crossRefStrength = calculateCrossReferenceStrength(semanticConnections);
  confidence += crossRefStrength * 0.3;

  // Contextual glue presence
  if (semanticConnections.contextualGlue.length > 0) {
    confidence += 0.2;
  }

  // Normalize to 0-1 scale
  return Math.min(1.0, confidence);
}

/**
 * Analyze a single selected text for pulse points and relationships
 * Enhanced with new clustering logic
 */
async function analyzeSinglePulse(selectedText, articleContent, articleTitle, headers) {
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 1500,
  },
});

  // Enhanced prompt with additional clustering instructions
  const smartAnalysisPrompt = `You are a precision content analyzer for the LivePulse semantic engine. Your job is to analyze selected text and identify:
1. The exact dynamic part that should update
2. Any related data points that must update together (semantic clusters)
3. Mathematical or logical relationships between data points
4. ENHANCED: Semantic connections, entity references, and contextual relationships

SELECTED TEXT: "${selectedText}"
ARTICLE TITLE: "${articleTitle || 'Unknown'}"
ARTICLE CONTEXT: "${articleContent.substring(0, 1000)}..."

TASK: Identify the smallest possible dynamic part AND any related data points that must update as a cluster.

ENHANCED CLUSTERING DETECTION:
Look for these additional patterns:
- Subject references: "it", "this", "they", "the company", "the stock"
- Contextual glue: "like", "towards", "representing", "compared to", "relative to"
- Entity mentions: Company names, products, locations appearing multiple times
- Temporal connectors: "meanwhile", "simultaneously", "at the same time"
- Causal relationships: "because", "due to", "as a result", "leading to"

EXAMPLES OF SEMANTIC CLUSTERS:

Example 1 - Financial Cluster with Entity References:
Selected: "Tesla shares closed at $248.50 on Friday, down 3.2% from Thursday's close of $257.75. The company's stock has been volatile this week."
Analysis: THREE related pulse points + entity linkage:
- Primary: "$248.50" (current price)
- Dependent: "3.2%" (calculated from price change)  
- Dependent: "down" (direction based on price comparison)
- Reference: "$257.75" (previous close)
- Entity Link: "Tesla" and "The company" refer to same entity
- Semantic Connection: "volatile this week" provides temporal context

Example 2 - Weather Comparison with Contextual Glue:
Selected: "Adelaide is experiencing sunny weather with 25°C, a pleasant 5 degrees warmer than yesterday's 20°C. This represents a typical spring warming pattern."
Analysis: FOUR related pulse points + contextual connections:
- Primary: "25°C" (current temperature)
- Dependent: "5 degrees warmer" (calculated difference)
- Dependent: "pleasant" (descriptor based on comparison)
- Reference: "20°C" (yesterday's temp)
- Contextual Glue: "This represents" links to broader pattern
- Semantic Connection: "typical spring warming" provides seasonal context

Example 3 - Cross-Reference Cluster:
Selected: "Apple's iPhone sales reached 15 million units in Q3, representing 23% of total smartphone market share. The device's popularity continues to grow."
Analysis: THREE pulse points with cross-references:
- Primary: "15 million units" (sales figure)
- Dependent: "23%" (market share calculation)
- Reference: Cross-paragraph mentions of "Apple" and "iPhone"
- Entity Recognition: "The device" refers back to "iPhone"

ANALYSIS INSTRUCTIONS:
1. Extract surrounding sentences (2-3 sentences before and after)
2. Identify the full paragraph containing the selected text
3. Determine if this is a single pulse or part of a semantic cluster
4. If cluster: identify all related data points and their relationships
5. ENHANCED: Detect entity references, contextual glue, and cross-paragraph connections
6. Specify mathematical/logical rules for dependent calculations
7. Calculate semantic clustering confidence score

Return JSON with this exact structure (enhanced with new fields):

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
      "paragraph": "full paragraph containing this pulse",
      "enhancedFeatures": {
        "entityReferences": ["list of entity mentions found"],
        "contextualConnections": ["contextual glue phrases found"],
        "crossReferences": ["references to this entity in other paragraphs"],
        "semanticStrength": "high|medium|low"
      }
    }
  ],
  "semanticCluster": {
    "clusterId": "unique identifier if this is a cluster",
    "clusterName": "descriptive name like 'Tesla Stock Price Movement'",
    "clusterType": "mathematical|temporal|comparative|descriptive|entity_linked",
    "primaryPulseIndex": 0,
    "relationships": [
      {
        "sourcePulseIndex": 0,
        "targetPulseIndex": 1,
        "relationshipType": "percentage_change|direction|comparison|reference_point|entity_reference",
        "calculationRule": "specific mathematical or logical rule",
        "dependencyOrder": 1,
        "semanticConnection": "type of semantic connection (contextual_glue|subject_reference|entity_link)"
      }
    ],
    "semanticRule": "natural language explanation of relationships",
    "enhancedClustering": {
      "entityLinks": ["entities that connect cluster members"],
      "contextualGlue": ["phrases that provide semantic connection"],
      "crossParagraphReferences": ["references found across paragraphs"],
      "clusterConfidence": 0.85,
      "clusteringMethod": "mathematical|semantic|hybrid"
    }
  },
  "contextAnalysis": {
    "articleThemes": ["main topics covered in article"],
    "contentCategory": "factual|opinion|descriptive|comparative",
    "updatePriority": "critical|important|moderate|low",
    "temporalReferences": ["time-related phrases found"],
    "comparativeElements": ["comparative phrases found"],
    "entityMentions": ["all entity mentions in context"],
    "semanticDensity": "high|medium|low"
  }
}

FREQUENCY GUIDELINES:
- Financial markets: 60-240 minutes (1-4 hours)
- Crypto prices: 60-120 minutes (1-2 hours)  
- Weather: 180-360 minutes (3-6 hours)
- Sports scores: 60-1440 minutes (1 hour to 1 day)
- Population/demographics: 43200-525600 minutes (monthly to yearly)
- Date references: 1440 minutes (daily)

ENHANCED RELATIONSHIP TYPES:
- percentage_change: Target calculates percentage from source values
- direction: Target determines up/down/stable from source comparison  
- comparison: Target describes relative difference (warmer/cooler, higher/lower)
- reference_point: Source provides baseline for calculations
- calculation: Target derives value through mathematical formula
- entity_reference: Target refers to same entity as source using different terms
- contextual_connection: Target connected through contextual glue phrases

Focus on precision in text boundaries, mathematical relationships, AND semantic connections.`;

  const result = await model.generateContent(smartAnalysisPrompt);
  const responseText = result.response.text();

	// Clean up the response to extract JSON
	let cleanedResponse = responseText.trim();
	if (cleanedResponse.startsWith('```json')) {
	  cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
	}
	if (cleanedResponse.startsWith('```')) {
	  cleanedResponse = cleanedResponse.replace(/```\s*/g, '').replace(/```\s*$/g, '');
	}

  let analysis;
  try {
    analysis = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse Gemini response:', responseText);
    throw new Error('Could not parse AI response as JSON');
  }

  // Apply enhanced clustering analysis (new functionality)
  analysis = enhanceClusteringAnalysis(analysis, articleContent, selectedText);

  // Validate the analysis (existing logic preserved)
  if (!analysis.pulsePoints || !Array.isArray(analysis.pulsePoints) || analysis.pulsePoints.length === 0) {
    throw new Error('No pulse points identified in analysis');
  }

  // Validate each pulse point (existing logic preserved)
  for (const pulse of analysis.pulsePoints) {
    const requiredFields = ['dynamicPart', 'pulseType', 'specificType', 'updateFrequency'];
    for (const field of requiredFields) {
      if (!pulse[field]) {
        throw new Error(`Missing required field: ${field} in pulse point`);
      }
    }
    
    // Ensure updateFrequency is reasonable (existing logic preserved)
    pulse.updateFrequency = Math.max(15, Math.min(525600, parseInt(pulse.updateFrequency)));
  }

  // Add metadata (enhanced with new version info)
  analysis.metadata = {
    analyzedAt: new Date().toISOString(),
    articleTitle: articleTitle,
    analysisVersion: '3.1-enhanced-semantic-clusters', // Updated version
    selectedTextLength: selectedText.length,
    articleLength: articleContent.length,
    mode: 'single_pulse',
    enhancedClustering: true // New flag
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
 * Enhanced with new clustering logic
 */
async function analyzeFullArticle(articleContent, articleTitle, headers) {
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 1500,
  },
});

  // Enhanced full article prompt
  const fullArticlePrompt = `You are analyzing an entire article to identify ALL potential pulse points and semantic clusters using enhanced detection methods.

ARTICLE TITLE: "${articleTitle || 'Unknown'}"
ARTICLE CONTENT: "${articleContent}"

TASK: Scan the entire article and identify:
1. All dynamic facts that could benefit from automatic updates
2. Related facts that form semantic clusters
3. Priority ranking for each pulse point
4. ENHANCED: Entity relationships, contextual connections, and cross-references

ENHANCED DETECTION METHODS:
- Entity Recognition: Track company names, products, locations across paragraphs
- Subject Reference Analysis: "it", "this", "they", "the company" linking
- Contextual Glue Detection: "like", "compared to", "representing", "similar to"
- Cross-Paragraph Connections: Same entities mentioned in different sections
- Temporal Relationship Mapping: "meanwhile", "simultaneously", time-based connections
- Causal Chain Detection: "because", "due to", "as a result", "leading to"

Look for these content types:
- Numbers that change over time (prices, statistics, counts)
- Dates and temporal references  
- Comparative statements with specific values
- Market data, weather data, population figures
- Sports scores, financial metrics
- Any factual data that becomes outdated
- ENHANCED: Entity mentions and their relationships across the article

IMPORTANT: Only identify facts that would genuinely benefit from automatic updates. Skip:
- Historical data that shouldn't change
- Opinions or subjective statements  
- One-time events that are now fixed in history
- Generic statements without specific values

Return JSON with this enhanced structure:

{
  "articleAnalysis": {
    "title": "article title",
    "contentLength": ${articleContent.length},
    "mainTopics": ["identified themes"],
    "contentType": "news|analysis|guide|opinion|technical",
    "updatePotential": "high|medium|low",
    "enhancedFeatures": {
      "entityDensity": "high|medium|low",
      "crossReferenceCount": 5,
      "semanticConnectionStrength": "high|medium|low",
      "clusteringPotential": "high|medium|low"
    }
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
      },
      "enhancedFeatures": {
        "entityReferences": ["related entities found"],
        "contextualConnections": ["contextual phrases nearby"],
        "crossReferences": ["mentions in other paragraphs"],
        "semanticStrength": "high|medium|low"
      }
    }
  ],
  "semanticClusters": [
    {
      "clusterName": "descriptive name",
      "pulseIndices": [0, 1, 2],
      "clusterType": "mathematical|temporal|comparative|entity_linked|contextual",
      "relationships": [
        {
          "sourceIndex": 0,
          "targetIndex": 1,
          "relationshipType": "percentage_change|direction|comparison|entity_reference|contextual_connection",
          "calculationRule": "mathematical rule or semantic connection",
          "semanticConnection": "type of connection found"
        }
      ],
      "priority": "critical|important|moderate|low",
      "enhancedClustering": {
        "entityLinks": ["entities connecting cluster members"],
        "contextualGlue": ["phrases providing semantic connection"],
        "crossParagraphSpan": true,
        "clusterConfidence": 0.85,
        "detectionMethod": "mathematical|semantic|hybrid"
      }
    }
  ],
  "recommendations": {
    "totalPulsePoints": 5,
    "highPriority": 2,
    "clustersIdentified": 1,
    "updateStrategy": "aggressive|moderate|conservative",
    "estimatedImpact": "high|medium|low",
    "enhancedInsights": {
      "strongestEntityConnections": ["entity pairs with highest connection strength"],
      "recommendedClusteringApproach": "mathematical|semantic|hybrid",
      "semanticComplexity": "high|medium|low"
    }
  }
}

Focus on finding 3-10 high-quality pulse points with strong semantic relationships rather than many low-quality ones.`;

  const result = await model.generateContent(fullArticlePrompt);
  const responseText = result.response.text();

	// Clean up the response to extract JSON
	let cleanedResponse = responseText.trim();
	if (cleanedResponse.startsWith('```json')) {
	  cleanedResponse = cleanedResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
	}
	if (cleanedResponse.startsWith('```')) {
	  cleanedResponse = cleanedResponse.replace(/```\s*/g, '').replace(/```\s*$/g, '');
	}

  let analysis;
  try {
    analysis = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse full article analysis:', responseText);
    throw new Error('Could not parse full article analysis as JSON');
  }

  // Apply enhanced clustering analysis to full article results
  if (analysis.pulsePoints && analysis.pulsePoints.length > 0) {
    // For full article scan, we'll enhance the overall analysis rather than individual selections
    const fullArticleEntities = extractEntitiesFromText(articleContent, {
      companies: /\b([A-Z][a-z]+ (?:Inc|Corp|Ltd|LLC|Company|Co)\.?|Apple|Google|Microsoft|Tesla|Amazon|Meta)\b/g,
      currencies: /\$[\d,]+\.?\d*|€[\d,]+\.?\d*|£[\d,]+\.?\d*|¥[\d,]+\.?\d*/g,
      percentages: /\d+\.?\d*%/g,
      numbers: /\b\d{1,3}(?:,\d{3})*(?:\.\d+)?\b/g,
      timeReferences: /\b(?:today|yesterday|tomorrow|this (?:week|month|quarter|year)|last (?:week|month|quarter|year))\b/gi
    });

    analysis.enhancedAnalysis = {
      fullArticleEntities,
      totalEntityMentions: Object.values(fullArticleEntities).flat().length,
      entityCoOccurrenceStrength: fullArticleEntities.coOccurrences ? fullArticleEntities.coOccurrences.length : 0,
      recommendedClusteringMethod: determineOptimalClusteringMethod(analysis, fullArticleEntities)
    };
  }

  // Add metadata (enhanced with new version info)
  analysis.metadata = {
    analyzedAt: new Date().toISOString(),
    articleTitle: articleTitle,
    analysisVersion: '3.1-enhanced-full-article-scan', // Updated version
    mode: 'full_article_scan',
    enhancedClustering: true // New flag
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

/**
 * Determine optimal clustering method based on analysis results
 */
function determineOptimalClusteringMethod(analysis, entities) {
  const mathematicalClusters = analysis.semanticClusters ? 
    analysis.semanticClusters.filter(c => c.clusterType === 'mathematical').length : 0;
    
  const semanticClusters = analysis.semanticClusters ? 
    analysis.semanticClusters.filter(c => ['entity_linked', 'contextual', 'temporal'].includes(c.clusterType)).length : 0;
    
  const entityCoOccurrences = entities.coOccurrences ? entities.coOccurrences.length : 0;
  
  // Determine best approach based on content characteristics
  if (mathematicalClusters > semanticClusters && entityCoOccurrences < 3) {
    return 'mathematical'; // Primarily numerical relationships
  } else if (semanticClusters > mathematicalClusters && entityCoOccurrences > 5) {
    return 'semantic'; // Rich entity relationships and contextual connections
  } else {
    return 'hybrid'; // Mixed approach recommended
  }
}