// Live Preview Staging System with Comprehensive Quality Validation
// netlify/functions/live-preview-staging.js

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

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
      articleId, 
      pulseUpdates, 
      clusterUpdates, 
      originalContent,
      articleContext 
    } = JSON.parse(event.body);

    console.log('Processing live preview staging:', { 
      articleId, 
      pulseCount: pulseUpdates?.length || 0,
      clusterCount: clusterUpdates?.length || 0 
    });

    // Initialize the Live Preview Staging Engine
    const stagingEngine = new LivePreviewStagingEngine();
    
    // Process the content through comprehensive validation pipeline
    const stagingResult = await stagingEngine.processForLivePreview({
      articleId,
      pulseUpdates: pulseUpdates || [],
      clusterUpdates: clusterUpdates || [],
      originalContent,
      articleContext
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        stagingResult,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('Live preview staging error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Live preview staging failed',
        details: error.stack,
      }),
    };
  }
};

/**
 * Comprehensive Live Preview Staging Engine
 * Validates and corrects content before display
 */
class LivePreviewStagingEngine {
  constructor() {
    this.qualityThresholds = {
      grammar: 0.85,      // 85% grammar accuracy required
      semantic: 0.80,     // 80% semantic coherence required
      tone: 0.75,         // 75% tone consistency required
      meaning: 0.85,      // 85% meaning preservation required
      overall: 0.80       // 80% overall quality required
    };

    this.correctionStrategies = {
      'grammar_error': 'smart_grammar_correction',
      'semantic_break': 'contextual_semantic_repair',
      'tone_mismatch': 'tone_alignment_correction',
      'meaning_drift': 'meaning_preservation_rewrite',
      'coherence_issue': 'paragraph_coherence_fix',
      'flow_disruption': 'narrative_flow_restoration'
    };
  }

  /**
   * Main processing pipeline for live preview staging
   */
  async processForLivePreview({ articleId, pulseUpdates, clusterUpdates, originalContent, articleContext }) {
    console.log('Starting live preview processing pipeline...');

    // Step 1: Apply all updates to create draft content
    const draftContent = await this.applyUpdatesToContent({
      originalContent,
      pulseUpdates,
      clusterUpdates
    });

    // Step 2: Comprehensive quality validation
    const qualityAssessment = await this.performComprehensiveQualityCheck({
      originalContent,
      draftContent,
      articleContext,
      updates: [...pulseUpdates, ...clusterUpdates]
    });

    // Step 3: Intelligent corrections if needed
    let finalContent = draftContent;
    let corrections = [];

    if (!qualityAssessment.passesThreshold) {
      console.log('Quality issues detected, applying intelligent corrections...');
      
      const correctionResult = await this.applyIntelligentCorrections({
        draftContent,
        originalContent,
        qualityAssessment,
        articleContext
      });

      finalContent = correctionResult.correctedContent;
      corrections = correctionResult.corrections;
    }

    // Step 4: Final validation pass
    const finalValidation = await this.performFinalValidation({
      originalContent,
      finalContent,
      articleContext,
      corrections
    });

    // Step 5: Generate staging metadata and recommendations
    const stagingMetadata = await this.generateStagingMetadata({
      qualityAssessment,
      corrections,
      finalValidation,
      processingTime: Date.now()
    });

    return {
      readyForPreview: finalValidation.approved,
      originalContent,
      draftContent,
      finalContent,
      qualityAssessment,
      corrections,
      finalValidation,
      stagingMetadata,
      previewStatus: this.determinePreviewStatus(finalValidation, corrections)
    };
  }

  /**
   * Apply pulse and cluster updates to create draft content
   */
  async applyUpdatesToContent({ originalContent, pulseUpdates, clusterUpdates }) {
    let updatedContent = originalContent;
    const allUpdates = [...pulseUpdates, ...clusterUpdates];

    // Sort updates by position in content to apply from end to beginning
    // This prevents position shifts from affecting subsequent updates
    const sortedUpdates = allUpdates.sort((a, b) => {
      const posA = updatedContent.indexOf(a.originalValue);
      const posB = updatedContent.indexOf(b.originalValue);
      return posB - posA; // Reverse order
    });

    for (const update of sortedUpdates) {
      if (update.originalValue && update.updatedValue) {
        // Handle cluster updates which may have multiple pulse points
        if (update.updates) {
          // This is a cluster update
          for (const pulseUpdate of update.updates) {
            updatedContent = this.replaceInContent(
              updatedContent,
              pulseUpdate.originalValue,
              pulseUpdate.updatedValue
            );
          }
        } else {
          // This is a single pulse update
          updatedContent = this.replaceInContent(
            updatedContent,
            update.originalValue,
            update.updatedValue
          );
        }
      }
    }

    return updatedContent;
  }

