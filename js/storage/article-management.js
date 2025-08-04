// js/storage/article-management.js - Article UI Management & Display
// Handles article selection and management UI

import { ArticleStorage } from './article-storage.js';
import { formatFrequency, extractArticleTitle } from '../core/utils.js';

/**
 * Article Management UI Controller
 * Handles article selection, display, and management interface
 */
export class ArticleManagement {
    constructor() {
        this.storage = new ArticleStorage();
        this.app = null;
        this.currentArticleId = null;
        this.articles = [];
    }

    /**
     * Initialize with app reference
     */
    init(app) {
        this.app = app;
        this.setupEventListeners();
        this.loadArticlesList();
    }

    /**
     * Setup event listeners for article management
     */
    setupEventListeners() {
        // Article selection dropdown
        const articleSelect = document.getElementById('article-select');
        if (articleSelect) {
            articleSelect.addEventListener('change', (e) => {
                this.handleArticleSelection(e.target.value);
            });
        }

        // New article button
        const newArticleBtn = document.getElementById('new-article-btn');
        if (newArticleBtn) {
            newArticleBtn.addEventListener('click', () => {
                this.createNewArticle();
            });
        }

        // Save article button
        const saveArticleBtn = document.getElementById('save-article-btn');
        if (saveArticleBtn) {
            saveArticleBtn.addEventListener('click', () => {
                this.saveCurrentArticle();
            });
        }

        // Delete article button
        const deleteArticleBtn = document.getElementById('delete-article-btn');
        if (deleteArticleBtn) {
            deleteArticleBtn.addEventListener('click', () => {
                this.deleteCurrentArticle();
            });
        }

        // Auto-save on content change (debounced)
        const articleContent = document.getElementById('article-content');
        if (articleContent) {
            let autoSaveTimeout;
            articleContent.addEventListener('input', () => {
                clearTimeout(autoSaveTimeout);
                autoSaveTimeout = setTimeout(() => {
                    this.autoSave();
                }, 5000); // Auto-save after 5 seconds of inactivity
            });
        }
    }

    /**
     * Load articles list from storage and populate dropdown
     */
    async loadArticlesList() {
        try {
            this.articles = await this.storage.getAllArticles();
            this.updateArticleDropdown();
            
            // Load the most recent article if no current selection
            if (!this.currentArticleId && this.articles.length > 0) {
                this.loadArticle(this.articles[0].id);
            }
        } catch (error) {
            console.error('Failed to load articles list:', error);
            this.app?.showError('Failed to load articles: ' + error.message);
        }
    }

    /**
     * Update the article selection dropdown
     */
    updateArticleDropdown() {
        const articleSelect = document.getElementById('article-select');
        if (!articleSelect) return;

        // Clear existing options except the default
        articleSelect.innerHTML = '<option value="">Select an article...</option>';

        // Add articles to dropdown
        this.articles.forEach(article => {
            const option = document.createElement('option');
            option.value = article.id;
            option.textContent = `${article.title} (${new Date(article.updated_at).toLocaleDateString()})`;
            
            if (article.id === this.currentArticleId) {
                option.selected = true;
            }
            
            articleSelect.appendChild(option);
        });

        // Update article info display
        this.updateArticleInfo();
    }

    /**
     * Handle article selection from dropdown
     */
    async handleArticleSelection(articleId) {
        if (!articleId) {
            this.clearArticleEditor();
            return;
        }

        try {
            await this.loadArticle(articleId);
        } catch (error) {
            console.error('Failed to load selected article:', error);
            this.app?.showError('Failed to load article: ' + error.message);
        }
    }

    /**
     * Load an article by ID
     */
    async loadArticle(articleId) {
        if (!articleId) return;

        try {
            const article = await this.storage.getArticle(articleId);
            if (!article) {
                throw new Error('Article not found');
            }

            this.currentArticleId = articleId;
            
            // Populate the editor
            this.populateEditor(article);
            
            // Load associated pulses and clusters
            await this.loadArticlePulses(articleId);
            
            // Update UI
            this.updateArticleInfo();
            this.updateArticleDropdown();
            
            this.app?.showSuccess(`Loaded article: ${article.title}`);
            
        } catch (error) {
            console.error('Failed to load article:', error);
            this.app?.showError('Failed to load article: ' + error.message);
        }
    }

