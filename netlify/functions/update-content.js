// Universal Update Content with Enhanced Smart Update Rules
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
 * Enhanced Smart Update Rules Engine
 * Determines optimal refresh rates and handles conflicts
 */
class SmartUpdateRules {
  constructor() {
    this.updateHistory = new Map();
    this.conflictResolutionStrategies = {
      'data_source_conflict': 'prioritize_authoritative_source',
      'frequency_conflict': 'adaptive_frequency_adjustment',
      'semantic_conflict': 'preserve_meaning_over_data',
      'scale_conflict': 'validate_against_historical_range',
      'timing_conflict': 'respect_market_hours'
    };
  }

  /**
   * Calculate smart refresh rate based on content type and volatility
   */
  calculateSmartRefreshRate(pulseType, specificType, currentValue, updateHistory = [], contentContext = {}) {
    const baseRates = {
      'crypto': { min: 15, base: 60, max: 240 },      // 15min - 4hr
      'stock': { min: 60, base: 180, max: 480 },      // 1hr - 8hr  
      'weather': { min: 120, base: 360, max: 720 },   // 2hr - 12hr
      'sports': { min: 30, base: 120, max: 1440 },    // 30min - 24hr
      'population': { min: 1440, base: 43200, max: 525600 }, // 1day - 1year
      'date': { min: 1440, base: 1440, max: 1440 },   // Always daily
      'news': { min: 60, base: 240, max: 720 },       // 1hr - 12hr
      'technology': { min: 240, base: 720, max: 2160 } // 4hr - 36hr
    };

    const rates = baseRates[pulseType] || baseRates['news'];
    
    // Analyze volatility from update history
    const volatilityFactor = this.calculateVolatilityFactor(updateHistory);
    
    // Context-based adjustments
    const contextFactor = this.calculateContextFactor(contentContext, pulseType);
    
    // Market hours consideration
    const timingFactor = this.calculateTimingFactor(pulseType, specificType);
    
    // Calculate final refresh rate
    let smartRate = rates.base * (1 / volatilityFactor) * contextFactor * timingFactor;
    
    // Ensure within bounds
    smartRate = Math.max(rates.min, Math.min(rates.max, Math.round(smartRate)));
    
    return {
      refreshRateMinutes: smartRate,
      reasoning: this.explainRefreshRateReasoning(rates.base, smartRate, volatilityFactor, contextFactor, timingFactor),
      volatilityFactor,
      contextFactor,
      timingFactor,
      confidence: this.calculateRefreshRateConfidence(updateHistory, contentContext)
    };
  }

  /**
   * Calculate volatility factor based on update history
   */
  calculateVolatilityFactor(updateHistory) {
    if (!updateHistory.length) return 1.0;

    const recentUpdates = updateHistory.slice(-10); // Last 10 updates
    let changeCount = 0;
    let significantChangeCount = 0;

    for (let i = 1; i < recentUpdates.length; i++) {
      const prev = this.extractNumericValue(recentUpdates[i - 1].old_value);
      const curr = this.extractNumericValue(recentUpdates[i].new_value);
      
      if (prev && curr && prev !== curr) {
        changeCount++;
        const changePercent = Math.abs((curr - prev) / prev);
        if (changePercent > 0.05) { // 5% threshold for significant change
          significantChangeCount++;
        }
      }
    }

    const changeRate = changeCount / recentUpdates.length;
    const significantChangeRate = significantChangeCount / recentUpdates.length;
    
    // Higher volatility = lower factor = faster updates
    return Math.max(0.3, 1 - (changeRate * 0.4 + significantChangeRate * 0.6));
  }

  /**
   * Calculate context factor based on content importance and type
   */
  calculateContextFactor(contentContext, pulseType) {
    let factor = 1.0;

    // Article importance
    if (contentContext.updatePriority === 'critical') factor *= 0.7;
    else if (contentContext.updatePriority === 'important') factor *= 0.85;
    else if (contentContext.updatePriority === 'low') factor *= 1.3;

    // Content category
    if (contentContext.contentCategory === 'breaking_news') factor *= 0.5;
    else if (contentContext.contentCategory === 'analysis') factor *= 1.2;
    else if (contentContext.contentCategory === 'reference') factor *= 1.5;

    // Temporal context
    if (contentContext.hasTemporalReferences) factor *= 0.8;
    if (contentContext.hasComparativeElements) factor *= 0.9;

    return Math.max(0.3, Math.min(2.0, factor));
  }

