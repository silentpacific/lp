// js/analysis/cluster-detection.js - Semantic Cluster Logic
// Handles detection and analysis of semantic relationships between pulse points

/**
 * Semantic Cluster Detection Engine
 * Identifies related pulse points that should update together
 */
export class ClusterDetection {

    /**
     * Analyze text for semantic clusters
     */
    static analyzeForClusters(text, context = '') {
        const potentialClusters = [];
        
        // Financial clusters (price + percentage + direction)
        const financialClusters = this.detectFinancialClusters(text);
        potentialClusters.push(...financialClusters);
        
        // Weather comparison clusters
        const weatherClusters = this.detectWeatherClusters(text);
        potentialClusters.push(...weatherClusters);
        
        // Revenue/growth clusters
        const revenueClusters = this.detectRevenueClusters(text);
        potentialClusters.push(...revenueClusters);
        
        // Temporal clusters (dates and time references)
        const temporalClusters = this.detectTemporalClusters(text);
        potentialClusters.push(...temporalClusters);
        
        // Comparative clusters (before/after, versus, compared to)
        const comparativeClusters = this.detectComparativeClusters(text);
        potentialClusters.push(...comparativeClusters);
        
        return potentialClusters;
    }

    /**
     * Detect financial clusters (stock price + percentage change + direction)
     */
    static detectFinancialClusters(text) {
        const clusters = [];
        
        // Pattern: $price, up/down X% from $previousPrice
        const financialPattern = /\$[\d,]+\.?\d*[^.]*?(?:up|down|rose|fell|gained|lost|increased|decreased)[^.]*?[\d.]+%[^.]*?(?:from|to)[^.]*?\$[\d,]+\.?\d*/gi;
        const matches = text.match(financialPattern);
        
        if (matches) {
            matches.forEach((match, index) => {
                const priceMatches = match.match(/\$[\d,]+\.?\d*/g);
                const percentMatch = match.match(/[\d.]+%/);
                const directionMatch = match.match(/\b(up|down|rose|fell|gained|lost|increased|decreased)\b/i);
                
                if (priceMatches && priceMatches.length >= 1 && percentMatch && directionMatch) {
                    clusters.push({
                        type: 'financial_movement',
                        confidence: 0.9,
                        elements: [
                            {
                                text: priceMatches[0],
                                role: 'primary',
                                dataType: 'currency',
                                updateSource: 'financial_api'
                            },
                            {
                                text: percentMatch[0],
                                role: 'dependent',
                                dataType: 'percentage',
                                calculationRule: 'percentage_change',
                                dependsOn: 0
                            },
                            {
                                text: directionMatch[0],
                                role: 'dependent', 
                                dataType: 'direction',
                                calculationRule: 'price_direction',
                                dependsOn: 0
                            }
                        ],
                        relationships: [
                            {
                                source: 0,
                                target: 1,
                                type: 'calculation',
                                rule: 'Calculate percentage change from price movement'
                            },
                            {
                                source: 0,
                                target: 2,
                                type: 'logical',
                                rule: 'Determine direction based on price comparison'
                            }
                        ],
                        semanticRule: 'Price drives percentage change and direction',
                        originalText: match
                    });
                }
            });
        }
        
        return clusters;
    }

    /**
     * Detect weather comparison clusters
     */
    static detectWeatherClusters(text) {
        const clusters = [];
        
        // Pattern: Temperature + comparison (warmer/cooler than yesterday)
        const weatherPattern = /\d+°[CF][^.]*?(?:\d+\s*degrees?\s*(?:warmer|cooler|hotter|colder))[^.]*?(?:yesterday|today|than)/gi;
        const matches = text.match(weatherPattern);
        
        if (matches) {
            matches.forEach((match, index) => {
                const tempMatch = match.match(/\d+°[CF]/);
                const comparisonMatch = match.match(/(\d+)\s*degrees?\s*(warmer|cooler|hotter|colder)/i);
                
                if (tempMatch && comparisonMatch) {
                    clusters.push({
                        type: 'weather_comparison',
                        confidence: 0.85,
                        elements: [
                            {
                                text: tempMatch[0],
                                role: 'primary',
                                dataType: 'temperature',
                                updateSource: 'weather_api'
                            },
                            {
                                text: `${comparisonMatch[1]} degrees ${comparisonMatch[2]}`,
                                role: 'dependent',
                                dataType: 'temperature_comparison',
                                calculationRule: 'temperature_difference',
                                dependsOn: 0
                            }
                        ],
                        relationships: [
                            {
                                source: 0,
                                target: 1,
                                type: 'comparison',
                                rule: 'Calculate temperature difference and determine comparative language'
                            }
                        ],
                        semanticRule: 'Current temperature drives comparison with historical data',
                        originalText: match
                    });
                }
            });
        }
        
        return clusters;
    }

