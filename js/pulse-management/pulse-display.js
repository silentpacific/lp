// js/pulse-management/pulse-display.js - Pulse List UI & Controls
// Handles the display and interaction with pulse points in the UI

import { formatFrequency } from '../core/utils.js';

/**
 * Pulse Display Manager
 * Manages the visual display and interaction with pulse points and clusters
 */
export class PulseDisplay {
    constructor() {
        this.app = null;
        this.selectedPulses = new Set();
        this.sortBy = 'id';
        this.sortOrder = 'asc';
        this.viewMode = 'detailed'; // detailed, compact, grid
    }

    /**
     * Initialize with app reference
     */
    init(app) {
        this.app = app;
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for pulse interactions
     */
    setupEventListeners() {
        // View mode controls
        const viewModeButtons = document.querySelectorAll('[data-view-mode]');
        viewModeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.setViewMode(e.target.dataset.viewMode);
            });
        });

        // Sort controls
        const sortControls = document.querySelectorAll('[data-sort-by]');
        sortControls.forEach(control => {
            control.addEventListener('click', (e) => {
                this.setSortBy(e.target.dataset.sortBy);
            });
        });

        // Bulk selection
        const selectAllBtn = document.getElementById('select-all-pulses');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAll());
        }

        const clearSelectionBtn = document.getElementById('clear-selection');
        if (clearSelectionBtn) {
            clearSelectionBtn.addEventListener('click', () => this.clearSelection());
        }
    }

    /**
     * Update the main pulse list display
     */
    updatePulseList(pulses = [], clusters = []) {
        const pulseList = document.getElementById('pulse-list');
        if (!pulseList) return;

        if (pulses.length === 0 && clusters.length === 0) {
            pulseList.innerHTML = this.getEmptyStateHTML();
            return;
        }

        // Sort pulses and clusters
        const sortedPulses = this.sortPulses([...pulses]);
        const sortedClusters = this.sortClusters([...clusters]);

        let listHTML = '';

        // Display clusters first
        sortedClusters.forEach(cluster => {
            listHTML += this.generateClusterCard(cluster, pulses);
        });

        // Display individual pulses
        const individualPulses = sortedPulses.filter(p => !p.clusterId);
        individualPulses.forEach(pulse => {
            listHTML += this.generatePulseCard(pulse);
        });

        pulseList.innerHTML = listHTML;
        this.updateSelectionUI();
    }

    /**
     * Generate HTML for empty state
     */
    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <div class="empty-icon">🎯</div>
                <h3>No pulse points created yet</h3>
                <p>Analyze some text to get started with dynamic content!</p>
                <div class="empty-actions">
                    <button onclick="document.getElementById('selected-text').focus()" class="btn btn-primary">
                        Start Analyzing
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Generate cluster card HTML
     */
    generateClusterCard(cluster, allPulses) {
        const clusterPulses = allPulses.filter(p => p.clusterId === cluster.id);
        const primaryPulse = clusterPulses.find(p => p.isPrimaryInCluster);
        const isOverdue = primaryPulse && new Date(primaryPulse.nextUpdate) < new Date();
        const statusIcon = cluster.isActive ? '🔗' : '⏸️';
        const overdueWarning = isOverdue ? ' ⚠️ OVERDUE' : '';

        const cardClass = this.viewMode === 'compact' ? 'cluster-item compact' : 'cluster-item detailed';

        return `
            <div class="${cardClass}" data-cluster-id="${cluster.id}">
                <div class="cluster-header">
                    <div class="cluster-title">
                        <input type="checkbox" class="cluster-checkbox" data-cluster-id="${cluster.id}" 
                               ${this.isClusterSelected(cluster.id) ? 'checked' : ''}>
                        <h4>${statusIcon} ${cluster.name}</h4>
                    </div>
                    <div class="cluster-badges">
                        <span class="cluster-type-badge ${cluster.type}">${cluster.type}</span>
                        <span class="pulse-count-badge">${clusterPulses.length} pulses</span>
                        <span class="priority-badge ${cluster.priority || 'medium'}">${cluster.priority || 'medium'}</span>
                        <span class="confidence-badge ${cluster.confidence || 'medium'}">${cluster.confidence || 'medium'}</span>
                    </div>
                </div>

                ${this.viewMode === 'detailed' ? `
                    <p class="cluster-description">${cluster.semanticRule}</p>
                    <div class="cluster-pulses">
                        ${clusterPulses.map(pulse => `
                            <div class="cluster-pulse-item ${pulse.role}" data-pulse-id="${pulse.id}">
                                <span class="pulse-role">${pulse.role}</span>
                                <span class="pulse-value">"${pulse.currentValue}"</span>
                                <span class="pulse-confidence ${pulse.confidence}">${this.getConfidenceIcon(pulse.confidence)}</span>
                                <span class="pulse-source">${this.truncateText(pulse.dataSource, 20)}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="cluster-summary">
                        <span class="primary-value">${primaryPulse?.currentValue || 'No primary'}</span>
                        <span class="update-info">${formatFrequency(primaryPulse?.updateFrequency || 0)}</span>
                    </div>
                `}

                <div class="cluster-meta">
                    <span>Updates: Every ${formatFrequency(primaryPulse?.updateFrequency || 60)}</span>
                    <span>Next: ${primaryPulse ? new Date(primaryPulse.nextUpdate).toLocaleTimeString() : 'N/A'}${overdueWarning}</span>
                    <span>Quality: ${primaryPulse?.sourceQuality || 'unknown'}</span>
                </div>

                <div class="cluster-actions">
                    <button onclick="window.livePulseApp.testClusterUpdate('${cluster.id}')" 
                            class="btn btn-small btn-primary" title="Update cluster">
                        🔄 Update
                    </button>
                    <button onclick="window.livePulseApp.toggleCluster('${cluster.id}')" 
                            class="btn btn-small ${cluster.isActive ? 'btn-warning' : 'btn-success'}" 
                            title="${cluster.isActive ? 'Pause' : 'Resume'} cluster">
                        ${cluster.isActive ? '⏸️ Pause' : '▶️ Resume'}
                    </button>
                    <button onclick="window.livePulseApp.editCluster('${cluster.id}')" 
                            class="btn btn-small btn-info" title="Edit cluster">
                        ✏️ Edit
                    </button>
                    <button onclick="window.livePulseApp.removeCluster('${cluster.id}')" 
                            class="btn btn-small btn-danger" title="Remove cluster">
                        🗑️ Remove
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Generate individual pulse card HTML
     */
    generatePulseCard(pulse) {
        const nextUpdate = new Date(pulse.nextUpdate);
        const isOverdue = nextUpdate < new Date();
        const statusIcon = pulse.isActive ? '🔄' : '⏸️';
        const overdueWarning = isOverdue ? ' ⚠️ OVERDUE' : '';
        
        const cardClass = this.viewMode === 'compact' ? 'pulse-item compact' : 'pulse-item detailed';

        return `
            <div class="${cardClass}" data-pulse-id="${pulse.id}">
                <div class="pulse-header">
                    <div class="pulse-title">
                        <input type="checkbox" class="pulse-checkbox" data-pulse-id="${pulse.id}" 
                               ${this.selectedPulses.has(pulse.id) ? 'checked' : ''}>
                        <h4>${statusIcon} Pulse #${pulse.id}: ${this.formatCategoryName(pulse.pulseType)}</h4>
                    </div>
                    <div class="pulse-badges">
                        <span class="confidence-badge-list ${pulse.confidence}">${this.getConfidenceIcon(pulse.confidence)} ${pulse.confidence}</span>
                        <span class="source-quality-badge ${pulse.sourceQuality || 'unknown'}">${pulse.sourceQuality || 'unknown'}</span>
                        <span class="priority-badge ${pulse.priority || 'medium'}">${pulse.priority || 'medium'}</span>
                    </div>
                </div>

                <div class="pulse-text-preview ${this.viewMode}">
                    <span class="static-text">${pulse.staticPrefix}</span>
                    <span class="dynamic-text highlighted">${pulse.currentValue}</span>
                    <span class="static-text">${pulse.staticSuffix}</span>
                </div>

                ${this.viewMode === 'detailed' ? `
                    <div class="pulse-meta detailed">
                        <div class="meta-row">
                            <span class="meta-label">Type:</span>
                            <span class="meta-value">${pulse.specificType}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Source:</span>
                            <span class="meta-value">${this.truncateText(pulse.dataSource, 30)}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Frequency:</span>
                            <span class="meta-value">${formatFrequency(pulse.updateFrequency)}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Last Updated:</span>
                            <span class="meta-value">${new Date(pulse.lastUpdated).toLocaleString()}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Next Update:</span>
                            <span class="meta-value ${isOverdue ? 'overdue' : ''}">${nextUpdate.toLocaleString()}${overdueWarning}</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Updates:</span>
                            <span class="meta-value">${pulse.updateCount} completed</span>
                        </div>
                        <div class="meta-row">
                            <span class="meta-label">Context:</span>
                            <span class="meta-value">${pulse.contextRelevance || 'medium'}</span>
                        </div>
                    </div>
                    <div class="pulse-reasoning">
                        <strong>Reasoning:</strong> ${pulse.reasoning}
                    </div>
                    ${pulse.tags && pulse.tags.length > 0 ? `
                        <div class="pulse-tags">
                            ${pulse.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                ` : `
                    <div class="pulse-meta compact">
                        <span>${formatFrequency(pulse.updateFrequency)}</span>
                        <span>${pulse.updateCount} updates</span>
                        <span class="${isOverdue ? 'overdue' : ''}">${nextUpdate.toLocaleTimeString()}${overdueWarning}</span>
                    </div>
                `}

                <div class="pulse-actions">
                    <button onclick="window.livePulseApp.testPulseUpdate(${pulse.id})" 
                            class="btn btn-small btn-primary" title="Update now">
                        🔄 Update
                    </button>
                    <button onclick="window.livePulseApp.togglePulse(${pulse.id})" 
                            class="btn btn-small ${pulse.isActive ? 'btn-warning' : 'btn-success'}" 
                            title="${pulse.isActive ? 'Pause' : 'Resume'} pulse">
                        ${pulse.isActive ? '⏸️ Pause' : '▶️ Resume'}
                    </button>
                    <button onclick="window.livePulseApp.editPulse(${pulse.id})" 
                            class="btn btn-small btn-info" title="Edit pulse">
                        ✏️ Edit
                    </button>
                    <button onclick="window.livePulseApp.removePulse(${pulse.id})" 
                            class="btn btn-small btn-danger" title="Remove pulse">
                        🗑️ Remove
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Set view mode (detailed, compact, grid)
     */
    setViewMode(mode) {
        this.viewMode = mode;
        
        // Update active button
        document.querySelectorAll('[data-view-mode]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.viewMode === mode);
        });

        // Update display
        this.app.updatePulseList();
    }

    /**
     * Set sort criteria
     */
    setSortBy(field) {
        if (this.sortBy === field) {
            this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortBy = field;
            this.sortOrder = 'asc';
        }

        // Update sort indicators
        this.updateSortIndicators();

        // Update display
        this.app.updatePulseList();
    }

    /**
     * Update sort indicators in UI
     */
    updateSortIndicators() {
        document.querySelectorAll('[data-sort-by]').forEach(control => {
            const isActive = control.dataset.sortBy === this.sortBy;
            control.classList.toggle('active', isActive);
            
            if (isActive) {
                const indicator = control.querySelector('.sort-indicator');
                if (indicator) {
                    indicator.textContent = this.sortOrder === 'asc' ? '↑' : '↓';
                }
            }
        });
    }

    /**
     * Sort pulses based on current criteria
     */
    sortPulses(pulses) {
        return pulses.sort((a, b) => {
            let aValue, bValue;

            switch (this.sortBy) {
                case 'id':
                    aValue = a.id;
                    bValue = b.id;
                    break;
                case 'type':
                    aValue = a.pulseType || '';
                    bValue = b.pulseType || '';
                    break;
                case 'confidence':
                    aValue = this.getConfidenceScore(a.confidence);
                    bValue = this.getConfidenceScore(b.confidence);
                    break;
                case 'priority':
                    aValue = this.getPriorityScore(a.priority);
                    bValue = this.getPriorityScore(b.priority);
                    break;
                case 'frequency':
                    aValue = a.updateFrequency || 0;
                    bValue = b.updateFrequency || 0;
                    break;
                case 'lastUpdated':
                    aValue = new Date(a.lastUpdated);
                    bValue = new Date(b.lastUpdated);
                    break;
                case 'nextUpdate':
                    aValue = new Date(a.nextUpdate);
                    bValue = new Date(b.nextUpdate);
                    break;
                default:
                    aValue = a.id;
                    bValue = b.id;
            }

            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Sort clusters based on current criteria
     */
    sortClusters(clusters) {
        return clusters.sort((a, b) => {
            let aValue, bValue;

            switch (this.sortBy) {
                case 'name':
                    aValue = a.name || '';
                    bValue = b.name || '';
                    break;
                case 'type':
                    aValue = a.type || '';
                    bValue = b.type || '';
                    break;
                case 'confidence':
                    aValue = this.getConfidenceScore(a.confidence);
                    bValue = this.getConfidenceScore(b.confidence);
                    break;
                case 'priority':
                    aValue = this.getPriorityScore(a.priority);
                    bValue = this.getPriorityScore(b.priority);
                    break;
                default:
                    aValue = a.name || '';
                    bValue = b.name || '';
            }

            if (aValue < bValue) return this.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    /**
     * Get numeric confidence score for sorting
     */
    getConfidenceScore(confidence) {
        const scores = { 'high': 3, 'medium': 2, 'low': 1, 'unknown': 0 };
        return scores[confidence] || 0;
    }

    /**
     * Get numeric priority score for sorting
     */
    getPriorityScore(priority) {
        const scores = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return scores[priority] || 2;
    }

    /**
     * Handle pulse selection
     */
    togglePulseSelection(pulseId) {
        if (this.selectedPulses.has(pulseId)) {
            this.selectedPulses.delete(pulseId);
        } else {
            this.selectedPulses.add(pulseId);
        }
        this.updateSelectionUI();
    }

    /**
     * Select all visible pulses
     */
    selectAll() {
        const visiblePulses = this.app.pulses.filter(p => !p.clusterId);
        visiblePulses.forEach(pulse => {
            this.selectedPulses.add(pulse.id);
        });
        this.updateSelectionUI();
    }

    /**
     * Clear all selections
     */
    clearSelection() {
        this.selectedPulses.clear();
        this.updateSelectionUI();
    }

    /**
     * Check if cluster is selected (all pulses in cluster are selected)
     */
    isClusterSelected(clusterId) {
        const clusterPulses = this.app.pulses.filter(p => p.clusterId === clusterId);
        return clusterPulses.length > 0 && clusterPulses.every(p => this.selectedPulses.has(p.id));
    }

    /**
     * Update selection UI elements
     */
    updateSelectionUI() {
        // Update checkboxes
        document.querySelectorAll('.pulse-checkbox').forEach(checkbox => {
            const pulseId = parseInt(checkbox.dataset.pulseId);
            checkbox.checked = this.selectedPulses.has(pulseId);
        });

        document.querySelectorAll('.cluster-checkbox').forEach(checkbox => {
            const clusterId = checkbox.dataset.clusterId;
            checkbox.checked = this.isClusterSelected(clusterId);
        });

        // Update selection counter
        const selectionCounter = document.getElementById('selection-counter');
        if (selectionCounter) {
            const count = this.selectedPulses.size;
            selectionCounter.textContent = count > 0 ? `${count} selected` : '';
            selectionCounter.style.display = count > 0 ? 'inline' : 'none';
        }

        // Update bulk action buttons
        const bulkActions = document.querySelector('.bulk-actions');
        if (bulkActions) {
            bulkActions.style.display = this.selectedPulses.size > 0 ? 'block' : 'none';
        }
    }

    /**
     * Get selected pulse IDs
     */
    getSelectedPulseIds() {
        return Array.from(this.selectedPulses);
    }

    /**
     * Highlight specific pulse
     */
    highlightPulse(pulseId, duration = 3000) {
        const pulseElement = document.querySelector(`[data-pulse-id="${pulseId}"]`);
        if (pulseElement) {
            pulseElement.classList.add('highlighted');
            setTimeout(() => {
                pulseElement.classList.remove('highlighted');
            }, duration);
        }
    }

    /**
     * Scroll to specific pulse
     */
    scrollToPulse(pulseId) {
        const pulseElement = document.querySelector(`[data-pulse-id="${pulseId}"]`);
        if (pulseElement) {
            pulseElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.highlightPulse(pulseId);
        }
    }

    /**
     * Show pulse details in modal or expanded view
     */
    showPulseDetails(pulseId) {
        const pulse = this.app.pulses.find(p => p.id === pulseId);
        if (!pulse) return;

        const detailsHTML = this.generatePulseDetailsHTML(pulse);
        
        // Show in modal if available
        if (this.app.modalManager) {
            this.app.modalManager.show(`Pulse #${pulse.id} Details`, detailsHTML, 'large');
        } else {
            // Fallback: expand in place or show alert
            console.log('Pulse Details:', pulse);
        }
    }

    /**
     * Generate detailed pulse information HTML
     */
    generatePulseDetailsHTML(pulse) {
        return `
            <div class="pulse-details-modal">
                <div class="detail-section">
                    <h3>📝 Content</h3>
                    <div class="detail-item">
                        <label>Original Text:</label>
                        <div class="detail-value">"${pulse.originalText}"</div>
                    </div>
                    <div class="detail-item">
                        <label>Current Value:</label>
                        <div class="detail-value highlighted">"${pulse.currentValue}"</div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>⚙️ Configuration</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Type:</label>
                            <div class="detail-value">${pulse.specificType}</div>
                        </div>
                        <div class="detail-item">
                            <label>Update Frequency:</label>
                            <div class="detail-value">${formatFrequency(pulse.updateFrequency)}</div>
                        </div>
                        <div class="detail-item">
                            <label>Data Source:</label>
                            <div class="detail-value">${pulse.dataSource}</div>
                        </div>
                        <div class="detail-item">
                            <label>Source Quality:</label>
                            <div class="detail-value">${pulse.sourceQuality || 'unknown'}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>📊 Metadata</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Confidence:</label>
                            <div class="detail-value ${pulse.confidence}">${this.getConfidenceIcon(pulse.confidence)} ${pulse.confidence}</div>
                        </div>
                        <div class="detail-item">
                            <label>Priority:</label>
                            <div class="detail-value">${pulse.priority || 'medium'}</div>
                        </div>
                        <div class="detail-item">
                            <label>Context Relevance:</label>
                            <div class="detail-value">${pulse.contextRelevance || 'medium'}</div>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <div class="detail-value">${pulse.isActive ? '✅ Active' : '⏸️ Paused'}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>🕒 Timing</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Last Updated:</label>
                            <div class="detail-value">${new Date(pulse.lastUpdated).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <label>Next Update:</label>
                            <div class="detail-value">${new Date(pulse.nextUpdate).toLocaleString()}</div>
                        </div>
                        <div class="detail-item">
                            <label>Update Count:</label>
                            <div class="detail-value">${pulse.updateCount} completed</div>
                        </div>
                    </div>
                </div>

                ${pulse.reasoning ? `
                    <div class="detail-section">
                        <h3>💭 Reasoning</h3>
                        <div class="detail-value">${pulse.reasoning}</div>
                    </div>
                ` : ''}

                ${pulse.tags && pulse.tags.length > 0 ? `
                    <div class="detail-section">
                        <h3>🏷️ Tags</h3>
                        <div class="tags-display">
                            ${pulse.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Helper methods
     */
    
    getConfidenceIcon(confidence) {
        switch (confidence) {
            case 'high': return '🔥';
            case 'medium': return '⚡';
            case 'low': return '⚠️';
            default: return '❓';
        }
    }

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

    truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * Export current display settings
     */
    exportDisplaySettings() {
        return {
            viewMode: this.viewMode,
            sortBy: this.sortBy,
            sortOrder: this.sortOrder,
            selectedPulses: Array.from(this.selectedPulses)
        };
    }

    /**
     * Import display settings
     */
    importDisplaySettings(settings) {
        this.viewMode = settings.viewMode || 'detailed';
        this.sortBy = settings.sortBy || 'id';
        this.sortOrder = settings.sortOrder || 'asc';
        this.selectedPulses = new Set(settings.selectedPulses || []);
        
        this.updateSortIndicators();
        this.updateSelectionUI();
    }
}