  /**
   * Calculate timing factor for market hours and relevant time zones
   */
  calculateTimingFactor(pulseType, specificType) {
    const now = new Date();
    const hour = now.getUTCHours();
    
    // Market hours consideration
    if (pulseType === 'stock' || pulseType === 'crypto') {
      // US market hours (9:30 AM - 4:00 PM ET = 14:30 - 21:00 UTC)
      const isUSMarketHours = hour >= 14 && hour <= 21;
      
      if (pulseType === 'stock' && !isUSMarketHours) {
        return 2.0; // Slower updates outside market hours
      }
      
      if (pulseType === 'crypto' && isUSMarketHours) {
        return 0.7; // Faster updates during active trading
      }
    }

    // Weather updates - less frequent at night
    if (pulseType === 'weather') {
      const isDayTime = hour >= 6 && hour <= 22; // 6 AM - 10 PM UTC
      return isDayTime ? 1.0 : 1.5;
    }

    // Sports - event-based timing
    if (pulseType === 'sports') {
      // This would check for active games/seasons
      return 1.0; // Placeholder - would integrate with sports calendar
    }

    return 1.0;
  }

  /**
   * Explain the reasoning behind refresh rate calculation
   */
  explainRefreshRateReasoning(baseRate, finalRate, volatilityFactor, contextFactor, timingFactor) {
    const factors = [];
    
    if (volatilityFactor < 0.8) {
      factors.push(`high volatility detected (${(1/volatilityFactor).toFixed(1)}x faster)`);
    }
    
    if (contextFactor < 0.9) {
      factors.push(`high priority content (${contextFactor.toFixed(1)}x faster)`);
    } else if (contextFactor > 1.1) {
      factors.push(`low priority content (${contextFactor.toFixed(1)}x slower)`);
    }
    
    if (timingFactor < 0.9) {
      factors.push(`active market hours (${timingFactor.toFixed(1)}x faster)`);
    } else if (timingFactor > 1.1) {
      factors.push(`off-hours timing (${timingFactor.toFixed(1)}x slower)`);
    }

    const rateChange = finalRate / baseRate;
    let changeDescription = '';
    
    if (rateChange < 0.7) {
      changeDescription = 'Much faster than standard';
    } else if (rateChange < 0.9) {
      changeDescription = 'Faster than standard';
    } else if (rateChange > 1.4) {
      changeDescription = 'Much slower than standard';
    } else if (rateChange > 1.1) {
      changeDescription = 'Slower than standard';
    } else {
      changeDescription = 'Standard rate';
    }

    return `${changeDescription} (${finalRate}min vs ${baseRate}min base). ${factors.join(', ')}`;
  }

  /**
   * Calculate confidence in refresh rate recommendation
   */
  calculateRefreshRateConfidence(updateHistory, contentContext) {
    let confidence = 0.7; // Base confidence

    // More history = higher confidence
    if (updateHistory.length > 10) confidence += 0.2;
    else if (updateHistory.length > 5) confidence += 0.1;

    // Clear content context = higher confidence
    if (contentContext.updatePriority && contentContext.contentCategory) {
      confidence += 0.1;
    }

    // Consistent update patterns = higher confidence
    if (updateHistory.length > 3) {
      const recentSuccessRate = updateHistory.slice(-5)
        .filter(update => !update.validation_status || update.validation_status === 'approved')
        .length / Math.min(5, updateHistory.length);
      confidence += recentSuccessRate * 0.2;
    }

    return Math.min(1.0, confidence);
  }

