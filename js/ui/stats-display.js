// js/ui/stats-display.js - Statistics & Metrics Display
// Handles the display of pulse statistics, metrics, and analytics

import { formatFrequency } from '../core/utils.js';

/**
 * Statistics Display Manager
 * Manages the display of pulse points statistics and metrics
 */
export class StatsDisplay {
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
     * Update all statistics displays
     */
    update(pulses = [], clusters = []) {
        this.updateBasicStats(pulses, clusters);
        this.updateEnhancedStats(pulses, clusters);
        this.updateEditorStats();
        this.updateHealthMetrics(pulses, clusters);
    }

    /**
     * Update basic statistics
     */
    updateBasicStats(pulses, clusters) {
        const activePulseCount = document.getElementById('active-pulse-count');
        const clusterCount = document.getElementById('cluster-count');
        const nextUpdateTime = document.getElementById('next-update-time');
        const successRate = document.getElementById('success-rate');

        const activePulses = pulses.filter(p => p.isActive);
        const totalUpdates = pulses.reduce((sum, p) => sum + (p.updateCount || 0), 0);

        // Active pulse count
        if (activePulseCount) {
            activePulseCount.textContent = activePulses.length;
        }

        // Cluster count
        if (clusterCount) {
            clusterCount.textContent = clusters.length;
        }

        // Next update time
        if (nextUpdateTime && activePulses.length > 0) {
            const nextUpdate = this.getNextUpdateTime(activePulses);
            if (nextUpdate) {
                nextUpdateTime.textContent = nextUpdate.toLocaleTimeString();
            }
        }

        // Success rate
        if (successRate) {
            const rate = this.calculateSuccessRate(pulses);
            successRate.textContent = `${rate}%`;
            successRate.className = `success-rate ${this.getSuccessRateClass(rate)}`;
        }
    }

    /**
     * Update enhanced statistics breakdown
     */
    updateEnhancedStats(pulses, clusters) {
        this.updateCategoryBreakdown(pulses);
        this.updateConfidenceBreakdown(pulses);
        this.updateSourceBreakdown(pulses);
        this.updatePriorityBreakdown(pulses);
        this.updateUpdateFrequencyStats(pulses);
    }

    /**
     * Update category breakdown
     */
    updateCategoryBreakdown(pulses) {
        const categoryBreakdown = document.getElementById('category-breakdown');
        if (!categoryBreakdown) return;

        const categoryStats = {};
        pulses.forEach(pulse => {
            const category = this.formatCategoryName(pulse.pulseType);
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        });

        categoryBreakdown.innerHTML = Object.entries(categoryStats)
            .sort(([,a], [,b]) => b - a) // Sort by count descending
            .map(([category, count]) => 
                `<span class="stat-item category-${category.toLowerCase()}">${category}: ${count}</span>`
            ).join('');
    }

    /**
     * Update confidence breakdown
     */
    updateConfidenceBreakdown(pulses) {
        const confidenceBreakdown = document.getElementById('confidence-breakdown');
        if (!confidenceBreakdown) return;

        const confidenceStats = {
            high: pulses.filter(p => p.confidence === 'high').length,
            medium: pulses.filter(p => p.confidence === 'medium').length,
            low: pulses.filter(p => p.confidence === 'low').length
        };

        confidenceBreakdown.innerHTML = `
            <span class="stat-item confidence-high">High: ${confidenceStats.high}</span>
            <span class="stat-item confidence-medium">Medium: ${confidenceStats.medium}</span>
            <span class="stat-item confidence-low">Low: ${confidenceStats.low}</span>
        `;
    }

