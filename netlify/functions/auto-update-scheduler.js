// Universal Auto-Update Scheduler with Semantic Cluster Support
// netlify/functions/auto-update-scheduler.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  console.log('🔄 Auto-update scheduler starting...');
  
  const startTime = new Date();
  const results = {
    processed: 0,
    successful: 0,
    failed: 0,
    skipped: 0,
    clusters: 0,
    singlePulses: 0,
    errors: [],
    details: []
  };

  try {
    // Find all due updates organized by priority
    const dueUpdates = await findDueUpdates();
    
    if (dueUpdates.clusters.length === 0 && dueUpdates.singlePulses.length === 0) {
      console.log('✅ No updates due at this time');
      return buildSuccessResponse(results, startTime, 'No updates due');
    }

    console.log(`📊 Found updates: ${dueUpdates.clusters.length} clusters, ${dueUpdates.singlePulses.length} single pulses`);

    // Process semantic clusters first (higher priority)
    for (const cluster of dueUpdates.clusters) {
      try {
        await processClusterUpdate(cluster, results);
        results.clusters++;
      } catch (error) {
        console.error(`❌ Cluster update failed:`, error);
        results.failed++;
        results.errors.push({
          type: 'cluster',
          clusterId: cluster.id,
          error: error.message
        });
      }
    }

    // Process individual pulse points
    for (const pulse of dueUpdates.singlePulses) {
      try {
        await processSinglePulseUpdate(pulse, results);
        results.singlePulses++;
      } catch (error) {
        console.error(`❌ Single pulse update failed:`, error);
        results.failed++;
        results.errors.push({
          type: 'single_pulse',
          pulseId: pulse.id,
          error: error.message
        });
      }
    }

    // Update cache and cleanup
    await performMaintenanceTasks();

    const duration = new Date() - startTime;
    console.log(`✅ Scheduler completed in ${duration}ms: ${results.successful}/${results.processed} successful`);

    return buildSuccessResponse(results, startTime, 'Updates completed');

  } catch (error) {
    console.error('💥 Scheduler fatal error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        results,
        duration: new Date() - startTime
      })
    };
  }
};

/**
 * Find all pulse points and clusters due for updates
 */
async function findDueUpdates() {
  const now = new Date().toISOString();
  
  // Find clusters due for update (based on primary pulse)
  const { data: dueClusters, error: clusterError } = await supabase
    .from('semantic_clusters')
    .select(`
      id,
      cluster_name,
      cluster_type,
      update_priority,
      semantic_rule,
      primary_pulse_id,
      pulses!inner(
        id,
        pulse_type,
        specific_type,
        current_value,
        next_update,
        update_frequency,
        is_active,
        is_primary_in_cluster
      )
    `)
    .eq('is_active', true)
    .eq('pulses.is_active', true)
    .eq('pulses.is_primary_in_cluster', true)
    .lte('pulses.next_update', now)
    .order('update_priority', { ascending: true }); // Higher priority first

  if (clusterError) {
    console.error('Error fetching due clusters:', clusterError);
  }

  // Find individual pulse points due for update (not part of clusters)
  const { data: duePulses, error: pulseError } = await supabase
    .from('pulses')
    .select(`
      id,
      article_id,
      pulse_type,
      specific_type,
      selected_text,
      current_value,
      static_prefix,
      static_suffix,
      surrounding_sentences,
      article_context,
      prompt_template,
      update_frequency,
      last_updated,
      next_update,
      update_count,
      source_url,
      semantic_cluster_id,
      confidence_score
    `)
    .eq('is_active', true)
    .is('semantic_cluster_id', null) // Only pulses not in clusters
    .lte('next_update', now)
    .order('update_priority', { ascending: false }); // Critical first

  if (pulseError) {
    console.error('Error fetching due pulses:', pulseError);
  }

  return {
    clusters: dueClusters || [],
    singlePulses: duePulses || []
  };
}

/**
 * Process a semantic cluster update
 */