  /**
   * Detect and resolve conflicts in update process
   */
  async detectAndResolveConflicts(updateData, existingPulse, relatedPulses = []) {
    const conflicts = [];
    const resolutions = [];

    // Data source conflict detection
    if (updateData.source !== existingPulse.source_name && updateData.confidence !== 'high') {
      conflicts.push({
        type: 'data_source_conflict',
        description: `New data from ${updateData.source} conflicts with established source ${existingPulse.source_name}`,
        severity: 'medium',
        oldSource: existingPulse.source_name,
        newSource: updateData.source
      });
    }

    // Scale conflict detection
    const oldNumeric = this.extractNumericValue(existingPulse.current_value);
    const newNumeric = this.extractNumericValue(updateData.value);
    
    if (oldNumeric && newNumeric) {
      const changePercent = Math.abs((newNumeric - oldNumeric) / oldNumeric);
      
      if (changePercent > 0.5) { // 50% change threshold
        conflicts.push({
          type: 'scale_conflict',
          description: `Large change detected: ${changePercent.toFixed(1)}% from ${oldNumeric} to ${newNumeric}`,
          severity: changePercent > 1.0 ? 'high' : 'medium',
          changePercent,
          oldValue: oldNumeric,
          newValue: newNumeric
        });
      }
    }

    // Semantic conflict detection
    const semanticConflict = await this.detectSemanticConflict(
      existingPulse.current_value,
      updateData.value,
      existingPulse.surrounding_sentences
    );
    
    if (semanticConflict.hasConflict) {
      conflicts.push({
        type: 'semantic_conflict',
        description: semanticConflict.description,
        severity: semanticConflict.severity,
        details: semanticConflict.details
      });
    }

    // Timing conflict detection
    const timingConflict = this.detectTimingConflict(existingPulse, updateData);
    if (timingConflict) {
      conflicts.push(timingConflict);
    }

    // Cluster consistency conflicts
    if (relatedPulses.length > 0) {
      const clusterConflicts = await this.detectClusterConflicts(updateData, relatedPulses);
      conflicts.push(...clusterConflicts);
    }

    // Generate resolutions for each conflict
    for (const conflict of conflicts) {
      const resolution = await this.generateConflictResolution(conflict, updateData, existingPulse);
      resolutions.push(resolution);
    }

    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      resolutions,
      overallSeverity: this.calculateOverallSeverity(conflicts),
      recommendedAction: this.getRecommendedAction(conflicts, resolutions)
    };
  }

  /**
   * Detect semantic conflicts using AI analysis
   */
  async detectSemanticConflict(oldValue, newValue, context) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 300,
          responseMimeType: "application/json",
        },
      });

      const conflictPrompt = `Analyze whether this data update creates a semantic conflict.

OLD VALUE: "${oldValue}"
NEW VALUE: "${newValue}"
CONTEXT: "${context}"

Check for:
1. Logical inconsistencies (price up vs market down)
2. Temporal impossibilities (future dates in past tense)
3. Scale inappropriateness (dramatic changes without context)
4. Tonal mismatches (positive context with negative data)

Return JSON:
{
  "hasConflict": true|false,
  "severity": "low|medium|high",
  "description": "specific conflict description",
  "details": {
    "logicalInconsistency": true|false,
    "temporalIssue": true|false,
    "scaleIssue": true|false,
    "tonalMismatch": true|false
  }
}`;

      const result = await model.generateContent(conflictPrompt);
      return JSON.parse(result.response.text());
    } catch (error) {
      console.error('Semantic conflict detection error:', error);
      return { hasConflict: false, severity: 'low', description: 'Analysis failed' };
    }
  }

  /**
   * Detect timing-based conflicts
   */
  detectTimingConflict(existingPulse, updateData) {
    const now = new Date();
    const lastUpdate = new Date(existingPulse.last_updated || existingPulse.updated_at);
    const timeSinceUpdate = (now - lastUpdate) / (1000 * 60); // Minutes

    // Too frequent updates
    if (timeSinceUpdate < existingPulse.update_frequency * 0.5) {
      return {
        type: 'timing_conflict',
        description: `Update attempted ${timeSinceUpdate.toFixed(0)} minutes after last update (frequency: ${existingPulse.update_frequency} minutes)`,
        severity: 'medium',
        timeSinceUpdate,
        expectedFrequency: existingPulse.update_frequency
      };
    }

    return null;
  }

  /**
   * Detect conflicts within semantic clusters
   */
  async detectClusterConflicts(updateData, relatedPulses) {
    const conflicts = [];

    // Check for mathematical inconsistencies
    for (const relatedPulse of relatedPulses) {
      // If this is a percentage change pulse, verify it matches the primary data
      if (relatedPulse.pulse_type === 'percentage' && updateData.metadata?.referencePrice) {
        const calculatedPercent = this.calculateExpectedPercentage(
          updateData.value,
          updateData.metadata.referencePrice
        );
        
        const currentPercent = this.extractNumericValue(relatedPulse.current_value);
        
        if (Math.abs(calculatedPercent - currentPercent) > 0.5) { // 0.5% tolerance
          conflicts.push({
            type: 'cluster_mathematical_conflict',
            description: `Percentage mismatch: expected ${calculatedPercent.toFixed(1)}% but current shows ${currentPercent}%`,
            severity: 'high',
            expectedValue: calculatedPercent,
            currentValue: currentPercent,
            relatedPulseId: relatedPulse.id
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * Generate resolution strategy for conflicts
   */
  async generateConflictResolution(conflict, updateData, existingPulse) {
    const strategy = this.conflictResolutionStrategies[conflict.type] || 'manual_review';
    
    switch (strategy) {
      case 'prioritize_authoritative_source':
        return {
          strategy: 'prioritize_authoritative_source',
          action: updateData.confidence === 'high' ? 'proceed_with_update' : 'keep_existing',
          reasoning: `Prioritizing ${updateData.confidence === 'high' ? 'new authoritative' : 'existing'} source`,
          confidence: 'high'
        };

      case 'adaptive_frequency_adjustment':
        const newFrequency = Math.max(existingPulse.update_frequency * 1.5, 60);
        return {
          strategy: 'adaptive_frequency_adjustment',
          action: 'adjust_frequency_and_proceed',
          newFrequency,
          reasoning: `Adjusting update frequency to ${newFrequency} minutes to reduce conflicts`,
          confidence: 'medium'
        };

      case 'preserve_meaning_over_data':
        return {
          strategy: 'preserve_meaning_over_data',
          action: 'semantic_validation_required',
          reasoning: 'Semantic conflict detected, require human validation',
          confidence: 'low'
        };

      case 'validate_against_historical_range':
        return {
          strategy: 'validate_against_historical_range',
          action: conflict.severity === 'high' ? 'flag_for_review' : 'proceed_with_warning',
          reasoning: `${conflict.changePercent?.toFixed(1)}% change ${conflict.severity === 'high' ? 'exceeds' : 'within'} acceptable range`,
          confidence: conflict.severity === 'high' ? 'low' : 'medium'
        };

      default:
        return {
          strategy: 'manual_review',
          action: 'flag_for_manual_review',
          reasoning: 'Complex conflict requires human intervention',
          confidence: 'low'
        };
    }
  }

  /**
   * Calculate overall severity of all conflicts
   */
  calculateOverallSeverity(conflicts) {
    if (!conflicts.length) return 'none';
    
    const severities = conflicts.map(c => c.severity);
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  /**
   * Get recommended action based on conflicts and resolutions
   */
  getRecommendedAction(conflicts, resolutions) {
    if (!conflicts.length) return 'proceed';
    
    const highSeverity = conflicts.some(c => c.severity === 'high');
    const requiresReview = resolutions.some(r => r.action.includes('review'));
    
    if (highSeverity || requiresReview) return 'manual_review_required';
    
    const canProceed = resolutions.every(r => 
      ['proceed_with_update', 'proceed_with_warning', 'adjust_frequency_and_proceed'].includes(r.action)
    );
    
    return canProceed ? 'proceed_with_adjustments' : 'manual_review_recommended';
  }

  /**
   * Utility: Extract numeric value from text
   */
  extractNumericValue(text) {
    if (!text) return null;
    const match = text.toString().match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(/,/g, '')) : null;
  }

  /**
   * Utility: Calculate expected percentage from two values
   */
  calculateExpectedPercentage(newValue, referenceValue) {
    const newNum = this.extractNumericValue(newValue);
    const refNum = this.extractNumericValue(referenceValue);
    if (!newNum || !refNum) return 0;
    return Math.abs(((newNum - refNum) / refNum) * 100);
  }
}

// Initialize smart update rules engine
const smartUpdateRules = new SmartUpdateRules();

/**
 * Update a single pulse point (enhanced with smart update rules)
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

  console.log('Updating single pulse with smart rules:', { pulseType, specificType, currentValue });

  // Get enhanced context and update history
  let fullContext = await getEnhancedContext(pulseId, articleContext, surroundingText);
  const updateHistory = await getUpdateHistory(pulseId);
  const existingPulse = await getPulseDetails(pulseId);

  // Calculate smart refresh rate
  const smartRefresh = smartUpdateRules.calculateSmartRefreshRate(
    pulseType, 
    specificType, 
    currentValue, 
    updateHistory,
    {
      updatePriority: fullContext.pulseMetadata.priority || 'medium',
      contentCategory: fullContext.contentCategory || 'factual',
      hasTemporalReferences: Boolean(fullContext.pulseMetadata.temporalReferences),
      hasComparativeElements: Boolean(fullContext.pulseMetadata.comparativeElements)
    }
  );

  // Check if update is needed based on smart refresh rate
  if (existingPulse && !shouldUpdateBasedOnSmartRules(existingPulse, smartRefresh)) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        reason: 'update_not_needed',
        smartRefresh,
        nextUpdateDue: calculateNextUpdateTime(existingPulse, smartRefresh),
        currentValue
      }),
    };
  }

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
        currentValue,
        smartRefresh
      }),
    };
  }

  // Enhanced conflict detection and resolution
  const conflictAnalysis = await smartUpdateRules.detectAndResolveConflicts(
    newData, 
    existingPulse, 
    [] // Related pulses would be fetched here for cluster analysis
  );

  if (conflictAnalysis.hasConflicts && conflictAnalysis.recommendedAction === 'manual_review_required') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        reason: 'conflicts_detected',
        conflicts: conflictAnalysis.conflicts,
        resolutions: conflictAnalysis.resolutions,
        recommendedAction: conflictAnalysis.recommendedAction,
        originalValue: currentValue,
        attemptedValue: newData.value,
        smartRefresh
      }),
    };
  }

  // Generate contextual update that preserves style and meaning
  const updateResult = await generateContextualUpdate({
    originalValue: currentValue,
    newData,
    staticPrefix,
    staticSuffix,
    fullContext,
    pulseType
  });

  // Enhanced validation with smart rules
  const validation = await validateUpdateWithSmartRules({
    originalValue: currentValue,
    updatedValue: updateResult.updatedValue,
    context: fullContext,
    pulseType,
    dataSource: newData,
    conflictAnalysis,
    smartRefresh
  });

  if (!validation.isValid) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Enhanced validation failed',
        validationError: validation.reason,
        originalValue: currentValue,
        attemptedValue: updateResult.updatedValue,
        suggestions: validation.suggestions,
        smartRefresh,
        conflictAnalysis
      }),
    };
  }

  // Apply any frequency adjustments from conflict resolution
  const adjustedFrequency = conflictAnalysis.resolutions
    .find(r => r.newFrequency)?.newFrequency || smartRefresh.refreshRateMinutes;

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
      smartUpdateRules: {
        smartRefresh,
        conflictAnalysis,
        adjustedFrequency,
        nextUpdateDue: new Date(Date.now() + adjustedFrequency * 60000).toISOString()
      }
    }),
  };
}

/**
 * Update an entire semantic cluster atomically (enhanced with smart rules)
 */
async function updateSemanticCluster(requestData, headers) {
  const { clusterId, triggerPulseId } = requestData;

  console.log('Updating semantic cluster with smart rules:', { clusterId, triggerPulseId });

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

  // Get update history for smart refresh calculation
  const clusterUpdateHistory = await getClusterUpdateHistory(clusterId);
  
  // Calculate smart refresh rate for the cluster
  const clusterSmartRefresh = smartUpdateRules.calculateSmartRefreshRate(
    primaryPulse.pulse_type,
    primaryPulse.specific_type,
    primaryPulse.current_value,
    clusterUpdateHistory,
    {
      updatePriority: cluster.update_priority || 'medium',
      contentCategory: 'comparative', // Clusters are typically comparative
      hasTemporalReferences: true,
      hasComparativeElements: true
    }
  );

  // Check if cluster update is needed
  if (!shouldUpdateClusterBasedOnSmartRules(cluster, clusterSmartRefresh)) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        reason: 'cluster_update_not_needed',
        clusterId,
        smartRefresh: clusterSmartRefresh,
        nextUpdateDue: calculateNextClusterUpdateTime(cluster, clusterSmartRefresh)
      }),
    };
  }

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
        primaryPulseId: primaryPulse.id,
        smartRefresh: clusterSmartRefresh
      }),
    };
  }

  // Enhanced cluster conflict detection
  const clusterConflictAnalysis = await smartUpdateRules.detectAndResolveConflicts(
    newPrimaryData,
    primaryPulse,
    cluster.pulses.filter(p => p.id !== primaryPulse.id)
  );

  if (clusterConflictAnalysis.hasConflicts && 
      clusterConflictAnalysis.recommendedAction === 'manual_review_required') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        reason: 'cluster_conflicts_detected',
        clusterId,
        conflicts: clusterConflictAnalysis.conflicts,
        resolutions: clusterConflictAnalysis.resolutions,
        smartRefresh: clusterSmartRefresh
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

  // Enhanced cluster validation with smart rules
  const clusterValidation = await validateClusterUpdateWithSmartRules({
    cluster,
    updates: clusterUpdates,
    primaryData: newPrimaryData,
    conflictAnalysis: clusterConflictAnalysis,
    smartRefresh: clusterSmartRefresh
  });

  if (!clusterValidation.isValid) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Enhanced cluster validation failed',
        validationErrors: clusterValidation.errors,
        clusterId,
        attemptedUpdates: clusterUpdates,
        smartRefresh: clusterSmartRefresh
      }),
    };
  }

  // Apply any frequency adjustments from conflict resolution
  const adjustedFrequency = clusterConflictAnalysis.resolutions
    .find(r => r.newFrequency)?.newFrequency || clusterSmartRefresh.refreshRateMinutes;

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
        updateMethod: 'semantic-cluster',
        smartUpdateRules: {
          smartRefresh: clusterSmartRefresh,
          conflictAnalysis: clusterConflictAnalysis,
          adjustedFrequency,
          nextUpdateDue: new Date(Date.now() + adjustedFrequency * 60000).toISOString()
        }
      }
    }),
  };
}

