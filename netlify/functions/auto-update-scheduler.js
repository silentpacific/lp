// Automatic pulse updater - runs on schedule
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  console.log('Auto-update scheduler running...');

  try {
    // Find all pulses that are due for updates
    const now = new Date();
    const { data: pulses, error } = await supabase
      .from('pulses')
      .select('*')
      .lt('next_update', now.toISOString())
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    console.log(`Found ${pulses?.length || 0} pulses due for update`);

    if (!pulses || pulses.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'No pulses due for update',
          processed: 0
        })
      };
    }

    const results = [];

    // Process each pulse
    for (const pulse of pulses) {
      try {
        console.log(`Updating pulse ${pulse.id}: ${pulse.specific_type}`);

        // Call the update-content function
        const updateResponse = await fetch(`${process.env.NETLIFY_URL}/.netlify/functions/update-content`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pulseType: pulse.pulse_type,
            specificType: pulse.specific_type,
            currentValue: pulse.current_value,
            promptTemplate: pulse.prompt_template,
            surroundingText: pulse.selected_text // Use original selected text as context
          })
        });

        const updateData = await updateResponse.json();

        if (updateData.success) {
          // Update the pulse in the database
          const nextUpdate = new Date(now.getTime() + (pulse.update_frequency * 60 * 1000));
          
          const { error: updateError } = await supabase
            .from('pulses')
            .update({
              current_value: updateData.updatedValue,
              last_updated: now.toISOString(),
              next_update: nextUpdate.toISOString(),
              update_count: pulse.update_count + 1,
              source_url: updateData.source
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
              source_url: updateData.source,
              reasoning: updateData.reasoning
            });

          results.push({
            pulseId: pulse.id,
            success: true,
            oldValue: pulse.current_value,
            newValue: updateData.updatedValue,
            nextUpdate: nextUpdate.toISOString()
          });

          console.log(`✅ Updated pulse ${pulse.id}: "${pulse.current_value}" → "${updateData.updatedValue}"`);

        } else {
          // Update failed - log error but don't stop processing others
          console.error(`❌ Failed to update pulse ${pulse.id}:`, updateData.error);
          
          results.push({
            pulseId: pulse.id,
            success: false,
            error: updateData.error
          });
        }

      } catch (pulseError) {
        console.error(`❌ Error processing pulse ${pulse.id}:`, pulseError);
        results.push({
          pulseId: pulse.id,
          success: false,
          error: pulseError.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Auto-update completed: ${successCount}/${pulses.length} pulses updated successfully`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Processed ${pulses.length} pulses, ${successCount} successful`,
        processed: pulses.length,
        successful: successCount,
        results: results
      })
    };

  } catch (error) {
    console.error('Auto-update scheduler error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};