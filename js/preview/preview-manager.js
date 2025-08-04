// js/preview/preview-manager.js - Live Preview Generation
// Handles the live preview of articles with pulse points and footnotes

import { formatFrequency } from '../core/utils.js';

/**
 * Preview Manager
 * Manages the live preview display with pulse points, footnotes, and export functionality
 */
export class PreviewManager {
    constructor() {
        this.app = null;
        this.showFootnotes = true;
        this.showSuperscripts = true;
    }

    /**
     * Initialize with app reference
     */
    init(app) {
        this.app = app;
    }

    /**
     * Update the article preview with pulse points highlighted
     */
    update(pulses = [], clusters = []) {
        const articlePreview = document.getElementById('article-preview');
        const articleContent = document.getElementById('article-content');
        
        if (!articlePreview || !articleContent) return;
        
        let content = articleContent.value;
        
        if (!content.trim()) {
            articlePreview.innerHTML = this.getPlaceholderHTML();
            return;
        }

        // Process content with pulse points
        const processedContent = this.processContentWithPulses(content, pulses);
        const footnotes = this.generateFootnotes(pulses, clusters);

        articlePreview.innerHTML = `
            <div class="article-content enhanced">
                ${processedContent}
                ${footnotes}
            </div>
        `;
        
        // Apply display settings
        setTimeout(() => {
            this.applyDisplaySettings();
        }, 50);
    }

    /**
     * Get placeholder HTML for empty content
     */
    getPlaceholderHTML() {
        return `
            <div class="preview-placeholder">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
                <h3>Live Preview</h3>
                <p>Articles with pulse points will appear here with highlighted dynamic content, confidence scores, categories, and automatic footnotes for editorial review.</p>
            </div>
        `;
    }

    /**
     * Process content and replace pulse text with enhanced highlighted versions
     */
    processContentWithPulses(content, pulses) {
        let processedContent = content;
        
        // Sort pulses by originalText length (longest first) to avoid partial replacements
        const sortedPulses = [...pulses].sort((a, b) => 
            (b.originalText?.length || 0) - (a.originalText?.length || 0)
        );

        sortedPulses.forEach(pulse => {
            try {
                const originalText = String(pulse.originalText || '').trim();
                const currentValue = String(pulse.currentValue || '').trim();
                
                // Only proceed if we have valid, clean text
                if (originalText && originalText.length > 0 && processedContent.includes(originalText)) {
                    const replacement = this.createPulseReplacement(pulse);
                    processedContent = processedContent.replace(originalText, replacement);
                }
            } catch (error) {
                console.warn('Error processing pulse for preview:', pulse.id, error);
            }
        });

        // Convert line breaks to HTML
        return processedContent.replace(/\n/g, '<br>');
    }

    /**
     * Create enhanced pulse point replacement HTML
     */
    createPulseReplacement(pulse) {
        let replacement = `<span class="pulse-point enhanced" data-pulse-id="${pulse.id}" title="${pulse.specificType}: ${pulse.reasoning}">`;
        replacement += `${pulse.currentValue}`;
        
        // Add confidence badge
        replacement += `<span class="confidence-badge ${pulse.confidence || 'medium'}" title="Confidence: ${pulse.confidence || 'medium'}">${this.getConfidenceIcon(pulse.confidence)}</span>`;
        
        // Add category tag
        replacement += `<span class="category-tag ${pulse.pulseType || 'unknown'}" title="Category: ${this.formatCategoryName(pulse.pulseType)}">${this.formatCategoryName(pulse.pulseType)}</span>`;
        
        // Add priority indicator if high priority
        if (pulse.priority === 'critical' || pulse.priority === 'high') {
            replacement += `<span class="priority-indicator ${pulse.priority}" title="Priority: ${pulse.priority}">!</span>`;
        }
        
        // Add superscript only if enabled
        if (this.showSuperscripts) {
            replacement += `<sup class="pulse-footnote-ref"><a href="#footnote-${pulse.id}">${pulse.id}</a></sup>`;
        }
        
        replacement += '</span>';
        return replacement;
    }