async function processClusterUpdate(cluster, results) {
  console.log(`🔄 Processing cluster: ${cluster.cluster_name} (${cluster.id})`);
  
  const primaryPulse = cluster.pulses[0]; // Primary pulse that triggers update
  const updateStartTime = new Date();

  // Call the update-content function for cluster update
  const updateResponse = await fetch(`${process.env.NETLIFY_URL}/.netlify/functions/update-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clusterId: cluster.id,
      triggerPulseId: primaryPulse.id,
      updateMethod: 'scheduled'
    })
  });

  const updateData = await updateResponse.json();

  if (!updateData.success) {
    throw new Error(`Cluster update failed: ${updateData.error}`);
  }

  // Update all pulse points in the cluster in the database
  const clusterUpdatePromises = updateData.updates.map(async (update) => {
    const nextUpdate = calculateNextUpdate(primaryPulse.update_frequency);
    
    // Update the pulse point
    const { error: updateError } = await supabase
      .from('pulses')
      .update({
        current_value: update.updatedValue,
        last_updated: updateStartTime.toISOString(),
        next_update: nextUpdate.toISOString(),
        update_count: supabase.raw('update_count + 1'),
        source_url: updateData.source
      })
      .eq('id', update.pulseId);

    if (updateError) {
      console.error(`Error updating pulse ${update.pulseId}:`, updateError);
      throw updateError;
    }

    // Log the update history
    await supabase
      .from('pulse_updates')
      .insert({
        pulse_id: update.pulseId,
        cluster_id: cluster.id,
        old_value: update.originalValue,
        new_value: update.updatedValue,
        update_source: updateData.source,
        update_method: 'scheduled',
        validation_status: 'approved',
        cluster_changes: updateData.updates,
        confidence_score: updateData.confidence === 'high' ? 0.9 : updateData.confidence === 'medium' ? 0.7 : 0.5,
        data_source_metadata: updateData.metadata
      });

    return update;
  });

  const completedUpdates = await Promise.all(clusterUpdatePromises);

  // Update cluster timestamp
  await supabase
    .from('semantic_clusters')
    .update({ updated_at: updateStartTime.toISOString() })
    .eq('id', cluster.id);

  results.processed += completedUpdates.length;
  results.successful += completedUpdates.length;
  
  results.details.push({
    type: 'cluster',
    clusterId: cluster.id,
    clusterName: cluster.cluster_name,
    updatesCount: completedUpdates.length,
    primaryPulse: {
      id: primaryPulse.id,
      oldValue: completedUpdates.find(u => u.pulseId === primaryPulse.id)?.originalValue,
      newValue: completedUpdates.find(u => u.pulseId === primaryPulse.id)?.updatedValue
    },
    confidence: updateData.confidence,
    source: updateData.source,
    duration: new Date() - updateStartTime
  });

  console.log(`✅ Cluster updated: ${cluster.cluster_name} (${completedUpdates.length} pulses)`);
}

/**
 * Process a single pulse point update
 */
async function processSinglePulseUpdate(pulse, results) {
  console.log(`🔄 Processing single pulse: ${pulse.specific_type} (${pulse.id})`);
  
  const updateStartTime = new Date();

  // Call the update-content function for single pulse
  const updateResponse = await fetch(`${process.env.NETLIFY_URL}/.netlify/functions/update-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pulseType: pulse.pulse_type,
      specificType: pulse.specific_type,
      currentValue: pulse.current_value,
      articleContext: pulse.article_context,
      promptTemplate: pulse.prompt_template,
      surroundingText: pulse.surrounding_sentences || pulse.selected_text,
      pulseId: pulse.id,
      staticPrefix: pulse.static_prefix,
      staticSuffix: pulse.static_suffix,
      updateMethod: 'scheduled'
    })
  });

  const updateData = await updateResponse.json();

  if (!updateData.success) {
    if (updateData.fallback) {
      // Skip this update due to no available data
      results.skipped++;
      results.details.push({
        type: 'single_pulse_skipped',
        pulseId: pulse.id,
        reason: updateData.error,
        specificType: pulse.specific_type
      });
      console.log(`⏭️ Skipped pulse ${pulse.id}: ${updateData.error}`);
      return;
    }
    
    throw new Error(`Single pulse update failed: ${updateData.error}`);
  }

  // Update the pulse in the database
  const nextUpdate = calculateNextUpdate(pulse.update_frequency);
  
  const { error: updateError } = await supabase
    .from('pulses')
    .update({
      current_value: updateData.updatedValue,
      last_updated: updateStartTime.toISOString(),
      next_update: nextUpdate.toISOString(),
      update_count: pulse.update_count + 1,
      source_url: updateData.source,
      confidence_score: updateData.confidence === 'high' ? 0.9 : updateData.confidence === 'medium' ? 0.7 : 0.5
    })
    .eq('id', pulse.id);

  if (updateError) {
    throw updateError;
  }

  // Log the update history
  await supabase
    .from('pulse_updates')
    .insert({
      pulse_id: pulse.id,
      old_value: pulse.current_value,
      new_value: updateData.updatedValue,
      update_source: updateData.source,
      update_method: 'scheduled',
      validation_status: updateData.validation?.isValid ? 'approved' : 'pending',
      reasoning: updateData.reasoning,
      confidence_score: updateData.confidence === 'high' ? 0.9 : updateData.confidence === 'medium' ? 0.7 : 0.5,
      data_source_metadata: updateData.metadata
    });

  results.processed++;
  results.successful++;
  
  results.details.push({
    type: 'single_pulse',
    pulseId: pulse.id,
    specificType: pulse.specific_type,
    oldValue: pulse.current_value,
    newValue: updateData.updatedValue,
    confidence: updateData.confidence,
    source: updateData.source,
    validation: updateData.validation,
    duration: new Date() - updateStartTime
  });

  console.log(`✅ Pulse updated: ${pulse.specific_type} "${pulse.current_value}" → "${updateData.updatedValue}"`);
}

