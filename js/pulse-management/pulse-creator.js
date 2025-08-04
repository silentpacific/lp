// js/pulse-management/pulse-creator.js - Create & Manage Individual Pulses
// Handles creation and management of pulse points from analysis results

import { formatFrequency } from '../core/utils.js';

/**
 * Pulse Creator and Manager
 * Converts analysis results into pulse point objects and manages their lifecycle
 */
export class PulseCreator {
    constructor() {
        this.app = null;
    }

    /**
     * Initialize with app reference
     */
    init(app) {
        this.app = app;
    }

    /**
     * Create pulse points from analysis results
     */
    async createFromAnalysis(analysis) {
        if (!analysis) {
            throw new Error('No analysis provided');
        }

        try {
            if (analysis.analysisType === 'semantic_cluster') {
                return await this.createSemanticCluster(analysis);
            } else {
                return await this.createSinglePulse(analysis.pulsePoints[0]);
            }
        } catch (error) {
            console.error('Failed to create pulse from analysis:', error);
            throw error;
        }
    }

    /**
     * Create a semantic cluster with all related pulse points
     */
    async createSemanticCluster(analysis) {
        const cluster = analysis.semanticCluster;
        const pulsePoints = analysis.pulsePoints;
        
        if (!cluster || !pulsePoints || pulsePoints.length === 0) {
            throw new Error('Invalid cluster analysis data');
        }

        // Create the cluster object
        const newCluster = {
            id: `cluster_${this.app.clusterCounter++}`,
            name: cluster.clusterName || 'Unnamed Cluster',
            type: cluster.clusterType || 'mathematical',
            semanticRule: cluster.semanticRule || 'Related pulse points that update together',
            pulseIds: [],
            relationships: cluster.relationships || [],
            isActive: true,
            createdAt: new Date().toISOString(),
            priority: this.calculateClusterPriority(pulsePoints),
            confidence: this.calculateClusterConfidence(pulsePoints)
        };

        // Create individual pulse points
        const clusterPulses = [];
        for (let i = 0; i < pulsePoints.length; i++) {
            const pulse = pulsePoints[i];
            const newPulse = this.createPulseFromData(pulse);
            
            // Add cluster-specific properties
            newPulse.clusterId = newCluster.id;
            newPulse.role = pulse.role || (i === 0 ? 'primary' : 'dependent');
            newPulse.isPrimaryInCluster = pulse.role === 'primary';
            newPulse.clusterIndex = i;
            
            clusterPulses.push(newPulse);
        }

        // Add pulse IDs to cluster
        newCluster.pulseIds = clusterPulses.map(p => p.id);
        
        // Validate cluster integrity
        this.validateCluster(newCluster, clusterPulses);

        return {
            cluster: newCluster,
            pulses: clusterPulses,
            success: true,
            message: `Semantic cluster created: "${newCluster.name}" with ${pulsePoints.length} pulse points`
        };
    }

    /**
     * Create a single pulse point
     */
    async createSinglePulse(pulseData) {
        if (!pulseData) {
            throw new Error('No pulse data provided');
        }

        const newPulse = this.createPulseFromData(pulseData);
        
        return {
            pulses: [newPulse],
            success: true,
            message: `Pulse point created: "${pulseData.dynamicPart}" will auto-update every ${formatFrequency(pulseData.updateFrequency)}`
        };
    }

    /**
     * Create pulse object from analysis data
     */
    createPulseFromData(pulseData) {
        // Clean and validate the text data
        const cleanOriginalText = String(pulseData.fullSelection || pulseData.dynamicPart || '').trim();
        const cleanDynamicPart = String(pulseData.dynamicPart || '').trim();
        const cleanStaticPrefix = String(pulseData.staticPrefix || '').trim();
        const cleanStaticSuffix = String(pulseData.staticSuffix || '').trim();
        
        if (!cleanDynamicPart) {
            throw new Error('Dynamic part is required for pulse creation');
        }
        
        // Enhanced confidence scoring
        const enhancedConfidence = this.calculateEnhancedConfidence(pulseData);
        
        // Improved data source assignment
        const enhancedDataSource = this.assignOptimalDataSource(pulseData);
        
        // Better update frequency based on content type
        const optimizedFrequency = this.optimizeUpdateFrequency(pulseData);
        
        // Calculate next update time
        const nextUpdate = new Date(Date.now() + (optimizedFrequency * 60 * 1000));
        
        return {
            id: this.app.pulseCounter++,
            originalText: cleanOriginalText,
            dynamicPart: cleanDynamicPart,
            staticPrefix: cleanStaticPrefix,
            staticSuffix: cleanStaticSuffix,
            currentValue: cleanDynamicPart,
            pulseType: pulseData.pulseType || 'unknown',
            specificType: pulseData.specificType || 'unknown',
            updateFrequency: optimizedFrequency,
            dataSource: enhancedDataSource,
            reasoning: pulseData.reasoning || 'No reasoning provided',
            confidence: enhancedConfidence,
            action: pulseData.action || 'update',
            subject: pulseData.subject || 'content',
            entity: pulseData.entity || 'unknown',
            emotion: pulseData.emotion || 'neutral',
            lastUpdated: new Date().toISOString(),
            nextUpdate: nextUpdate.toISOString(),
            updateCount: 0,
            isActive: true,
            clusterId: null,
            role: 'single',
            isPrimaryInCluster: false,
            // Enhanced metadata
            changeHistory: [],
            sourceQuality: this.getSourceQuality(enhancedDataSource),
            contextRelevance: this.calculateContextRelevance(pulseData),
            priority: this.calculatePulsePriority(pulseData),
            tags: this.generatePulseTags(pulseData)
        };
    }