    /**
     * Detect revenue/growth clusters
     */
    static detectRevenueClusters(text) {
        const clusters = [];
        
        // Pattern: Revenue grew X% to $amount from $previousAmount
        const revenuePattern = /(?:revenue|sales|earnings)[^.]*?(?:grew|increased|rose)[^.]*?[\d.]+%[^.]*?(?:to|reaching)[^.]*?\$[\d.,]+[MB]?[^.]*?(?:from|compared to)[^.]*?\$[\d.,]+[MB]?/gi;
        const matches = text.match(revenuePattern);
        
        if (matches) {
            matches.forEach((match, index) => {
                const percentMatch = match.match(/[\d.]+%/);
                const revenueMatches = match.match(/\$[\d.,]+[MB]?/g);
                const growthMatch = match.match(/\b(grew|increased|rose|declined|decreased|fell)\b/i);
                
                if (percentMatch && revenueMatches && revenueMatches.length >= 2 && growthMatch) {
                    clusters.push({
                        type: 'revenue_growth',
                        confidence: 0.88,
                        elements: [
                            {
                                text: revenueMatches[0],
                                role: 'primary',
                                dataType: 'currency',
                                updateSource: 'financial_reports'
                            },
                            {
                                text: percentMatch[0],
                                role: 'dependent',
                                dataType: 'percentage',
                                calculationRule: 'growth_percentage',
                                dependsOn: 0
                            },
                            {
                                text: growthMatch[0],
                                role: 'dependent',
                                dataType: 'growth_direction',
                                calculationRule: 'growth_direction',
                                dependsOn: 0
                            }
                        ],
                        relationships: [
                            {
                                source: 0,
                                target: 1,
                                type: 'calculation',
                                rule: 'Calculate growth percentage from current vs previous revenue'
                            },
                            {
                                source: 0,
                                target: 2,
                                type: 'logical',
                                rule: 'Determine growth direction (grew/declined) from comparison'
                            }
                        ],
                        semanticRule: 'Current revenue drives growth percentage and direction',
                        originalText: match
                    });
                }
            });
        }
        
        return clusters;
    }

    /**
     * Detect temporal clusters (dates and time references)
     */
    static detectTemporalClusters(text) {
        const clusters = [];
        
        // Pattern: "In 2023" + data + "compared to 2022" + data
        const temporalPattern = /(?:in|during|by)\s+(\d{4})[^.]*?(?:compared to|versus|from)\s+(\d{4})/gi;
        const matches = text.match(temporalPattern);
        
        if (matches) {
            matches.forEach((match, index) => {
                const years = match.match(/\d{4}/g);
                if (years && years.length >= 2) {
                    clusters.push({
                        type: 'temporal_comparison',
                        confidence: 0.75,
                        elements: [
                            {
                                text: years[0],
                                role: 'primary',
                                dataType: 'year',
                                updateSource: 'system_date'
                            },
                            {
                                text: years[1],
                                role: 'reference',
                                dataType: 'year',
                                calculationRule: 'previous_period',
                                dependsOn: 0
                            }
                        ],
                        relationships: [
                            {
                                source: 0,
                                target: 1,
                                type: 'temporal',
                                rule: 'Previous period reference updates when current period changes'
                            }
                        ],
                        semanticRule: 'Current time period drives historical comparison references',
                        originalText: match
                    });
                }
            });
        }
        
        return clusters;
    }