    /**
     * Generate footnotes section
     */
    generateFootnotes(pulses, clusters) {
        if (!this.showFootnotes || pulses.length === 0) {
            return '';
        }

        let footnotes = '<div class="footnotes-section enhanced"><h4>📝 Pulse Point Sources & Metadata:</h4>';
        
        // Group by clusters
        const clusteredFootnotes = new Map();
        const individualFootnotes = [];
        
        pulses.forEach(pulse => {
            if (pulse.clusterId) {
                if (!clusteredFootnotes.has(pulse.clusterId)) {
                    clusteredFootnotes.set(pulse.clusterId, []);
                }
                clusteredFootnotes.get(pulse.clusterId).push(pulse);
            } else {
                individualFootnotes.push(pulse);
            }
        });
        
        // Display enhanced cluster footnotes
        clusteredFootnotes.forEach((clusterPulses, clusterId) => {
            const cluster = clusters.find(c => c.id === clusterId);
            footnotes += this.generateClusterFootnotes(cluster, clusterPulses);
        });
        
        // Display enhanced individual footnotes
        individualFootnotes.forEach(pulse => {
            footnotes += this.generateIndividualFootnote(pulse);
        });
        
        footnotes += '</div>';
        return footnotes;
    }

    /**
     * Generate cluster footnotes
     */
    generateClusterFootnotes(cluster, clusterPulses) {
        return `
            <div class="footnote-cluster enhanced">
                <div class="cluster-header">
                    <strong>🔗 ${cluster?.name || 'Cluster'}</strong>
                    <span class="cluster-type">${cluster?.type || 'mathematical'}</span>
                    <span class="cluster-confidence ${cluster?.confidence || 'medium'}">${cluster?.confidence || 'medium'}</span>
                </div>
                <div class="cluster-rule">${cluster?.semanticRule || 'Related pulse points that update together'}</div>
                ${clusterPulses.map(pulse => `
                    <div id="footnote-${pulse.id}" class="footnote-item enhanced">
                        <div class="footnote-header">
                            <strong>${pulse.id}.</strong> 
                            <span class="pulse-role ${pulse.role || 'single'}">${(pulse.role || 'single').toUpperCase()}</span>
                            <span class="confidence-indicator ${pulse.confidence || 'medium'}">${this.getConfidenceIcon(pulse.confidence)} ${pulse.confidence || 'medium'}</span>
                            <span class="priority-badge ${pulse.priority || 'medium'}">${pulse.priority || 'medium'}</span>
                        </div>
                        <div class="footnote-content">
                            <span class="current-value">"${pulse.currentValue}"</span> from 
                            <span class="data-source">${pulse.dataSource}</span>
                        </div>
                        <div class="footnote-meta">
                            <span>Category: ${this.formatCategoryName(pulse.pulseType)}</span>
                            <span>Frequency: ${formatFrequency(pulse.updateFrequency)}</span>
                            <span>Updated: ${new Date(pulse.lastUpdated).toLocaleString()}</span>
                            <span>Count: ${pulse.updateCount} updates</span>
                            <span>Quality: ${pulse.sourceQuality || 'unknown'}</span>
                        </div>
                        ${pulse.tags && pulse.tags.length > 0 ? `
                            <div class="footnote-tags">
                                ${pulse.tags.map(tag => `<span class="footnote-tag">${tag}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Generate individual footnote
     */
    generateIndividualFootnote(pulse) {
        return `
            <div id="footnote-${pulse.id}" class="footnote-item enhanced individual">
                <div class="footnote-header">
                    <strong>${pulse.id}.</strong> 
                    <span class="confidence-indicator ${pulse.confidence || 'medium'}">${this.getConfidenceIcon(pulse.confidence)} ${pulse.confidence || 'medium'}</span>
                    <span class="category-badge ${pulse.pulseType || 'unknown'}">${this.formatCategoryName(pulse.pulseType)}</span>
                    <span class="priority-badge ${pulse.priority || 'medium'}">${pulse.priority || 'medium'}</span>
                </div>
                <div class="footnote-content">
                    <span class="current-value">"${pulse.currentValue}"</span> from 
                    <span class="data-source">${pulse.dataSource}</span>
                </div>
                <div class="footnote-meta">
                    <span>Frequency: ${formatFrequency(pulse.updateFrequency)}</span>
                    <span>Updated: ${new Date(pulse.lastUpdated).toLocaleString()}</span>
                    <span>Count: ${pulse.updateCount} updates</span>
                    <span>Quality: ${pulse.sourceQuality || 'unknown'}</span>
                    <span>Context: ${pulse.contextRelevance || 'medium'}</span>
                </div>
                <div class="footnote-reasoning">${pulse.reasoning}</div>
                ${pulse.tags && pulse.tags.length > 0 ? `
                    <div class="footnote-tags">
                        ${pulse.tags.map(tag => `<span class="footnote-tag">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Apply display settings (footnotes and superscripts visibility)
     */
    applyDisplaySettings() {
        const footnotesSection = document.querySelector('.footnotes-section');
        if (footnotesSection) {
            footnotesSection.style.display = this.showFootnotes ? 'block' : 'none';
        }

        const superscripts = document.querySelectorAll('.pulse-footnote-ref');
        superscripts.forEach(sup => {
            sup.style.display = this.showSuperscripts ? 'inline' : 'none';
        });
    }

    /**
     * Toggle footnotes display
     */
    toggleFootnotes() {
        this.showFootnotes = !this.showFootnotes;
        this.applyDisplaySettings();
        this.app?.showSuccess(`Footnotes ${this.showFootnotes ? 'enabled' : 'disabled'}`);
        return this.showFootnotes;
    }

    /**
     * Toggle superscripts display
     */
    toggleSuperscripts() {
        this.showSuperscripts = !this.showSuperscripts;
        this.applyDisplaySettings();
        this.app?.showSuccess(`Superscripts ${this.showSuperscripts ? 'enabled' : 'disabled'}`);
        return this.showSuperscripts;
    }

    /**
     * Export article HTML with pulse points
     */
    exportHtml() {
        const previewContent = document.getElementById('article-preview');
        if (!previewContent) {
            this.app?.showError('No content to export');
            return;
        }

        const articleContent = previewContent.querySelector('.article-content');
        if (!articleContent) {
            this.app?.showError('No article content to export');
            return;
        }

        // Create clean HTML version
        const cleanHtml = this.createCleanHtmlExport(articleContent);
        
        // Create download
        const blob = new Blob([cleanHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.generateFilename();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.app?.showSuccess('Article HTML exported successfully!');
    }

    /**
     * Create clean HTML export
     */
    createCleanHtmlExport(articleContent) {
        const articleInput = document.getElementById('article-content');
        const title = this.extractTitle(articleInput?.value) || 'LivePulse Article';
        
        const cleanContent = articleContent.innerHTML;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        ${this.getExportStyles()}
    </style>
</head>
<body>
    <article>
        ${cleanContent}
    </article>
    
    <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.9rem; color: #6b7280; text-align: center;">
        <p>Generated by <strong>LivePulse</strong> - Intelligent Content Analysis & Automatic Updates</p>
        <p>Export Date: ${new Date().toLocaleString()}</p>
        <p>Pulse Points: ${this.app?.pulses?.length || 0} | Clusters: ${this.app?.semanticClusters?.length || 0}</p>
    </footer>
</body>
</html>`;
    }

    /**
     * Get CSS styles for export
     */
    getExportStyles() {
        return `
            body {
                font-family: 'Georgia', serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 2rem;
                color: #333;
            }
            .pulse-point {
                background: linear-gradient(45deg, #dc2626, #b91c1c);
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-weight: 600;
                position: relative;
                display: inline;
            }
            .pulse-point .confidence-badge {
                background: rgba(255, 255, 255, 0.9);
                color: #dc2626;
                border-radius: 3px;
                padding: 1px 3px;
                font-size: 0.7rem;
                margin-left: 4px;
            }
            .pulse-point .category-tag {
                background: rgba(255, 255, 255, 0.8);
                color: #1f2937;
                border-radius: 3px;
                padding: 1px 3px;
                font-size: 0.6rem;
                margin-left: 2px;
                text-transform: uppercase;
            }
            .pulse-point sup {
                background: rgba(255, 255, 255, 0.95);
                color: #dc2626;
                border-radius: 3px;
                padding: 1px 4px;
                font-size: 0.7rem;
                margin-left: 2px;
            }
            .pulse-point sup a {
                color: #dc2626;
                text-decoration: none;
            }
            .footnotes-section {
                margin-top: 2rem;
                padding-top: 1.5rem;
                border-top: 1px solid #e5e7eb;
            }
            .footnotes-section h4 {
                color: #1f2937;
                margin-bottom: 1rem;
            }
            .footnote-item {
                font-size: 0.9rem;
                color: #4b5563;
                margin-bottom: 1rem;
                padding: 0.5rem;
                border-left: 3px solid #e5e7eb;
            }
            .footnote-cluster {
                margin-bottom: 1.5rem;
                padding: 1rem;
                background: #f9fafb;
                border-radius: 6px;
            }
            .footnote-cluster strong {
                color: #374151;
            }
            .footnote-meta {
                margin-top: 0.5rem;
                font-size: 0.8rem;
                color: #6b7280;
            }
            .footnote-meta span {
                margin-right: 1rem;
            }
            .footnote-tags {
                margin-top: 0.5rem;
            }
            .footnote-tag {
                background: #e5e7eb;
                color: #4b5563;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 0.7rem;
                margin-right: 4px;
            }
            h1, h2, h3, h4, h5, h6 {
                color: #1f2937;
                margin-bottom: 0.5rem;
            }
            p {
                margin-bottom: 1rem;
            }
        `;
    }

    /**
     * Generate filename for export
     */
    generateFilename() {
        const articleInput = document.getElementById('article-content');
        const title = this.extractTitle(articleInput?.value) || 'livepulse-article';
        const date = new Date().toISOString().split('T')[0];
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        return `${slug}-${date}.html`;
    }

    /**
     * Extract title from content
     */
    extractTitle(content) {
        if (!content) return null;
        const lines = content.split('\n');
        const firstLine = lines[0].trim();
        return firstLine.length > 0 && firstLine.length < 100 ? firstLine : null;
    }

    /**
     * Helper method to get confidence icon
     */
    getConfidenceIcon(confidence) {
        switch (confidence) {
            case 'high': return '🔥';
            case 'medium': return '⚡';
            case 'low': return '⚠️';
            default: return '❓';
        }
    }

    /**
     * Helper method to format category names
     */
    formatCategoryName(pulseType) {
        if (!pulseType) return 'Unknown';
        
        const categoryMap = {
            'crypto': 'Crypto',
            'stock': 'Finance',
            'weather': 'Weather',
            'date': 'Temporal',
            'population': 'Demographics',
            'sports': 'Sports',
            'news': 'News',
            'technology': 'Tech',
            'financial': 'Finance',
            'social': 'Social',
            'other': 'General'
        };
        
        return categoryMap[pulseType.toLowerCase()] || pulseType.charAt(0).toUpperCase() + pulseType.slice(1);
    }

    /**
     * Generate preview statistics
     */
    getPreviewStats() {
        return {
            showFootnotes: this.showFootnotes,
            showSuperscripts: this.showSuperscripts,
            pulsesInPreview: this.app?.pulses?.length || 0,
            clustersInPreview: this.app?.semanticClusters?.length || 0,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Reset preview settings to defaults
     */
    resetSettings() {
        this.showFootnotes = true;
        this.showSuperscripts = true;
        this.applyDisplaySettings();
        this.app?.showSuccess('Preview settings reset to defaults');
    }

    /**
     * Get pulse point at cursor position (for interactive features)
     */
    getPulseAtPosition(x, y) {
        const element = document.elementFromPoint(x, y);
        if (!element) return null;
        
        const pulseElement = element.closest('.pulse-point');
        if (!pulseElement) return null;
        
        const pulseId = parseInt(pulseElement.dataset.pulseId);
        return this.app?.pulses?.find(p => p.id === pulseId) || null;
    }

    /**
     * Highlight specific pulse type in preview
     */
    highlightPulseType(pulseType) {
        const pulseElements = document.querySelectorAll(`.pulse-point[data-pulse-type="${pulseType}"]`);
        pulseElements.forEach(element => {
            element.classList.add('highlighted-type');
        });
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
            pulseElements.forEach(element => {
                element.classList.remove('highlighted-type');
            });
        }, 3000);
    }

    /**
     * Show/hide specific confidence levels
     */
    filterByConfidence(confidenceLevel) {
        const allPulses = document.querySelectorAll('.pulse-point');
        
        allPulses.forEach(element => {
            const badge = element.querySelector(`.confidence-badge.${confidenceLevel}`);
            if (confidenceLevel === 'all' || badge) {
                element.style.display = 'inline';
            } else {
                element.style.display = 'none';
            }
        });
    }

    /**
     * Generate preview performance metrics
     */
    getPerformanceMetrics() {
        const startTime = performance.now();
        
        // Measure preview generation time
        this.update(this.app?.pulses || [], this.app?.semanticClusters || []);
        
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        return {
            renderTime: Math.round(renderTime),
            pulseCount: this.app?.pulses?.length || 0,
            clusterCount: this.app?.semanticClusters?.length || 0,
            footnotesEnabled: this.showFootnotes,
            superscriptsEnabled: this.showSuperscripts,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Create preview thumbnail for article management
     */
    generateThumbnail() {
        const preview = document.getElementById('article-preview');
        if (!preview) return null;
        
        // Create a simplified version for thumbnail
        const content = preview.textContent || preview.innerText || '';
        const truncated = content.substring(0, 200) + (content.length > 200 ? '...' : '');
        
        return {
            text: truncated,
            pulseCount: this.app?.pulses?.length || 0,
            clusterCount: this.app?.semanticClusters?.length || 0,
            lastUpdated: new Date().toISOString()
        };
    }
}