    /**
     * Calculate enhanced confidence based on multiple factors
     */
    calculateEnhancedConfidence(pulseData) {
        let score = 0.5; // Start with medium confidence
        
        // Rule 1: Specific numeric patterns get higher confidence
        if (pulseData.dynamicPart) {
            const text = pulseData.dynamicPart.toLowerCase();
            
            // Financial data with currency symbols
            if (text.includes('$') && text.match(/\d/)) {
                score += 0.3;
            }
            
            // Percentage values
            if (text.includes('%')) {
                score += 0.2;
            }
            
            // Temperature data
            if (text.match(/\d+°[cf]/)) {
                score += 0.2;
            }
            
            // Well-formatted numbers
            if (text.match(/\d{1,3}(,\d{3})*/)) {
                score += 0.1;
            }
        }
        
        // Rule 2: Data source quality affects confidence
        if (pulseData.dataSource) {
            const source = pulseData.dataSource.toLowerCase();
            if (source.includes('api') || source.includes('official')) {
                score += 0.2;
            }
            if (source.includes('coingecko') || source.includes('yahoo') || source.includes('openweather')) {
                score += 0.2;
            }
        }
        
        // Rule 3: Pulse type reliability
        const reliableTypes = ['crypto', 'weather', 'stock', 'date'];
        if (reliableTypes.includes(pulseData.pulseType)) {
            score += 0.1;
        }
        
        // Rule 4: Context quality
        if (pulseData.reasoning && pulseData.reasoning.length > 20) {
            score += 0.1;
        }
        
        // Convert to categorical confidence
        if (score >= 0.8) return 'high';
        if (score >= 0.6) return 'medium';
        return 'low';
    }

    /**
     * Assign optimal data source based on pulse type
     */
    assignOptimalDataSource(pulseData) {
        const type = pulseData.pulseType?.toLowerCase();
        const specificType = pulseData.specificType?.toLowerCase();
        
        // Framework Rule: Assign trusted APIs per category
        switch (type) {
            case 'crypto':
                if (specificType?.includes('bitcoin') || specificType?.includes('btc')) {
                    return 'CoinGecko API (Bitcoin)';
                }
                if (specificType?.includes('ethereum') || specificType?.includes('eth')) {
                    return 'CoinGecko API (Ethereum)';
                }
                return 'CoinGecko API';
                
            case 'weather':
                return 'OpenWeatherMap API';
                
            case 'stock':
                if (specificType?.includes('tesla')) {
                    return 'Yahoo Finance (TSLA)';
                }
                if (specificType?.includes('apple')) {
                    return 'Yahoo Finance (AAPL)';
                }
                return 'Yahoo Finance API';
                
            case 'date':
                return 'System Date/Time';
                
            case 'population':
                return 'Australian Bureau of Statistics';
                
            case 'technology':
                return 'Tech Industry APIs';
                
            case 'sports':
                return 'Sports Data API';
                
            default:
                return pulseData.dataSource || 'AI Research Fallback';
        }
    }