    /**
     * Detect comparative clusters (A vs B, higher than, compared to)
     */
    static detectComparativeClusters(text) {
        const clusters = [];
        
        // Pattern: Number + "higher/lower than" + Number
        const comparativePattern = /([\d.,]+(?:%|\$|°[CF]|[MB])?)[^.]*?\b(higher|lower|greater|less|more|fewer)\s+than[^.]*?([\d.,]+(?:%|\$|°[CF]|[MB])?)/gi;
        const matches = text.match(comparativePattern);
        
        if (matches) {
            matches.forEach((match, index) => {
                const numbers = match.match(/[\d.,]+(?:%|\$|°[CF]|[MB])?/g);
                const comparison = match.match(/\b(higher|lower|greater|less|more|fewer)\b/i);
                
                if (numbers && numbers.length >= 2 && comparison) {
                    clusters.push({
                        type: 'comparative_analysis',
                        confidence: 0.80,
                        elements: [
                            {
                                text: numbers[0],
                                role: 'primary',
                                dataType: 'numeric',
                                updateSource: 'data_api'
                            },
                            {
                                text: comparison[0],
                                role: 'dependent',
                                dataType: 'comparison_word',
                                calculationRule: 'comparative_analysis',
                                dependsOn: 0
                            },
                            {
                                text: numbers[1],
                                role: 'reference',
                                dataType: 'numeric',
                                calculationRule: 'reference_point',
                                dependsOn: 0
                            }
                        ],
                        relationships: [
                            {
                                source: 0,
                                target: 1,
                                type: 'comparison',
                                rule: 'Determine comparative language based on numeric relationship'
                            },
                            {
                                source: 0,
                                target: 2,
                                type: 'reference',
                                rule: 'Reference point may update independently'
                            }
                        ],
                        semanticRule: 'Primary value drives comparative language with reference point',
                        originalText: match
                    });
                }
            });
        }
        
        return clusters;
    }

    /**
     * Validate cluster relationships
     */
    static validateCluster(cluster) {
        const validationResults = {
            isValid: true,
            issues: [],
            confidence: cluster.confidence
        };

        // Check for required elements
        if (!cluster.elements || cluster.elements.length < 2) {
            validationResults.isValid = false;
            validationResults.issues.push('Cluster must have at least 2 elements');
        }

        // Check for primary element
        const primaryElements = cluster.elements.filter(el => el.role === 'primary');
        if (primaryElements.length !== 1) {
            validationResults.isValid = false;
            validationResults.issues.push('Cluster must have exactly one primary element');
        }

        // Check relationships match elements
        if (cluster.relationships) {
            cluster.relationships.forEach(rel => {
                if (rel.source >= cluster.elements.length || rel.target >= cluster.elements.length) {
                    validationResults.isValid = false;
                    validationResults.issues.push('Invalid relationship indices');
                }
            });
        }

        // Check for circular dependencies
        if (this.hasCircularDependencies(cluster)) {
            validationResults.isValid = false;
            validationResults.issues.push('Circular dependency detected');
        }

        // Adjust confidence based on issues
        if (validationResults.issues.length > 0) {
            validationResults.confidence = Math.max(0.1, validationResults.confidence - (validationResults.issues.length * 0.2));
        }

        return validationResults;
    }