    /**
     * Populate the editor with article content
     */
    populateEditor(article) {
        const articleContent = document.getElementById('article-content');
        if (articleContent) {
            articleContent.value = article.raw_content || '';
        }

        // Trigger preview update
        this.app?.updatePreview();
    }

    /**
     * Load pulses and clusters for the current article
     */
    async loadArticlePulses(articleId) {
        try {
            const { pulses, clusters } = await this.storage.getArticlePulses(articleId);
            
            // Update app state
            this.app.pulses = pulses || [];
            this.app.semanticClusters = clusters || [];
            
            // Update counters
            if (pulses?.length > 0) {
                this.app.pulseCounter = Math.max(...pulses.map(p => p.id)) + 1;
            }
            if (clusters?.length > 0) {
                this.app.clusterCounter = Math.max(...clusters.map(c => parseInt(c.id.split('_')[1]))) + 1;
            }
            
            // Update displays
            this.app?.updateAllDisplays();
            
        } catch (error) {
            console.error('Failed to load article pulses:', error);
            // Don't show error to user for this - just log it
        }
    }

    /**
     * Create a new article
     */
    async createNewArticle() {
        const title = prompt('Enter article title:');
        if (!title?.trim()) return;

        try {
            const articleData = {
                title: title.trim(),
                raw_content: '',
                content_html: '',
                pulse_count: 0
            };

            const articleId = await this.storage.saveArticle(articleData);
            
            // Add to local articles list
            const newArticle = {
                id: articleId,
                ...articleData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.articles.unshift(newArticle);
            this.currentArticleId = articleId;
            
            // Clear current content
            this.clearArticleEditor();
            
            // Update UI
            this.updateArticleDropdown();
            
            this.app?.showSuccess(`Created new article: ${title}`);
            
        } catch (error) {
            console.error('Failed to create article:', error);
            this.app?.showError('Failed to create article: ' + error.message);
        }
    }

    /**
     * Save the current article
     */
    async saveCurrentArticle() {
        if (!this.currentArticleId) {
            this.app?.showError('No article selected to save');
            return;
        }

        try {
            const articleContent = document.getElementById('article-content');
            if (!articleContent) {
                throw new Error('Article content not found');
            }

            const content = articleContent.value;
            const title = extractArticleTitle(content) || 'Untitled Article';

            const articleData = {
                title,
                raw_content: content,
                content_html: this.generateArticleHTML(content),
                pulse_count: this.app?.pulses?.length || 0
            };

            await this.storage.updateArticle(this.currentArticleId, articleData);
            
            // Save associated pulses and clusters
            await this.saveArticlePulses();
            
            // Update local articles list
            const articleIndex = this.articles.findIndex(a => a.id === this.currentArticleId);
            if (articleIndex >= 0) {
                this.articles[articleIndex] = {
                    ...this.articles[articleIndex],
                    ...articleData,
                    updated_at: new Date().toISOString()
                };
            }
            
            this.updateArticleDropdown();
            this.app?.showSuccess('Article saved successfully');
            
        } catch (error) {
            console.error('Failed to save article:', error);
            this.app?.showError('Failed to save article: ' + error.message);
        }
    }

    /**
     * Auto-save the current article (silent)
     */
    async autoSave() {
        if (!this.currentArticleId) return;

        try {
            const articleContent = document.getElementById('article-content');
            if (!articleContent) return;

            const content = articleContent.value;
            const title = extractArticleTitle(content) || 'Untitled Article';

            const articleData = {
                title,
                raw_content: content,
                pulse_count: this.app?.pulses?.length || 0
            };

            await this.storage.updateArticle(this.currentArticleId, articleData);
            
            // Update timestamp in dropdown (subtle indicator)
            this.updateArticleDropdown();
            
        } catch (error) {
            console.error('Auto-save failed:', error);
            // Don't show error to user for auto-save failures
        }
    }

    /**
     * Save pulses and clusters for the current article
     */
    async saveArticlePulses() {
        if (!this.currentArticleId) return;

        try {
            await this.storage.saveArticlePulses(
                this.currentArticleId,
                this.app?.pulses || [],
                this.app?.semanticClusters || []
            );
        } catch (error) {
            console.error('Failed to save article pulses:', error);
            throw error;
        }
    }

    /**
     * Delete the current article
     */
    async deleteCurrentArticle() {
        if (!this.currentArticleId) {
            this.app?.showError('No article selected to delete');
            return;
        }

        const currentArticle = this.articles.find(a => a.id === this.currentArticleId);
        const articleTitle = currentArticle?.title || 'this article';

        if (!confirm(`Are you sure you want to delete "${articleTitle}"? This action cannot be undone.`)) {
            return;
        }

        try {
            await this.storage.deleteArticle(this.currentArticleId);
            
            // Remove from local list
            this.articles = this.articles.filter(a => a.id !== this.currentArticleId);
            
            // Clear current state
            this.currentArticleId = null;
            this.clearArticleEditor();
            
            // Update UI
            this.updateArticleDropdown();
            
            this.app?.showSuccess(`Deleted article: ${articleTitle}`);
            
        } catch (error) {
            console.error('Failed to delete article:', error);
            this.app?.showError('Failed to delete article: ' + error.message);
        }
    }

    /**
     * Clear the article editor
     */
    clearArticleEditor() {
        const articleContent = document.getElementById('article-content');
        if (articleContent) {
            articleContent.value = '';
        }

        // Clear app state
        if (this.app) {
            this.app.pulses = [];
            this.app.semanticClusters = [];
            this.app.currentAnalysis = null;
            this.app.updateAllDisplays();
        }
    }

    /**
     * Generate HTML version of article with pulse points
     */
    generateArticleHTML(content) {
        // This is a simplified version - the full version would be in preview-manager
        let html = content.replace(/\n/g, '<br>');
        
        // Add pulse point highlighting (basic version)
        if (this.app?.pulses) {
            this.app.pulses.forEach(pulse => {
                if (pulse.originalText && html.includes(pulse.originalText)) {
                    html = html.replace(
                        pulse.originalText,
                        `<span class="pulse-point" data-pulse-id="${pulse.id}">${pulse.currentValue}</span>`
                    );
                }
            });
        }
        
        return html;
    }

    /**
     * Update article info display
     */
    updateArticleInfo() {
        const articleInfo = document.getElementById('current-article-info');
        if (!articleInfo) return;

        if (!this.currentArticleId) {
            articleInfo.innerHTML = '<span class="text-muted">No article selected</span>';
            return;
        }

        const article = this.articles.find(a => a.id === this.currentArticleId);
        if (!article) return;

        const lastSaved = new Date(article.updated_at).toLocaleString();
        const pulseCount = this.app?.pulses?.length || 0;
        const clusterCount = this.app?.semanticClusters?.length || 0;

        articleInfo.innerHTML = `
            <div class="article-info-content">
                <div class="article-title">${article.title}</div>
                <div class="article-meta">
                    <span>Last saved: ${lastSaved}</span>
                    <span>Pulses: ${pulseCount}</span>
                    <span>Clusters: ${clusterCount}</span>
                </div>
            </div>
        `;
    }

    /**
     * Get current article data
     */
    getCurrentArticle() {
        if (!this.currentArticleId) return null;
        return this.articles.find(a => a.id === this.currentArticleId);
    }

    /**
     * Get current article ID
     */
    getCurrentArticleId() {
        return this.currentArticleId;
    }

    /**
     * Check if article has unsaved changes
     */
    hasUnsavedChanges() {
        // This would compare current editor content with saved content
        // Implementation depends on specific requirements
        return false;
    }
}