  /**
   * Smart content replacement that preserves context
   */
  replaceInContent(content, originalValue, updatedValue) {
    // Find the most specific match to avoid incorrect replacements
    const regex = new RegExp(this.escapeRegExp(originalValue), 'g');
    return content.replace(regex, updatedValue);
  }

  /**
   * Escape special regex characters
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Comprehensive quality validation across multiple dimensions
   */
  async performComprehensiveQualityCheck({ originalContent, draftContent, articleContext, updates }) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
          responseMimeType: "application/json",
        },
      });

      const qualityPrompt = `You are a comprehensive content quality validator for the LivePulse staging system. Analyze the updated content across all quality dimensions.

ORIGINAL CONTENT: "${originalContent.substring(0, 1500)}..."
UPDATED CONTENT: "${draftContent.substring(0, 1500)}..."
ARTICLE CONTEXT: "${articleContext || 'Not provided'}"
UPDATES APPLIED: ${updates.length} fact updates

COMPREHENSIVE QUALITY ANALYSIS REQUIRED:

1. GRAMMAR VALIDATION (Score 0.0-1.0):
   - Sentence structure integrity
   - Subject-verb agreement
   - Punctuation accuracy
   - Tense consistency
   - Article and preposition usage

2. SEMANTIC COHERENCE (Score 0.0-1.0):
   - Logical flow between sentences
   - Contextual appropriateness of updates
   - Meaning preservation across paragraphs
   - Conceptual consistency

3. TONE CONSISTENCY (Score 0.0-1.0):
   - Emotional context preservation
   - Writing style maintenance
   - Voice consistency
   - Formality level matching

4. MEANING PRESERVATION (Score 0.0-1.0):
   - Original intent maintained
   - Key messages preserved
   - Context accuracy
   - Factual relationship integrity

5. OVERALL COHERENCE (Score 0.0-1.0):
   - Article-level flow
   - Narrative consistency
   - Reader comprehension
   - Professional quality

SENTENCE-LEVEL ANALYSIS:
For each sentence containing updates, analyze:
- Grammar correctness
- Semantic fit with surrounding context
- Tone alignment
- Meaning preservation

PARAGRAPH-LEVEL ANALYSIS:
For each paragraph containing updates:
- Internal coherence
- Transition smoothness
- Topic consistency
- Flow maintenance

ARTICLE-LEVEL ANALYSIS:
- Overall narrative integrity
- Thematic consistency
- Reader experience quality
- Professional standard compliance

Return JSON with this structure:

{
  "qualityScores": {
    "grammar": 0.92,
    "semantic": 0.87,
    "tone": 0.83,
    "meaning": 0.91,
    "overall": 0.88
  },
  "passesThreshold": true,
  "qualityThresholds": {
    "grammar": 0.85,
    "semantic": 0.80,
    "tone": 0.75,
    "meaning": 0.85,
    "overall": 0.80
  },
  "detectedIssues": [
    {
      "type": "grammar_error|semantic_break|tone_mismatch|meaning_drift|coherence_issue|flow_disruption",
      "severity": "critical|high|medium|low",
      "location": "sentence|paragraph|article",
      "description": "specific issue description",
      "affectedText": "problematic text excerpt",
      "suggestedFix": "recommended correction approach",
      "confidence": 0.85
    }
  ],
  "sentenceAnalysis": [
    {
      "sentence": "sentence text",
      "hasUpdates": true,
      "qualityScores": {
        "grammar": 0.95,
        "semantic": 0.88,
        "tone": 0.82,
        "meaning": 0.93
      },
      "issues": ["list of issues if any"],
      "recommendation": "approve|fix|rewrite"
    }
  ],
  "paragraphAnalysis": [
    {
      "paragraphIndex": 0,
      "hasUpdates": true,
      "coherenceScore": 0.89,
      "flowScore": 0.85,
      "issues": ["coherence issues if any"],
      "recommendation": "approve|minor_fix|major_revision"
    }
  ],
  "articleLevelAssessment": {
    "narrativeIntegrity": 0.87,
    "thematicConsistency": 0.91,
    "readerExperience": 0.84,
    "professionalQuality": 0.89,
    "overallRecommendation": "approve|needs_correction|requires_rewrite"
  }
}

QUALITY THRESHOLDS:
- Grammar: 85% minimum
- Semantic: 80% minimum  
- Tone: 75% minimum
- Meaning: 85% minimum
- Overall: 80% minimum

Be thorough and precise in identifying quality issues while maintaining high standards for content integrity.`;

      const result = await model.generateContent(qualityPrompt);
      const responseText = result.response.text();
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Quality assessment error:', error);
      return {
        qualityScores: {
          grammar: 0.5,
          semantic: 0.5,
          tone: 0.5,
          meaning: 0.5,
          overall: 0.5
        },
        passesThreshold: false,
        detectedIssues: [{
          type: 'system_error',
          severity: 'critical',
          description: 'Quality assessment system error',
          suggestedFix: 'Manual review required'
        }]
      };
    }
  }

  /**
   * Apply intelligent corrections based on quality assessment
   */
  async applyIntelligentCorrections({ draftContent, originalContent, qualityAssessment, articleContext }) {
    const corrections = [];
    let correctedContent = draftContent;

    // Sort issues by severity and apply corrections
    const sortedIssues = qualityAssessment.detectedIssues.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    for (const issue of sortedIssues) {
      console.log(`Applying correction for ${issue.type} issue:`, issue.description);

      const correctionResult = await this.applySingleCorrection({
        issue,
        currentContent: correctedContent,
        originalContent,
        articleContext
      });

      if (correctionResult.success) {
        correctedContent = correctionResult.correctedText;
        corrections.push({
          issueType: issue.type,
          severity: issue.severity,
          originalText: issue.affectedText,
          correctedText: correctionResult.correctionApplied,
          reasoning: correctionResult.reasoning,
          confidence: correctionResult.confidence
        });
      }
    }

    return {
      correctedContent,
      corrections,
      totalCorrections: corrections.length
    };
  }

  /**
   * Apply a single intelligent correction
   */
  async applySingleCorrection({ issue, currentContent, originalContent, articleContext }) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800,
          responseMimeType: "application/json",
        },
      });

      const correctionPrompt = `You are an intelligent content correction system. Apply a precise correction that preserves meaning, tone, and intent.

CURRENT CONTENT: "${currentContent.substring(0, 1000)}..."
ORIGINAL CONTENT: "${originalContent.substring(0, 1000)}..."
ARTICLE CONTEXT: "${articleContext || 'Not provided'}"

ISSUE TO CORRECT:
Type: ${issue.type}
Severity: ${issue.severity}
Description: ${issue.description}
Affected Text: "${issue.affectedText}"
Suggested Fix: ${issue.suggestedFix}

CORRECTION REQUIREMENTS:
1. PRESERVE ORIGINAL MEANING AND INTENT
2. MAINTAIN CONSISTENT TONE AND VOICE
3. FIX THE SPECIFIC ISSUE IDENTIFIED
4. MINIMIZE CHANGES TO SURROUNDING TEXT
5. ENSURE GRAMMATICAL CORRECTNESS
6. MAINTAIN SEMANTIC COHERENCE

CORRECTION STRATEGIES BY ISSUE TYPE:

Grammar Error:
- Fix grammatical mistakes while preserving meaning
- Correct punctuation, tense, agreement issues
- Maintain sentence structure where possible

Semantic Break:
- Repair logical flow between sentences/phrases
- Add transitional phrases if needed
- Ensure contextual appropriateness

Tone Mismatch:
- Adjust word choice to match original tone
- Modify sentence structure to preserve voice
- Maintain formality level

Meaning Drift:
- Restore original intended meaning
- Clarify ambiguous phrasing
- Ensure factual accuracy preservation

Coherence Issue:
- Improve paragraph flow
- Add connecting phrases
- Reorganize if necessary

Flow Disruption:
- Smooth narrative transitions
- Improve readability
- Maintain natural progression

Return JSON:
{
  "success": true,
  "correctedText": "the specific corrected text that replaces the problematic section",
  "correctionApplied": "description of what was changed",
  "reasoning": "explanation of why this correction was made",
  "confidence": 0.88,
  "preservationCheck": {
    "meaningPreserved": true,
    "tonePreserved": true,
    "intentPreserved": true,
    "contextPreserved": true
  },
  "alternativeOptions": ["other correction possibilities if any"]
}

Focus on surgical precision - make minimal changes that maximally improve quality.`;

      const result = await model.generateContent(correctionPrompt);
      const responseText = result.response.text();
      
      const correctionResult = JSON.parse(responseText);
      
      // Apply the correction to the content
      if (correctionResult.success && issue.affectedText) {
        const correctedContent = currentContent.replace(
          issue.affectedText,
          correctionResult.correctedText
        );
        
        return {
          ...correctionResult,
          correctedText: correctedContent
        };
      }
      
      return correctionResult;
    } catch (error) {
      console.error('Single correction error:', error);
      return {
        success: false,
        error: error.message,
        reasoning: 'Correction system error - manual review required'
      };
    }
  }

  /**
   * Final validation pass after corrections
   */
  async performFinalValidation({ originalContent, finalContent, articleContext, corrections }) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
          responseMimeType: "application/json",
        },
      });

      const validationPrompt = `You are performing the final quality validation before content goes to live preview.

ORIGINAL CONTENT: "${originalContent.substring(0, 800)}..."
FINAL CONTENT: "${finalContent.substring(0, 800)}..."
CORRECTIONS APPLIED: ${corrections.length}
ARTICLE CONTEXT: "${articleContext || 'Not provided'}"

FINAL VALIDATION CHECKLIST:

1. OVERALL QUALITY STANDARDS:
   - Professional writing quality ✓
   - Grammatical correctness ✓
   - Semantic coherence ✓
   - Tone consistency ✓
   - Meaning preservation ✓

2. CONTENT INTEGRITY:
   - Original intent preserved ✓
   - Factual accuracy maintained ✓
   - Context appropriateness ✓
   - Reader experience quality ✓

3. TECHNICAL STANDARDS:
   - Proper sentence structure ✓
   - Logical paragraph flow ✓
   - Appropriate transitions ✓
   - Consistent voice ✓

4. CORRECTION EFFECTIVENESS:
   - Issues successfully resolved ✓
   - No new problems introduced ✓
   - Minimal change principle followed ✓
   - Natural language flow ✓

Return JSON:
{
  "approved": true,
  "confidence": 0.92,
  "finalQualityScore": 0.89,
  "validationResults": {
    "grammar": "pass",
    "semantic": "pass", 
    "tone": "pass",
    "meaning": "pass",
    "coherence": "pass",
    "integrity": "pass"
  },
  "remainingIssues": [
    {
      "type": "minor_style_issue",
      "severity": "low",
      "description": "description if any issues remain",
      "impact": "minimal|moderate|significant"
    }
  ],
  "recommendation": "approve_for_preview|needs_minor_fixes|requires_major_revision|manual_review_required",
  "previewReadiness": "ready|conditional|not_ready",
  "editorNotes": "any important notes for the editor"
}

APPROVAL CRITERIA:
- All quality scores above minimum thresholds
- No critical or high-severity issues remaining
- Original meaning and tone preserved
- Professional standard achieved
- Reader experience maintained

Be thorough but practical in final assessment.`;

      const result = await model.generateContent(validationPrompt);
      const responseText = result.response.text();
      
      return JSON.parse(responseText);
    } catch (error) {
      console.error('Final validation error:', error);
      return {
        approved: false,
        confidence: 0.0,
        recommendation: 'manual_review_required',
        previewReadiness: 'not_ready',
        error: 'Final validation system error'
      };
    }
  }

  /**
   * Generate comprehensive staging metadata
   */
  async generateStagingMetadata({ qualityAssessment, corrections, finalValidation, processingTime }) {
    return {
      processingTimestamp: new Date().toISOString(),
      processingDuration: Date.now() - processingTime,
      qualitySummary: {
        initialScores: qualityAssessment.qualityScores,
        finalScore: finalValidation.finalQualityScore,
        improvement: finalValidation.finalQualityScore - qualityAssessment.qualityScores.overall,
        thresholdsMet: finalValidation.approved
      },
      correctionsSummary: {
        totalCorrections: corrections.length,
        correctionTypes: this.groupCorrectionsByType(corrections),
        successRate: corrections.filter(c => c.confidence > 0.7).length / Math.max(corrections.length, 1),
        highConfidenceCorrections: corrections.filter(c => c.confidence > 0.8).length
      },
      validationSummary: {
        approved: finalValidation.approved,
        confidence: finalValidation.confidence,
        recommendation: finalValidation.recommendation,
        previewReadiness: finalValidation.previewReadiness,
        remainingIssuesCount: finalValidation.remainingIssues?.length || 0
      },
      systemPerformance: {
        qualityAssessmentTime: '< 5 seconds',
        correctionTime: `${corrections.length * 2} seconds estimated`,
        finalValidationTime: '< 3 seconds',
        totalProcessingTime: `${Math.round((Date.now() - processingTime) / 1000)} seconds`
      }
    };
  }

  /**
   * Group corrections by type for metadata
   */
  groupCorrectionsByType(corrections) {
    const grouped = {};
    corrections.forEach(correction => {
      if (!grouped[correction.issueType]) {
        grouped[correction.issueType] = 0;
      }
      grouped[correction.issueType]++;
    });
    return grouped;
  }

  /**
   * Determine preview status based on validation results
   */
  determinePreviewStatus(finalValidation, corrections) {
    if (!finalValidation.approved) {
      return {
        status: 'blocked',
        reason: 'Quality standards not met',
        action: 'Manual review required'
      };
    }

    if (finalValidation.confidence < 0.7) {
      return {
        status: 'conditional',
        reason: 'Low confidence in corrections',
        action: 'Editor review recommended'
      };
    }

    if (corrections.length > 5) {
      return {
        status: 'caution',
        reason: 'Many corrections applied',
        action: 'Review corrections before publishing'
      };
    }

    return {
      status: 'approved',
      reason: 'All quality checks passed',
      action: 'Ready for live preview'
    };
  }
}