    /**
     * Check for circular dependencies in cluster relationships
     */
    static hasCircularDependencies(cluster) {
        const visited = new Set();
        const recursionStack = new Set();

        const hasCycle = (elementIndex) => {
            if (recursionStack.has(elementIndex)) {
                return true; // Cycle detected
            }
            if (visited.has(elementIndex)) {
                return false; // Already processed
            }

            visited.add(elementIndex);
            recursionStack.add(elementIndex);

            // Check all relationships where this element is the source
            const dependencies = cluster.relationships
                .filter(rel => rel.source === elementIndex)
                .map(rel => rel.target);

            for (const dep of dependencies) {
                if (hasCycle(dep)) {
                    return true;
                }
            }

            recursionStack.delete(elementIndex);
            return false;
        };

        // Check each element for cycles
        for (let i = 0; i < cluster.elements.length; i++) {
            if (hasCycle(i)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Merge overlapping clusters
     */
    static mergeClusters(clusters) {
        const merged = [];
        const processed = new Set();

        clusters.forEach((cluster, index) => {
            if (processed.has(index)) return;

            let currentCluster = { ...cluster };
            processed.add(index);

            // Find overlapping clusters
            clusters.forEach((otherCluster, otherIndex) => {
                if (otherIndex === index || processed.has(otherIndex)) return;

                if (this.clustersOverlap(currentCluster, otherCluster)) {
                    currentCluster = this.combineClusters(currentCluster, otherCluster);
                    processed.add(otherIndex);
                }
            });

            merged.push(currentCluster);
        });

        return merged;
    }

    /**
     * Check if two clusters overlap (share text or elements)
     */
    static clustersOverlap(cluster1, cluster2) {
        // Check if original text overlaps
        if (cluster1.originalText && cluster2.originalText) {
            const text1 = cluster1.originalText.toLowerCase();
            const text2 = cluster2.originalText.toLowerCase();
            
            // Simple overlap check - if one contains significant portion of the other
            const shorter = text1.length < text2.length ? text1 : text2;
            const longer = text1.length >= text2.length ? text1 : text2;
            
            if (longer.includes(shorter) || this.calculateOverlap(text1, text2) > 0.5) {
                return true;
            }
        }

        // Check if elements overlap
        for (const elem1 of cluster1.elements) {
            for (const elem2 of cluster2.elements) {
                if (elem1.text === elem2.text) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Calculate text overlap ratio
     */
    static calculateOverlap(text1, text2) {
        const words1 = text1.split(/\s+/);
        const words2 = text2.split(/\s+/);
        const commonWords = words1.filter(word => words2.includes(word));
        
        return commonWords.length / Math.max(words1.length, words2.length);
    }

    /**
     * Combine two overlapping clusters
     */
    static combineClusters(cluster1, cluster2) {
        const combined = {
            type: cluster1.type, // Keep primary cluster type
            confidence: Math.min(cluster1.confidence, cluster2.confidence),
            elements: [...cluster1.elements],
            relationships: [...cluster1.relationships],
            semanticRule: cluster1.semanticRule,
            originalText: cluster1.originalText + ' ' + cluster2.originalText
        };

        // Add unique elements from cluster2
        cluster2.elements.forEach(elem2 => {
            const exists = combined.elements.some(elem1 => elem1.text === elem2.text);
            if (!exists) {
                combined.elements.push(elem2);
            }
        });

        // Add unique relationships from cluster2 (with index adjustments)
        const offset = cluster1.elements.length;
        cluster2.relationships.forEach(rel => {
            // Adjust indices for merged elements
            const adjustedRel = {
                ...rel,
                source: rel.source + offset,
                target: rel.target + offset
            };
            combined.relationships.push(adjustedRel);
        });

        return combined;
    }

    /**
     * Score cluster quality
     */
    static scoreCluster(cluster) {
        let score = cluster.confidence || 0.5;
        
        // Bonus for clear primary element
        const primaryElements = cluster.elements.filter(el => el.role === 'primary');
        if (primaryElements.length === 1) {
            score += 0.1;
        }
        
        // Bonus for well-defined relationships
        if (cluster.relationships && cluster.relationships.length > 0) {
            score += 0.1;
        }
        
        // Bonus for clear semantic rule
        if (cluster.semanticRule && cluster.semanticRule.length > 20) {
            score += 0.1;
        }
        
        // Penalty for too many elements (complexity)
        if (cluster.elements.length > 5) {
            score -= 0.1;
        }
        
        return Math.max(0, Math.min(1, score));
    }

    /**
     * Generate cluster summary
     */
    static generateClusterSummary(cluster) {
        const primaryElement = cluster.elements.find(el => el.role === 'primary');
        const dependentElements = cluster.elements.filter(el => el.role === 'dependent');
        
        return {
            name: this.generateClusterName(cluster),
            description: cluster.semanticRule || 'Related data points that update together',
            primaryData: primaryElement?.text || 'Unknown',
            dependentCount: dependentElements.length,
            updateFrequency: this.suggestUpdateFrequency(cluster),
            complexity: cluster.elements.length > 3 ? 'high' : cluster.elements.length > 2 ? 'medium' : 'low',
            confidence: this.scoreCluster(cluster)
        };
    }

    /**
     * Generate a descriptive name for the cluster
     */
    static generateClusterName(cluster) {
        const typeNames = {
            'financial_movement': 'Stock Price Movement',
            'weather_comparison': 'Weather Comparison',
            'revenue_growth': 'Revenue Growth Analysis', 
            'temporal_comparison': 'Time Period Comparison',
            'comparative_analysis': 'Comparative Data Analysis'
        };
        
        return typeNames[cluster.type] || 'Data Relationship Cluster';
    }

    /**
     * Suggest update frequency for cluster
     */
    static suggestUpdateFrequency(cluster) {
        const frequencyMap = {
            'financial_movement': 240,    // 4 hours (market hours)
            'weather_comparison': 180,    // 3 hours
            'revenue_growth': 2160,       // 1.5 days (quarterly updates)
            'temporal_comparison': 1440,  // 24 hours
            'comparative_analysis': 720   // 12 hours
        };
        
        return frequencyMap[cluster.type] || 360; // 6 hours default
    }
}