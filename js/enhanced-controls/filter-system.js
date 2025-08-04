// js/enhanced-controls/filter-system.js - Search & Filter Functionality
// Provides advanced filtering, searching, and bulk operations for pulse management

import { BulkOperations } from './bulk-operations.js';
import { ImportExport } from './import-export.js';

/**
 * Enhanced Controls System
 * Manages filtering, searching, and bulk operations for pulse points
 */
export class EnhancedControls {
    constructor() {
        this.app = null;
        this.bulkOps = new BulkOperations();
        this.importExport = new ImportExport();
        this.originalPulses = null; // Store original data when filtering
        this.activeFilters = {
            category: 'all',
            confidence: 'all',
            sourceQuality: 'all',
            activeStatus: 'all',
            priority: 'all'
        };
        this.searchTerm = '';
    }

    /**
     * Initialize with app reference
     */
    init(app) {
        this.app = app;
        this.bulkOps.init(app);
        this.importExport.init(app);
    }

    /**
     * Initialize all enhanced controls
     */
    initialize() {
        this.setupFilterControls();
        this.setupSearchControls();
        this.setupBulkControls();
        this.setupImportExportControls();
        this.setupValidationControls();
        console.log('✅ Enhanced controls initialized');
    }

    /**
     * Setup filter controls
     */
    setupFilterControls() {
        // Category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.activeFilters.category = e.target.value;
                this.applyFilters();
            });
        }

        // Confidence filter
        const confidenceFilter = document.getElementById('confidence-filter');
        if (confidenceFilter) {
            confidenceFilter.addEventListener('change', (e) => {
                this.activeFilters.confidence = e.target.value;
                this.applyFilters();
            });
        }

        // Source quality filter
        const sourceFilter = document.getElementById('source-quality-filter');
        if (sourceFilter) {
            sourceFilter.addEventListener('change', (e) => {
                this.activeFilters.sourceQuality = e.target.value;
                this.applyFilters();
            });
        }

        // Active status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.activeFilters.activeStatus = e.target.value;
                this.applyFilters();
            });
        }

        // Priority filter
        const priorityFilter = document.getElementById('priority-filter');
        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.activeFilters.priority = e.target.value;
                this.applyFilters();
            });
        }

        // Clear filters button
        const clearFiltersBtn = document.getElementById('clear-filters-btn');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }

    /**
     * Setup search controls
     */
    setupSearchControls() {
        const searchInput = document.getElementById('pulse-search');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.searchTerm = e.target.value.trim();
                this.applyFilters();
            }, 300));
        }

        const searchClearBtn = document.getElementById('search-clear-btn');
        if (searchClearBtn) {
            searchClearBtn.addEventListener('click', () => {
                this.clearSearch();
            });
        }
    }

    /**
     * Setup bulk operation controls
     */
    setupBulkControls() {
        const bulkUpdateBtn = document.getElementById('bulk-update-btn');
        if (bulkUpdateBtn) {
            bulkUpdateBtn.addEventListener('click', () => {
                this.bulkOps.updateAll();
            });
        }

        const bulkPauseBtn = document.getElementById('bulk-pause-btn');
        if (bulkPauseBtn) {
            bulkPauseBtn.addEventListener('click', () => {
                this.bulkOps.toggleAll(false);
            });
        }

        const bulkResumeBtn = document.getElementById('bulk-resume-btn');
        if (bulkResumeBtn) {
            bulkResumeBtn.addEventListener('click', () => {
                this.bulkOps.toggleAll(true);
            });
        }

        const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
        if (bulkDeleteBtn) {
            bulkDeleteBtn.addEventListener('click', () => {
                this.bulkOps.deleteSelected();
            });
        }
    }

    /**
     * Setup import/export controls
     */
    setupImportExportControls() {
        const exportBtn = document.getElementById('export-config-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.importExport.exportConfig();
            });
        }

        const importInput = document.getElementById('import-config-input');
        if (importInput) {
            importInput.addEventListener('change', (e) => {
                this.importExport.importConfig(e);
            });
        }

        const importBtn = document.getElementById('import-config-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                importInput.click();
            });
        }
    }

    /**
     * Setup validation controls
     */
    setupValidationControls() {
        const validateBtn = document.getElementById('validate-btn');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                this.validateAllPulses();
            });
        }

        const autoFixBtn = document.getElementById('auto-fix-btn');
        if (autoFixBtn) {
            autoFixBtn.addEventListener('click', () => {
                this.autoFixIssues();
            });
        }
    }

    /**
     * Apply all active filters
     */
    applyFilters() {
        if (!this.originalPulses) {
            this.originalPulses = [...this.app.pulses];
        }

        let filteredPulses = [...this.originalPulses];

        // Apply category filter
        if (this.activeFilters.category !== 'all') {
            filteredPulses = filteredPulses.filter(pulse => 
                pulse.pulseType === this.activeFilters.category
            );
        }

        // Apply confidence filter
        if (this.activeFilters.confidence !== 'all') {
            filteredPulses = filteredPulses.filter(pulse => 
                pulse.confidence === this.activeFilters.confidence
            );
        }

        // Apply source quality filter
        if (this.activeFilters.sourceQuality !== 'all') {
            filteredPulses = filteredPulses.filter(pulse => 
                pulse.sourceQuality === this.activeFilters.sourceQuality
            );
        }

        // Apply active status filter
        if (this.activeFilters.activeStatus !== 'all') {
            const isActive = this.activeFilters.activeStatus === 'active';
            filteredPulses = filteredPulses.filter(pulse => 
                pulse.isActive === isActive
            );
        }

        // Apply priority filter
        if (this.activeFilters.priority !== 'all') {
            filteredPulses = filteredPulses.filter(pulse => 
                pulse.priority === this.activeFilters.priority
            );
        }

        // Apply search filter
        if (this.searchTerm) {
            const term = this.searchTerm.toLowerCase();
            filteredPulses = filteredPulses.filter(pulse => 
                this.matchesSearchTerm(pulse, term)
            );
        }

        // Update displayed pulses
        this.app.pulses = filteredPulses;
        this.app.updatePulseList();
        
        // Update filter status
        this.updateFilterStatus(filteredPulses.length, this.originalPulses.length);
    }

    /**
     * Check if pulse matches search term
     */
    matchesSearchTerm(pulse, term) {
        const searchableFields = [
            pulse.currentValue,
            pulse.originalText,
            pulse.specificType,
            pulse.dataSource,
            pulse.reasoning,
            pulse.entity,
            pulse.subject
        ];

        return searchableFields.some(field => 
            field && field.toLowerCase().includes(term)
        );
    }

    /**
     * Clear all filters
     */
    clearAllFilters() {
        // Reset filter values
        this.activeFilters = {
            category: 'all',
            confidence: 'all',
            sourceQuality: 'all',
            activeStatus: 'all',
            priority: 'all'
        };
        this.searchTerm = '';

        // Reset UI controls
        this.resetFilterControls();

        // Restore original data
        if (this.originalPulses) {
            this.app.pulses = [...this.originalPulses];
            this.originalPulses = null;
        }

        this.app.updatePulseList();
        this.updateFilterStatus(this.app.pulses.length, this.app.pulses.length);
        this.app.showSuccess('All filters cleared');
    }

    /**
     * Clear search only
     */
    clearSearch() {
        this.searchTerm = '';
        const searchInput = document.getElementById('pulse-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.applyFilters();
    }

    /**
     * Reset filter control values in UI
     */
    resetFilterControls() {
        const controls = [
            'category-filter',
            'confidence-filter', 
            'source-quality-filter',
            'status-filter',
            'priority-filter'
        ];

        controls.forEach(id => {
            const control = document.getElementById(id);
            if (control) {
                control.value = 'all';
            }
        });

        const searchInput = document.getElementById('pulse-search');
        if (searchInput) {
            searchInput.value = '';
        }
    }

    /**
     * Update filter status display
     */
    updateFilterStatus(filtered, total) {
        const statusElement = document.getElementById('filter-status');
        if (statusElement) {
            if (filtered === total) {
                statusElement.textContent = `Showing all ${total} pulse points`;
                statusElement.className = 'filter-status';
            } else {
                statusElement.textContent = `Showing ${filtered} of ${total} pulse points`;
                statusElement.className = 'filter-status filtered';
            }
        }

        // Update clear filters button visibility
        const clearBtn = document.getElementById('clear-filters-btn');
        if (clearBtn) {
            clearBtn.style.display = filtered === total ? 'none' : 'inline-block';
        }
    }

    /**
     * Get filter statistics
     */
    getFilterStats() {
        const pulses = this.originalPulses || this.app.pulses;
        
        const stats = {
            total: pulses.length,
            byCategory: {},
            byConfidence: {},
            bySourceQuality: {},
            byStatus: { active: 0, inactive: 0 },
            byPriority: {}
        };

        pulses.forEach(pulse => {
            // Category stats
            const category = pulse.pulseType || 'unknown';
            stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;

            // Confidence stats
            const confidence = pulse.confidence || 'unknown';
            stats.byConfidence[confidence] = (stats.byConfidence[confidence] || 0) + 1;

            // Source quality stats
            const quality = pulse.sourceQuality || 'unknown';
            stats.bySourceQuality[quality] = (stats.bySourceQuality[quality] || 0) + 1;

            // Status stats
            stats.byStatus[pulse.isActive ? 'active' : 'inactive']++;

            // Priority stats
            const priority = pulse.priority || 'medium';
            stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        });

        return stats;
    }

    /**
     * Populate filter dropdowns with available options
     */
    populateFilterOptions() {
        const stats = this.getFilterStats();

        // Populate category filter
        this.populateSelect('category-filter', stats.byCategory, 'All Categories');
        
        // Populate confidence filter
        this.populateSelect('confidence-filter', stats.byConfidence, 'All Confidence Levels');
        
        // Populate source quality filter
        this.populateSelect('source-quality-filter', stats.bySourceQuality, 'All Source Qualities');
        
        // Populate priority filter
        this.populateSelect('priority-filter', stats.byPriority, 'All Priorities');
    }

    /**
     * Populate a select element with options
     */
    populateSelect(selectId, options, allLabel) {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Clear existing options except 'all'
        const allOption = select.querySelector('option[value="all"]');
        select.innerHTML = '';
        
        if (allOption) {
            select.appendChild(allOption);
        } else {
            const newAllOption = document.createElement('option');
            newAllOption.value = 'all';
            newAllOption.textContent = allLabel;
            select.appendChild(newAllOption);
        }

        // Add options with counts
        Object.entries(options).sort().forEach(([key, count]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${this.formatOptionLabel(key)} (${count})`;
            select.appendChild(option);
        });
    }

    /**
     * Format option labels for display
     */
    formatOptionLabel(key) {
        const labelMap = {
            'crypto': 'Cryptocurrency',
            'stock': 'Stock/Finance',
            'weather': 'Weather',
            'date': 'Date/Time',
            'population': 'Demographics',
            'high': 'High Confidence',
            'medium': 'Medium Confidence', 
            'low': 'Low Confidence',
            'premium': 'Premium Sources',
            'standard': 'Standard Sources',
            'basic': 'Basic Sources',
            'unknown': 'Unknown',
            'critical': 'Critical Priority',
            'high': 'High Priority',
            'low': 'Low Priority'
        };

        return labelMap[key] || key.charAt(0).toUpperCase() + key.slice(1);
    }

    /**
     * Validate all pulse points
     */
    validateAllPulses() {
        const issues = [];
        const pulses = this.originalPulses || this.app.pulses;
        
        pulses.forEach(pulse => {
            // Check for missing required fields
            if (!pulse.currentValue || pulse.currentValue.trim() === '') {
                issues.push(`Pulse #${pulse.id}: Missing current value`);
            }
            
            if (!pulse.dataSource || pulse.dataSource.trim() === '') {
                issues.push(`Pulse #${pulse.id}: Missing data source`);
            }
            
            // Check for overdue updates
            if (pulse.isActive && new Date(pulse.nextUpdate) < new Date()) {
                issues.push(`Pulse #${pulse.id}: Overdue for update`);
            }
            
            // Check for unrealistic update frequencies
            if (pulse.updateFrequency < 60) {
                issues.push(`Pulse #${pulse.id}: Update frequency too aggressive (${pulse.updateFrequency} min)`);
            }
            
            // Check for low confidence with high frequency
            if (pulse.confidence === 'low' && pulse.updateFrequency < 180) {
                issues.push(`Pulse #${pulse.id}: Low confidence but frequent updates`);
            }
            
            // Check for broken clusters
            if (pulse.clusterId && !this.app.semanticClusters.find(c => c.id === pulse.clusterId)) {
                issues.push(`Pulse #${pulse.id}: References non-existent cluster ${pulse.clusterId}`);
            }
        });
        
        // Check cluster integrity
        this.app.semanticClusters.forEach(cluster => {
            const clusterPulses = pulses.filter(p => p.clusterId === cluster.id);
            if (clusterPulses.length === 0) {
                issues.push(`Cluster "${cluster.name}": No associated pulse points`);
            }
            
            const primaryPulses = clusterPulses.filter(p => p.isPrimaryInCluster);
            if (primaryPulses.length === 0) {
                issues.push(`Cluster "${cluster.name}": No primary pulse designated`);
            } else if (primaryPulses.length > 1) {
                issues.push(`Cluster "${cluster.name}": Multiple primary pulses (${primaryPulses.length})`);
            }
        });
        
        // Display results
        this.displayValidationResults(issues);
        return issues;
    }

    /**
     * Display validation results
     */
    displayValidationResults(issues) {
        if (issues.length === 0) {
            this.app.showSuccess('✅ All pulse points validated successfully - no issues found!');
        } else {
            const maxDisplay = 10;
            const issueList = issues.slice(0, maxDisplay).join('\n• ');
            const moreText = issues.length > maxDisplay ? `\n... and ${issues.length - maxDisplay} more issues` : '';
            this.app.showError(`Found ${issues.length} validation issues:\n• ${issueList}${moreText}`);
        }
    }

    /**
     * Auto-fix common issues
     */
    async autoFixIssues() {
        const fixes = {
            applied: [],
            failed: []
        };

        const pulses = this.originalPulses || this.app.pulses;

        for (const pulse of pulses) {
            // Fix missing data sources
            if (!pulse.dataSource || pulse.dataSource.trim() === '') {
                try {
                    pulse.dataSource = this.assignDataSource(pulse);
                    pulse.sourceQuality = this.getSourceQuality(pulse.dataSource);
                    fixes.applied.push({
                        pulseId: pulse.id,
                        fix: 'assigned_data_source',
                        value: pulse.dataSource
                    });
                } catch (error) {
                    fixes.failed.push({
                        pulseId: pulse.id,
                        fix: 'assign_data_source',
                        error: error.message
                    });
                }
            }

            // Adjust unrealistic frequencies
            if (pulse.updateFrequency < 60) {
                const oldFreq = pulse.updateFrequency;
                pulse.updateFrequency = 60; // Minimum 1 hour
                fixes.applied.push({
                    pulseId: pulse.id,
                    fix: 'adjusted_frequency',
                    oldValue: oldFreq,
                    newValue: pulse.updateFrequency
                });
            }
        }

        // Update displays
        this.app.updateAllDisplays();

        // Show results
        const message = `Auto-fix completed: ${fixes.applied.length} issues fixed, ${fixes.failed.length} failed`;
        if (fixes.failed.length === 0) {
            this.app.showSuccess(message);
        } else {
            this.app.showError(message);
        }

        return fixes;
    }

    /**
     * Assign data source based on pulse type
     */
    assignDataSource(pulse) {
        const type = pulse.pulseType?.toLowerCase();
        
        switch (type) {
            case 'crypto': return 'CoinGecko API';
            case 'weather': return 'OpenWeatherMap API';
            case 'stock': return 'Yahoo Finance API';
            case 'date': return 'System Date/Time';
            case 'population': return 'Australian Bureau of Statistics';
            default: return 'AI Research API';
        }
    }

    /**
     * Get source quality rating
     */
    getSourceQuality(dataSource) {
        const source = dataSource?.toLowerCase() || '';
        
        if (source.includes('coingecko') || source.includes('yahoo') || source.includes('openweather')) {
            return 'premium';
        }
        if (source.includes('api')) {
            return 'standard';
        }
        if (source.includes('government') || source.includes('bureau')) {
            return 'premium';
        }
        return 'basic';
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Get current filter state
     */
    getFilterState() {
        return {
            activeFilters: { ...this.activeFilters },
            searchTerm: this.searchTerm,
            hasFilters: this.originalPulses !== null,
            filteredCount: this.app.pulses.length,
            totalCount: this.originalPulses?.length || this.app.pulses.length
        };
    }
}