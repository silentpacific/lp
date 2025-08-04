// js/pulse-management/cluster-manager.js - Semantic Cluster Management
// Handles creation, management, and relationships of semantic clusters

/**
 * Cluster Manager
 * Manages semantic clusters and their relationships with pulse points
 */
export class ClusterManager {
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
     * Create a new semantic cluster
     */
    createCluster(clusterData) {
        const cluster = {
            id: `cluster_${this.app.clusterCounter++}`,
            name: clusterData.name || 'Unnamed Cluster',
            type: clusterData.type || 'mathematical',
            semanticRule: clusterData.semanticRule || 'Related pulse points that update together',
            pulseIds: clusterData.pulseIds || [],
            relationships: clusterData.relationships || [],
            isActive: clusterData.isActive !== undefined ? clusterData.isActive : true,
            priority: clusterData.priority || 'medium',
            confidence: clusterData.confidence || 'medium',
            createdAt: new Date().toISOString(),
            metadata: clusterData.metadata || {}
        };

        // Validate cluster before creation
        const validation = this.validateCluster(cluster);
        if (!validation.isValid) {
            throw new Error(`Invalid cluster: ${validation.issues.join(', ')}`);
        }

        this.app.semanticClusters.push(cluster);
        return cluster;
    }

    /**
     * Update cluster properties
     */
    updateCluster(clusterId, updates) {
        const cluster = this.app.semanticClusters.find(c => c.id === clusterId);
        if (!cluster) {
            throw new Error(`Cluster ${clusterId} not found`);
        }

        // Apply updates
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                cluster[key] = updates[key];
            }
        });

        // Validate updated cluster
        const validation = this.validateCluster(cluster);
        if (!validation.isValid) {
            throw new Error(`Invalid cluster update: ${validation.issues.join(', ')}`);
        }

        return cluster;
    }

    /**
     * Delete a cluster and handle associated pulses
     */
    deleteCluster(clusterId, keepPulses = true) {
        const cluster = this.app.semanticClusters.find(c => c.id === clusterId);
        if (!cluster) {
            throw new Error(`Cluster ${clusterId} not found`);
        }

        const clusterPulses = this.app.pulses.filter(p => p.clusterId === clusterId);

        if (keepPulses) {
            // Convert cluster pulses to individual pulses
            clusterPulses.forEach(pulse => {
                pulse.clusterId = null;
                pulse.role = 'single';
                pulse.isPrimaryInCluster = false;
            });
        } else {
            // Remove all cluster pulses
            this.app.pulses = this.app.pulses.filter(p => p.clusterId !== clusterId);
        }

        // Remove cluster
        this.app.semanticClusters = this.app.semanticClusters.filter(c => c.id !== clusterId);

        return {
            deletedCluster: cluster,
            affectedPulses: clusterPulses.length,
            pulsesKept: keepPulses
        };
    }

    /**
     * Add pulse to existing cluster
     */
    addPulseToCluster(pulseId, clusterId, role = 'dependent') {
        const pulse = this.app.pulses.find(p => p.id === pulseId);
        const cluster = this.app.semanticClusters.find(c => c.id === clusterId);

        if (!pulse) {
            throw new Error(`Pulse ${pulseId} not found`);
        }
        if (!cluster) {
            throw new Error(`Cluster ${clusterId} not found`);
        }

        // Remove from existing cluster if any
        if (pulse.clusterId) {
            this.removePulseFromCluster(pulseId);
        }

        // Add to new cluster
        pulse.clusterId = clusterId;
        pulse.role = role;
        pulse.isPrimaryInCluster = role === 'primary';

        // Update cluster pulse IDs
        if (!cluster.pulseIds.includes(pulseId)) {
            cluster.pulseIds.push(pulseId);
        }

        // If this is primary, demote any existing primary
        if (role === 'primary') {
            this.app.pulses.forEach(p => {
                if (p.clusterId === clusterId && p.id !== pulseId) {
                    p.isPrimaryInCluster = false;
                    if (p.role === 'primary') {
                        p.role = 'dependent';
                    }
                }
            });
        }

        return { pulse, cluster };
    }

    /**
     * Remove pulse from cluster
     */
    removePulseFromCluster(pulseId) {
        const pulse = this.app.pulses.find(p => p.id === pulseId);
        if (!pulse || !pulse.clusterId) {
            return null;
        }

        const clusterId = pulse.clusterId;
        const cluster = this.app.semanticClusters.find(c => c.id === clusterId);

        // Remove pulse from cluster
        pulse.clusterId = null;
        pulse.role = 'single';
        pulse.isPrimaryInCluster = false;

        // Update cluster pulse IDs
        if (cluster) {
            cluster.pulseIds = cluster.pulseIds.filter(id => id !== pulseId);

            // If cluster is now empty, remove it
            if (cluster.pulseIds.length === 0) {
                this.deleteCluster(clusterId, false);
            }
        }

        return { pulse, clusterId };
    }

    /**
     * Create relationship between pulses in a cluster
     */
    createRelationship(clusterId, relationship) {
        const cluster = this.app.semanticClusters.find(c => c.id === clusterId);
        if (!cluster) {
            throw new Error(`Cluster ${clusterId} not found`);
        }

        const newRelationship = {
            id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sourcePulseId: relationship.sourcePulseId,
            targetPulseId: relationship.targetPulseId,
            relationshipType: relationship.relationshipType,
            calculationRule: relationship.calculationRule,
            dependencyOrder: relationship.dependencyOrder || 1,
            isActive: relationship.isActive !== undefined ? relationship.isActive : true,
            createdAt: new Date().toISOString()
        };

        // Validate relationship
        const validation = this.validateRelationship(newRelationship, cluster);
        if (!validation.isValid) {
            throw new Error(`Invalid relationship: ${validation.issues.join(', ')}`);
        }

        cluster.relationships = cluster.relationships || [];
        cluster.relationships.push(newRelationship);

        return newRelationship;
    }

    /**
     * Update relationship
     */
    updateRelationship(clusterId, relationshipId, updates) {
        const cluster = this.app.semanticClusters.find(c => c.id === clusterId);
        if (!cluster) {
            throw new Error(`Cluster ${clusterId} not found`);
        }

        const relationship = cluster.relationships?.find(r => r.id === relationshipId);
        if (!relationship) {
            throw new Error(`Relationship ${relationshipId} not found`);
        }

        // Apply updates
        Object.keys(updates).forEach(key => {
            if (key !== 'id' && key !== 'createdAt') {
                relationship[key] = updates[key];
            }
        });

        // Validate updated relationship
        const validation = this.validateRelationship(relationship, cluster);
        if (!validation.isValid) {
            throw new Error(`Invalid relationship update: ${validation.issues.join(', ')}`);
        }

        return relationship;
    }

    /**
     * Delete relationship
     */
    deleteRelationship(clusterId, relationshipId) {
        const cluster = this.app.semanticClusters.find(c => c.id === clusterId);
        if (!cluster) {
            throw new Error(`Cluster ${clusterId} not found`);
        }

        cluster.relationships = cluster.relationships?.filter(r => r.id !== relationshipId) || [];
        return true;
    }

    /**
     * Validate cluster structure and data
     */
    validateCluster(cluster) {
        const issues = [];

        // Check required fields
        if (!cluster.name || cluster.name.trim() === '') {
            issues.push('Cluster name is required');
        }

        if (!cluster.type) {
            issues.push('Cluster type is required');
        }

        // Check pulse IDs exist
        if (cluster.pulseIds && cluster.pulseIds.length > 0) {
            cluster.pulseIds.forEach(pulseId => {
                const pulse = this.app.pulses.find(p => p.id === pulseId);
                if (!pulse) {
                    issues.push(`Pulse ${pulseId} not found`);
                }
            });
        }

        // Check for exactly one primary pulse
        if (cluster.pulseIds && cluster.pulseIds.length > 0) {
            const clusterPulses = this.app.pulses.filter(p => cluster.pulseIds.includes(p.id));
            const primaryPulses = clusterPulses.filter(p => p.isPrimaryInCluster);
            
            if (primaryPulses.length === 0) {
                issues.push('Cluster must have one primary pulse');
            } else if (primaryPulses.length > 1) {
                issues.push('Cluster cannot have multiple primary pulses');
            }
        }

        // Check for circular dependencies in relationships
        if (cluster.relationships && cluster.relationships.length > 0) {
            if (this.hasCircularDependencies(cluster)) {
                issues.push('Circular dependency detected in relationships');
            }
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Validate relationship
     */
    validateRelationship(relationship, cluster) {
        const issues = [];

        // Check required fields
        if (!relationship.sourcePulseId) {
            issues.push('Source pulse ID is required');
        }

        if (!relationship.targetPulseId) {
            issues.push('Target pulse ID is required');
        }

        if (!relationship.relationshipType) {
            issues.push('Relationship type is required');
        }

        // Check that both pulses exist in cluster
        if (cluster.pulseIds) {
            if (!cluster.pulseIds.includes(relationship.sourcePulseId)) {
                issues.push('Source pulse not in cluster');
            }

            if (!cluster.pulseIds.includes(relationship.targetPulseId)) {
                issues.push('Target pulse not in cluster');
            }
        }

        // Check for self-reference
        if (relationship.sourcePulseId === relationship.targetPulseId) {
            issues.push('Pulse cannot have relationship with itself');
        }

        return {
            isValid: issues.length === 0,
            issues
        };
    }

    /**
     * Check for circular dependencies in cluster relationships
     */
    hasCircularDependencies(cluster) {
        if (!cluster.relationships || cluster.relationships.length === 0) {
            return false;
        }

        const visited = new Set();
        const recursionStack = new Set();

        const hasCycle = (pulseId) => {
            if (recursionStack.has(pulseId)) {
                return true; // Cycle detected
            }
            if (visited.has(pulseId)) {
                return false; // Already processed
            }

            visited.add(pulseId);
            recursionStack.add(pulseId);

            // Check all relationships where this pulse is the source
            const dependencies = cluster.relationships
                .filter(rel => rel.sourcePulseId === pulseId)
                .map(rel => rel.targetPulseId);

            for (const depId of dependencies) {
                if (hasCycle(depId)) {
                    return true;
                }
            }

            recursionStack.delete(pulseId);
            return false;
        };

        // Check each pulse for cycles
        for (const pulseId of cluster.pulseIds || []) {
            if (hasCycle(pulseId)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get cluster statistics
     */
    getClusterStats(clusterId) {
        const cluster = this.app.semanticClusters.find(c => c.id === clusterId);
        if (!cluster) {
            return null;
        }

        const clusterPulses = this.app.pulses.filter(p => p.clusterId === clusterId);
        const activePulses = clusterPulses.filter(p => p.isActive);
        const primaryPulse = clusterPulses.find(p => p.isPrimaryInCluster);

        return {
            cluster,
            totalPulses: clusterPulses.length,
            activePulses: activePulses.length,
            inactivePulses: clusterPulses.length - activePulses.length,
            primaryPulse: primaryPulse || null,
            dependentPulses: clusterPulses.filter(p => !p.isPrimaryInCluster).length,
            relationships: cluster.relationships?.length || 0,
            lastUpdated: this.getLastClusterUpdate(clusterPulses),
            nextUpdate: this.getNextClusterUpdate(activePulses),
            averageConfidence: this.calculateAverageConfidence(clusterPulses),
            healthScore: this.calculateClusterHealth(cluster, clusterPulses)
        };
    }

    /**
     * Get last update time for cluster
     */
    getLastClusterUpdate(clusterPulses) {
        if (clusterPulses.length === 0) return null;

        const updateTimes = clusterPulses
            .map(p => new Date(p.lastUpdated))
            .filter(date => !isNaN(date.getTime()));

        return updateTimes.length > 0 ? new Date(Math.max(...updateTimes)) : null;
    }

    /**
     * Get next update time for cluster
     */
    getNextClusterUpdate(activePulses) {
        if (activePulses.length === 0) return null;

        const nextTimes = activePulses
            .map(p => new Date(p.nextUpdate))
            .filter(date => !isNaN(date.getTime()));

        return nextTimes.length > 0 ? new Date(Math.min(...nextTimes)) : null;
    }

    /**
     * Calculate average confidence for cluster
     */
    calculateAverageConfidence(clusterPulses) {
        if (clusterPulses.length === 0) return 'unknown';

        const confidenceScores = {
            'high': 3,
            'medium': 2,
            'low': 1,
            'unknown': 0
        };

        const totalScore = clusterPulses.reduce((sum, pulse) => {
            return sum + (confidenceScores[pulse.confidence] || 0);
        }, 0);

        const avgScore = totalScore / clusterPulses.length;

        if (avgScore >= 2.5) return 'high';
        if (avgScore >= 1.5) return 'medium';
        if (avgScore >= 0.5) return 'low';
        return 'unknown';
    }

    /**
     * Calculate cluster health score
     */
    calculateClusterHealth(cluster, clusterPulses) {
        let score = 100;

        // Check for missing primary pulse
        const primaryPulses = clusterPulses.filter(p => p.isPrimaryInCluster);
        if (primaryPulses.length === 0) {
            score -= 30;
        } else if (primaryPulses.length > 1) {
            score -= 20;
        }

        // Check for inactive pulses
        const inactivePulses = clusterPulses.filter(p => !p.isActive);
        if (inactivePulses.length > 0) {
            score -= (inactivePulses.length / clusterPulses.length) * 20;
        }

        // Check for overdue updates
        const now = new Date();
        const overduePulses = clusterPulses.filter(p => 
            p.isActive && new Date(p.nextUpdate) < now
        );
        if (overduePulses.length > 0) {
            score -= (overduePulses.length / clusterPulses.length) * 25;
        }

        // Check for missing relationships
        if (!cluster.relationships || cluster.relationships.length === 0) {
            if (clusterPulses.length > 1) {
                score -= 15;
            }
        }

        // Check for low confidence pulses
        const lowConfidencePulses = clusterPulses.filter(p => p.confidence === 'low');
        if (lowConfidencePulses.length > 0) {
            score -= (lowConfidencePulses.length / clusterPulses.length) * 10;
        }

        return Math.max(0, Math.round(score));
    }

    /**
     * Merge two clusters
     */
    mergeClusters(primaryClusterId, secondaryClusterId) {
        const primaryCluster = this.app.semanticClusters.find(c => c.id === primaryClusterId);
        const secondaryCluster = this.app.semanticClusters.find(c => c.id === secondaryClusterId);

        if (!primaryCluster || !secondaryCluster) {
            throw new Error('One or both clusters not found');
        }

        // Move all pulses from secondary to primary cluster
        const secondaryPulses = this.app.pulses.filter(p => p.clusterId === secondaryClusterId);
        secondaryPulses.forEach(pulse => {
            pulse.clusterId = primaryClusterId;
            // Don't change roles - keep existing structure
        });

        // Merge pulse IDs
        primaryCluster.pulseIds = [
            ...primaryCluster.pulseIds,
            ...secondaryCluster.pulseIds.filter(id => !primaryCluster.pulseIds.includes(id))
        ];

        // Merge relationships
        primaryCluster.relationships = [
            ...(primaryCluster.relationships || []),
            ...(secondaryCluster.relationships || [])
        ];

        // Update semantic rule
        primaryCluster.semanticRule = `${primaryCluster.semanticRule} | Merged with: ${secondaryCluster.semanticRule}`;

        // Remove secondary cluster
        this.app.semanticClusters = this.app.semanticClusters.filter(c => c.id !== secondaryClusterId);

        return {
            mergedCluster: primaryCluster,
            movedPulses: secondaryPulses.length,
            removedCluster: secondaryCluster
        };
    }

    /**
     * Auto-detect potential clusters from existing pulses
     */
    autoDetectClusters() {
        const individualPulses = this.app.pulses.filter(p => !p.clusterId);
        const potentialClusters = [];

        // Group by similar types and entities
        const groups = this.groupPulsesByAffinity(individualPulses);

        groups.forEach(group => {
            if (group.pulses.length >= 2) {
                potentialClusters.push({
                    name: `Auto-detected ${group.type} Cluster`,
                    type: 'mathematical',
                    semanticRule: `Related ${group.type} data points`,
                    pulseIds: group.pulses.map(p => p.id),
                    confidence: this.calculateGroupConfidence(group.pulses),
                    auto_detected: true
                });
            }
        });

        return potentialClusters;
    }

    /**
     * Group pulses by affinity (similar types, entities, etc.)
     */
    groupPulsesByAffinity(pulses) {
        const groups = new Map();

        pulses.forEach(pulse => {
            // Create affinity key based on type and entity
            const key = `${pulse.pulseType}_${pulse.entity}_${pulse.subject}`;
            
            if (!groups.has(key)) {
                groups.set(key, {
                    type: pulse.pulseType,
                    entity: pulse.entity,
                    subject: pulse.subject,
                    pulses: []
                });
            }
            
            groups.get(key).pulses.push(pulse);
        });

        return Array.from(groups.values());
    }

    /**
     * Calculate confidence for auto-detected group
     */
    calculateGroupConfidence(pulses) {
        const avgConfidence = this.calculateAverageConfidence(pulses);
        
        // Reduce confidence for auto-detected clusters
        switch (avgConfidence) {
            case 'high': return 'medium';
            case 'medium': return 'low';
            default: return 'low';
        }
    }

    /**
     * Get all clusters with their statistics
     */
    getAllClustersWithStats() {
        return this.app.semanticClusters.map(cluster => ({
            ...cluster,
            stats: this.getClusterStats(cluster.id)
        }));
    }

    /**
     * Repair cluster integrity issues
     */
    repairCluster(clusterId) {
        const cluster = this.app.semanticClusters.find(c => c.id === clusterId);
        if (!cluster) {
            throw new Error(`Cluster ${clusterId} not found`);
        }

        const repairs = [];
        const clusterPulses = this.app.pulses.filter(p => p.clusterId === clusterId);

        // Fix missing primary pulse
        const primaryPulses = clusterPulses.filter(p => p.isPrimaryInCluster);
        if (primaryPulses.length === 0 && clusterPulses.length > 0) {
            // Make first pulse primary
            clusterPulses[0].isPrimaryInCluster = true;
            clusterPulses[0].role = 'primary';
            repairs.push('Set primary pulse');
        } else if (primaryPulses.length > 1) {
            // Keep only first primary
            primaryPulses.slice(1).forEach(pulse => {
                pulse.isPrimaryInCluster = false;
                pulse.role = 'dependent';
            });
            repairs.push('Fixed multiple primary pulses');
        }

        // Update pulse IDs list
        cluster.pulseIds = clusterPulses.map(p => p.id);

        // Remove invalid relationships
        if (cluster.relationships) {
            const validRelationships = cluster.relationships.filter(rel => 
                cluster.pulseIds.includes(rel.sourcePulseId) &&
                cluster.pulseIds.includes(rel.targetPulseId)
            );
            
            if (validRelationships.length !== cluster.relationships.length) {
                cluster.relationships = validRelationships;
                repairs.push('Removed invalid relationships');
            }
        }

        return {
            cluster,
            repairs,
            repairCount: repairs.length
        };
    }
}