// Universal Update Content with Semantic Cluster Support
// netlify/functions/update-content.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Import the universal data fetcher
const { fetchUniversalData } = require('./data-sources');

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
    const requestData = JSON.parse(event.body);
    
    // Support both legacy single pulse updates and new cluster updates
    if (requestData.clusterId) {
      return await updateSemanticCluster(requestData, headers);
    } else {
      return await updateSinglePulse(requestData, headers);
    }

  } catch (error) {
    console.error('Update content error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Failed to update content',
        details: error.stack,
      }),
    };
  }
};

/**
 * Update a single pulse point (legacy support + new smart updates)
 */
async function updateSinglePulse(requestData, headers) {
  const { 
    pulseType, 
    specificType, 
    currentValue, 
    articleContext, 
    promptTemplate,
    surroundingText,
    pulseId,
    staticPrefix = '',
    staticSuffix = ''
  } = requestData;

  console.log('Updating single pulse:', { pulseType, specificType, currentValue });

  // Get enhanced context if pulseId provided
  let fullContext = await getEnhancedContext(pulseId, articleContext, surroundingText);

  // Fetch new data using universal data engine
  const newData = await fetchUniversalData(pulseType, specificType, {
    currentValue,
    context: fullContext.articleContext,
    surroundingText: fullContext.surroundingText,
    location: fullContext.location
  });

  if (!newData.value || newData.confidence === 'error') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: newData.error || 'No updated data available for this content type',
        fallback: true,
        currentValue
      }),
    };
  }

  // Generate contextual update that preserves style and semantic meaning
  const updateResult = await generateContextualUpdate({
    originalValue: currentValue,
    newData,
    staticPrefix,
    staticSuffix,
    fullContext,
    pulseType
  });

  // Validate the update semantically
  const validation = await validateUpdate({
    originalValue: currentValue,
    updatedValue: updateResult.updatedValue,
    context: fullContext,
    pulseType,
    dataSource: newData
  });

  if (!validation.isValid) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Update validation failed',
        validationError: validation.reason,
        originalValue: currentValue,
        attemptedValue: updateResult.updatedValue,
        suggestions: validation.suggestions
      }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      originalValue: currentValue,
      updatedValue: updateResult.updatedValue,
      staticPrefix,
      staticSuffix,
      source: newData.source,
      reasoning: updateResult.reasoning,
      confidence: newData.confidence,
      dataContext: newData.context,
      validation: validation,
      metadata: newData.metadata,
      timestamp: new Date().toISOString(),
      updateMethod: newData.confidence === 'high' ? 'api-data' : 'ai-research',
    }),
  };
}

/**
 * Update an entire semantic cluster atomically
 */
async function updateSemanticCluster(requestData, headers) {
  const { clusterId, triggerPulseId } = requestData;

  console.log('Updating semantic cluster:', { clusterId, triggerPulseId });

  // Get cluster information and all related pulse points
  const { data: cluster, error: clusterError } = await supabase
    .from('semantic_clusters')
    .select(`
      *,
      pulses(*),
      pulse_relationships(*)
    `)
    .eq('id', clusterId)
    .eq('is_active', true)
    .single();

  if (clusterError || !cluster) {
    throw new Error(`Cluster not found: ${clusterId}`);
  }

  // Get the primary pulse that drives the update
  const primaryPulse = cluster.pulses.find(p => p.is_primary_in_cluster) || 
                      cluster.pulses.find(p => p.id === cluster.primary_pulse_id) ||
                      cluster.pulses[0];

  if (!primaryPulse) {
    throw new Error('No primary pulse found in cluster');
  }

  console.log('Primary pulse for cluster:', primaryPulse.id, primaryPulse.pulse_type);

  // Fetch new data for the primary pulse
  const newPrimaryData = await fetchUniversalData(
    primaryPulse.pulse_type, 
    primaryPulse.specific_type,
    {
      currentValue: primaryPulse.current_value,
      context: primaryPulse.article_context,
      surroundingText: primaryPulse.surrounding_sentences
    }
  );

  if (!newPrimaryData.value || newPrimaryData.confidence === 'error') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: newPrimaryData.error || 'Failed to fetch primary data for cluster',
        clusterId,
        primaryPulseId: primaryPulse.id
      }),
    };
  }

  // Calculate all dependent values based on the new primary data
  const clusterUpdates = await calculateClusterUpdates({
    cluster,
    primaryPulse,
    newPrimaryData,
    allPulses: cluster.pulses,
    relationships: cluster.pulse_relationships
  });

  // Validate the entire cluster update for consistency
  const clusterValidation = await validateClusterUpdate({
    cluster,
    updates: clusterUpdates,
    primaryData: newPrimaryData
  });

  if (!clusterValidation.isValid) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Cluster validation failed',
        validationErrors: clusterValidation.errors,
        clusterId,
        attemptedUpdates: clusterUpdates
      }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      success: true,
      clusterId,
      clusterName: cluster.cluster_name,
      primaryPulseId: primaryPulse.id,
      updates: clusterUpdates,
      validation: clusterValidation,
      source: newPrimaryData.source,
      confidence: newPrimaryData.confidence,
      metadata: {
        clusterType: cluster.cluster_type,
        semanticRule: cluster.semantic_rule,
        updatedAt: new Date().toISOString(),
        updateMethod: 'semantic-cluster'
      }
    }),
  };
}