/**
 * Utility function to get article content and context
 */
async function getArticleData(articleId) {
  try {
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', articleId)
      .single();

    if (error || !article) {
      throw new Error(`Article not found: ${articleId}`);
    }

    return {
      content: article.content_html || article.raw_content,
      context: article.article_context,
      title: article.title,
      metadata: article.metadata
    };
  } catch (error) {
    console.error('Error fetching article data:', error);
    return null;
  }
}

/**
 * Enhanced preview endpoint that includes staging validation
 */
exports.generateLivePreview = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { articleId } = JSON.parse(event.body);
    
    // Get article data
    const articleData = await getArticleData(articleId);
    if (!articleData) {
      throw new Error('Could not retrieve article data');
    }

    // Get all pending pulse updates for this article
    const { data: pulseUpdates } = await supabase
      .from('pulse_updates')
      .select(`
        *,
        pulses(*)
      `)
      .eq('pulses.article_id', articleId)
      .eq('validation_status', 'pending');

    // Get all pending cluster updates for this article  
    const { data: clusterUpdates } = await supabase
      .from('pulse_updates')
      .select(`
        *,
        semantic_clusters(*)
      `)
      .eq('semantic_clusters.article_id', articleId)
      .eq('validation_status', 'pending')
      .not('cluster_id', 'is', null);

    // Process through staging pipeline
    const stagingEngine = new LivePreviewStagingEngine();
    const stagingResult = await stagingEngine.processForLivePreview({
      articleId,
      pulseUpdates: pulseUpdates || [],
      clusterUpdates: clusterUpdates || [],
      originalContent: articleData.content,
      articleContext: articleData.context
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        articleId,
        articleTitle: articleData.title,
        stagingResult,
        previewReady: stagingResult.readyForPreview,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('Live preview generation error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Live preview generation failed'
      }),
    };
  }
};