/**
 * Calculate next update time based on frequency
 */
function calculateNextUpdate(frequencyMinutes) {
  const now = new Date();
  return new Date(now.getTime() + (frequencyMinutes * 60 * 1000));
}

/**
 * Perform maintenance tasks
 */
async function performMaintenanceTasks() {
  try {
    // Clean up old cache entries
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    await supabase
      .from('pulse_data_cache')
      .delete()
      .lt('expires_at', oneDayAgo);

    // Update article pulse counts and last update times
    await supabase.rpc('refresh_article_pulse_stats');

    console.log('🧹 Maintenance tasks completed');
  } catch (error) {
    console.warn('⚠️ Maintenance tasks failed:', error);
  }
}

/**
 * Build standardized success response
 */
function buildSuccessResponse(results, startTime, message) {
  const duration = new Date() - startTime;
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      message,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      summary: {
        processed: results.processed,
        successful: results.successful,
        failed: results.failed,
        skipped: results.skipped,
        successRate: results.processed > 0 ? (results.successful / results.processed * 100).toFixed(1) + '%' : '100%'
      },
      breakdown: {
        clusters: results.clusters,
        singlePulses: results.singlePulses,
        totalPulsePoints: results.processed
      },
      details: results.details,
      errors: results.errors.length > 0 ? results.errors : undefined
    })
  };
}

/**
 * Manual trigger endpoint for testing
 * Usage: POST with { "forceUpdate": true, "pulseId": "uuid" } or { "clusterId": "uuid" }
 */
if (process.env.NODE_ENV === 'development') {
  exports.manualTrigger = async (pulseId, clusterId) => {
    console.log('🔧 Manual trigger activated');
    
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      skipped: 0,
      clusters: 0,
      singlePulses: 0,
      errors: [],
      details: []
    };

    try {
      if (clusterId) {
        // Trigger specific cluster update
        const { data: cluster } = await supabase
          .from('semantic_clusters')
          .select(`
            id,
            cluster_name,
            cluster_type,
            update_priority,
            semantic_rule,
            primary_pulse_id,
            pulses!inner(*)
          `)
          .eq('id', clusterId)
          .single();

        if (cluster) {
          await processClusterUpdate(cluster, results);
          results.clusters++;
        }
      } else if (pulseId) {
        // Trigger specific pulse update
        const { data: pulse } = await supabase
          .from('pulses')
          .select('*')
          .eq('id', pulseId)
          .single();

        if (pulse) {
          await processSinglePulseUpdate(pulse, results);
          results.singlePulses++;
        }
      }

      return { success: true, results };
    } catch (error) {
      return { success: false, error: error.message, results };
    }
  };
}