/**
 * Get enhanced context for better updates
 */
async function getEnhancedContext(pulseId, articleContext, surroundingText) {
  let context = {
    articleContext: articleContext || '',
    surroundingText: surroundingText || '',
    location: null,
    articleTitle: '',
    pulseMetadata: {}
  };

  if (pulseId) {
    try {
      const { data: pulse } = await supabase
        .from('pulses')
        .select(`
          *,
          articles(title, content_html, raw_content, article_context)
        `)
        .eq('id', pulseId)
        .single();
      
      if (pulse?.articles) {
        context.articleContext = pulse.articles.article_context || 
                               `${pulse.articles.title} ${pulse.articles.raw_content || pulse.articles.content_html}`;
        context.articleTitle = pulse.articles.title;
      }
      
      if (pulse) {
        context.surroundingText = pulse.surrounding_sentences || pulse.selected_text;
        context.pulseMetadata = {
          action: pulse.action,
          subject: pulse.subject,
          entity: pulse.entity,
          emotion: pulse.emotion
        };
      }
    } catch (error) {
      console.warn('Could not fetch enhanced context:', error);
    }
  }

  return context;
}

/**
 * Generate contextual update that preserves style and meaning
 */
async function generateContextualUpdate({ originalValue, newData, staticPrefix, staticSuffix, fullContext, pulseType }) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 300,
        responseMimeType: "application/json",
      },
    });

    const updatePrompt = `You are updating content while preserving the original writing style, tone, and semantic meaning.

ORIGINAL VALUE: "${originalValue}"
NEW DATA: ${newData.value} (${newData.context})
STATIC PREFIX: "${staticPrefix}"
STATIC SUFFIX: "${staticSuffix}"
FULL CONTEXT: "${fullContext.articleContext.substring(0, 300)}..."
CONTENT TYPE: ${pulseType}
ARTICLE TITLE: "${fullContext.articleTitle}"

TASK: Update only the dynamic value while preserving:
1. Original sentence structure and grammar
2. Writing style and tone  
3. Any descriptive adjectives or context
4. Semantic meaning and intent
5. Emotional context if present

CONTEXT CLUES:
- Action: ${fullContext.pulseMetadata.action || 'none'}
- Subject: ${fullContext.pulseMetadata.subject || 'none'}
- Entity: ${fullContext.pulseMetadata.entity || 'none'}
- Emotion: ${fullContext.pulseMetadata.emotion || 'none'}

Return JSON:
{
  "updatedValue": "the naturally updated value that flows with the original style",
  "reasoning": "brief explanation of what was changed and why",
  "confidence": "high|medium|low",
  "preservedElements": ["list of style elements preserved"],
  "semanticChanges": "description of any meaning changes"
}

EXAMPLES:
Original: "$65,000" → New: "$67,200" → Updated: "$67,200"
Original: "sunny with 25°C" → New: "rainy with 18°C" → Updated: "rainy with 18°C"  
Original: "5.2 million residents" → New: "5.4 million" → Updated: "5.4 million residents"

Focus on natural, seamless integration of the new data.`;

    const result = await model.generateContent(updatePrompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Contextual update generation error:', error);
    return {
      updatedValue: newData.value,
      reasoning: 'Fallback direct replacement due to generation error',
      confidence: 'low',
      preservedElements: [],
      semanticChanges: 'Direct value replacement'
    };
  }
}