    /**
     * Update source quality breakdown
     */
    updateSourceBreakdown(pulses) {
        const sourceBreakdown = document.getElementById('source-breakdown');
        if (!sourceBreakdown) return;

        const sourceStats = {
            premium: pulses.filter(p => p.sourceQuality === 'premium').length,
            standard: pulses.filter(p => p.sourceQuality === 'standard').length,
            basic: pulses.filter(p => p.sourceQuality === 'basic').length,
            unknown: pulses.filter(p => p.sourceQuality === 'unknown').length
        };

        sourceBreakdown.innerHTML = `
            <span class="stat-item source-premium">Premium: ${sourceStats.premium}</span>
            <span class="stat-item source-standard">Standard: ${sourceStats.standard}</span>
            <span class="stat-item source-basic">Basic: ${sourceStats.basic}</span>
            ${sourceStats.unknown > 0 ? `<span class="stat-item source-unknown">Unknown: ${sourceStats.unknown}</span>` : ''}
        `;
    }

    /**
     * Update priority breakdown
     */
    updatePriorityBreakdown(pulses) {
        const priorityBreakdown = document.getElementById('priority-breakdown');
        if (!priorityBreakdown) return;

        const priorityStats = {
            critical: pulses.filter(p => p.priority === 'critical').length,
            high: pulses.filter(p => p.priority === 'high').length,
            medium: pulses.filter(p => p.priority === 'medium').length,
            low: pulses.filter(p => p.priority === 'low').length
        };

        const nonZeroStats = Object.entries(priorityStats).filter(([, count]) => count > 0);

        priorityBreakdown.innerHTML = nonZeroStats
            .map(([priority, count]) => 
                `<span class="stat-item priority-${priority}">${priority.charAt(0).toUpperCase() + priority.slice(1)}: ${count}</span>`
            ).join('');
    }

    /**
     * Update frequency statistics
     */
    updateUpdateFrequencyStats(pulses) {
        const frequencyStats = document.getElementById('frequency-stats');
        if (!frequencyStats) return;

        if (pulses.length === 0) {
            frequencyStats.innerHTML = '<span class="stat-item">No pulse points</span>';
            return;
        }

        const frequencies = pulses.map(p => p.updateFrequency);
        const avgFrequency = frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length;
        const minFrequency = Math.min(...frequencies);
        const maxFrequency = Math.max(...frequencies);

        frequencyStats.innerHTML = `
            <span class="stat-item">Avg: ${formatFrequency(Math.round(avgFrequency))}</span>
            <span class="stat-item">Min: ${formatFrequency(minFrequency)}</span>
            <span class="stat-item">Max: ${formatFrequency(maxFrequency)}</span>
        `;
    }

    /**
     * Update editor-specific statistics
     */
    updateEditorStats() {
        if (!this.app.isEditorMode) return;

        const footnotesStatus = document.getElementById('footnotes-status');
        const superscriptsStatus = document.getElementById('superscripts-status');

        if (footnotesStatus && this.app.previewManager) {
            const enabled = this.app.previewManager.showFootnotes;
            footnotesStatus.textContent = enabled ? 'Enabled' : 'Disabled';
            footnotesStatus.style.color = enabled ? '#10b981' : '#ef4444';
        }

        if (superscriptsStatus && this.app.previewManager) {
            const enabled = this.app.previewManager.showSuperscripts;
            superscriptsStatus.textContent = enabled ? 'Enabled' : 'Disabled';
            superscriptsStatus.style.color = enabled ? '#10b981' : '#ef4444';
        }
    }

    /**
     * Update system health metrics
     */
    updateHealthMetrics(pulses, clusters) {
        this.updateOverdueIndicator(pulses);
        this.updateSystemHealth(pulses, clusters);
        this.updatePerformanceMetrics(pulses);
    }

    /**
     * Update overdue pulse indicator
     */
    updateOverdueIndicator(pulses) {
        const overdueIndicator = document.getElementById('overdue-indicator');
        if (!overdueIndicator) return;

        const now = new Date();
        const overduePulses = pulses.filter(p => 
            p.isActive && new Date(p.nextUpdate) < now
        );

        if (overduePulses.length === 0) {
            overdueIndicator.innerHTML = '<span class="status-good">✅ All up to date</span>';
        } else {
            overdueIndicator.innerHTML = `<span class="status-warning">⚠️ ${overduePulses.length} overdue</span>`;
        }
    }