/**
 * Get enhanced context for better updates (existing function preserved)
 */
async function getEnhancedContext(pulseId, articleContext, surroundingText) {
  let context = {
    articleContext: articleContext || '',
    surroundingText: surroundingText || '',
    location: null,
    articleTitle: '',
    pulseMetadata: {},
    contentCategory: 'factual'
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
          emotion: pulse.emotion,
          priority: pulse.update_priority || 'medium',
          temporalReferences: pulse.temporal_references,
          comparativeElements: pulse.comparative_elements
        };
        
        // Determine content category from context
        if (context.articleTitle.toLowerCase().includes('breaking') || 
            context.surroundingText.toLowerCase().includes('urgent')) {
          context.contentCategory = 'breaking_news';
        } else if (context.surroundingText.includes('compared to') || 
                   context.surroundingText.includes('versus')) {
          context.contentCategory = 'comparative';
        } else if (context.articleTitle.toLowerCase().includes('analysis')) {
          context.contentCategory = 'analysis';
        }
      }
    } catch (error) {
      console.warn('Could not fetch enhanced context:', error);
    }
  }

  return context;
}

/**
 * Get update history for smart refresh calculations
 */
async function getUpdateHistory(pulseId, limit = 20) {
  if (!pulseId) return [];
  
  try {
    const { data: history } = await supabase
      .from('pulse_updates')
      .select('*')
      .eq('pulse_id', pulseId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    return history || [];
  } catch (error) {
    console.warn('Could not fetch update history:', error);
    return [];
  }
}

/**
 * Get cluster update history
 */
async function getClusterUpdateHistory(clusterId, limit = 20) {
  if (!clusterId) return [];
  
  try {
    const { data: history } = await supabase
      .from('pulse_updates')
      .select('*')
      .eq('cluster_id', clusterId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    return history || [];
  } catch (error) {
    console.warn('Could not fetch cluster update history:', error);
    return [];
  }
}

/**
 * Get pulse details for conflict analysis
 */
async function getPulseDetails(pulseId) {
  if (!pulseId) return null;
  
  try {
    const { data: pulse } = await supabase
      .from('pulses')
      .select('*')
      .eq('id', pulseId)
      .single();
    
    return pulse;
  } catch (error) {
    console.warn('Could not fetch pulse details:', error);
    return null;
  }
}

/**
 * Check if update is needed based on smart rules
 */
function shouldUpdateBasedOnSmartRules(existingPulse, smartRefresh) {
  if (!existingPulse.last_updated) return true;
  
  const lastUpdate = new Date(existingPulse.last_updated);
  const now = new Date();
  const timeSinceUpdate = (now - lastUpdate) / (1000 * 60); // Minutes
  
  return timeSinceUpdate >= smartRefresh.refreshRateMinutes;
}

/**
 * Check if cluster update is needed based on smart rules
 */
function shouldUpdateClusterBasedOnSmartRules(cluster, smartRefresh) {
  if (!cluster.updated_at) return true;
  
  const lastUpdate = new Date(cluster.updated_at);
  const now = new Date();
  const timeSinceUpdate = (now - lastUpdate) / (1000 * 60); // Minutes
  
  return timeSinceUpdate >= smartRefresh.refreshRateMinutes;
}

/**
 * Calculate next update time for single pulse
 */
function calculateNextUpdateTime(existingPulse, smartRefresh) {
  const lastUpdate = new Date(existingPulse.last_updated || existingPulse.updated_at);
  return new Date(lastUpdate.getTime() + smartRefresh.refreshRateMinutes * 60000).toISOString();
}

/**
 * Calculate next update time for cluster
 */
function calculateNextClusterUpdateTime(cluster, smartRefresh) {
  const lastUpdate = new Date(cluster.updated_at);
  return new Date(lastUpdate.getTime() + smartRefresh.refreshRateMinutes * 60000).toISOString();
}

/**
 * Generate contextual update that preserves style and meaning (existing function preserved)
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
 * Enhanced validation with smart rules integration
 */
async function validateUpdateWithSmartRules({ originalValue, updatedValue, context, pulseType, dataSource, conflictAnalysis, smartRefresh }) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500,
        responseMimeType: "application/json",
      },
    });

    const validationPrompt = `You are validating whether a content update maintains semantic coherence using enhanced smart rules.

ORIGINAL VALUE: "${originalValue}"
UPDATED VALUE: "${updatedValue}"
CONTEXT: "${context.surroundingText}"
CONTENT TYPE: ${pulseType}
DATA SOURCE: ${dataSource.source} (confidence: ${dataSource.confidence})

SMART RULES ANALYSIS:
- Refresh Rate: ${smartRefresh.refreshRateMinutes} minutes (${smartRefresh.reasoning})
- Volatility Factor: ${smartRefresh.volatilityFactor}
- Context Factor: ${smartRefresh.contextFactor}
- Conflicts Detected: ${conflictAnalysis.hasConflicts ? conflictAnalysis.conflicts.length : 0}

ENHANCED VALIDATION CRITERIA:
1. Grammatical correctness: Does the update fit grammatically?
2. Semantic coherence: Does the meaning remain logical?
3. Tone consistency: Is the emotional context preserved?
4. Scale appropriateness: Is the new value reasonable in context?
5. Factual plausibility: Does the update make factual sense?
6. SMART RULES: Do conflicts align with resolution strategies?
7. FREQUENCY: Is the update timing appropriate?
8. VOLATILITY: Does the change match expected volatility patterns?

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
    "factual": true|false,
    "smartRulesAlignment": true|false,
    "frequencyAppropriate": true|false,
    "volatilityExpected": true|false
  },
  "suggestions": ["list of suggestions if invalid"],
  "riskLevel": "low|medium|high",
  "smartRulesAssessment": {
    "conflictResolutionEffective": true|false,
    "refreshRateOptimal": true|false,
    "volatilityPredictionAccurate": true|false
  }
}

ENHANCED REJECTION CRITERIA:
- Smart rules indicate high conflict risk
- Frequency violation without valid override
- Volatility pattern mismatch
- Scale changes beyond smart thresholds
- Conflict resolution strategy failed

APPROVE if the update passes both traditional and smart rules validation.`;

    const result = await model.generateContent(validationPrompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Enhanced validation error:', error);
    return {
      isValid: false,
      confidence: 'low',
      reason: 'Enhanced validation system error',
      checks: {},
      suggestions: ['Manual review required due to enhanced validation system error'],
      riskLevel: 'high'
    };
  }
}