/**
 * Validate that an update maintains semantic coherence
 */
async function validateUpdate({ originalValue, updatedValue, context, pulseType, dataSource }) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 400,
        responseMimeType: "application/json",
      },
    });

    const validationPrompt = `You are validating whether a content update maintains semantic coherence and meaning.

ORIGINAL VALUE: "${originalValue}"
UPDATED VALUE: "${updatedValue}"
CONTEXT: "${context.surroundingText}"
CONTENT TYPE: ${pulseType}
DATA SOURCE: ${dataSource.source} (confidence: ${dataSource.confidence})

VALIDATION CRITERIA:
1. Grammatical correctness: Does the update fit grammatically?
2. Semantic coherence: Does the meaning remain logical?
3. Tone consistency: Is the emotional context preserved?
4. Scale appropriateness: Is the new value reasonable in context?
5. Factual plausibility: Does the update make factual sense?

Return JSON:
{
  "isValid": true|false,
  "confidence": "high|medium|low",
  "reason": "explanation of validation result",
  "checks": {
    "grammatical": true|false,
    "semantic": true|false,
    "tone": true|false,
    "scale": true|false,
    "factual": true|false
  },
  "suggestions": ["list of suggestions if invalid"],
  "riskLevel": "low|medium|high"
}

REJECT if:
- Grammatical mismatch (price → weather description)
- Meaning distortion (small change → massive change without context)
- Tone inconsistency (disappointing rise → disappointing fall)
- Scale inappropriateness (1000x unexpected changes)
- Factual impossibility (negative temperatures in summer)

APPROVE if the update is natural, coherent, and preserves meaning.`;

    const result = await model.generateContent(validationPrompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Validation error:', error);
    return {
      isValid: false,
      confidence: 'low',
      reason: 'Validation system error',
      checks: {},
      suggestions: ['Manual review required due to validation system error'],
      riskLevel: 'high'
    };
  }
}

/**
 * Calculate all dependent updates in a semantic cluster
 */
async function calculateClusterUpdates({ cluster, primaryPulse, newPrimaryData, allPulses, relationships }) {
  const updates = [];
  
  // Start with the primary pulse update
  updates.push({
    pulseId: primaryPulse.id,
    role: 'primary',
    originalValue: primaryPulse.current_value,
    updatedValue: newPrimaryData.value,
    reasoning: 'Primary data source update',
    confidence: newPrimaryData.confidence
  });

  // Calculate dependent updates based on relationships
  for (const relationship of relationships) {
    const targetPulse = allPulses.find(p => p.id === relationship.target_pulse_id);
    if (!targetPulse) continue;

    const dependentUpdate = await calculateDependentValue({
      relationship,
      targetPulse,
      primaryValue: newPrimaryData.value,
      primaryMetadata: newPrimaryData.metadata,
      allUpdates: updates
    });

    if (dependentUpdate) {
      updates.push(dependentUpdate);
    }
  }

  return updates;
}

/**
 * Calculate a dependent value based on relationship rules
 */
async function calculateDependentValue({ relationship, targetPulse, primaryValue, primaryMetadata, allUpdates }) {
  try {
    const { relationship_type, calculation_rule } = relationship;
    
    switch (relationship_type) {
      case 'percentage_change':
        return calculatePercentageChange(targetPulse, primaryValue, primaryMetadata, calculation_rule);
      
      case 'direction':
        return calculateDirection(targetPulse, primaryValue, primaryMetadata, calculation_rule);
      
      case 'comparison':
        return calculateComparison(targetPulse, primaryValue, primaryMetadata, calculation_rule);
      
      case 'reference_point':
        // Reference points typically don't update unless it's a new time period
        return null;
      
      case 'calculation':
        return calculateCustom(targetPulse, primaryValue, primaryMetadata, calculation_rule);
      
      default:
        console.warn('Unknown relationship type:', relationship_type);
        return null;
    }
  } catch (error) {
    console.error('Error calculating dependent value:', error);
    return {
      pulseId: targetPulse.id,
      role: 'dependent',
      originalValue: targetPulse.current_value,
      updatedValue: targetPulse.current_value, // Keep original on error
      reasoning: `Calculation failed: ${error.message}`,
      confidence: 'error'
    };
  }
}