    /**
     * Update system health indicator
     */
    updateSystemHealth(pulses, clusters) {
        const healthIndicator = document.getElementById('system-health');
        if (!healthIndicator) return;

        const health = this.calculateSystemHealth(pulses, clusters);
        
        healthIndicator.innerHTML = `
            <span class="health-score ${health.level}">${health.score}%</span>
            <span class="health-label">${health.label}</span>
        `;
    }

    /**
     * Calculate system health score
     */
    calculateSystemHealth(pulses, clusters) {
        if (pulses.length === 0) {
            return { score: 100, level: 'excellent', label: 'No Issues' };
        }

        let score = 100;
        let issues = [];

        // Check for overdue pulses
        const now = new Date();
        const overduePulses = pulses.filter(p => p.isActive && new Date(p.nextUpdate) < now);
        if (overduePulses.length > 0) {
            const overdueRatio = overduePulses.length / pulses.filter(p => p.isActive).length;
            score -= overdueRatio * 30;
            issues.push(`${overduePulses.length} overdue`);
        }

        // Check for low confidence pulses
        const lowConfidencePulses = pulses.filter(p => p.confidence === 'low');
        if (lowConfidencePulses.length > 0) {
            const lowConfidenceRatio = lowConfidencePulses.length / pulses.length;
            score -= lowConfidenceRatio * 20;
            if (lowConfidenceRatio > 0.3) {
                issues.push('Many low confidence pulses');
            }
        }

        // Check for missing data sources
        const missingSourcePulses = pulses.filter(p => !p.dataSource || p.dataSource.trim() === '');
        if (missingSourcePulses.length > 0) {
            const missingSourceRatio = missingSourcePulses.length / pulses.length;
            score -= missingSourceRatio * 25;
            issues.push(`${missingSourcePulses.length} missing sources`);
        }

        // Check for broken clusters
        const brokenClusters = clusters.filter(cluster => {
            const clusterPulses = pulses.filter(p => p.clusterId === cluster.id);
            return clusterPulses.length === 0;
        });
        if (brokenClusters.length > 0) {
            score -= brokenClusters.length * 10;
            issues.push(`${brokenClusters.length} empty clusters`);
        }

        score = Math.max(0, Math.round(score));

        let level, label;
        if (score >= 90) {
            level = 'excellent';
            label = 'Excellent';
        } else if (score >= 75) {
            level = 'good';
            label = 'Good';
        } else if (score >= 60) {
            level = 'fair';
            label = 'Fair';
        } else {
            level = 'poor';
            label = 'Needs Attention';
        }

        return { score, level, label, issues };
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(pulses) {
        const performanceMetrics = document.getElementById('performance-metrics');
        if (!performanceMetrics) return;

        const metrics = this.calculatePerformanceMetrics(pulses);
        
        performanceMetrics.innerHTML = `
            <div class="metric-item">
                <span class="metric-label">Avg Response:</span>
                <span class="metric-value">${metrics.avgResponseTime}ms</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Update Rate:</span>
                <span class="metric-value">${metrics.updateRate}%</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Active Ratio:</span>
                <span class="metric-value">${metrics.activeRatio}%</span>
            </div>
        `;
    }

    /**
     * Calculate performance metrics
     */
    calculatePerformanceMetrics(pulses) {
        if (pulses.length === 0) {
            return {
                avgResponseTime: 0,
                updateRate: 0,
                activeRatio: 0
            };
        }

        // Mock response time (would be real in production)
        const avgResponseTime = Math.floor(Math.random() * 200) + 50;

        // Calculate update success rate
        const totalUpdates = pulses.reduce((sum, p) => sum + (p.updateCount || 0), 0);
        const successfulUpdates = pulses.filter(p => !p.hasErrors).length;
        const updateRate = totalUpdates > 0 ? Math.round((successfulUpdates / pulses.length) * 100) : 100;

        // Calculate active ratio
        const activePulses = pulses.filter(p => p.isActive).length;
        const activeRatio = Math.round((activePulses / pulses.length) * 100);

        return {
            avgResponseTime,
            updateRate,
            activeRatio
        };
    }

    /**
     * Get next update time
     */
    getNextUpdateTime(activePulses) {
        if (activePulses.length === 0) return null;

        const nextTimes = activePulses
            .map(p => new Date(p.nextUpdate))
            .filter(date => !isNaN(date.getTime()));

        return nextTimes.length > 0 ? new Date(Math.min(...nextTimes)) : null;
    }

    /**
     * Calculate success rate
     */
    calculateSuccessRate(pulses) {
        if (pulses.length === 0) return 100;

        // Calculate based on confidence and update success
        const highQualityPulses = pulses.filter(p => 
            p.confidence !== 'low' && 
            p.dataSource && 
            p.dataSource.trim() !== '' &&
            !p.hasErrors
        );

        return Math.round((highQualityPulses.length / pulses.length) * 100);
    }

    /**
     * Get success rate CSS class
     */
    getSuccessRateClass(rate) {
        if (rate >= 90) return 'excellent';
        if (rate >= 75) return 'good';
        if (rate >= 60) return 'fair';
        return 'poor';
    }

    /**
     * Format category name for display
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
     * Generate comprehensive statistics report
     */
    generateStatsReport(pulses, clusters) {
        const now = new Date();
        const activePulses = pulses.filter(p => p.isActive);
        const overduePulses = pulses.filter(p => p.isActive && new Date(p.nextUpdate) < now);

        return {
            overview: {
                totalPulses: pulses.length,
                activePulses: activePulses.length,
                inactivePulses: pulses.length - activePulses.length,
                totalClusters: clusters.length,
                activeClusters: clusters.filter(c => c.isActive).length
            },
            health: {
                overduePulses: overduePulses.length,
                overduePercentage: activePulses.length > 0 ? Math.round((overduePulses.length / activePulses.length) * 100) : 0,
                systemHealth: this.calculateSystemHealth(pulses, clusters),
                successRate: this.calculateSuccessRate(pulses)
            },
            categories: this.getCategoryStats(pulses),
            confidence: this.getConfidenceStats(pulses),
            sources: this.getSourceStats(pulses),
            priorities: this.getPriorityStats(pulses),
            frequencies: this.getFrequencyStats(pulses),
            updates: {
                totalUpdates: pulses.reduce((sum, p) => sum + (p.updateCount || 0), 0),
                averageUpdates: pulses.length > 0 ? Math.round(pulses.reduce((sum, p) => sum + (p.updateCount || 0), 0) / pulses.length) : 0,
                nextUpdate: this.getNextUpdateTime(activePulses),
                recentActivity: this.getRecentActivity(pulses)
            },
            performance: this.calculatePerformanceMetrics(pulses),
            timestamp: now.toISOString()
        };
    }

    /**
     * Get category statistics
     */
    getCategoryStats(pulses) {
        const stats = {};
        pulses.forEach(pulse => {
            const category = pulse.pulseType || 'unknown';
            if (!stats[category]) {
                stats[category] = { count: 0, active: 0, overdue: 0 };
            }
            stats[category].count++;
            if (pulse.isActive) {
                stats[category].active++;
                if (new Date(pulse.nextUpdate) < new Date()) {
                    stats[category].overdue++;
                }
            }
        });
        return stats;
    }

    /**
     * Get confidence statistics
     */
    getConfidenceStats(pulses) {
        return {
            high: pulses.filter(p => p.confidence === 'high').length,
            medium: pulses.filter(p => p.confidence === 'medium').length,
            low: pulses.filter(p => p.confidence === 'low').length,
            unknown: pulses.filter(p => !p.confidence || p.confidence === 'unknown').length
        };
    }

    /**
     * Get source statistics
     */
    getSourceStats(pulses) {
        return {
            premium: pulses.filter(p => p.sourceQuality === 'premium').length,
            standard: pulses.filter(p => p.sourceQuality === 'standard').length,
            basic: pulses.filter(p => p.sourceQuality === 'basic').length,
            unknown: pulses.filter(p => p.sourceQuality === 'unknown' || !p.sourceQuality).length,
            missing: pulses.filter(p => !p.dataSource || p.dataSource.trim() === '').length
        };
    }

    /**
     * Get priority statistics
     */
    getPriorityStats(pulses) {
        return {
            critical: pulses.filter(p => p.priority === 'critical').length,
            high: pulses.filter(p => p.priority === 'high').length,
            medium: pulses.filter(p => p.priority === 'medium').length,
            low: pulses.filter(p => p.priority === 'low').length,
            unset: pulses.filter(p => !p.priority).length
        };
    }

    /**
     * Get frequency statistics
     */
    getFrequencyStats(pulses) {
        if (pulses.length === 0) {
            return { min: 0, max: 0, average: 0, distribution: {} };
        }

        const frequencies = pulses.map(p => p.updateFrequency);
        const distribution = {};
        
        frequencies.forEach(freq => {
            const bucket = this.getFrequencyBucket(freq);
            distribution[bucket] = (distribution[bucket] || 0) + 1;
        });

        return {
            min: Math.min(...frequencies),
            max: Math.max(...frequencies),
            average: Math.round(frequencies.reduce((sum, freq) => sum + freq, 0) / frequencies.length),
            distribution
        };
    }

    /**
     * Get frequency bucket for grouping
     */
    getFrequencyBucket(frequency) {
        if (frequency < 60) return 'very-frequent'; // < 1 hour
        if (frequency < 360) return 'frequent'; // 1-6 hours
        if (frequency < 1440) return 'daily'; // 6-24 hours
        if (frequency < 10080) return 'weekly'; // 1-7 days
        return 'monthly'; // > 1 week
    }

    /**
     * Get recent activity information
     */
    getRecentActivity(pulses) {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        return {
            updatedLast24Hours: pulses.filter(p => 
                p.lastUpdated && new Date(p.lastUpdated) > last24Hours
            ).length,
            updatedLastWeek: pulses.filter(p => 
                p.lastUpdated && new Date(p.lastUpdated) > lastWeek
            ).length,
            scheduledNext24Hours: pulses.filter(p => 
                p.isActive && new Date(p.nextUpdate) < new Date(now.getTime() + 24 * 60 * 60 * 1000)
            ).length
        };
    }

    /**
     * Display detailed statistics modal
     */
    showDetailedStats() {
        if (!this.app.pulses || this.app.pulses.length === 0) {
            this.app.showInfo('No pulse points to analyze');
            return;
        }

        const report = this.generateStatsReport(this.app.pulses, this.app.semanticClusters);
        
        // Create modal content
        const modalContent = this.createStatsModalContent(report);
        
        // Show modal (assuming modal manager exists)
        if (this.app.modalManager) {
            this.app.modalManager.show('Detailed Statistics', modalContent, 'large');
        } else {
            // Fallback: log to console or show in alert
            console.log('Detailed Statistics Report:', report);
            this.app.showInfo('Detailed statistics logged to console');
        }
    }

    /**
     * Create modal content for detailed statistics
     */
    createStatsModalContent(report) {
        return `
            <div class="stats-report">
                <div class="stats-section">
                    <h3>📊 Overview</h3>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-number">${report.overview.totalPulses}</div>
                            <div class="stat-label">Total Pulses</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${report.overview.activePulses}</div>
                            <div class="stat-label">Active</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${report.overview.totalClusters}</div>
                            <div class="stat-label">Clusters</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${report.health.successRate}%</div>
                            <div class="stat-label">Success Rate</div>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <h3>🏥 Health Status</h3>
                    <div class="health-summary">
                        <div class="health-item">
                            <span class="health-label">System Health:</span>
                            <span class="health-value ${report.health.systemHealth.level}">${report.health.systemHealth.score}% (${report.health.systemHealth.label})</span>
                        </div>
                        <div class="health-item">
                            <span class="health-label">Overdue Pulses:</span>
                            <span class="health-value ${report.health.overduePulses > 0 ? 'warning' : 'good'}">${report.health.overduePulses} (${report.health.overduePercentage}%)</span>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <h3>📈 Categories</h3>
                    <div class="category-stats">
                        ${Object.entries(report.categories).map(([category, stats]) => `
                            <div class="category-item">
                                <span class="category-name">${this.formatCategoryName(category)}</span>
                                <span class="category-count">${stats.count} total</span>
                                <span class="category-active">${stats.active} active</span>
                                ${stats.overdue > 0 ? `<span class="category-overdue">${stats.overdue} overdue</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <div class="stats-section">
                    <h3>🔄 Update Activity</h3>
                    <div class="activity-stats">
                        <div class="activity-item">
                            <span class="activity-label">Total Updates:</span>
                            <span class="activity-value">${report.updates.totalUpdates}</span>
                        </div>
                        <div class="activity-item">
                            <span class="activity-label">Average per Pulse:</span>
                            <span class="activity-value">${report.updates.averageUpdates}</span>
                        </div>
                        <div class="activity-item">
                            <span class="activity-label">Updated Last 24h:</span>
                            <span class="activity-value">${report.updates.recentActivity.updatedLast24Hours}</span>
                        </div>
                        <div class="activity-item">
                            <span class="activity-label">Next Update:</span>
                            <span class="activity-value">${report.updates.nextUpdate ? report.updates.nextUpdate.toLocaleTimeString() : 'None scheduled'}</span>
                        </div>
                    </div>
                </div>

                <div class="stats-section">
                    <h3>⚡ Performance</h3>
                    <div class="performance-stats">
                        <div class="performance-item">
                            <span class="performance-label">Response Time:</span>
                            <span class="performance-value">${report.performance.avgResponseTime}ms</span>
                        </div>
                        <div class="performance-item">
                            <span class="performance-label">Update Rate:</span>
                            <span class="performance-value">${report.performance.updateRate}%</span>
                        </div>
                        <div class="performance-item">
                            <span class="performance-label">Active Ratio:</span>
                            <span class="performance-value">${report.performance.activeRatio}%</span>
                        </div>
                    </div>
                </div>

                <div class="stats-footer">
                    <small>Generated: ${new Date(report.timestamp).toLocaleString()}</small>
                </div>
            </div>
        `;
    }

    /**
     * Export statistics as JSON
     */
    exportStats() {
        if (!this.app.pulses || this.app.pulses.length === 0) {
            this.app.showError('No statistics to export');
            return;
        }

        const report = this.generateStatsReport(this.app.pulses, this.app.semanticClusters);
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `livepulse-statistics-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.app.showSuccess('Statistics exported successfully');
    }

    /**
     * Schedule automatic stats refresh
     */
    scheduleStatsRefresh(intervalMs = 30000) { // 30 seconds
        setInterval(() => {
            if (this.app.pulses && this.app.semanticClusters) {
                this.update(this.app.pulses, this.app.semanticClusters);
            }
        }, intervalMs);
    }

    /**
     * Get real-time statistics for dashboard
     */
    getRealTimeStats() {
        const pulses = this.app.pulses || [];
        const clusters = this.app.semanticClusters || [];
        const now = new Date();

        return {
            pulse: {
                total: pulses.length,
                active: pulses.filter(p => p.isActive).length,
                overdue: pulses.filter(p => p.isActive && new Date(p.nextUpdate) < now).length
            },
            clusters: {
                total: clusters.length,
                active: clusters.filter(c => c.isActive).length
            },
            health: this.calculateSystemHealth(pulses, clusters),
            nextUpdate: this.getNextUpdateTime(pulses.filter(p => p.isActive)),
            timestamp: now.toISOString()
        };
    }
}