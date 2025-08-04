// LivePulse Article Storage
// js/storage/article-storage.js

// Initialize namespace
window.LivePulse = window.LivePulse || {};
window.LivePulse.Storage = window.LivePulse.Storage || {};
window.LivePulse.Storage.Articles = {};

// ===== ARTICLE STORAGE CLASS =====

class ArticleStorageManager {
    constructor() {
        this.savedArticles = [];
        this.currentArticleId = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the article storage system
     */
    async initialize() {
        if (this.isInitialized) return true;

        try {
            // Wait for storage client to be available
            await this.waitForStorageClient();
            
            // Load existing articles
            await this.loadArticles();
            
            this.isInitialized = true;
            console.log('📚 Article Storage initialized');
            return true;
        } catch (error) {
            console.warn('⚠️ Article Storage initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Wait for storage client to be ready
     */
    async waitForStorageClient() {
        const maxAttempts = 20;
        let attempts = 0;

        while (attempts < maxAttempts) {
            if (window.LivePulse.Storage.isAvailable && window.LivePulse.Storage.isAvailable()) {
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
        }

        throw new Error('Storage client not available');
    }

    /**
     * Save an article
     */
    async saveArticle(articleData) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            // Prepare article data with metadata
            const preparedData = this.prepareArticleData(articleData);
            
            // Save to Supabase
            const result = await window.LivePulse.Storage.articles.save(preparedData);
            
            if (result) {
                // Update local cache
                this.savedArticles.unshift(result);
                this.currentArticleId = result.id;
                
                // Trigger update event
                this.dispatchEvent('articleSaved', { article: result });
                
                return result;
            } else {
                throw new Error('Save operation returned no result');
            }
        } catch (error) {
            console.error('Save article error:', error);
            throw new Error(`Failed to save article: ${error.message}`);
        }
    }

    /**
     * Load all articles
     */
    async loadArticles(limit = 50) {
        try {
            if (!window.LivePulse.Storage.isAvailable()) {
                console.warn('Storage not available, using empty article list');
                this.savedArticles = [];
                return [];
            }

            const articles = await window.LivePulse.Storage.articles.getAll(limit);
            this.savedArticles = articles || [];
            
            // Trigger update event
            this.dispatchEvent('articlesLoaded', { articles: this.savedArticles });
            
            return this.savedArticles;
        } catch (error) {
            console.error('Load articles error:', error);
            this.savedArticles = [];
            return [];
        }
    }

    /**
     * Load a specific article by ID
     */
    async loadArticle(articleId) {
        try {
            const article = await window.LivePulse.Storage.articles.getById(articleId);
            
            if (article) {
                this.currentArticleId = articleId;
                
                // Trigger update event
                this.dispatchEvent('articleLoaded', { article });
                
                return article;
            } else {
                throw new Error('Article not found');
            }
        } catch (error) {
            console.error('Load article error:', error);
            throw new Error(`Failed to load article: ${error.message}`);
        }
    }

    /**
     * Update an existing article
     */
    async updateArticle(articleId, updateData) {
        try {
            const result = await window.LivePulse.Storage.articles.update(articleId, updateData);
            
            if (result) {
                // Update local cache
                const index = this.savedArticles.findIndex(a => a.id === articleId);
                if (index !== -1) {
                    this.savedArticles[index] = result;
                }
                
                // Trigger update event
                this.dispatchEvent('articleUpdated', { article: result });
                
                return result;
            } else {
                throw new Error('Update operation returned no result');
            }
        } catch (error) {
            console.error('Update article error:', error);
            throw new Error(`Failed to update article: ${error.message}`);
        }
    }

    /**
     * Delete an article
     */
    async deleteArticle(articleId) {
        try {
            const success = await window.LivePulse.Storage.articles.delete(articleId);
            
            if (success) {
                // Remove from local cache
                this.savedArticles = this.savedArticles.filter(a => a.id !== articleId);
                
                // Clear current article if it was deleted
                if (this.currentArticleId === articleId) {
                    this.currentArticleId = null;
                }
                
                // Trigger update event
                this.dispatchEvent('articleDeleted', { articleId });
                
                return true;
            } else {
                throw new Error('Delete operation failed');
            }
        } catch (error) {
            console.error('Delete article error:', error);
            throw new Error(`Failed to delete article: ${error.message}`);
        }
    }

    /**
     * Search articles
     */
    async searchArticles(searchTerm, limit = 20) {
        try {
            if (!searchTerm || searchTerm.trim() === '') {
                return this.savedArticles.slice(0, limit);
            }

            // Try database search first
            let results = [];
            if (window.LivePulse.Storage.isAvailable()) {
                results = await window.LivePulse.Storage.articles.search(searchTerm, limit);
            }

            // Fallback to local search if database search fails
            if (results.length === 0) {
                results = this.searchLocal(searchTerm, limit);
            }

            return results;
        } catch (error) {
            console.error('Search articles error:', error);
            // Fallback to local search
            return this.searchLocal(searchTerm, limit);
        }
    }

    /**
     * Local search in cached articles
     */
    searchLocal(searchTerm, limit = 20) {
        const term = searchTerm.toLowerCase();
        
        return this.savedArticles.filter(article => {
            return article.title.toLowerCase().includes(term) ||
                   article.raw_content.toLowerCase().includes(term) ||
                   (article.metadata?.tags && 
                    article.metadata.tags.some(tag => 
                        tag.toLowerCase().includes(term)
                    )) ||
                   (article.metadata?.category && 
                    article.metadata.category.toLowerCase().includes(term));
        }).slice(0, limit);
    }

    /**
     * Get recent articles
     */
    getRecentArticles(limit = 5) {
        return this.savedArticles.slice(0, limit);
    }

    /**
     * Get current article
     */
    getCurrentArticle() {
        if (!this.currentArticleId) return null;
        return this.savedArticles.find(a => a.id === this.currentArticleId);
    }

    /**
     * Prepare article data for saving
     */
    prepareArticleData(data) {
        const utils = window.LivePulse.Utils;
        
        return {
            title: data.title || utils.extractArticleTitle(data.content) || 'Untitled Article',
            content_html: data.contentHtml || data.content.replace(/\n/g, '<br>'),
            raw_content: data.content || '',
            author_id: data.author || null,
            pulse_count: data.pulseCount || 0,
            last_pulse_update: data.pulseCount > 0 ? new Date().toISOString() : null,
            article_context: data.category || null,
            metadata: {
                tags: data.tags || [],
                category: data.category || null,
                author: data.author || null,
                pulseAnalysis: data.pulseAnalysis || {
                    totalPulses: 0,
                    totalClusters: 0,
                    pulsePoints: [],
                    clusters: []
                },
                savedAt: new Date().toISOString(),
                version: '1.0'
            }
        };
    }

    /**
     * Export article data
     */
    exportArticle(articleId, format = 'json') {
        const article = this.savedArticles.find(a => a.id === articleId);
        if (!article) {
            throw new Error('Article not found');
        }

        switch (format.toLowerCase()) {
            case 'json':
                return this.exportAsJSON(article);
            case 'html':
                return this.exportAsHTML(article);
            case 'markdown':
                return this.exportAsMarkdown(article);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Export as JSON
     */
    exportAsJSON(article) {
        const exportData = {
            title: article.title,
            content: article.raw_content,
            metadata: article.metadata,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        
        const filename = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
        this.downloadBlob(blob, filename);
    }

    /**
     * Export as HTML
     */
    exportAsHTML(article) {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${article.title}</title>
    <style>
        body { 
            font-family: Georgia, serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 2rem; 
            color: #333; 
        }
        h1, h2, h3 { color: #2c3e50; }
        .metadata { 
            color: #666; 
            font-size: 0.9rem; 
            border-bottom: 1px solid #eee; 
            padding-bottom: 1rem; 
            margin-bottom: 2rem; 
        }
    </style>
</head>
<body>
    <div class="metadata">
        <strong>Author:</strong> ${article.metadata?.author || 'Unknown'}<br>
        <strong>Category:</strong> ${article.metadata?.category || 'None'}<br>
        <strong>Created:</strong> ${new Date(article.created_at).toLocaleString()}<br>
        <strong>Pulse Points:</strong> ${article.pulse_count || 0}
    </div>
    
    <article>
        ${article.content_html}
    </article>
    
    <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #eee; color: #666; text-align: center;">
        <p>Exported from LivePulse on ${new Date().toLocaleString()}</p>
    </footer>
</body>
</html>`;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const filename = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        this.downloadBlob(blob, filename);
    }

    /**
     * Export as Markdown
     */
    exportAsMarkdown(article) {
        const markdown = `# ${article.title}

**Author:** ${article.metadata?.author || 'Unknown'}  
**Category:** ${article.metadata?.category || 'None'}  
**Created:** ${new Date(article.created_at).toLocaleString()}  
**Pulse Points:** ${article.pulse_count || 0}

---

${article.raw_content}

---

*Exported from LivePulse on ${new Date().toLocaleString()}*`;

        const blob = new Blob([markdown], { type: 'text/markdown' });
        const filename = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        this.downloadBlob(blob, filename);
    }

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get storage statistics
     */
    getStats() {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        return {
            total: this.savedArticles.length,
            recent: this.savedArticles.filter(a => new Date(a.created_at) > last30Days).length,
            withPulses: this.savedArticles.filter(a => a.pulse_count > 0).length,
            categories: this.getCategoryStats(),
            totalPulses: this.savedArticles.reduce((sum, a) => sum + (a.pulse_count || 0), 0)
        };
    }

    /**
     * Get category statistics
     */
    getCategoryStats() {
        const stats = {};
        this.savedArticles.forEach(article => {
            const category = article.metadata?.category || 'uncategorized';
            stats[category] = (stats[category] || 0) + 1;
        });
        return stats;
    }

    /**
     * Dispatch custom events
     */
    dispatchEvent(eventName, detail = {}) {
        const event = new CustomEvent(`livepulse:${eventName}`, {
            detail: detail,
            bubbles: true
        });
        document.dispatchEvent(event);
    }
}

// ===== GLOBAL INSTANCE =====
window.LivePulse.Storage.Articles.manager = new ArticleStorageManager();

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Save article
 */
window.LivePulse.Storage.Articles.save = async function(articleData) {
    return await this.manager.saveArticle(articleData);
};

/**
 * Load all articles
 */
window.LivePulse.Storage.Articles.loadAll = async function(limit = 50) {
    return await this.manager.loadArticles(limit);
};

/**
 * Load specific article
 */
window.LivePulse.Storage.Articles.load = async function(articleId) {
    return await this.manager.loadArticle(articleId);
};

/**
 * Update article
 */
window.LivePulse.Storage.Articles.update = async function(articleId, data) {
    return await this.manager.updateArticle(articleId, data);
};

/**
 * Delete article
 */
window.LivePulse.Storage.Articles.delete = async function(articleId) {
    return await this.manager.deleteArticle(articleId);
};

/**
 * Search articles
 */
window.LivePulse.Storage.Articles.search = async function(searchTerm, limit = 20) {
    return await this.manager.searchArticles(searchTerm, limit);
};

/**
 * Get recent articles
 */
window.LivePulse.Storage.Articles.getRecent = function(limit = 5) {
    return this.manager.getRecentArticles(limit);
};

/**
 * Export article
 */
window.LivePulse.Storage.Articles.export = function(articleId, format = 'json') {
    return this.manager.exportArticle(articleId, format);
};

/**
 * Get statistics
 */
window.LivePulse.Storage.Articles.getStats = function() {
    return this.manager.getStats();
};

// ===== BACKWARD COMPATIBILITY FUNCTIONS =====

/**
 * Legacy save article function
 */
window.saveArticle = async function() {
    const articleContent = document.getElementById('article-content')?.value.trim();
    if (!articleContent) {
        window.showError('Please enter article content before saving.');
        return;
    }

    // Show save modal (will be implemented in modal-manager.js)
    if (window.LivePulse.UI && window.LivePulse.UI.Modals) {
        window.LivePulse.UI.Modals.showSaveArticleModal(articleContent);
    } else {
        // Fallback: prompt for basic info
        const title = prompt('Article title:', window.LivePulse.Utils.extractArticleTitle(articleContent));
        if (title) {
            try {
                const result = await window.LivePulse.Storage.Articles.save({
                    title: title,
                    content: articleContent,
                    pulseCount: window.pulses ? window.pulses.length : 0
                });
                
                window.showSuccess(`✅ Article "${title}" saved successfully!`);
                return result;
            } catch (error) {
                window.showError('Failed to save article: ' + error.message);
            }
        }
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Auto-initialize when DOM is ready
    setTimeout(async () => {
        try {
            await window.LivePulse.Storage.Articles.manager.initialize();
        } catch (error) {
            console.warn('Article storage initialization failed:', error);
        }
    }, 500);
    
    console.log('📚 LivePulse Article Storage loaded');
});

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LivePulse.Storage.Articles;
}