    /**
     * Optimize update frequency based on pulse type and volatility
     */
    optimizeUpdateFrequency(pulseData) {
        const type = pulseData.pulseType?.toLowerCase();
        const originalFreq = pulseData.updateFrequency || 180;
        
        // Framework frequency guidelines
        switch (type) {
            case 'crypto':
                return 60; // 1 hour - crypto is highly volatile
                
            case 'stock':
                return 240; // 4 hours - stock market hours consideration
                
            case 'weather':
                return 180; // 3 hours - weather changes moderately
                
            case 'date':
                return 1440; // 24 hours - dates change daily
                
            case 'population':
                return 43200; // 1 month - demographics change slowly
                
            case 'sports':
                return 120; // 2 hours - active updates during games
                
            case 'technology':
                return 720; // 12 hours - tech specs change moderately
                
            default:
                // Use original frequency but ensure it's within reasonable bounds
                return Math.max(60, Math.min(43200, originalFreq)); // 1 hour to 1 month
        }
    }

    /**
     * Get source quality rating
     */
    getSourceQuality(dataSource) {
        const source = dataSource?.toLowerCase() || '';
        
        if (source.includes('api')) {
            if (source.includes('coingecko') || source.includes('yahoo') || source.includes('openweather')) {
                return 'premium'; // High-quality, trusted APIs
            }
            return 'standard'; // Generic APIs
        }
        
        if (source.includes('official') || source.includes('government') || source.includes('bureau')) {
            return 'premium'; // Official government sources
        }
        
        if (source.includes('ai') || source.includes('research')) {
            return 'basic'; // AI-generated or research-based
        }
        
        return 'unknown';
    }

    /**
     * Calculate context relevance
     */
    calculateContextRelevance(pulseData) {
        let relevance = 0.5; // Start with medium relevance
        
        // Check if the pulse type matches common article themes
        if (pulseData.subject && pulseData.entity) {
            relevance += 0.2; // Has clear subject and entity
        }
        
        if (pulseData.action && pulseData.action !== 'update') {
            relevance += 0.1; // Has meaningful action context
        }
        
        if (pulseData.emotion && pulseData.emotion !== 'neutral') {
            relevance += 0.1; // Has emotional context
        }
        
        // Convert to categorical relevance
        if (relevance >= 0.8) return 'high';
        if (relevance >= 0.6) return 'medium';
        return 'low';
    }

    /**
     * Calculate pulse priority
     */
    calculatePulsePriority(pulseData) {
        const type = pulseData.pulseType?.toLowerCase();
        const confidence = pulseData.confidence || 'medium';
        
        // High priority types
        if (['crypto', 'stock'].includes(type) && confidence === 'high') {
            return 'critical';
        }
        
        if (['weather', 'financial'].includes(type) && confidence === 'high') {
            return 'high';
        }
        
        if (confidence === 'high') {
            return 'medium';
        }
        
        return 'low';
    }

    /**
     * Generate tags for pulse categorization
     */
    generatePulseTags(pulseData) {
        const tags = [];
        
        // Add type-based tags
        if (pulseData.pulseType) {
            tags.push(pulseData.pulseType.toLowerCase());
        }
        
        // Add confidence-based tags
        if (pulseData.confidence) {
            tags.push(`confidence-${pulseData.confidence}`);
        }
        
        // Add entity-based tags
        if (pulseData.entity && pulseData.entity !== 'unknown') {
            tags.push(pulseData.entity.toLowerCase().replace(/\s+/g, '-'));
        }
        
        // Add action-based tags
        if (pulseData.action && pulseData.action !== 'update') {
            tags.push(`action-${pulseData.action.toLowerCase()}`);
        }
        
        return tags;
    }

    /**
     * Calculate cluster priority
     */
    calculateClusterPriority(pulsePoints) {
        if (!pulsePoints || pulsePoints.length === 0) return 'low';
        
        // Check if any pulse has high priority types
        const hasHighPriorityType = pulsePoints.some(p => 
            ['crypto', 'stock', 'financial'].includes(p.pulseType?.toLowerCase())
        );
        
        if (hasHighPriorityType) return 'high';
        
        // Check confidence levels
        const highConfidenceCount = pulsePoints.filter(p => p.confidence === 'high').length;
        if (highConfidenceCount >= pulsePoints.length * 0.7) return 'medium';
        
        return 'low';
    }

    /**
     * Calculate cluster confidence
     */
    calculateClusterConfidence(pulsePoints) {
        if (!pulsePoints || pulsePoints.length === 0) return 'low';
        
        // Calculate average confidence score
        let totalScore = 0;
        let validCount = 0;
        
        pulsePoints.forEach(pulse => {
            let score = 0.5; // Default medium
            switch (pulse.confidence) {
                case 'high': score = 0.9; break;
                case 'medium': score = 0.6; break;
                case 'low': score = 0.3; break;
            }
            totalScore += score;
            validCount++;
        });
        
        const avgScore = validCount > 0 ? totalScore / validCount : 0.5;
        
        // Convert back to categorical
        if (avgScore >= 0.8) return 'high';
        if (avgScore >= 0.6) return 'medium';
        return 'low';
    }