/**
 * Enhanced cluster validation with smart rules
 */
async function validateClusterUpdateWithSmartRules({ cluster, updates, primaryData, conflictAnalysis, smartRefresh }) {
  const validation = {
    isValid: true,
    confidence: 'high',
    errors: [],
    warnings: [],
    smartRulesAssessment: {
      clusterCoherence: true,
      mathematicalConsistency: true,
      semanticAlignment: true,
      conflictResolution: true
    }
  };

  // Enhanced validation with smart rules
  
  // Check that all updates are mathematically consistent
  for (const update of updates) {
    if (update.confidence === 'error') {
      validation.isValid = false;
      validation.errors.push(`Update failed for pulse ${update.pulseId}: ${update.reasoning}`);
      validation.smartRulesAssessment.mathematicalConsistency = false;
    }
  }

  // Validate conflict resolution effectiveness
  if (conflictAnalysis.hasConflicts) {
    const unresolvedHighSeverity = conflictAnalysis.conflicts
      .filter(c => c.severity === 'high')
      .filter(c => !conflictAnalysis.resolutions.find(r => r.action.includes('proceed')));
    
    if (unresolvedHighSeverity.length > 0) {
      validation.isValid = false;
      validation.errors.push('High-severity conflicts remain unresolved');
      validation.smartRulesAssessment.conflictResolution = false;
    }
  }

  // Check for semantic coherence across the cluster using smart rules
  if (cluster.cluster_type === 'mathematical') {
    const primaryUpdate = updates.find(u => u.role === 'primary');
    const dependentUpdates = updates.filter(u => u.role === 'dependent');
    
    if (primaryUpdate && dependentUpdates.length > 0) {
      // Verify mathematical relationships make sense with smart volatility expectations
      for (const dep of dependentUpdates) {
        if (dep.confidence === 'low' && smartRefresh.volatilityFactor < 0.5) {
          validation.warnings.push(`Low confidence in dependent calculation for pulse ${dep.pulseId} during high volatility period`);
          validation.smartRulesAssessment.semanticAlignment = false;
        }
      }
    }
  }

  // Validate timing appropriateness based on smart refresh rules
  const timingValidation = validateClusterTiming(cluster, smartRefresh);
  if (!timingValidation.isValid) {
    validation.warnings.push(timingValidation.warning);
  }

  // Validate scale changes are within smart rules expectations
  const scaleValidation = validateClusterScale(updates, smartRefresh);
  if (!scaleValidation.isValid) {
    validation.errors.push(scaleValidation.error);
    validation.isValid = false;
    validation.smartRulesAssessment.clusterCoherence = false;
  }

  if (validation.errors.length > 0) {
    validation.isValid = false;
    validation.confidence = 'low';
  } else if (validation.warnings.length > 0) {
    validation.confidence = 'medium';
  }

  return validation;
}

