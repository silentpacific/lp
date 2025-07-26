// Ghost CMS + LivePulse Integration
// netlify/functions/ghost-integration.js

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Ghost Content API configuration
const GHOST_API_URL = process.env.GHOST_API_URL; // e.g., https://yourblog.ghost.io
const GHOST_CONTENT_KEY = process.env.GHOST_CONTENT_KEY;
const GHOST_ADMIN_KEY = process.env.GHOST_ADMIN_KEY;

// Fetch posts from Ghost CMS
async function fetchGhostPosts() {
  try {
    const response = await fetch(
      `${GHOST_API_URL}/ghost/api/v3/content/posts/?key=${GHOST_CONTENT_KEY}&include=tags&limit=all`
    );
    const data = await response.json();
    return data.posts;
  } catch (error) {
    console.error('Error fetching Ghost posts:', error);
    return [];
  }
}

// Import Ghost post into LivePulse system
async function importPostToLivePulse(ghostPost) {
  try {
    // Save to articles table
    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        id: ghostPost.uuid,
        title: ghostPost.title,
        content_html: ghostPost.html,
        raw_content: ghostPost.plaintext || ghostPost.excerpt,
        ghost_post_id: ghostPost.id,
        ghost_slug: ghostPost.slug,
        published_at: ghostPost.published_at,
        updated_at: ghostPost.updated_at,
        ghost_url: ghostPost.url,
        tags: ghostPost.tags?.map(tag => tag.name) || [],
        feature_image: ghostPost.feature_image,
        excerpt: ghostPost.excerpt
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Imported Ghost post: ${ghostPost.title}`);
    return article;
  } catch (error) {
    console.error('Error importing post:', error);
    return null;
  }
}

// Analyze Ghost post for pulse points
async function analyzeGhostPost(article) {
  try {
    const response = await fetch(`${process.env.NETLIFY_URL}/.netlify/functions/analyze-pulse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedText: article.content_html,
        articleContent: article.raw_content,
        articleTitle: article.title,
        mode: 'full_article_scan' // New mode for complete article analysis
      })
    });

    const analysis = await response.json();
    
    if (analysis.success && analysis.pulsePoints) {
      // Save detected pulse points
      for (const pulse of analysis.pulsePoints) {
        await supabase
          .from('pulse_points')
          .insert({
            article_id: article.id,
            pulse_point: pulse.pulse_point,
            action: pulse.action,
            subject: pulse.subject,
            emotion: pulse.emotion,
            entity: pulse.entity,
            sentence: pulse.sentence,
            paragraph: pulse.paragraph,
            source_footnote: pulse.source_footnote,
            superscript_id: pulse.superscript_id,
            frequency: pulse.frequency,
            why_likely_to_change: pulse.why_likely_to_change,
            confidence_score: pulse.confidence_score,
            next_update: calculateNextUpdate(pulse.frequency)
          });
      }
      
      console.log(`Detected ${analysis.pulsePoints.length} pulse points in "${article.title}"`);
    }

    return analysis;
  } catch (error) {
    console.error('Error analyzing post:', error);
    return null;
  }
}

// Update Ghost post with pulse-enhanced content
async function updateGhostPost(articleId, updatedContent) {
  try {
    // Get the Ghost post details
    const { data: article } = await supabase
      .from('articles')
      .select('ghost_post_id, title')
      .eq('id', articleId)
      .single();

    if (!article) throw new Error('Article not found');

    // Update via Ghost Admin API
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({}, Buffer.from(GHOST_ADMIN_KEY.split(':')[1], 'hex'), {
      keyid: GHOST_ADMIN_KEY.split(':')[0],
      algorithm: 'HS256',
      expiresIn: '5m',
      audience: '/v3/admin/'
    });

    const response = await fetch(
      `${GHOST_API_URL}/ghost/api/v3/admin/posts/${article.ghost_post_id}/`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Ghost ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          posts: [{
            html: updatedContent,
            updated_at: new Date().toISOString()
          }]
        })
      }
    );

    if (!response.ok) throw new Error(`Ghost API error: ${response.status}`);

    console.log(`Updated Ghost post: ${article.title}`);
    return true;
  } catch (error) {
    console.error('Error updating Ghost post:', error);
    return false;
  }
}

// Calculate next update time based on frequency
function calculateNextUpdate(frequency) {
  const now = new Date();
  const frequencies = {
    'Live': 15,
    'Hourly': 60,
    'Daily': 1440,
    'Weekly': 10080,
    'Monthly': 43200
  };
  
  const minutes = frequencies[frequency] || 1440;
  return new Date(now.getTime() + (minutes * 60 * 1000));
}

// Main handler for Ghost integration
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { action } = JSON.parse(event.body || '{}');

    switch (action) {
      case 'import_posts':
        const posts = await fetchGhostPosts();
        const imported = [];
        
        for (const post of posts.slice(0, 10)) { // Limit for testing
          const article = await importPostToLivePulse(post);
          if (article) {
            const analysis = await analyzeGhostPost(article);
            imported.push({
              title: post.title,
              pulsePoints: analysis?.pulsePoints?.length || 0
            });
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: `Imported ${imported.length} posts`,
            imported
          })
        };

      case 'sync_post':
        const { ghostPostId } = JSON.parse(event.body);
        // Sync specific post logic here
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true })
        };

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

  } catch (error) {
    console.error('Ghost integration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};