    /**
     * Validate cluster integrity
     */
    validateCluster(cluster, pulses) {
        const issues = [];
        
        // Check that all pulse IDs exist
        cluster.pulseIds.forEach(pulseId => {
            if (!pulses.find(p => p.id === pulseId)) {
                issues.push(`Pulse ID ${pulseId} not found in cluster pulses`);
            }
        });
        
        // Check for exactly one primary pulse
        const primaryPulses = pulses.filter(p => p.isPrimaryInCluster);
        if (primaryPulses.length !== 1) {
            issues.push(`Cluster must have exactly one primary pulse, found ${primaryPulses.length}`);
        }
        
        // Check relationships reference valid pulse indices
        if (cluster.relationships) {
            cluster.relationships.forEach(rel => {
                if (rel.sourcePulseIndex >= pulses.length || rel.targetPulseIndex >= pulses.length) {
                    issues.push('Invalid relationship pulse indices');
                }
            });
        }
        
        if (issues.length > 0) {
            console.warn('Cluster validation issues:', issues);
            // Don't throw error, just log warnings
        }
        
        return issues.length === 0;
    }

    /**
     * Update pulse list display
     */
    updatePulseList(pulses, clusters) {
        const pulseList = document.getElementById('pulse-list');
        if (!pulseList) return;
        
        if (pulses.length === 0 && clusters.length === 0) {
            pulseList.innerHTML = this.getEmptyStateHTML();
            return;
        }

        let listHTML = '';

        // Display semantic clusters first
        clusters.forEach(cluster => {
            listHTML += this.generateClusterHTML(cluster, pulses);
        });

        // Display individual pulse points
        const individualPulses = pulses.filter(p => !p.clusterId);
        individualPulses.forEach(pulse => {
            listHTML += this.generatePulseHTML(pulse);
        });

        pulseList.innerHTML = listHTML;
    }

    /**
     * Generate empty state HTML
     */
    getEmptyStateHTML() {
        return `
            <div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">🎯</div>
                <p>No pulse points created yet.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem;">Analyze some text to get started!</p>
            </div>
        `;
    }