/**
 * Validate cluster timing based on smart rules
 */
function validateClusterTiming(cluster, smartRefresh) {
  // Check if cluster update timing aligns with smart refresh recommendations
  const now = new Date();
  const lastUpdate = new Date(cluster.updated_at || now);
  const timeSinceUpdate = (now - lastUpdate) / (1000 * 60); // Minutes
  
  const expectedMinTime = smartRefresh.refreshRateMinutes * 0.8;
  const expectedMaxTime = smartRefresh.refreshRateMinutes * 1.5;
  
  if (timeSinceUpdate < expectedMinTime) {
    return {
      isValid: false,
      warning: `Cluster update may be too frequent: ${timeSinceUpdate.toFixed(0)} minutes since last update (expected minimum: ${expectedMinTime.toFixed(0)} minutes)`
    };
  }
  
  if (timeSinceUpdate > expectedMaxTime && smartRefresh.volatilityFactor < 0.7) {
    return {
      isValid: true,
      warning: `Cluster update may be overdue during high volatility period: ${timeSinceUpdate.toFixed(0)} minutes since last update`
    };
  }
  
  return { isValid: true };
}

/**
 * Validate cluster scale changes based on smart rules
 */
function validateClusterScale(updates, smartRefresh) {
  const primaryUpdate = updates.find(u => u.role === 'primary');
  if (!primaryUpdate) return { isValid: true };
  
  const oldValue = smartUpdateRules.extractNumericValue(primaryUpdate.originalValue);
  const newValue = smartUpdateRules.extractNumericValue(primaryUpdate.updatedValue);
  
  if (oldValue && newValue) {
    const changePercent = Math.abs((newValue - oldValue) / oldValue);
    
    // Adjust acceptable change threshold based on volatility
    const maxAcceptableChange = smartRefresh.volatilityFactor > 0.7 ? 0.2 : 0.5; // 20% or 50%
    
    if (changePercent > maxAcceptableChange) {
      return {
        isValid: false,
        error: `Cluster primary value change (${(changePercent * 100).toFixed(1)}%) exceeds acceptable threshold (${(maxAcceptableChange * 100).toFixed(1)}%) for current volatility level`
      };
    }
  }
  
  return { isValid: true };
}

/**
 * Calculate all dependent updates in a semantic cluster (existing function preserved)
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
 * Calculate a dependent value based on relationship rules (existing function preserved)
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
 * Calculate percentage change between values (existing function preserved)
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
 * Calculate direction (up/down/stable) based on comparison (existing function preserved)
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
 * Calculate comparison (warmer/cooler, higher/lower, etc.) (existing function preserved)
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
 * Custom calculation based on specific rules (existing function preserved)
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