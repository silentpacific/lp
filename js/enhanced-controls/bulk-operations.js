// js/enhanced-controls/bulk-operations.js - Bulk Operations
// Handles bulk operations on multiple pulse points and clusters

/**
 * Bulk Operations Manager
 * Provides bulk update, toggle, and delete operations for pulse points
 */
export class BulkOperations {
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
     * Bulk update all active pulse points
     */
    async updateAll(pulseIds = null) {
        const targetPulses = pulseIds ? 
            this.app.pulses.filter(p => pulseIds.includes(p.id)) : 
            this.app.pulses.filter(p => p.isActive);
        
        if (targetPulses.length === 0) {
            this.app.showError('No pulse points to update');
            return { success: false, message: 'No pulse points to update' };
        }

        const results = {
            successful: [],
            failed: [],
            totalAttempted: targetPulses.length
        };

        this.app.showInfo(`Starting bulk update of ${targetPulses.length} pulse points...`);

        for (const pulse of targetPulses) {
            try {
                const updateData = this.generateMockUpdate(pulse);
                pulse.currentValue = updateData.updatedValue;
                pulse.lastUpdated = updateData.timestamp;
                pulse.updateCount++;
                
                const nextUpdate = new Date(Date.now() + (pulse.updateFrequency * 60 * 1000));
                pulse.nextUpdate = nextUpdate.toISOString();
                
                results.successful.push({
                    pulseId: pulse.id,
                    oldValue: pulse.currentValue,
                    newValue: updateData.updatedValue
                });
            } catch (error) {
                console.error(`Failed to update pulse ${pulse.id}:`, error);
                results.failed.push({
                    pulseId: pulse.id,
                    error: error.message
                });
            }
        }

        // Update displays
        this.app.updateAllDisplays();
        
        const message = `Bulk updated ${results.successful.length}/${targetPulses.length} pulse points`;
        if (results.failed.length === 0) {
            this.app.showSuccess(message);
        } else {
            this.app.showError(`${message}. ${results.failed.length} failed.`);
        }

        return {
            success: results.failed.length === 0,
            results,
            message
        };
    }

    /**
     * Bulk toggle active status
     */
    toggleAll(activate = true) {
        const targetPulses = activate ? 
            this.app.pulses.filter(p => !p.isActive) : 
            this.app.pulses.filter(p => p.isActive);
        
        if (targetPulses.length === 0) {
            const message = `No pulse points to ${activate ? 'activate' : 'deactivate'}`;
            this.app.showError(message);
            return { success: false, message };
        }

        // Update pulse status
        targetPulses.forEach(pulse => {
            pulse.isActive = activate;
        });

        // Also update affected clusters
        const affectedClusters = new Set(targetPulses.map(p => p.clusterId).filter(Boolean));
        affectedClusters.forEach(clusterId => {
            const cluster = this.app.semanticClusters.find(c => c.id === clusterId);
            if (cluster) {
                const clusterPulses = this.app.pulses.filter(p => p.clusterId === clusterId);
                cluster.isActive = clusterPulses.some(p => p.isActive);
            }
        });

        // Update displays
        this.app.updateAllDisplays();
        
        const message = `${activate ? 'Activated' : 'Deactivated'} ${targetPulses.length} pulse points`;
        this.app.showSuccess(message);

        return {
            success: true,
            affected: targetPulses.length,
            message
        };
    }

    /**
     * Bulk delete selected pulse points
     */
    deleteSelected(pulseIds = null) {
        let targetPulses;
        
        if (pulseIds) {
            targetPulses = this.app.pulses.filter(p => pulseIds.includes(p.id));
        } else {
            // If no specific IDs provided, we'd need a selection mechanism
            // For now, this is a placeholder - you'd need to implement pulse selection UI
            this.app.showError('No pulse points selected for deletion');
            return { success: false, message: 'No pulse points selected' };
        }

        if (targetPulses.length === 0) {
            this.app.showError('No pulse points found to delete');
            return { success: false, message: 'No pulse points found' };
        }

        // Confirm deletion
        const confirmed = confirm(`Are you sure you want to delete ${targetPulses.length} pulse points? This action cannot be undone.`);
        if (!confirmed) {
            return { success: false, message: 'Deletion cancelled by user' };
        }

        // Get affected clusters before deletion
        const affectedClusterIds = new Set(targetPulses.map(p => p.clusterId).filter(Boolean));
        const targetPulseIds = targetPulses.map(p => p.id);

        // Remove pulses
        this.app.pulses = this.app.pulses.filter(p => !targetPulseIds.includes(p.id));

        // Clean up clusters that might be empty now
        affectedClusterIds.forEach(clusterId => {
            const remainingPulses = this.app.pulses.filter(p => p.clusterId === clusterId);
            if (remainingPulses.length === 0) {
                // Remove empty cluster
                this.app.semanticClusters = this.app.semanticClusters.filter(c => c.id !== clusterId);
            } else {
                // Update cluster pulse IDs
                const cluster = this.app.semanticClusters.find(c => c.id === clusterId);
                if (cluster) {
                    cluster.pulseIds = remainingPulses.map(p => p.id);
                }
            }
        });

        // Update displays
        this.app.updateAllDisplays();
        
        const message = `Deleted ${targetPulses.length} pulse points`;
        this.app.showSuccess(message);

        return {
            success: true,
            deleted: targetPulses.length,
            message
        };
    }