/**
 * Calculate percentage change between values
 */
function calculatePercentageChange(targetPulse, newPrimaryValue, metadata, calculationRule) {
  // Extract numeric values and calculate percentage
  const newPrice = parseFloat(newPrimaryValue.replace(/[$,]/g, ''));
  const referencePrice = metadata.referencePrice || parseFloat(targetPulse.selected_text.match(/[\d.]+/)?.[0]);
  
  if (!newPrice || !referencePrice) {
    throw new Error('Could not extract numeric values for percentage calculation');
  }
  
  const percentChange = Math.abs(((newPrice - referencePrice) / referencePrice) * 100);
  const formattedPercent = `${percentChange.toFixed(1)}%`;
  
  return {
    pulseId: targetPulse.id,
    role: 'dependent',
    originalValue: targetPulse.current_value,
    updatedValue: formattedPercent,
    reasoning: `Calculated ${percentChange.toFixed(1)}% change from ${referencePrice} to ${newPrice}`,
    confidence: 'high'
  };
}

/**
 * Calculate direction (up/down/stable) based on comparison
 */
function calculateDirection(targetPulse, newPrimaryValue, metadata, calculationRule) {
  const newPrice = parseFloat(newPrimaryValue.replace(/[$,]/g, ''));
  const referencePrice = metadata.referencePrice || parseFloat(targetPulse.selected_text.match(/[\d.]+/)?.[0]);
  
  if (!newPrice || !referencePrice) {
    throw new Error('Could not extract numeric values for direction calculation');
  }
  
  let direction;
  if (newPrice > referencePrice) {
    direction = 'up';
  } else if (newPrice < referencePrice) {
    direction = 'down';
  } else {
    direction = 'stable';
  }
  
  return {
    pulseId: targetPulse.id,
    role: 'dependent',
    originalValue: targetPulse.current_value,
    updatedValue: direction,
    reasoning: `Direction ${direction} calculated from ${referencePrice} to ${newPrice}`,
    confidence: 'high'
  };
}

/**
 * Calculate comparison (warmer/cooler, higher/lower, etc.)
 */
function calculateComparison(targetPulse, newPrimaryValue, metadata, calculationRule) {
  // This would implement comparison logic based on the specific context
  // For now, return unchanged as comparison logic is highly context-dependent
  return {
    pulseId: targetPulse.id,
    role: 'dependent',
    originalValue: targetPulse.current_value,
    updatedValue: targetPulse.current_value,
    reasoning: 'Comparison calculation not yet implemented',
    confidence: 'low'
  };
}

/**
 * Custom calculation based on specific rules
 */
function calculateCustom(targetPulse, newPrimaryValue, metadata, calculationRule) {
  // This would implement custom calculation logic
  return {
    pulseId: targetPulse.id,
    role: 'dependent',  
    originalValue: targetPulse.current_value,
    updatedValue: targetPulse.current_value,
    reasoning: 'Custom calculation not yet implemented',
    confidence: 'low'
  };
}

/**
 * Validate that all cluster updates are consistent
 */
async function validateClusterUpdate({ cluster, updates, primaryData }) {
  const validation = {
    isValid: true,
    confidence: 'high',
    errors: [],
    warnings: []
  };

  // Check that all updates are mathematically consistent
  for (const update of updates) {
    if (update.confidence === 'error') {
      validation.isValid = false;
      validation.errors.push(`Update failed for pulse ${update.pulseId}: ${update.reasoning}`);
    }
  }

  // Check for semantic coherence across the cluster
  if (cluster.cluster_type === 'mathematical') {
    const primaryUpdate = updates.find(u => u.role === 'primary');
    const dependentUpdates = updates.filter(u => u.role === 'dependent');
    
    if (primaryUpdate && dependentUpdates.length > 0) {
      // Verify mathematical relationships make sense
      // This is a simplified check - would be more sophisticated in production
      for (const dep of dependentUpdates) {
        if (dep.confidence === 'low') {
          validation.warnings.push(`Low confidence in dependent calculation for pulse ${dep.pulseId}`);
        }
      }
    }
  }

  if (validation.errors.length > 0) {
    validation.isValid = false;
    validation.confidence = 'low';
  } else if (validation.warnings.length > 0) {
    validation.confidence = 'medium';
  }

  return validation;
}