// js/analysis/mock-analysis.js - Mock/Demo Analysis Functions
// Provides realistic mock analysis for development and demos

import { formatFrequency } from '../core/utils.js';

/**
 * Mock Analysis Generator
 * Provides realistic mock analysis results for development and demonstration
 */
export class MockAnalysis {
    
    /**
     * Generate mock analysis for selected text
     */
    static generateMockAnalysis(selectedText, articleContent) {
        console.log('🎭 Generating mock analysis for:', selectedText.substring(0, 50) + '...');
        
        const mockType = this.detectMockType(selectedText);
        
        if (mockType.isCluster) {
            return this.generateMockCluster(selectedText, mockType);
        } else {
            return this.generateMockSinglePulse(selectedText, mockType);
        }
    }

    /**
     * Detect the type of content and whether it's likely a cluster
     */
    static detectMockType(selectedText) {
        const text = selectedText.toLowerCase();
        
        // Stock/financial cluster patterns
        if (text.includes(') && (text.includes('%') || text.includes('down') || text.includes('up'))) {
            return {
                isCluster: true,
                type: 'stock',
                category: 'financial_cluster'
            };
        }
        
        // Weather comparison cluster
        if ((text.includes('°c') || text.includes('°f')) && (text.includes('warmer') || text.includes('cooler') || text.includes('yesterday'))) {
            return {
                isCluster: true,
                type: 'weather',
                category: 'weather_comparison'
            };
        }
        
        // Sales/revenue cluster
        if (text.includes(') && (text.includes('million') || text.includes('billion')) && (text.includes('from') || text.includes('grew'))) {
            return {
                isCluster: true,
                type: 'financial',
                category: 'revenue_growth'
            };
        }
        
        // Crypto price
        if (text.includes('bitcoin') || text.includes('btc') || text.includes('crypto') || text.includes('ethereum')) {
            return {
                isCluster: false,
                type: 'crypto',
                category: 'crypto_price'
            };
        }
        
        // Weather single
        if (text.includes('°c') || text.includes('°f') || text.includes('sunny') || text.includes('rainy')) {
            return {
                isCluster: false,
                type: 'weather',
                category: 'weather_simple'
            };
        }
        
        // Stock single
        if (text.includes(') && (text.includes('shares') || text.includes('stock') || text.includes('price'))) {
            return {
                isCluster: false,
                type: 'stock',
                category: 'stock_price'
            };
        }
        
        // Population/demographic
        if (text.includes('million') && (text.includes('people') || text.includes('population') || text.includes('residents'))) {
            return {
                isCluster: false,
                type: 'population',
                category: 'demographics'
            };
        }
        
        // Default
        return {
            isCluster: false,
            type: 'other',
            category: 'general'
        };
    }

    /**
     * Generate a mock cluster analysis
     */
    static generateMockCluster(selectedText, mockType) {
        switch (mockType.category) {
            case 'financial_cluster':
                return this.generateFinancialCluster(selectedText);
            case 'weather_comparison':
                return this.generateWeatherComparisonCluster(selectedText);
            case 'revenue_growth':
                return this.generateRevenueGrowthCluster(selectedText);
            default:
                return this.generateMockSinglePulse(selectedText, mockType);
        }
    }

    /**
     * Generate financial cluster (price, percentage, direction)
     */
    static generateFinancialCluster(selectedText) {
        const priceMatch = selectedText.match(/\$[\d,]+\.?\d*/);
        const percentMatch = selectedText.match(/[\d.]+%/);
        const directionMatch = selectedText.match(/\b(up|down|rose|fell|increased|decreased)\b/i);
        
        const currentPrice = priceMatch ? priceMatch[0] : '$248.50';
        const percentChange = percentMatch ? percentMatch[0] : '3.2%';
        const direction = directionMatch ? directionMatch[0].toLowerCase() : 'down';
        
        return {
            analysisType: 'semantic_cluster',
            pulsePoints: [
                {
                    dynamicPart: currentPrice,
                    staticPrefix: selectedText.substring(0, selectedText.indexOf(currentPrice)),
                    staticSuffix: selectedText.substring(selectedText.indexOf(currentPrice) + currentPrice.length),
                    fullSelection: selectedText,
                    pulseType: 'stock',
                    specificType: 'stock:tesla:price',
                    role: 'primary',
                    updateFrequency: 240,
                    reasoning: 'Stock prices change during market hours',
                    dataSource: 'Yahoo Finance API',
                    confidence: 'high',
                    action: 'closed',
                    subject: 'Tesla shares',
                    entity: 'Tesla Inc',
                    emotion: direction === 'down' ? 'negative' : 'positive'
                },
                {
                    dynamicPart: percentChange,
                    staticPrefix: ', ',
                    staticSuffix: ' from',
                    fullSelection: percentChange,
                    pulseType: 'stock',
                    specificType: 'stock:tesla:change_percent',
                    role: 'dependent',
                    updateFrequency: 240,
                    reasoning: 'Percentage calculated from price change',
                    dataSource: 'Calculated from stock price',
                    confidence: 'high',
                    action: 'changed',
                    subject: 'price movement',
                    entity: 'Tesla Inc'
                },
                {
                    dynamicPart: direction,
                    staticPrefix: ', ',
                    staticSuffix: ' ' + percentChange,
                    fullSelection: direction,
                    pulseType: 'stock',
                    specificType: 'stock:tesla:direction',
                    role: 'dependent',
                    updateFrequency: 240,
                    reasoning: 'Direction determined by price comparison',
                    dataSource: 'Calculated from price movement',
                    confidence: 'high',
                    action: direction,
                    subject: 'stock direction',
                    entity: 'Tesla Inc'
                }
            ],
            semanticCluster: {
                clusterId: 'tesla_price_cluster_' + Date.now(),
                clusterName: 'Tesla Stock Price Movement',
                clusterType: 'mathematical',
                primaryPulseIndex: 0,
                relationships: [
                    {
                        sourcePulseIndex: 0,
                        targetPulseIndex: 1,
                        relationshipType: 'percentage_change',
                        calculationRule: 'Calculate percentage change from current vs previous price',
                        dependencyOrder: 1
                    },
                    {
                        sourcePulseIndex: 0,
                        targetPulseIndex: 2,
                        relationshipType: 'direction',
                        calculationRule: 'Determine up/down based on price comparison',
                        dependencyOrder: 1
                    }
                ],
                semanticRule: 'Stock price drives percentage change and direction indicators'
            }
        };
    }

    /**
     * Generate weather comparison cluster
     */
    static generateWeatherComparisonCluster(selectedText) {
        const currentTempMatch = selectedText.match(/(\d+)°[CF]/);
        const comparisonMatch = selectedText.match(/(\d+) degrees? (warmer|cooler)/);
        
        const currentTemp = currentTempMatch ? currentTempMatch[0] : '25°C';
        const comparison = comparisonMatch ? `${comparisonMatch[1]} degrees ${comparisonMatch[2]}` : '5 degrees warmer';
        
        return {
            analysisType: 'semantic_cluster',
            pulsePoints: [
                {
                    dynamicPart: currentTemp,
                    staticPrefix: 'with ',
                    staticSuffix: ', a pleasant',
                    fullSelection: currentTemp,
                    pulseType: 'weather',
                    specificType: 'weather:adelaide:temperature',
                    role: 'primary',
                    updateFrequency: 180,
                    reasoning: 'Temperature updates several times daily',
                    dataSource: 'OpenWeatherMap API',
                    confidence: 'high',
                    action: 'experiencing',
                    subject: 'temperature',
                    entity: 'Adelaide',
                    emotion: 'pleasant'
                },
                {
                    dynamicPart: comparison,
                    staticPrefix: ', a pleasant ',
                    staticSuffix: ' than yesterday\'s',
                    fullSelection: comparison,
                    pulseType: 'weather',
                    specificType: 'weather:adelaide:comparison',
                    role: 'dependent',
                    updateFrequency: 180,
                    reasoning: 'Comparison calculated from current vs previous temperature',
                    dataSource: 'Calculated from temperature difference',
                    confidence: 'high',
                    action: 'compared',
                    subject: 'temperature difference',
                    entity: 'Adelaide'
                }
            ],
            semanticCluster: {
                clusterId: 'weather_comparison_' + Date.now(),
                clusterName: 'Adelaide Weather Comparison',
                clusterType: 'comparative',
                primaryPulseIndex: 0,
                relationships: [
                    {
                        sourcePulseIndex: 0,
                        targetPulseIndex: 1,
                        relationshipType: 'comparison',
                        calculationRule: 'Calculate temperature difference and determine warmer/cooler',
                        dependencyOrder: 1
                    }
                ],
                semanticRule: 'Current temperature drives the comparison with previous day'
            }
        };
    }

    /**
     * Generate revenue growth cluster
     */
    static generateRevenueGrowthCluster(selectedText) {
        const currentRevenueMatch = selectedText.match(/\$[\d.]+\s*[MB]/i);
        const previousRevenueMatch = selectedText.match(/from[^$]*\$[\d.]+\s*[MB]/i);
        const percentMatch = selectedText.match(/[\d.]+%/);
        
        const currentRevenue = currentRevenueMatch ? currentRevenueMatch[0] : '$2.5M';
        const previousRevenue = previousRevenueMatch ? previousRevenueMatch[0].replace(/from[^$]*/, '') : '$2.17M';
        const growthPercent = percentMatch ? percentMatch[0] : '15%';
        
        return {
            analysisType: 'semantic_cluster',
            pulsePoints: [
                {
                    dynamicPart: currentRevenue,
                    staticPrefix: 'grew 15% to ',
                    staticSuffix: ' from last quarter\'s',
                    fullSelection: currentRevenue,
                    pulseType: 'financial',
                    specificType: 'financial:revenue:current',
                    role: 'primary',
                    updateFrequency: 2160, // Monthly
                    reasoning: 'Revenue figures update monthly or quarterly',
                    dataSource: 'Financial reporting API',
                    confidence: 'high',
                    action: 'achieved',
                    subject: 'revenue',
                    entity: 'Company',
                    emotion: 'positive'
                },
                {
                    dynamicPart: growthPercent,
                    staticPrefix: 'grew ',
                    staticSuffix: ' to $2.5M',
                    fullSelection: growthPercent,
                    pulseType: 'financial',
                    specificType: 'financial:revenue:growth_rate',
                    role: 'dependent',
                    updateFrequency: 2160,
                    reasoning: 'Growth percentage calculated from revenue change',
                    dataSource: 'Calculated from revenue figures',
                    confidence: 'high',
                    action: 'grew',
                    subject: 'growth rate',
                    entity: 'Company'
                }
            ],
            semanticCluster: {
                clusterId: 'revenue_growth_' + Date.now(),
                clusterName: 'Revenue Growth Analysis',
                clusterType: 'mathematical',
                primaryPulseIndex: 0,
                relationships: [
                    {
                        sourcePulseIndex: 0,
                        targetPulseIndex: 1,
                        relationshipType: 'percentage_growth',
                        calculationRule: 'Calculate growth percentage from current vs previous revenue',
                        dependencyOrder: 1
                    }
                ],
                semanticRule: 'Current revenue drives growth percentage calculation'
            }
        };
    }

    /**
     * Generate a mock single pulse analysis
     */
    static generateMockSinglePulse(selectedText, mockType) {
        let dynamicPart = selectedText;
        let staticPrefix = '';
        let staticSuffix = '';
        
        // Try to identify the dynamic part based on patterns
        if (mockType.type === 'crypto') {
            const cryptoMatch = selectedText.match(/\$[\d,]+/);
            if (cryptoMatch) {
                const index = selectedText.indexOf(cryptoMatch[0]);
                dynamicPart = cryptoMatch[0];
                staticPrefix = selectedText.substring(0, index);
                staticSuffix = selectedText.substring(index + cryptoMatch[0].length);
            }
        } else if (mockType.type === 'weather') {
            const tempMatch = selectedText.match(/\d+°[CF]/);
            if (tempMatch) {
                const index = selectedText.indexOf(tempMatch[0]);
                dynamicPart = tempMatch[0];
                staticPrefix = selectedText.substring(0, index);
                staticSuffix = selectedText.substring(index + tempMatch[0].length);
            }
        } else if (mockType.type === 'stock') {
            const priceMatch = selectedText.match(/\$[\d,]+\.?\d*/);
            if (priceMatch) {
                const index = selectedText.indexOf(priceMatch[0]);
                dynamicPart = priceMatch[0];
                staticPrefix = selectedText.substring(0, index);
                staticSuffix = selectedText.substring(index + priceMatch[0].length);
            }
        } else if (mockType.type === 'population') {
            const popMatch = selectedText.match(/[\d.]+\s*million/i);
            if (popMatch) {
                const index = selectedText.indexOf(popMatch[0]);
                dynamicPart = popMatch[0];
                staticPrefix = selectedText.substring(0, index);
                staticSuffix = selectedText.substring(index + popMatch[0].length);
            }
        }
        
        return {
            analysisType: 'single_pulse',
            pulsePoints: [
                {
                    dynamicPart: dynamicPart,
                    staticPrefix: staticPrefix,
                    staticSuffix: staticSuffix,
                    fullSelection: selectedText,
                    pulseType: mockType.type,
                    specificType: `${mockType.type}:${mockType.category}`,
                    role: 'single',
                    updateFrequency: this.getUpdateFrequency(mockType.type),
                    reasoning: this.getReasoningText(mockType.type),
                    dataSource: this.getDataSource(mockType.type),
                    confidence: this.getConfidenceLevel(mockType.type, dynamicPart),
                    action: 'update',
                    subject: mockType.type,
                    entity: 'content'
                }
            ]
        };
    }

    /**
     * Generate mock full article scan
     */
    static generateMockFullScan(articleContent) {
        const pulsePoints = [];
        const clusters = [];
        
        // Enhanced pattern detection following framework rules
        
        // 1. Financial data patterns (prices + percentages + directions)
        const financialMatches = articleContent.match(/\$[\d,]+\.?\d*[^.]*?(?:up|down|rose|fell|gained|lost|increased|decreased)[^.]*?[\d.]+%/gi) || [];
        financialMatches.forEach((match, i) => {
            if (i < 2) { // Limit for demo
                const priceMatch = match.match(/\$[\d,]+\.?\d*/);
                const percentMatch = match.match(/[\d.]+%/);
                const directionMatch = match.match(/\b(up|down|rose|fell|gained|lost|increased|decreased)\b/i);
                
                if (priceMatch) {
                    pulsePoints.push({
                        text: priceMatch[0],
                        dynamicPart: priceMatch[0],
                        staticContext: match.substring(0, 50) + '...',
                        pulseType: 'stock',
                        specificType: 'stock:price',
                        updateFrequency: 240,
                        priority: 'high',
                        reasoning: 'Financial data changes during market hours',
                        confidence: 'high',
                        location: { position: 'early' }
                    });
                }
            }
        });
        
        // 2. Cryptocurrency patterns
        const cryptoMatches = articleContent.match(/\b(?:bitcoin|btc|ethereum|eth).*?\$[\d,]+/gi) || [];
        cryptoMatches.forEach((match, i) => {
            if (i < 2) {
                const priceMatch = match.match(/\$[\d,]+/);
                if (priceMatch) {
                    pulsePoints.push({
                        text: priceMatch[0],
                        dynamicPart: priceMatch[0],
                        staticContext: match,
                        pulseType: 'crypto',
                        specificType: match.toLowerCase().includes('bitcoin') ? 'crypto:btc:price' : 'crypto:eth:price',
                        updateFrequency: 60,
                        priority: 'critical',
                        reasoning: 'Cryptocurrency prices are highly volatile',
                        confidence: 'high',
                        location: { position: 'middle' }
                    });
                }
            }
        });
        
        // 3. Weather patterns
        const weatherMatches = articleContent.match(/\d+°[CF](?:[^.]*?(?:warmer|cooler|than|yesterday|today))?/gi) || [];
        weatherMatches.forEach((match, i) => {
            if (i < 2) {
                const tempMatch = match.match(/\d+°[CF]/);
                if (tempMatch) {
                    pulsePoints.push({
                        text: tempMatch[0],
                        dynamicPart: tempMatch[0],
                        staticContext: match,
                        pulseType: 'weather',
                        specificType: 'weather:temperature',
                        updateFrequency: 180,
                        priority: 'medium',
                        reasoning: 'Weather conditions change throughout the day',
                        confidence: 'high',
                        location: { position: 'middle' }
                    });
                }
            }
        });
        
        // 4. Population/demographic patterns
        const populationMatches = articleContent.match(/[\d.]+\s*million\s*(?:people|residents|population)/gi) || [];
        populationMatches.forEach((match, i) => {
            if (i < 1) {
                const popMatch = match.match(/[\d.]+\s*million/i);
                if (popMatch) {
                    pulsePoints.push({
                        text: popMatch[0],
                        dynamicPart: popMatch[0],
                        staticContext: match,
                        pulseType: 'population',
                        specificType: 'population:count',
                        updateFrequency: 43200, // Monthly
                        priority: 'low',
                        reasoning: 'Population data updates periodically',
                        confidence: 'medium',
                        location: { position: 'early' }
                    });
                }
            }
        });
        
        // 5. Date patterns
        const dateMatches = articleContent.match(/\b(?:in\s+)?(?:202[0-9]|january|february|march|april|may|june|july|august|september|october|november|december)\b/gi) || [];
        dateMatches.forEach((match, i) => {
            if (i < 2) {
                pulsePoints.push({
                    text: match,
                    dynamicPart: match,
                    staticContext: `Reference to ${match}`,
                    pulseType: 'date',
                    specificType: 'date:reference',
                    updateFrequency: 1440,
                    priority: 'low',
                    reasoning: 'Date references may need updating for currency',
                    confidence: 'medium',
                    location: { position: 'early' }
                });
            }
        });
        
        // Create clusters for related financial data
        if (pulsePoints.filter(p => p.pulseType === 'stock').length >= 2) {
            clusters.push({
                clusterName: 'Financial Performance Cluster',
                clusterType: 'mathematical',
                pulseIndices: pulsePoints.map((p, i) => p.pulseType === 'stock' ? i : -1).filter(i => i >= 0).slice(0, 3),
                relationships: [
                    {
                        sourceIndex: 0,
                        targetIndex: 1,
                        relationshipType: 'percentage_change',
                        calculationRule: 'Calculate percentage change from price movement'
                    }
                ],
                priority: 'high'
            });
        }
        
        return {
            articleAnalysis: {
                title: this.extractArticleTitle(articleContent),
                contentLength: articleContent.length,
                mainTopics: ['financial markets', 'technology', 'current events'],
                contentType: 'news',
                updatePotential: pulsePoints.length > 3 ? 'high' : pulsePoints.length > 1 ? 'medium' : 'low'
            },
            pulsePoints: pulsePoints,
            semanticClusters: clusters,
            recommendations: {
                totalPulsePoints: pulsePoints.length,
                highPriority: pulsePoints.filter(p => p.priority === 'high' || p.priority === 'critical').length,
                clustersIdentified: clusters.length,
                updateStrategy: pulsePoints.length > 5 ? 'aggressive' : pulsePoints.length > 2 ? 'moderate' : 'conservative',
                estimatedImpact: pulsePoints.length > 4 ? 'high' : pulsePoints.length > 2 ? 'medium' : 'low'
            }
        };
    }

    /**
     * Helper methods
     */
    
    static getUpdateFrequency(type) {
        const frequencies = {
            'crypto': 60,      // 1 hour
            'weather': 180,    // 3 hours  
            'stock': 240,      // 4 hours
            'population': 43200, // 1 month
            'date': 1440,      // 24 hours
            'other': 720       // 12 hours
        };
        return frequencies[type] || 180;
    }

    static getReasoningText(type) {
        const reasons = {
            'crypto': 'Cryptocurrency prices are highly volatile and change frequently',
            'weather': 'Weather conditions change throughout the day',
            'stock': 'Stock prices change during market hours',
            'population': 'Demographic data updates periodically with census releases',
            'date': 'Date references may become outdated',
            'other': 'General data that may change over time'
        };
        return reasons[type] || 'Data may change and should be kept current';
    }

    static getDataSource(type) {
        const sources = {
            'crypto': 'CoinGecko API',
            'weather': 'OpenWeatherMap API',
            'stock': 'Yahoo Finance API',
            'population': 'Australian Bureau of Statistics',
            'date': 'System Date/Time',
            'other': 'AI Research API'
        };
        return sources[type] || 'External API';
    }

    static getConfidenceLevel(type, dynamicPart) {
        // Higher confidence for well-formatted numeric data
        if (dynamicPart.match(/\$[\d,]+\.?\d*/) || dynamicPart.match(/\d+°[CF]/)) {
            return 'high';
        }
        
        const reliableTypes = ['crypto', 'weather', 'stock'];
        if (reliableTypes.includes(type)) {
            return 'medium';
        }
        
        return 'low';
    }

    static extractArticleTitle(content) {
        const lines = content.split('\n');
        const firstLine = lines[0].trim();
        return firstLine.length > 0 && firstLine.length < 100 ? firstLine : 'Untitled Article';
    }
}