    /**
     * Bulk update overdue pulse points
     */
    async updateOverdue() {
        const now = new Date();
        const overduePulses = this.app.pulses.filter(p => 
            p.isActive && new Date(p.nextUpdate) < now
        );

        if (overduePulses.length === 0) {
            this.app.showSuccess('No overdue pulse points found');
            return { success: true, message: 'No overdue pulse points', updated: 0 };
        }

        const pulseIds = overduePulses.map(p => p.id);
        const result = await this.updateAll(pulseIds);

        const message = `Updated ${result.results.successful.length} overdue pulse points`;
        return {
            success: result.success,
            message,
            updated: result.results.successful.length,
            failed: result.results.failed.length
        };
    }

    /**
     * Bulk change update frequency
     */
    bulkChangeFrequency(newFrequency, pulseIds = null) {
        const targetPulses = pulseIds ? 
            this.app.pulses.filter(p => pulseIds.includes(p.id)) : 
            this.app.pulses.filter(p => p.isActive);

        if (targetPulses.length === 0) {
            this.app.showError('No pulse points to update');
            return { success: false, message: 'No pulse points found' };
        }

        // Validate frequency
        if (newFrequency < 60 || newFrequency > 43200) {
            this.app.showError('Update frequency must be between 1 hour (60 min) and 1 month (43200 min)');
            return { success: false, message: 'Invalid frequency' };
        }

        // Update frequencies
        const updated = [];
        targetPulses.forEach(pulse => {
            const oldFrequency = pulse.updateFrequency;
            pulse.updateFrequency = newFrequency;
            
            // Recalculate next update time
            const nextUpdate = new Date(Date.now() + (newFrequency * 60 * 1000));
            pulse.nextUpdate = nextUpdate.toISOString();
            
            updated.push({
                pulseId: pulse.id,
                oldFrequency,
                newFrequency
            });
        });

        // Update displays
        this.app.updateAllDisplays();
        
        const message = `Updated frequency for ${updated.length} pulse points to ${this.formatFrequency(newFrequency)}`;
        this.app.showSuccess(message);

        return {
            success: true,
            updated: updated.length,
            changes: updated,
            message
        };
    }

    /**
     * Bulk change data source
     */
    bulkChangeDataSource(newDataSource, pulseIds = null) {
        const targetPulses = pulseIds ? 
            this.app.pulses.filter(p => pulseIds.includes(p.id)) : 
            this.app.pulses;

        if (targetPulses.length === 0) {
            this.app.showError('No pulse points to update');
            return { success: false, message: 'No pulse points found' };
        }

        if (!newDataSource || newDataSource.trim() === '') {
            this.app.showError('Data source cannot be empty');
            return { success: false, message: 'Invalid data source' };
        }

        // Update data sources
        const updated = [];
        targetPulses.forEach(pulse => {
            const oldSource = pulse.dataSource;
            pulse.dataSource = newDataSource.trim();
            pulse.sourceQuality = this.getSourceQuality(pulse.dataSource);
            
            updated.push({
                pulseId: pulse.id,
                oldSource,
                newSource: pulse.dataSource
            });
        });

        // Update displays
        this.app.updateAllDisplays();
        
        const message = `Updated data source for ${updated.length} pulse points`;
        this.app.showSuccess(message);

        return {
            success: true,
            updated: updated.length,
            changes: updated,
            message
        };
    }

