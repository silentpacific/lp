// LivePulse Analysis Engine
// js/analysis/pulse-analyzer.js

// Initialize namespace
window.LivePulse = window.LivePulse || {};
window.LivePulse.Analysis = window.LivePulse.Analysis || {};
window.LivePulse.Analysis.PulseAnalyzer = {};

// ===== PULSE ANALYZER CLASS =====

class PulseAnalyzer {
    constructor() {
        this.isInitialized = false;
        this.currentAnalysis = null;
        this.lastScanResults = null;
        this.analysisCache = new Map();
        this.init();
    }

    /**
     * Initialize the analyzer
     */
    init() {
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('🔬 Pulse Analyzer initialized');
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            // Analyze button
            const analyzeBtn = document.getElementById('analyze-btn');
            if (analyzeBtn) {
                analyzeBtn.addEventListener('click', () => this.analyzeSinglePulse());
            }

            // Scan full article button
            const scanBtn = document.getElementById('scan-full-article');
            if (scanBtn) {
                scanBtn.addEventListener('click', () => this.scanFullArticle());
            }

            // Create pulse button
            const createBtn = document.getElementById('create-pulse-btn');
            if (createBtn) {
                createBtn.addEventListener('click', () => this.createPulseFromAnalysis());
            }

            // Article content change - clear scan results
            const articleContent = document.getElementById('article-content');
            if (articleContent) {
                const utils = window.LivePulse.Utils;
                const debouncedClear = utils ? utils.debounce(() => this.clearScanResults(), 300) : (() => this.clearScanResults());
                articleContent.addEventListener('input', debouncedClear);
            }

            // Selected text change - clear analysis
            const selectedText = document.getElementById('selected-text');
            if (selectedText) {
                selectedText.addEventListener('input', () => this.clearCurrentAnalysis());
            }
        });
    }

    /**
     * Analyze selected text for pulse points
     */
    async analyzeSinglePulse() {
        console.log('🔬 Starting single pulse analysis...');
        
        const selectedTextEl = document.getElementById('selected-text');
        const articleContentEl = document.getElementById('article-content');
        
        if (!selectedTextEl || !articleContentEl) {
            window.showError('Required form elements not found');
            return;
        }
        
        const selectedTextValue = selectedTextEl.value.trim();
        const articleContentValue = articleContentEl.value.trim();

        if (!selectedTextValue) {
            window.showError('Please enter the text you want to make dynamic');
            return;
        }

        if (!articleContentValue) {
            window.showError('Please enter some article content first');
            return;
        }

        // Check cache first
        const cacheKey = `single_${this.hashString(selectedTextValue + articleContentValue)}`;
        if (this.analysisCache.has(cacheKey)) {
            console.log('📋 Using cached analysis');
            const cachedAnalysis = this.analysisCache.get(cacheKey);
            this.displayAnalysisResults(cachedAnalysis, selectedTextValue);
            return;
        }

        // Show loading state
        const analyzeBtn = document.getElementById('analyze-btn');
        this.setButtonLoading(analyzeBtn, 'Analyzing...');
        
        try {
            let analysis;
            
            // Try real API first
            try {
                console.log('🌐 Attempting API call...');
                analysis = await this.callAnalysisAPI(selectedTextValue, articleContentValue, 'single_pulse');
                console.log('✅ API analysis successful');
            } catch (apiError) {
                console.log('⚠️ API unavailable, using mock analysis:', apiError.message);
                // Fall back to mock analysis
                analysis = this.generateMockAnalysis(selectedTextValue, articleContentValue);
            }

            // Cache the result
            this.analysisCache.set(cacheKey, analysis);
            
            // Store and display results
            this.currentAnalysis = analysis;
            this.displayAnalysisResults(analysis, selectedTextValue);
            
            window.showSuccess('Analysis completed! Review the detected pulse points below.');

        } catch (error) {
            console.error('❌ Analysis error:', error);
            window.showError('Analysis error: ' + error.message);
        } finally {
            this.setButtonLoading(analyzeBtn, 'Analyze', false);
        }
    }

    /**
     * Scan entire article for pulse points
     */
    async scanFullArticle() {
        console.log('🔍 Starting full article scan...');
        
        const articleContentEl = document.getElementById('article-content');
        const scanBtn = document.getElementById('scan-full-article');
        
        if (!articleContentEl || !scanBtn) {
            window.showError('Required elements not found');
            return;
        }
        
        const articleContentValue = articleContentEl.value.trim();

        if (!articleContentValue) {
            window.showError('Please enter article content to scan');
            return;
        }

        // Check cache first
        const cacheKey = `full_${this.hashString(articleContentValue)}`;
        if (this.analysisCache.has(cacheKey)) {
            console.log('📋 Using cached scan results');
            const cachedResults = this.analysisCache.get(cacheKey);
            this.displayScanResults(cachedResults);
            return;
        }

        // Show loading state
        this.setButtonLoading(scanBtn, 'Scanning Article...');
        scanBtn.classList.add('btn-disabled');
        
        try {
            let analysis;
            
            // Try real API first
            try {
                console.log('🌐 Attempting full scan API call...');
                analysis = await this.callAnalysisAPI(articleContentValue, articleContentValue, 'full_article_scan');
                console.log('✅ Full scan API successful');
            } catch (apiError) {
                console.log('⚠️ Scan API unavailable, using mock scan:', apiError.message);
                // Fall back to mock scan
                analysis = this.generateMockFullScan(articleContentValue);
            }

            // Cache the result
            this.analysisCache.set(cacheKey, analysis);
            
            // Store and display results
            this.lastScanResults = analysis;
            this.displayScanResults(analysis);
            
            const pulseCount = analysis.pulsePoints?.length || 0;
            const clusterCount = analysis.semanticClusters?.length || 0;
            window.showSuccess(`Found ${pulseCount} potential pulse points and ${clusterCount} clusters`);
            
            // Keep button disabled after successful scan
            scanBtn.textContent = '✅ Article Scanned';
            scanBtn.classList.add('btn-disabled');
            scanBtn.disabled = true;

        } catch (error) {
            console.error('❌ Scan error:', error);
            window.showError('Article scan failed: ' + error.message);
            this.resetScanButton();
        }
    }

    /**
     * Call the analysis API
     */
    async callAnalysisAPI(selectedText, articleContent, mode) {
        const config = window.LivePulse.Config;
        const utils = window.LivePulse.Utils;
        
        const endpoint = config?.DataSources?.ENDPOINTS?.ANALYZE_PULSE || '/.netlify/functions/analyze-pulse';
        const articleTitle = utils ? utils.extractArticleTitle(articleContent) : 'Unknown Article';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                selectedText: selectedText,
                articleContent: articleContent,
                articleTitle: articleTitle,
                mode: mode
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'API returned error');
        }

        return data.analysis;
    }

    /**
     * Generate mock analysis for demo purposes
     */
    generateMockAnalysis(selectedText, articleContent) {
        console.log('🎭 Generating mock analysis for:', selectedText.substring(0, 50) + '...');
        
        const mockType = this.detectMockType(selectedText);
        
        if (mockType.isCluster) {
            return this.generateMockCluster(selectedText, mockType);
        } else {
            return this.generateMockSinglePulse(selectedText, mockType);
        }
    }

    /**
     * Detect the type of content for mock analysis
     */
    detectMockType(selectedText) {
        const text = selectedText.toLowerCase();
        
        // Stock/financial cluster patterns
        if (text.includes('$') && (text.includes('%') || text.includes('down') || text.includes('up'))) {
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
        
        // Crypto price
        if (text.includes('bitcoin') || text.includes('btc') || text.includes('crypto')) {
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
        if (text.includes('$') && (text.includes('shares') || text.includes('stock') || text.includes('price'))) {
            return {
                isCluster: false,
                type: 'stock',
                category: 'stock_price'
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
     * Generate mock cluster analysis
     */
    generateMockCluster(selectedText, mockType) {
        if (mockType.category === 'financial_cluster') {
            // Extract price and percentage from text
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
                        dataSource: 'Financial markets API',
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
        
        // Weather comparison cluster
        if (mockType.category === 'weather_comparison') {
            const currentTempMatch = selectedText.match(/(\d+)°[CF]/);
            const comparisonMatch = selectedText.match(/(\d+) degrees? (warmer|cooler)/);
            
            const currentTemp = currentTempMatch ? currentTempMatch[0] : '25°C';
            const comparison = comparisonMatch ? `${comparisonMatch[1]} degrees ${comparisonMatch[2]}` : '5 degrees warmer';
            
            return {
                analysisType: 'semantic_cluster',
                pulsePoints: [
                    {
                        dynamicPart: currentTemp,
                        staticPrefix: 'is ',
                        staticSuffix: ', ',
                        fullSelection: currentTemp,
                        pulseType: 'weather',
                        specificType: 'weather:adelaide:temperature',
                        role: 'primary',
                        updateFrequency: 180,
                        reasoning: 'Temperature updates several times daily',
                        dataSource: 'Weather API',
                        confidence: 'high',
                        action: 'experiencing',
                        subject: 'temperature',
                        entity: 'Adelaide'
                    },
                    {
                        dynamicPart: comparison,
                        staticPrefix: ', ',
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
        
        // Fallback to single pulse
        return this.generateMockSinglePulse(selectedText, mockType);
    }

    /**
     * Generate mock single pulse analysis
     */
    generateMockSinglePulse(selectedText, mockType) {
        const config = window.LivePulse.Config;
        
        // Extract the likely dynamic part
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
        }
        
        const defaultFreq = config?.Pulse?.DEFAULT_FREQUENCIES?.[mockType.type] || 180;
        
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
                    updateFrequency: defaultFreq,
                    reasoning: `${mockType.type} data changes regularly and should be kept current`,
                    dataSource: `${mockType.type.charAt(0).toUpperCase() + mockType.type.slice(1)} API`,
                    confidence: 'medium',
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
    generateMockFullScan(articleContent) {
        const pulsePoints = [];
        const clusters = [];
        const utils = window.LivePulse.Utils;

        // Financial data patterns
        const financialMatches = articleContent.match(/\$[\d,]+\.?\d*[^.]*?(?:up|down|rose|fell|gained|lost|increased|decreased)[^.]*?[\d.]+%/gi) || [];
        financialMatches.forEach((match, i) => {
            if (i < 2) {
                const priceMatch = match.match(/\$[\d,]+\.?\d*/);
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

        // Cryptocurrency patterns
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

        // Weather patterns
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

        // Date patterns
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
                relationships: [{
                    sourceIndex: 0,
                    targetIndex: 1,
                    relationshipType: 'percentage_change',
                    calculationRule: 'Calculate percentage change from price movement'
                }],
                priority: 'high'
            });
        }

        const articleTitle = utils ? utils.extractArticleTitle(articleContent) : 'Unknown Article';

        return {
            articleAnalysis: {
                title: articleTitle,
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
     * Display analysis results
     */
    displayAnalysisResults(analysis, originalText) {
        const analysisResult = document.getElementById('analysis-result');
        const analysisContent = document.getElementById('analysis-content');
        const createPulseBtn = document.getElementById('create-pulse-btn');
        
        if (!analysisContent) return;
        
        const isCluster = analysis.analysisType === 'semantic_cluster';
        const pulsePoints = analysis.pulsePoints || [];
        const cluster = analysis.semanticCluster;

        let analysisHTML = `
            <div class="analysis-header">
                <h3>📊 Smart Analysis Results</h3>
                <div class="analysis-type">
                    <span class="analysis-badge ${isCluster ? 'cluster' : 'single'}">${isCluster ? '🔗 Semantic Cluster' : '📍 Single Pulse'}</span>
                </div>
            </div>
        `;

        if (isCluster && cluster) {
            analysisHTML += `
                <div class="cluster-info">
                    <h4>🔗 Cluster: ${cluster.clusterName}</h4>
                    <p class="cluster-description">${cluster.semanticRule}</p>
                    <div class="cluster-meta">
                        <span>Type: ${cluster.clusterType}</span>
                        <span>Pulse Points: ${pulsePoints.length}</span>
                        <span>Relationships: ${cluster.relationships?.length || 0}</span>
                    </div>
                </div>
            `;
        }

        // Display pulse points
        analysisHTML += '<div class="pulse-points-section"><h4>🎯 Pulse Points Detected:</h4>';
        
        pulsePoints.forEach((pulse, index) => {
            const isPrimary = pulse.role === 'primary';
            const roleIcon = isPrimary ? '🔥' : pulse.role === 'dependent' ? '⚡' : '📌';
            const roleClass = pulse.role || 'single';
            
            const utils = window.LivePulse.Utils;
            const freqText = utils ? utils.formatFrequency(pulse.updateFrequency || 180) : `${pulse.updateFrequency || 180} minutes`;
            
            analysisHTML += `
                <div class="pulse-point-card ${roleClass}">
                    <div class="pulse-header">
                        <span class="pulse-role ${roleClass}">${roleIcon} ${(pulse.role || 'single').toUpperCase()}</span>
                        <span class="pulse-confidence confidence-${pulse.confidence || 'medium'}">${pulse.confidence || 'medium'}</span>
                    </div>
                    
                    <div class="text-breakdown">
                        <div class="text-parts">
                            <span class="static-text">${pulse.staticPrefix || ''}</span><span class="dynamic-text" title="This will update automatically">${pulse.dynamicPart || ''}</span><span class="static-text">${pulse.staticSuffix || ''}</span>
                        </div>
                    </div>
                    
                    <div class="pulse-details">
                        <div class="detail-row">
                            <label>Type:</label>
                            <span>${pulse.pulseType || 'unknown'} → ${pulse.specificType || 'unknown'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Update Frequency:</label>
                            <span>${freqText}</span>
                        </div>
                        <div class="detail-row">
                            <label>Data Source:</label>
                            <span>${pulse.dataSource || 'Unknown'}</span>
                        </div>
                        <div class="detail-row">
                            <label>Reasoning:</label>
                            <span>${pulse.reasoning || 'No reasoning provided'}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        analysisHTML += '</div>';

        // Display relationships if cluster
        if (isCluster && cluster && cluster.relationships && cluster.relationships.length > 0) {
            analysisHTML += '<div class="relationships-section"><h4>🔄 Relationships:</h4>';
            
            cluster.relationships.forEach(rel => {
                const sourcePulse = pulsePoints[rel.sourcePulseIndex];
                const targetPulse = pulsePoints[rel.targetPulseIndex];
                
                if (sourcePulse && targetPulse) {
                    analysisHTML += `
                        <div class="relationship-card">
                            <div class="relationship-flow">
                                <span class="source-pulse">${sourcePulse.dynamicPart}</span>
                                <span class="relationship-arrow">→</span>
                                <span class="target-pulse">${targetPulse.dynamicPart}</span>
                            </div>
                            <div class="relationship-details">
                                <strong>${rel.relationshipType}</strong>: ${rel.calculationRule}
                            </div>
                        </div>
                    `;
                }
            });
            
            analysisHTML += '</div>';
        }

        analysisContent.innerHTML = analysisHTML;
        
        // Show analysis result and create button
        if (analysisResult) analysisResult.classList.remove('hidden');
        if (createPulseBtn) createPulseBtn.classList.remove('hidden');
    }

    /**
     * Display scan results
     */
    displayScanResults(analysis) {
        const fullScanResults = document.getElementById('full-scan-results');
        const scanResultsContent = document.getElementById('scan-results-content');
        const scanPulseCount = document.getElementById('scan-pulse-count');
        const scanClusterCount = document.getElementById('scan-cluster-count');

        if (!fullScanResults || !scanResultsContent) return;

        // Update stats
        if (scanPulseCount) scanPulseCount.textContent = `${analysis.pulsePoints?.length || 0} pulse points`;
        if (scanClusterCount) scanClusterCount.textContent = `${analysis.semanticClusters?.length || 0} clusters`;

        let resultsHTML = '';

        if (analysis.pulsePoints && analysis.pulsePoints.length > 0) {
            resultsHTML += '<div class="discovered-pulses"><h4>🎯 Discovered Pulse Points:</h4>';
            
            analysis.pulsePoints.forEach((pulse, index) => {
                const priorityClass = `priority-${pulse.priority || 'medium'}`;
                const utils = window.LivePulse.Utils;
                const freqText = utils ? utils.formatFrequency(pulse.updateFrequency) : `${pulse.updateFrequency} min`;
                
                resultsHTML += `
                    <div class="discovered-pulse-card ${priorityClass}">
                        <div class="pulse-preview">
                            <span class="pulse-text">"${pulse.text || pulse.dynamicPart}"</span>
                            <span class="pulse-priority ${pulse.priority || 'medium'}">${pulse.priority || 'medium'}</span>
                            <div class="pulse-info">
                                <span>${pulse.pulseType}</span>
                                <span>${freqText}</span>
                                <span>Confidence: ${pulse.confidence}</span>
                            </div>
                        </div>
                        <button onclick="window.LivePulse.Analysis.PulseAnalyzer.manager.createPulseFromScan(${index})" class="btn btn-small btn-success">Create Pulse</button>
                    </div>
                `;
            });
            
            resultsHTML += '</div>';
        }

        if (analysis.semanticClusters && analysis.semanticClusters.length > 0) {
            resultsHTML += '<div class="discovered-clusters"><h4>🔗 Discovered Clusters:</h4>';
            
            analysis.semanticClusters.forEach((cluster, index) => {
                resultsHTML += `
                    <div class="discovered-cluster-card">
                        <div style="flex: 1;">
                            <h5>${cluster.clusterName}</h5>
                            <div class="cluster-pulses">
                                ${cluster.pulseIndices.map(i => `<span class="cluster-pulse">"${analysis.pulsePoints[i]?.dynamicPart || analysis.pulsePoints[i]?.text}"</span>`).join('')}
                            </div>
                        </div>
                        <button onclick="window.LivePulse.Analysis.PulseAnalyzer.manager.createClusterFromScan(${index})" class="btn btn-small btn-success">Create Cluster</button>
                    </div>
                `;
            });
            
            resultsHTML += '</div>';
        }

        if (!analysis.pulsePoints?.length && !analysis.semanticClusters?.length) {
            resultsHTML = `
                <div style="text-align: center; padding: 2rem; color: #6b7280;">
                    <div style="font-size: 2rem; margin-bottom: 1rem;">🔍</div>
                    <h4 style="color: #4b5563;">No pulse points detected</h4>
                    <p>Try analyzing specific text manually below, or check if your article contains numerical data, dates, or other dynamic content.</p>
                </div>
            `;
        }

        scanResultsContent.innerHTML = resultsHTML;
        fullScanResults.classList.remove('hidden');
    }

    /**
     * Create pulse from current analysis
     */
    createPulseFromAnalysis() {
        if (!this.currentAnalysis) {
            window.showError('No analysis results to create pulse from');
            return;
        }

        // This will be handled by pulse creator module
        if (window.LivePulse.PulseManagement && window.LivePulse.PulseManagement.Creator) {
            if (this.currentAnalysis.analysisType === 'semantic_cluster') {
                window.LivePulse.PulseManagement.Creator.createSemanticCluster(this.currentAnalysis);
            } else {
                window.LivePulse.PulseManagement.Creator.createSinglePulse(this.currentAnalysis.pulsePoints[0]);
            }
        } else {
            // Fallback for backward compatibility
            if (window.createPulseFromAnalysis) {
                window.createPulseFromAnalysis();
            } else {
                window.showError('Pulse creation system not available');
            }
        }

        // Clear current analysis
        this.clearCurrentAnalysis();
    }

    /**
     * Create pulse from scan results
     */
    createPulseFromScan(pulseIndex) {
        if (!this.lastScanResults || !this.lastScanResults.pulsePoints) {
            window.showError('No scan results available');
            return;
        }
        
        const pulseData = this.lastScanResults.pulsePoints[pulseIndex];
        if (!pulseData) {
            window.showError('Pulse data not found');
            return;
        }

        // Convert scan result to pulse format
        const dynamicText = String(pulseData.dynamicPart || pulseData.text || '').trim();
        const contextText = String(pulseData.staticContext || '').trim();
        
        // Try to extract prefix and suffix from context
        let staticPrefix = '';
        let staticSuffix = '';
        
        if (contextText && dynamicText && contextText.includes(dynamicText)) {
            const parts = contextText.split(dynamicText);
            staticPrefix = parts[0] || '';
            staticSuffix = parts.slice(1).join(dynamicText) || '';
        }

        const convertedPulse = {
            dynamicPart: dynamicText,
            staticPrefix: staticPrefix,
            staticSuffix: staticSuffix,
            fullSelection: dynamicText,
            pulseType: pulseData.pulseType || 'unknown',
            specificType: pulseData.specificType || 'unknown',
            updateFrequency: pulseData.updateFrequency || 180,
            dataSource: pulseData.dataSource || 'Unknown',
            reasoning: pulseData.reasoning || 'Created from scan',
            confidence: pulseData.confidence || 'medium',
            role: 'single'
        };

        // Create pulse using pulse creator module
        if (window.LivePulse.PulseManagement && window.LivePulse.PulseManagement.Creator) {
            window.LivePulse.PulseManagement.Creator.createSinglePulse(convertedPulse);
        } else {
            // Fallback for backward compatibility
            if (window.createSinglePulse) {
                window.createSinglePulse(convertedPulse);
            } else {
                window.showError('Pulse creation system not available');
            }
        }

        window.showSuccess(`Created pulse point: "${convertedPulse.dynamicPart}"`);
    }

    /**
     * Create cluster from scan results
     */
    createClusterFromScan(clusterIndex) {
        if (!this.lastScanResults || !this.lastScanResults.semanticClusters) {
            window.showError('No scan results available');
            return;
        }
        
        const clusterData = this.lastScanResults.semanticClusters[clusterIndex];
        const pulsePoints = this.lastScanResults.pulsePoints;
        if (!clusterData || !pulsePoints) {
            window.showError('Cluster data not found');
            return;
        }

        // Validate pulse indices exist
        if (!clusterData.pulseIndices || clusterData.pulseIndices.length === 0) {
            window.showError('No pulse points found in cluster');
            return;
        }

        // Convert scan cluster to analysis format
        const convertedAnalysis = {
            analysisType: 'semantic_cluster',
            pulsePoints: clusterData.pulseIndices.map((pulseIndex, i) => {
                const pulse = pulsePoints[pulseIndex];
                if (!pulse) {
                    console.warn(`Pulse at index ${pulseIndex} not found`);
                    return null;
                }
                
                const dynamicText = String(pulse.dynamicPart || pulse.text || '').trim();
                const contextText = String(pulse.staticContext || '').trim();
                
                let staticPrefix = '';
                let staticSuffix = '';
                
                if (contextText && dynamicText && contextText.includes(dynamicText)) {
                    const parts = contextText.split(dynamicText);
                    staticPrefix = parts[0] || '';
                    staticSuffix = parts.slice(1).join(dynamicText) || '';
                }
                
                return {
                    dynamicPart: dynamicText,
                    staticPrefix: staticPrefix,
                    staticSuffix: staticSuffix,
                    fullSelection: dynamicText,
                    pulseType: pulse.pulseType || 'unknown',
                    specificType: pulse.specificType || 'unknown',
                    updateFrequency: pulse.updateFrequency || 180,
                    dataSource: pulse.dataSource || 'Unknown',
                    reasoning: pulse.reasoning || 'Created from cluster scan',
                    confidence: pulse.confidence || 'medium',
                    role: i === 0 ? 'primary' : 'dependent'
                };
            }).filter(Boolean),
            semanticCluster: {
                clusterId: `scan_cluster_${clusterIndex}`,
                clusterName: clusterData.clusterName || 'Unnamed Cluster',
                clusterType: clusterData.clusterType || 'mathematical',
                relationships: clusterData.relationships || [],
                semanticRule: `Cluster created from article scan: ${clusterData.clusterName || 'Unnamed Cluster'}`
            }
        };

        if (convertedAnalysis.pulsePoints.length === 0) {
            window.showError('No valid pulse points found in cluster');
            return;
        }

        // Create cluster using pulse creator module
        if (window.LivePulse.PulseManagement && window.LivePulse.PulseManagement.Creator) {
            window.LivePulse.PulseManagement.Creator.createSemanticCluster(convertedAnalysis);
        } else {
            // Fallback for backward compatibility
            if (window.createSemanticCluster) {
                window.createSemanticCluster(convertedAnalysis);
            } else {
                window.showError('Cluster creation system not available');
            }
        }

        window.showSuccess(`Created semantic cluster: "${convertedAnalysis.semanticCluster.clusterName}" with ${convertedAnalysis.pulsePoints.length} pulse points`);
    }

    /**
     * Clear current analysis
     */
    clearCurrentAnalysis() {
        this.currentAnalysis = null;
        
        const selectedText = document.getElementById('selected-text');
        const analysisResult = document.getElementById('analysis-result');
        const createPulseBtn = document.getElementById('create-pulse-btn');
        
        if (selectedText) selectedText.value = '';
        if (analysisResult) analysisResult.classList.add('hidden');
        if (createPulseBtn) createPulseBtn.classList.add('hidden');
    }

    /**
     * Clear scan results
     */
    clearScanResults() {
        this.lastScanResults = null;
        
        const fullScanResults = document.getElementById('full-scan-results');
        if (fullScanResults) {
            fullScanResults.classList.add('hidden');
        }
        this.resetScanButton();
    }

    /**
     * Reset scan button to original state
     */
    resetScanButton() {
        const scanBtn = document.getElementById('scan-full-article');
        if (scanBtn) {
            scanBtn.textContent = '🔍 Scan Full Article for Pulse Points';
            scanBtn.classList.remove('btn-disabled');
            scanBtn.disabled = false;
        }
    }

    /**
     * Set button loading state
     */
    setButtonLoading(button, loadingText, isLoading = true) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || loadingText;
        }
    }

    /**
     * Hash string for caching
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString();
    }

    /**
     * Clear analysis cache
     */
    clearCache() {
        this.analysisCache.clear();
        console.log('🧹 Analysis cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.analysisCache.size,
            memoryUsage: JSON.stringify(Array.from(this.analysisCache.entries())).length
        };
    }
}

// ===== GLOBAL INSTANCE =====
window.LivePulse.Analysis.PulseAnalyzer.manager = new PulseAnalyzer();

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Analyze single pulse
 */
window.LivePulse.Analysis.PulseAnalyzer.analyzeSingle = function() {
    return this.manager.analyzeSinglePulse();
};

/**
 * Scan full article
 */
window.LivePulse.Analysis.PulseAnalyzer.scanArticle = function() {
    return this.manager.scanFullArticle();
};

/**
 * Create pulse from analysis
 */
window.LivePulse.Analysis.PulseAnalyzer.createPulse = function() {
    return this.manager.createPulseFromAnalysis();
};

/**
 * Clear current analysis
 */
window.LivePulse.Analysis.PulseAnalyzer.clearAnalysis = function() {
    return this.manager.clearCurrentAnalysis();
};

/**
 * Clear scan results
 */
window.LivePulse.Analysis.PulseAnalyzer.clearScan = function() {
    return this.manager.clearScanResults();
};

/**
 * Get current analysis
 */
window.LivePulse.Analysis.PulseAnalyzer.getCurrentAnalysis = function() {
    return this.manager.currentAnalysis;
};

/**
 * Get last scan results
 */
window.LivePulse.Analysis.PulseAnalyzer.getLastScan = function() {
    return this.manager.lastScanResults;
};

// ===== BACKWARD COMPATIBILITY FUNCTIONS =====

/**
 * Legacy analyze single pulse function
 */
window.analyzeSinglePulse = function() {
    return window.LivePulse.Analysis.PulseAnalyzer.manager.analyzeSinglePulse();
};

/**
 * Legacy scan full article function
 */
window.scanFullArticle = function() {
    return window.LivePulse.Analysis.PulseAnalyzer.manager.scanFullArticle();
};

/**
 * Legacy create pulse from analysis function
 */
window.createPulseFromAnalysis = function() {
    return window.LivePulse.Analysis.PulseAnalyzer.manager.createPulseFromAnalysis();
};

/**
 * Legacy create pulse from scan function
 */
window.createPulseFromScan = function(pulseIndex) {
    return window.LivePulse.Analysis.PulseAnalyzer.manager.createPulseFromScan(pulseIndex);
};

/**
 * Legacy create cluster from scan function
 */
window.createClusterFromScan = function(clusterIndex) {
    return window.LivePulse.Analysis.PulseAnalyzer.manager.createClusterFromScan(clusterIndex);
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔬 LivePulse Pulse Analyzer loaded');
});

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LivePulse.Analysis.PulseAnalyzer;
}