    /**
     * Generate cluster HTML
     */
    generateClusterHTML(cluster, allPulses) {
        const clusterPulses = allPulses.filter(p => p.clusterId === cluster.id);
        const primaryPulse = clusterPulses.find(p => p.isPrimaryInCluster);
        const isOverdue = primaryPulse && new Date(primaryPulse.nextUpdate) < new Date();
        const statusIcon = cluster.isActive ? '🔗' : '⏸️';
        const overdueWarning = isOverdue ? ' ⚠️ OVERDUE' : '';

        return `
            <div class="cluster-item enhanced">
                <div class="cluster-header">
                    <h4>${statusIcon} ${cluster.name}</h4>
                    <div class="cluster-badges">
                        <span class="cluster-type-badge ${cluster.type}">${cluster.type}</span>
                        <span class="pulse-count-badge">${clusterPulses.length} pulses</span>
                        <span class="priority-badge ${cluster.priority || 'medium'}">${cluster.priority || 'medium'}</span>
                    </div>
                </div>
                <p class="cluster-description">${cluster.semanticRule}</p>
                <div class="cluster-pulses">
                    ${clusterPulses.map(pulse => `
                        <div class="cluster-pulse-item ${pulse.role}">
                            <span class="pulse-role">${pulse.role}</span>
                            <span class="pulse-value">"${pulse.currentValue}"</span>
                            <span class="pulse-confidence ${pulse.confidence}">${this.getConfidenceIcon(pulse.confidence)}</span>
                            <span class="pulse-source">${pulse.dataSource}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="cluster-meta enhanced">
                    <span>Updates: Every ${formatFrequency(primaryPulse?.updateFrequency || 60)}</span>
                    <span>Next: ${primaryPulse ? new Date(primaryPulse.nextUpdate).toLocaleTimeString() : 'N/A'}${overdueWarning}</span>
                    <span>Source Quality: ${primaryPulse?.sourceQuality || 'unknown'}</span>
                    <span>Confidence: ${cluster.confidence || 'medium'}</span>
                </div>
                <div class="cluster-actions">
                    <button onclick="window.livePulseApp.testClusterUpdate('${cluster.id}')" class="btn btn-small btn-primary">Update Cluster</button>
                    <button onclick="window.livePulseApp.toggleCluster('${cluster.id}')" class="btn btn-small ${cluster.isActive ? 'btn-warning' : 'btn-success'}">${cluster.isActive ? 'Pause' : 'Resume'}</button>
                    <button onclick="window.livePulseApp.removeCluster('${cluster.id}')" class="btn btn-small btn-danger">Remove</button>
                </div>
            </div>
        `;
    }

    /**
     * Generate individual pulse HTML
     */
    generatePulseHTML(pulse) {
        const nextUpdate = new Date(pulse.nextUpdate);
        const isOverdue = nextUpdate < new Date();
        const statusIcon = pulse.isActive ? '🔄' : '⏸️';
        const overdueWarning = isOverdue ? ' ⚠️ OVERDUE' : '';
        
        return `
            <div class="pulse-item enhanced">
                <div class="pulse-header">
                    <h4>${statusIcon} Pulse #${pulse.id}: ${this.formatCategoryName(pulse.pulseType)}</h4>
                    <div class="pulse-badges">
                        <span class="confidence-badge-list ${pulse.confidence}">${this.getConfidenceIcon(pulse.confidence)} ${pulse.confidence}</span>
                        <span class="source-quality-badge ${pulse.sourceQuality || 'unknown'}">${pulse.sourceQuality || 'unknown'}</span>
                        <span class="priority-badge ${pulse.priority || 'medium'}">${pulse.priority || 'medium'}</span>
                    </div>
                </div>
                <div class="pulse-text-preview enhanced">
                    <span class="static-text">${pulse.staticPrefix}</span>
                    <span class="dynamic-text highlighted">${pulse.currentValue}</span>
                    <span class="static-text">${pulse.staticSuffix}</span>
                </div>
                <div class="pulse-meta enhanced">
                    <div class="meta-row">
                        <span class="meta-label">Type:</span>
                        <span class="meta-value">${pulse.specificType}</span>
                    </div>
                    <div class="meta-row">
                        <span class="meta-label">Source:</span>
                        <span class="meta-value">${pulse.dataSource}</span>
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
                <div class="pulse-actions">
                    <button onclick="window.livePulseApp.testPulseUpdate(${pulse.id})" class="btn btn-small btn-primary">Update Now</button>
                    <button onclick="window.livePulseApp.togglePulse(${pulse.id})" class="btn btn-small ${pulse.isActive ? 'btn-warning' : 'btn-success'}">${pulse.isActive ? 'Pause' : 'Resume'}</button>
                    <button onclick="window.livePulseApp.editPulseSource(${pulse.id})" class="btn btn-small btn-info">Edit Source</button>
                    <button onclick="window.livePulseApp.removePulse(${pulse.id})" class="btn btn-small btn-danger">Remove</button>
                </div>
            </div>
        `;
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
     * Create pulse from scan results
     */
    createPulseFromScan(scanResult) {
        const pulseData = {
            dynamicPart: scanResult.dynamicPart || scanResult.text,
            staticPrefix: this.extractPrefix(scanResult.staticContext, scanResult.dynamicPart),
            staticSuffix: this.extractSuffix(scanResult.staticContext, scanResult.dynamicPart),
            fullSelection: scanResult.text,
            pulseType: scanResult.pulseType,
            specificType: scanResult.specificType,
            updateFrequency: scanResult.updateFrequency,
            dataSource: scanResult.dataSource || 'Unknown',
            reasoning: scanResult.reasoning || 'Created from article scan',
            confidence: scanResult.confidence || 'medium',
            priority: scanResult.priority || 'medium'
        };

        return this.createPulseFromData(pulseData);
    }

    /**
     * Extract prefix from context
     */
    extractPrefix(context, dynamicPart) {
        if (!context || !dynamicPart) return '';
        const index = context.indexOf(dynamicPart);
        return index >= 0 ? context.substring(0, index) : '';
    }

    /**
     * Extract suffix from context
     */
    extractSuffix(context, dynamicPart) {
        if (!context || !dynamicPart) return '';
        const index = context.indexOf(dynamicPart);
        return index >= 0 ? context.substring(index + dynamicPart.length) : '';
    }

    /**
     * Bulk create pulses from multiple analysis results
     */
    async bulkCreate(analysisResults) {
        const results = {
            success: [],
            failed: [],
            clusters: [],
            totalPulses: 0
        };

        for (const analysis of analysisResults) {
            try {
                const result = await this.createFromAnalysis(analysis);
                results.success.push(result);
                results.totalPulses += result.pulses.length;
                
                if (result.cluster) {
                    results.clusters.push(result.cluster);
                }
            } catch (error) {
                results.failed.push({
                    analysis,
                    error: error.message
                });
            }
        }

        return results;
    }
}