    /**
     * Bulk export pulse data
     */
    exportPulseData(pulseIds = null) {
        const targetPulses = pulseIds ? 
            this.app.pulses.filter(p => pulseIds.includes(p.id)) : 
            this.app.pulses;

        if (targetPulses.length === 0) {
            this.app.showError('No pulse points to export');
            return { success: false, message: 'No pulse points found' };
        }

        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                version: '3.0',
                totalPulses: targetPulses.length,
                exportType: 'bulk_operation'
            },
            pulses: targetPulses.map(pulse => ({
                id: pulse.id,
                originalText: pulse.originalText,
                currentValue: pulse.currentValue,
                pulseType: pulse.pulseType,
                specificType: pulse.specificType,
                updateFrequency: pulse.updateFrequency,
                dataSource: pulse.dataSource,
                confidence: pulse.confidence,
                priority: pulse.priority,
                isActive: pulse.isActive,
                clusterId: pulse.clusterId,
                role: pulse.role,
                sourceQuality: pulse.sourceQuality,
                contextRelevance: pulse.contextRelevance,
                tags: pulse.tags
            }))
        };

        // Create download
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `livepulse-bulk-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const message = `Exported ${targetPulses.length} pulse points`;
        this.app.showSuccess(message);

        return {
            success: true,
            exported: targetPulses.length,
            message
        };
    }

    /**
     * Get bulk operation statistics
     */
    getBulkStats() {
        const pulses = this.app.pulses;
        const now = new Date();

        return {
            total: pulses.length,
            active: pulses.filter(p => p.isActive).length,
            inactive: pulses.filter(p => !p.isActive).length,
            overdue: pulses.filter(p => p.isActive && new Date(p.nextUpdate) < now).length,
            highPriority: pulses.filter(p => p.priority === 'critical' || p.priority === 'high').length,
            lowConfidence: pulses.filter(p => p.confidence === 'low').length,
            missingSource: pulses.filter(p => !p.dataSource || p.dataSource.trim() === '').length,
            clustered: pulses.filter(p => p.clusterId).length,
            individual: pulses.filter(p => !p.clusterId).length
        };
    }

    /**
     * Generate mock update (from pulse-updater logic)
     */
    generateMockUpdate(pulse) {
        let newValue = pulse.currentValue;
        
        // Generate realistic updates based on pulse type
        if (pulse.pulseType === 'crypto' || pulse.specificType.includes('crypto')) {
            const currentPrice = parseFloat(pulse.currentValue.replace(/[$,]/g, ''));
            if (!isNaN(currentPrice)) {
                const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
                const newPrice = currentPrice * (1 + variation);
                newValue = `$${Math.round(newPrice).toLocaleString()}`;
            }
        } else if (pulse.pulseType === 'stock' || pulse.specificType.includes('stock')) {
            const currentPrice = parseFloat(pulse.currentValue.replace(/[$,]/g, ''));
            if (!isNaN(currentPrice)) {
                const variation = (Math.random() - 0.5) * 0.06; // ±3% variation
                const newPrice = currentPrice * (1 + variation);
                newValue = `$${newPrice.toFixed(2)}`;
            }
        } else if (pulse.pulseType === 'weather' || pulse.specificType.includes('weather')) {
            const tempMatch = pulse.currentValue.match(/(\d+)°([CF])/);
            if (tempMatch) {
                const currentTemp = parseInt(tempMatch[1]);
                const unit = tempMatch[2];
                const change = Math.floor(Math.random() * 6) - 3; // ±3 degrees
                const newTemp = Math.max(0, currentTemp + change);
                newValue = pulse.currentValue.replace(/\d+°/, `${newTemp}°`);
            }
        } else if (pulse.currentValue.includes('%')) {
            const percentMatch = pulse.currentValue.match(/([\d.]+)%/);
            if (percentMatch) {
                const currentPercent = parseFloat(percentMatch[1]);
                const change = (Math.random() - 0.5) * 2; // ±1% change
                const newPercent = Math.max(0, currentPercent + change);
                newValue = pulse.currentValue.replace(/[\d.]+%/, `${newPercent.toFixed(1)}%`);
            }
        }
        
        return {
            updatedValue: newValue,
            timestamp: new Date().toISOString(),
            source: 'Bulk Mock Update'
        };
    }

    /**
     * Format frequency for display
     */
    formatFrequency(minutes) {
        if (minutes < 60) return `${minutes} minutes`;
        if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
        if (minutes < 10080) return `${Math.round(minutes / 1440)} days`;
        if (minutes < 43200) return `${Math.round(minutes / 10080)} weeks`;
        return `${Math.round(minutes / 43200)} months`;
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
}