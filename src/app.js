// Universal LivePulse Frontend with Semantic Cluster Support
// Optimized for performance and editor features
// src/app.js

let currentAnalysis = null;
let pulses = [];
let semanticClusters = [];
let pulseCounter = 1;
let clusterCounter = 1;

// Editor preferences (only for app.html)
let showFootnotes = true;
let showSuperscripts = true;
let isEditorMode = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🫀 LivePulse App loading...');
    
    // Detect if we're in editor mode (app.html) or landing page (index.html)
    isEditorMode = document.body.classList.contains('app-body') || 
                   document.querySelector('.app-header') !== null;
    
    console.log(`Mode detected: ${isEditorMode ? 'Editor' : 'Landing Page'}`);
    
    if (isEditorMode) {
        initializeEditorApp();
    } else {
        initializeLandingPage();
    }
});

/**
 * Initialize editor application (app.html)
 */
function initializeEditorApp() {
    console.log('🔧 Initializing editor mode...');
    
    // Get DOM elements
    const articleContent = document.getElementById('article-content');
    const selectedText = document.getElementById('selected-text');
    const analyzeBtn = document.getElementById('analyze-btn');
    const analysisResult = document.getElementById('analysis-result');
    const analysisContent = document.getElementById('analysis-content');
    const createPulseBtn = document.getElementById('create-pulse-btn');
    const articlePreview = document.getElementById('article-preview');
    const pulseList = document.getElementById('pulse-list');
    const scanFullArticleBtn = document.getElementById('scan-full-article');

    // Check if elements exist
    if (!articleContent || !selectedText || !analyzeBtn) {
        console.error('❌ Required DOM elements not found');
        return;
    }
    
    console.log('✅ DOM elements found, initializing editor...');

    // Initialize UI event listeners
    initializeEventListeners();
    
    // Initialize editor-specific features
    initializeEditorFeatures();
    
    // Initialize mobile menu
    initializeMobileMenu();
    
    // Update initial preview and stats
    updatePreview();
    updateStatsDisplay();
    
    console.log('✅ Editor mode fully loaded!');
}

/**
 * Initialize landing page (index.html) 
 */
function initializeLandingPage() {
    console.log('🏠 Initializing landing page mode...');
    
    // Only handle smooth scrolling and header effects for landing page
    initSmoothScrolling();
    initHeaderScrollEffect();
    
    console.log('✅ Landing page mode loaded!');
}

/**
 * Initialize all event listeners (editor mode only)
 */
function initializeEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    const articleContent = document.getElementById('article-content');
    const selectedText = document.getElementById('selected-text');
    const analyzeBtn = document.getElementById('analyze-btn');
    const createPulseBtn = document.getElementById('create-pulse-btn');
    const scanFullArticleBtn = document.getElementById('scan-full-article');
    
    // Analyze single pulse button
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', analyzeSinglePulse);
    }
    
    // Create pulse button
    if (createPulseBtn) {
        createPulseBtn.addEventListener('click', createPulseFromAnalysis);
    }
    
    // Scan full article button
    if (scanFullArticleBtn) {
        scanFullArticleBtn.addEventListener('click', scanFullArticle);
    }
    
    // Article content change - update preview and clear scan results
    if (articleContent) {
        articleContent.addEventListener('input', debounce(function() {
            updatePreview();
            clearScanResults();
        }, 300));
    }
    
    // Selected text change - clear previous analysis
    if (selectedText) {
        selectedText.addEventListener('input', function() {
            if (currentAnalysis) {
                const analysisResult = document.getElementById('analysis-result');
                const createPulseBtn = document.getElementById('create-pulse-btn');
                if (analysisResult) analysisResult.classList.add('hidden');
                if (createPulseBtn) createPulseBtn.classList.add('hidden');
                currentAnalysis = null;
            }
        });
    }
    
    console.log('✅ Event listeners set up successfully');
}

/**
 * Initialize editor-specific features (app.html only)
 */
function initializeEditorFeatures() {
    if (!isEditorMode) return;
    
    console.log('🎨 Initializing editor features...');
    
    const toggleFootnotesBtn = document.getElementById('toggle-footnotes');
    const toggleSuperscriptsBtn = document.getElementById('toggle-superscripts');
    const exportHtmlBtn = document.getElementById('export-html');

    // Toggle footnotes
    if (toggleFootnotesBtn) {
        toggleFootnotesBtn.addEventListener('click', function() {
            showFootnotes = !showFootnotes;
            updateFootnotesDisplay();
            updatePreview();
            updateStatsDisplay();
            showSuccess(`Footnotes ${showFootnotes ? 'enabled' : 'disabled'}`);
        });
    }

    // Toggle superscripts
    if (toggleSuperscriptsBtn) {
        toggleSuperscriptsBtn.addEventListener('click', function() {
            showSuperscripts = !showSuperscripts;
            updateSuperscriptsDisplay();
            updatePreview();
            updateStatsDisplay();
            showSuccess(`Superscripts ${showSuperscripts ? 'enabled' : 'disabled'}`);
        });
    }

    // Export HTML
    if (exportHtmlBtn) {
        exportHtmlBtn.addEventListener('click', exportArticleHtml);
    }

    console.log('✅ Editor features initialized');
}

/**
 * Update footnotes display (editor mode only)
 */
function updateFootnotesDisplay() {
    if (!isEditorMode) return;
    
    const footnotesSection = document.querySelector('.footnotes-section');
    if (footnotesSection) {
        footnotesSection.style.display = showFootnotes ? 'block' : 'none';
    }
}

/**
 * Update superscripts display (editor mode only)
 */
function updateSuperscriptsDisplay() {
    if (!isEditorMode) return;
    
    const superscripts = document.querySelectorAll('.pulse-point sup');
    superscripts.forEach(sup => {
        sup.style.display = showSuperscripts ? 'inline' : 'none';
    });
}

/**
 * Update stats display with editor features
 */
function updateStatsDisplay() {
    // Update basic stats
    const activePulseCount = document.getElementById('active-pulse-count');
    const clusterCount = document.getElementById('cluster-count');
    const nextUpdateTime = document.getElementById('next-update-time');
    const successRate = document.getElementById('success-rate');
    
    if (activePulseCount) {
        activePulseCount.textContent = pulses.filter(p => p.isActive).length;
    }
    
    if (clusterCount) {
        clusterCount.textContent = semanticClusters.length;
    }
    
    if (nextUpdateTime && pulses.length > 0) {
        const nextUpdate = pulses
            .filter(p => p.isActive)
            .map(p => new Date(p.nextUpdate))
            .sort((a, b) => a - b)[0];
        
        if (nextUpdate) {
            nextUpdateTime.textContent = nextUpdate.toLocaleTimeString();
        }
    }
    
    if (successRate) {
        const totalUpdates = pulses.reduce((sum, p) => sum + p.updateCount, 0);
        successRate.textContent = totalUpdates > 0 ? '95%' : '--';
    }
    
    // Update editor-specific stats (only in editor mode)
    if (isEditorMode) {
        const footnotesStatus = document.getElementById('footnotes-status');
        const superscriptsStatus = document.getElementById('superscripts-status');
        
        if (footnotesStatus) {
            footnotesStatus.textContent = showFootnotes ? 'Enabled' : 'Disabled';
            footnotesStatus.style.color = showFootnotes ? '#10b981' : '#ef4444';
        }
        
        if (superscriptsStatus) {
            superscriptsStatus.textContent = showSuperscripts ? 'Enabled' : 'Disabled';
            superscriptsStatus.style.color = showSuperscripts ? '#10b981' : '#ef4444';
        }
    }
}

/**
 * Export article HTML with pulse points (editor mode only)
 */
function exportArticleHtml() {
    if (!isEditorMode) return;
    
    const previewContent = document.getElementById('article-preview');
    if (!previewContent) {
        showError('No content to export');
        return;
    }

    const articleContent = previewContent.querySelector('.article-content');
    if (!articleContent) {
        showError('No article content to export');
        return;
    }

    // Create a clean HTML version
    const cleanHtml = createCleanHtmlExport(articleContent);
    
    // Create download
    const blob = new Blob([cleanHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'livepulse-article.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSuccess('Article HTML exported successfully!');
}

/**
 * Create clean HTML export (editor mode only)
 */
function createCleanHtmlExport(articleContent) {
    const articleInput = document.getElementById('article-content');
    const title = articleInput?.value.split('\n')[0]?.trim() || 'LivePulse Article';
    
    const cleanContent = articleContent.innerHTML;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
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
            margin-bottom: 0.5rem;
        }
        .footnote-cluster strong {
            color: #374151;
        }
        h1, h2, h3, h4, h5, h6 {
            color: #1f2937;
            margin-bottom: 0.5rem;
        }
        p {
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <article>
        ${cleanContent}
    </article>
    
    <footer style="margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; font-size: 0.9rem; color: #6b7280; text-align: center;">
        <p>Generated by <strong>LivePulse</strong> - Intelligent Content Analysis & Automatic Updates</p>
        <p>Export Date: ${new Date().toLocaleString()}</p>
    </footer>
</body>
</html>`;
}

/**
 * Analyze selected text for pulse points and semantic relationships
 */
async function analyzeSinglePulse() {
    console.log('🔬 Starting single pulse analysis...');
    
    const selectedTextEl = document.getElementById('selected-text');
    const articleContentEl = document.getElementById('article-content');
    const analysisResult = document.getElementById('analysis-result');
    const createPulseBtn = document.getElementById('create-pulse-btn');
    
    if (!selectedTextEl || !articleContentEl) return;
    
    const selectedTextValue = selectedTextEl.value.trim();
    const articleContentValue = articleContentEl.value.trim();

    if (!selectedTextValue) {
        showError('Please enter the text you want to make dynamic');
        return;
    }

    if (!articleContentValue) {
        showError('Please enter some article content first');
        return;
    }

    // Show loading state
    const analyzeBtn = document.getElementById('analyze-btn');
    setButtonLoading(analyzeBtn, 'Analyzing...');
    
    try {
        // Try real API first, fall back to mock if it fails
        let analysis;
        try {
            console.log('🌐 Attempting API call...');
            const response = await fetch('/.netlify/functions/analyze-pulse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedText: selectedTextValue,
                    articleContent: articleContentValue,
                    articleTitle: extractArticleTitle(articleContentValue),
                    mode: 'single_pulse'
                })
            });

            const data = await response.json();

            if (data.success) {
                analysis = data.analysis;
                console.log('✅ API analysis successful');
            } else {
                throw new Error(data.error);
            }
        } catch (apiError) {
            console.log('⚠️ API unavailable, using mock analysis:', apiError.message);
            // Fall back to mock analysis
            analysis = generateMockAnalysis(selectedTextValue, articleContentValue);
        }

        currentAnalysis = analysis;
        displaySmartAnalysis(analysis, selectedTextValue);
        if (analysisResult) analysisResult.classList.remove('hidden');
        if (createPulseBtn) createPulseBtn.classList.remove('hidden');
        
        showSuccess('Analysis completed! Review the detected pulse points below.');

    } catch (error) {
        console.error('❌ Analysis error:', error);
        showError('Analysis error: ' + error.message);
    } finally {
        setButtonLoading(analyzeBtn, 'Analyze', false);
    }
}

/**
 * Scan entire article for pulse points and clusters
 */
async function scanFullArticle() {
    console.log('🔍 Starting full article scan...');
    
    const articleContentEl = document.getElementById('article-content');
    const scanFullArticleBtn = document.getElementById('scan-full-article');
    
    if (!articleContentEl || !scanFullArticleBtn) return;
    
    const articleContentValue = articleContentEl.value.trim();

    if (!articleContentValue) {
        showError('Please enter article content to scan');
        return;
    }

    setButtonLoading(scanFullArticleBtn, 'Scanning Article...');
    scanFullArticleBtn.classList.add('btn-disabled');
    
    try {
        // Try real API first, fall back to mock if it fails
        let analysis;
        try {
            console.log('🌐 Attempting full scan API call...');
            const response = await fetch('/.netlify/functions/analyze-pulse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedText: articleContentValue,
                    articleContent: articleContentValue,
                    articleTitle: extractArticleTitle(articleContentValue),
                    mode: 'full_article_scan'
                })
            });

            const data = await response.json();

            if (data.success) {
                analysis = data.analysis;
                console.log('✅ Full scan API successful');
            } else {
                throw new Error(data.error);
            }
        } catch (apiError) {
            console.log('⚠️ Scan API unavailable, using mock scan:', apiError.message);
            // Fall back to mock scan
            analysis = generateMockFullScan(articleContentValue);
        }

        displayInlineScanResults(analysis);
        showSuccess(`Found ${analysis.pulsePoints?.length || 0} potential pulse points and ${analysis.semanticClusters?.length || 0} clusters`);
        
        // Keep button disabled after successful scan
        scanFullArticleBtn.textContent = '✅ Article Scanned';
        scanFullArticleBtn.classList.add('btn-disabled');
        scanFullArticleBtn.disabled = true;

    } catch (error) {
        console.error('❌ Scan error:', error);
        showError('Article scan failed: ' + error.message);
        resetScanButton();
    }
}

/**
 * Generate mock analysis for demo purposes
 */
function generateMockAnalysis(selectedText, articleContent) {
    console.log('🎭 Generating mock analysis for:', selectedText.substring(0, 50) + '...');
    
    // Detect what type of content this might be
    const mockType = detectMockType(selectedText);
    
    if (mockType.isCluster) {
        return generateMockCluster(selectedText, mockType);
    } else {
        return generateMockSinglePulse(selectedText, mockType);
    }
}

/**
 * Detect the type of content and whether it's likely a cluster
 */
function detectMockType(selectedText) {
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
 * Generate a mock cluster analysis
 */
function generateMockCluster(selectedText, mockType) {
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
    } else if (mockType.category === 'weather_comparison') {
        // Extract temperatures from text
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
                    dataSource: 'Weather API',
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
    
    // Fallback to single pulse
    return generateMockSinglePulse(selectedText, mockType);
}

/**
 * Generate a mock single pulse analysis
 */
function generateMockSinglePulse(selectedText, mockType) {
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
                updateFrequency: mockType.type === 'crypto' ? 60 : mockType.type === 'weather' ? 180 : 240,
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
function generateMockFullScan(articleContent) {
    const pulsePoints = [];
    const clusters = [];
    
    // Look for common patterns in the article
    const priceMatches = articleContent.match(/\$[\d,]+\.?\d*/g) || [];
    const tempMatches = articleContent.match(/\d+°[CF]/g) || [];
    const percentMatches = articleContent.match(/[\d.]+%/g) || [];
    const cryptoMatches = articleContent.match(/\$\d+,?\d+(?:\.\d{2})?/g) || [];
    
    let pulseIndex = 0;
    
    // Add stock-related pulses
    priceMatches.forEach((price, i) => {
        if (i < 3) { // Limit to first 3 matches
            pulsePoints.push({
                text: `${price}`,
                dynamicPart: price,
                staticContext: `Trading at ${price} per share`,
                pulseType: 'stock',
                specificType: 'stock:price',
                updateFrequency: 240,
                priority: 'high',
                reasoning: 'Stock prices change during market hours',
                confidence: 'high'
            });
            pulseIndex++;
        }
    });
    
    // Add weather pulses
    tempMatches.forEach((temp, i) => {
        if (i < 2) {
            pulsePoints.push({
                text: `${temp}`,
                dynamicPart: temp,
                staticContext: `Temperature of ${temp}`,
                pulseType: 'weather',
                specificType: 'weather:temperature',
                updateFrequency: 180,
                priority: 'medium',
                reasoning: 'Weather conditions change throughout the day',
                confidence: 'high'
            });
            pulseIndex++;
        }
    });
    
    // Add crypto pulses  
    if (articleContent.toLowerCase().includes('bitcoin') && cryptoMatches.length > 0) {
        pulsePoints.push({
            text: cryptoMatches[0],
            dynamicPart: cryptoMatches[0],
            staticContext: `Bitcoin trading at ${cryptoMatches[0]}`,
            pulseType: 'crypto',
            specificType: 'crypto:btc:price',
            updateFrequency: 60,
            priority: 'high',
            reasoning: 'Cryptocurrency prices are highly volatile',
            confidence: 'high'
        });
        pulseIndex++;
    }
    
    // Create a cluster if we have related financial data
    if (priceMatches.length > 0 && percentMatches.length > 0) {
        clusters.push({
            clusterName: 'Financial Performance Cluster',
            clusterType: 'mathematical',
            pulseIndices: [0, 1], // First two pulses
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
            title: extractArticleTitle(articleContent),
            contentLength: articleContent.length,
            mainTopics: ['financial markets', 'technology', 'current events'],
            contentType: 'news',
            updatePotential: 'high'
        },
        pulsePoints: pulsePoints,
        semanticClusters: clusters,
        recommendations: {
            totalPulsePoints: pulsePoints.length,
            highPriority: pulsePoints.filter(p => p.priority === 'high').length,
            clustersIdentified: clusters.length,
            updateStrategy: 'moderate',
            estimatedImpact: 'medium'
        }
    };
}

/**
 * Display smart analysis results with semantic cluster information
 */
function displaySmartAnalysis(analysis, originalText) {
    const analysisContent = document.getElementById('analysis-content');
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
                        <span>${formatFrequency(pulse.updateFrequency || 180)}</span>
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
}

/**
 * Display scan results inline below the scan button
 */
function displayInlineScanResults(analysis) {
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
            resultsHTML += `
                <div class="discovered-pulse-card ${priorityClass}">
                    <div class="pulse-preview">
                        <span class="pulse-text">"${pulse.text || pulse.dynamicPart}"</span>
                        <span class="pulse-priority ${pulse.priority || 'medium'}">${pulse.priority || 'medium'}</span>
                        <div class="pulse-info">
                            <span>${pulse.pulseType}</span>
                            <span>${formatFrequency(pulse.updateFrequency)}</span>
                            <span>Confidence: ${pulse.confidence}</span>
                        </div>
                    </div>
                    <button onclick="createPulseFromScan(${index})" class="btn btn-small btn-success">Create Pulse</button>
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
                    <button onclick="createClusterFromScan(${index})" class="btn btn-small btn-success">Create Cluster</button>
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
    
    // Store scan results for later use
    window.lastScanResults = analysis;
}

/**
 * Create pulse from current analysis
 */
function createPulseFromAnalysis() {
    if (!currentAnalysis) return;

    if (currentAnalysis.analysisType === 'semantic_cluster') {
        createSemanticCluster(currentAnalysis);
    } else {
        createSinglePulse(currentAnalysis.pulsePoints[0]);
    }

    // Clear current analysis
    const selectedText = document.getElementById('selected-text');
    const analysisResult = document.getElementById('analysis-result');
    const createPulseBtn = document.getElementById('create-pulse-btn');
    
    if (selectedText) selectedText.value = '';
    if (analysisResult) analysisResult.classList.add('hidden');
    if (createPulseBtn) createPulseBtn.classList.add('hidden');
    currentAnalysis = null;
}

/**
 * Create a semantic cluster with all related pulse points
 */
function createSemanticCluster(analysis) {
    const cluster = analysis.semanticCluster;
    const pulsePoints = analysis.pulsePoints;
    
    const newCluster = {
        id: `cluster_${clusterCounter++}`,
        name: cluster.clusterName,
        type: cluster.clusterType,
        semanticRule: cluster.semanticRule,
        pulseIds: [],
        relationships: cluster.relationships,
        isActive: true,
        createdAt: new Date().toISOString()
    };

    // Create individual pulse points
    const clusterPulses = pulsePoints.map(pulse => {
        const newPulse = createPulseFromData(pulse);
        newPulse.clusterId = newCluster.id;
        newPulse.role = pulse.role;
        newPulse.isPrimaryInCluster = pulse.role === 'primary';
        return newPulse;
    });

    // Add pulse IDs to cluster
    newCluster.pulseIds = clusterPulses.map(p => p.id);
    
    // Store cluster and pulses
    semanticClusters.push(newCluster);
    pulses.push(...clusterPulses);

    updatePulseList();
    updatePreview();
    
    showSuccess(`✅ Semantic cluster created: "${cluster.clusterName}" with ${pulsePoints.length} pulse points`);
}

/**
 * Create a single pulse point
 */
function createSinglePulse(pulseData) {
    const newPulse = createPulseFromData(pulseData);
    pulses.push(newPulse);
    
    updatePulseList();
    updatePreview();
    
    showSuccess(`✅ Pulse point created: "${pulseData.dynamicPart}" will auto-update every ${formatFrequency(pulseData.updateFrequency)}`);
}

/**
 * Create pulse object from analysis data
 */
function createPulseFromData(pulseData) {
    const nextUpdate = new Date(Date.now() + (pulseData.updateFrequency * 60 * 1000));
    
    // Clean and validate the text data
    const cleanOriginalText = String(pulseData.fullSelection || pulseData.dynamicPart || '').trim();
    const cleanDynamicPart = String(pulseData.dynamicPart || '').trim();
    const cleanStaticPrefix = String(pulseData.staticPrefix || '').trim();
    const cleanStaticSuffix = String(pulseData.staticSuffix || '').trim();
    
    return {
        id: pulseCounter++,
        originalText: cleanOriginalText,
        dynamicPart: cleanDynamicPart,
        staticPrefix: cleanStaticPrefix,
        staticSuffix: cleanStaticSuffix,
        currentValue: cleanDynamicPart,
        pulseType: pulseData.pulseType || 'unknown',
        specificType: pulseData.specificType || 'unknown',
        updateFrequency: pulseData.updateFrequency || 180,
        dataSource: pulseData.dataSource || 'Unknown',
        reasoning: pulseData.reasoning || 'No reasoning provided',
        confidence: pulseData.confidence || 'medium',
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
        isPrimaryInCluster: false
    };
}

/**
 * Update the pulse list display
 */
function updatePulseList() {
    const pulseList = document.getElementById('pulse-list');
    if (!pulseList) return;
    
    if (pulses.length === 0 && semanticClusters.length === 0) {
        pulseList.innerHTML = '<div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);"><div style="font-size: 2rem; margin-bottom: 1rem;">🎯</div><p>No pulse points created yet.</p><p style="font-size: 0.9rem; margin-top: 0.5rem;">Analyze some text to get started!</p></div>';
        return;
    }

    let listHTML = '';

    // Display semantic clusters first
    semanticClusters.forEach(cluster => {
        const clusterPulses = pulses.filter(p => p.clusterId === cluster.id);
        const primaryPulse = clusterPulses.find(p => p.isPrimaryInCluster);
        const isOverdue = primaryPulse && new Date(primaryPulse.nextUpdate) < new Date();
        const statusIcon = cluster.isActive ? '🔗' : '⏸️';
        const overdueWarning = isOverdue ? ' ⚠️ OVERDUE' : '';

        listHTML += `
            <div class="cluster-item">
                <h4>${statusIcon} Cluster: ${cluster.name}</h4>
                <p class="cluster-description">${cluster.semanticRule}</p>
                <div class="cluster-pulses">
                    ${clusterPulses.map(pulse => `
                        <div class="cluster-pulse-item ${pulse.role}">
                            <span class="pulse-role">${pulse.role}</span>
                            <span class="pulse-value">"${pulse.currentValue}"</span>
                            <span class="pulse-type">${pulse.specificType}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="cluster-meta">
                    <span>Updates: Every ${formatFrequency(primaryPulse?.updateFrequency || 60)} min</span>
                    <span>Next update: ${primaryPulse ? new Date(primaryPulse.nextUpdate).toLocaleString() : 'N/A'}${overdueWarning}</span>
                    <span>Pulse count: ${clusterPulses.length}</span>
                </div>
                <div class="cluster-actions">
                    <button onclick="testClusterUpdate('${cluster.id}')" class="btn btn-small">Update</button>
                    <button onclick="toggleCluster('${cluster.id}')" class="btn btn-small ${cluster.isActive ? 'btn-warning' : 'btn-success'}">${cluster.isActive ? 'Pause' : 'Resume'}</button>
                    <button onclick="removeCluster('${cluster.id}')" class="btn btn-small btn-danger">Remove</button>
                </div>
            </div>
        `;
    });

    // Display individual pulse points
    const individualPulses = pulses.filter(p => !p.clusterId);
    individualPulses.forEach(pulse => {
        const nextUpdate = new Date(pulse.nextUpdate);
        const isOverdue = nextUpdate < new Date();
        const statusIcon = pulse.isActive ? '🔄' : '⏸️';
        const overdueWarning = isOverdue ? ' ⚠️ OVERDUE' : '';
        
        listHTML += `
            <div class="pulse-item">
                <h4>${statusIcon} Pulse #${pulse.id}: ${pulse.specificType}</h4>
                <div class="pulse-text-preview">
                    <span class="static-text">${pulse.staticPrefix}</span><span class="dynamic-text">${pulse.currentValue}</span><span class="static-text">${pulse.staticSuffix}</span>
                </div>
                <div class="pulse-meta">
                    <span>Updates: Every ${formatFrequency(pulse.updateFrequency)} min</span>
                    <span>Source: ${pulse.dataSource}</span>
                    <span>Confidence: ${pulse.confidence}</span>
                    <span>Last updated: ${new Date(pulse.lastUpdated).toLocaleString()}</span>
                    <span>Next update: ${nextUpdate.toLocaleString()}${overdueWarning}</span>
                    <span>Count: ${pulse.updateCount} updates</span>
                </div>
                <div class="pulse-actions">
                    <button onclick="testPulseUpdate(${pulse.id})" class="btn btn-small">Update</button>
                    <button onclick="togglePulse(${pulse.id})" class="btn btn-small ${pulse.isActive ? 'btn-warning' : 'btn-success'}">${pulse.isActive ? 'Pause' : 'Resume'}</button>
                    <button onclick="removePulse(${pulse.id})" class="btn btn-small btn-danger">Remove</button>
                </div>
            </div>
        `;
    });

    pulseList.innerHTML = listHTML;
}

/**
 * Update article preview with pulse points highlighted
 */
function updatePreview() {
    const articlePreview = document.getElementById('article-preview');
    const articleContent = document.getElementById('article-content');
    
    if (!articlePreview || !articleContent) return;
    
    let content = articleContent.value;
    
    if (!content.trim()) {
        const placeholderText = isEditorMode 
            ? '<div class="preview-placeholder"><div style="font-size: 3rem; margin-bottom: 1rem;">📄</div><h3>Editor Article Preview</h3><p>Articles with pulse points will appear here with highlighted dynamic content, confidence scores, categories, and automatic footnotes for editorial review.</p></div>'
            : '<div class="preview-placeholder"><div style="font-size: 3rem; margin-bottom: 1rem;">📄</div><h3>Your Live Article Preview</h3><p>Articles with pulse points will appear here with highlighted dynamic content and automatic footnotes.</p></div>';
        
        articlePreview.innerHTML = placeholderText;
        return;
    }

    // Replace pulse text with enhanced highlighted versions
    pulses.forEach(pulse => {
        try {
            const originalText = String(pulse.originalText || '').trim();
            const currentValue = String(pulse.currentValue || '').trim();
            
            // Only proceed if we have valid, clean text
            if (originalText && originalText.length > 0 && !originalText.includes('if (analysis.semanticClusters')) {
                // Use simple string replacement instead of regex for safety
                if (content.includes(originalText)) {
                    let replacement = `<span class="pulse-point enhanced" data-pulse-id="${pulse.id}" title="${pulse.specificType}: ${pulse.reasoning}">`;
                    replacement += `${currentValue}`;
                    
                    // Add confidence badge
                    replacement += `<span class="confidence-badge ${pulse.confidence || 'medium'}" title="Confidence: ${pulse.confidence || 'medium'}">${getConfidenceIcon(pulse.confidence)}</span>`;
                    
                    // Add category tag
                    replacement += `<span class="category-tag ${pulse.pulseType || 'unknown'}" title="Category: ${formatCategoryName(pulse.pulseType)}">${formatCategoryName(pulse.pulseType)}</span>`;
                    
                    // Add superscript only in editor mode and if enabled
                    if (isEditorMode && showSuperscripts) {
                        replacement += `<sup class="pulse-footnote-ref"><a href="#footnote-${pulse.id}">${pulse.id}</a></sup>`;
                    }
                    
                    replacement += '</span>';
                    content = content.replace(originalText, replacement);
                }
            }
        } catch (error) {
            console.warn('Error processing pulse for enhanced preview:', pulse.id, error);
        }
    });

    // Add enhanced footnotes only in editor mode and if enabled
    let footnotes = '';
    if (isEditorMode && showFootnotes && pulses.length > 0) {
        footnotes = '<div class="footnotes-section enhanced"><h4>📝 Pulse Point Sources & Metadata:</h4>';
        
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
            const cluster = semanticClusters.find(c => c.id === clusterId);
            footnotes += `
                <div class="footnote-cluster enhanced">
                    <div class="cluster-header">
                        <strong>🔗 ${cluster?.name || 'Cluster'}</strong>
                        <span class="cluster-type">${cluster?.type || 'mathematical'}</span>
                    </div>
                    <div class="cluster-rule">${cluster?.semanticRule || 'Related pulse points that update together'}</div>
                    ${clusterPulses.map(pulse => `
                        <div id="footnote-${pulse.id}" class="footnote-item enhanced">
                            <div class="footnote-header">
                                <strong>${pulse.id}.</strong> 
                                <span class="pulse-role ${pulse.role || 'single'}">${(pulse.role || 'single').toUpperCase()}</span>
                                <span class="confidence-indicator ${pulse.confidence || 'medium'}">${getConfidenceIcon(pulse.confidence)} ${pulse.confidence || 'medium'}</span>
                            </div>
                            <div class="footnote-content">
                                <span class="current-value">"${pulse.currentValue}"</span> from 
                                <span class="data-source">${pulse.dataSource}</span>
                            </div>
                            <div class="footnote-meta">
                                <span>Category: ${formatCategoryName(pulse.pulseType)}</span>
                                <span>Frequency: ${formatFrequency(pulse.updateFrequency)}</span>
                                <span>Updated: ${new Date(pulse.lastUpdated).toLocaleString()}</span>
                                <span>Count: ${pulse.updateCount} updates</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        });
        
        // Display enhanced individual footnotes
        individualFootnotes.forEach(pulse => {
            footnotes += `
                <div id="footnote-${pulse.id}" class="footnote-item enhanced individual">
                    <div class="footnote-header">
                        <strong>${pulse.id}.</strong> 
                        <span class="confidence-indicator ${pulse.confidence || 'medium'}">${getConfidenceIcon(pulse.confidence)} ${pulse.confidence || 'medium'}</span>
                        <span class="category-badge ${pulse.pulseType || 'unknown'}">${formatCategoryName(pulse.pulseType)}</span>
                    </div>
                    <div class="footnote-content">
                        <span class="current-value">"${pulse.currentValue}"</span> from 
                        <span class="data-source">${pulse.dataSource}</span>
                    </div>
                    <div class="footnote-meta">
                        <span>Frequency: ${formatFrequency(pulse.updateFrequency)}</span>
                        <span>Updated: ${new Date(pulse.lastUpdated).toLocaleString()}</span>
                        <span>Count: ${pulse.updateCount} updates</span>
                    </div>
                    <div class="footnote-reasoning">${pulse.reasoning}</div>
                </div>
            `;
        });
        
        footnotes += '</div>';
    }

    articlePreview.innerHTML = `
        <div class="article-content enhanced">
            ${content.replace(/\n/g, '<br>')}
            ${footnotes}
        </div>
    `;
    
    // Apply editor settings
    if (isEditorMode) {
        setTimeout(() => {
            updateFootnotesDisplay();
            updateSuperscriptsDisplay();
        }, 50);
    }
}

// Helper function to get confidence icon
function getConfidenceIcon(confidence) {
    switch (confidence) {
        case 'high': return '🔥';
        case 'medium': return '⚡';
        case 'low': return '⚠️';
        default: return '❓';
    }
}

// Helper function to format category names
function formatCategoryName(pulseType) {
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
 * Clear scan results when article content changes
 */
function clearScanResults() {
    const fullScanResults = document.getElementById('full-scan-results');
    if (fullScanResults) {
        fullScanResults.classList.add('hidden');
    }
    resetScanButton();
    window.lastScanResults = null;
}

/**
 * Reset scan button to original state
 */
function resetScanButton() {
    const scanFullArticleBtn = document.getElementById('scan-full-article');
    if (scanFullArticleBtn) {
        scanFullArticleBtn.textContent = '🔍 Scan Full Article for Pulse Points';
        scanFullArticleBtn.classList.remove('btn-disabled');
        scanFullArticleBtn.disabled = false;
    }
}

/**
 * Initialize smooth scrolling for navigation links
 */
function initSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Initialize header scroll effect
 */
function initHeaderScrollEffect() {
    window.addEventListener('scroll', function() {
        const header = document.querySelector('.header');
        if (header) {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
            }
        }
    });
}

/**
 * Initialize mobile menu functionality
 */
function initializeMobileMenu() {
    // Add scroll spy functionality for mobile menu
    const sections = document.querySelectorAll('.section-anchor');
    const menuItems = document.querySelectorAll('.mobile-menu-item[href^="#"]');
    
    function updateActiveMenuItem() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });
        
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + current) {
                item.classList.add('active');
            }
        });
    }
    
    // Update active menu item on scroll
    window.addEventListener('scroll', updateActiveMenuItem);
    
    // Set initial active state
    updateActiveMenuItem();
    
    // Add click handlers for smooth scrolling
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Global functions for pulse and cluster management
window.testPulseUpdate = async function(pulseId) {
    const pulse = pulses.find(p => p.id === pulseId);
    if (!pulse) return;

    const button = event.target;
    setButtonLoading(button, 'Updating...');

    try {
        // For demo, generate mock update
        const updateData = generateMockUpdate(pulse);
        
        pulse.currentValue = updateData.updatedValue;
        pulse.lastUpdated = updateData.timestamp || new Date().toISOString();
        pulse.updateCount++;
        
        const nextUpdate = new Date(Date.now() + (pulse.updateFrequency * 60 * 1000));
        pulse.nextUpdate = nextUpdate.toISOString();
        
        updatePulseList();
        updatePreview();
        showSuccess(`✅ Pulse updated: "${updateData.updatedValue}" (Next: ${nextUpdate.toLocaleTimeString()})`);

    } catch (error) {
        showError('Update failed: ' + error.message);
    } finally {
        setButtonLoading(button, 'Update', false);
    }
};

window.testClusterUpdate = async function(clusterId) {
    const cluster = semanticClusters.find(c => c.id === clusterId);
    if (!cluster) return;

    const button = event.target;
    setButtonLoading(button, 'Updating Cluster...');

    try {
        const clusterPulses = pulses.filter(p => p.clusterId === clusterId);
        const primaryPulse = clusterPulses.find(p => p.isPrimaryInCluster);
        
        if (!primaryPulse) {
            throw new Error('No primary pulse found in cluster');
        }

        // Update primary pulse
        const updateData = generateMockUpdate(primaryPulse);
        primaryPulse.currentValue = updateData.updatedValue;
        primaryPulse.lastUpdated = updateData.timestamp || new Date().toISOString();
        primaryPulse.updateCount++;
        
        const nextUpdate = new Date(Date.now() + (primaryPulse.updateFrequency * 60 * 1000));
        primaryPulse.nextUpdate = nextUpdate.toISOString();
        
        updatePulseList();
        updatePreview();
        showSuccess(`✅ Cluster updated: "${cluster.name}" (Primary: "${updateData.updatedValue}")`);

    } catch (error) {
        showError('Cluster update failed: ' + error.message);
    } finally {
        setButtonLoading(button, 'Update', false);
    }
};

window.togglePulse = function(pulseId) {
    const pulse = pulses.find(p => p.id === pulseId);
    if (!pulse) return;

    pulse.isActive = !pulse.isActive;
    updatePulseList();
    
    const status = pulse.isActive ? 'resumed' : 'paused';
    showSuccess(`Pulse ${status}. Auto-updates ${pulse.isActive ? 'enabled' : 'disabled'}.`);
};

window.toggleCluster = function(clusterId) {
    const cluster = semanticClusters.find(c => c.id === clusterId);
    if (!cluster) return;

    cluster.isActive = !cluster.isActive;
    
    // Update all pulses in the cluster
    pulses.filter(p => p.clusterId === clusterId).forEach(pulse => {
        pulse.isActive = cluster.isActive;
    });
    
    updatePulseList();
    
    const status = cluster.isActive ? 'resumed' : 'paused';
    showSuccess(`Cluster ${status}. Auto-updates ${cluster.isActive ? 'enabled' : 'disabled'}.`);
};

window.removePulse = function(pulseId) {
    pulses = pulses.filter(p => p.id !== pulseId);
    updatePulseList();
    updatePreview();
    showSuccess('Pulse removed');
};

window.removeCluster = function(clusterId) {
    semanticClusters = semanticClusters.filter(c => c.id !== clusterId);
    pulses = pulses.filter(p => p.clusterId !== clusterId);
    updatePulseList();
    updatePreview();
    showSuccess('Cluster and all related pulses removed');
};

window.createPulseFromScan = function(pulseIndex) {
    if (!window.lastScanResults || !window.lastScanResults.pulsePoints) return;
    
    const pulseData = window.lastScanResults.pulsePoints[pulseIndex];
    if (!pulseData) return;

    // Convert scan result to pulse format with proper text cleaning
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
        fullSelection: dynamicText, // Use just the dynamic part as selection
        pulseType: pulseData.pulseType || 'unknown',
        specificType: pulseData.specificType || 'unknown',
        updateFrequency: pulseData.updateFrequency || 180,
        dataSource: pulseData.dataSource || 'Unknown',
        reasoning: pulseData.reasoning || 'Created from scan',
        confidence: pulseData.confidence || 'medium',
        role: 'single'
    };

    createSinglePulse(convertedPulse);
    showSuccess(`Created pulse point: "${convertedPulse.dynamicPart}"`);
};

window.createClusterFromScan = function(clusterIndex) {
    if (!window.lastScanResults || !window.lastScanResults.semanticClusters) return;
    
    const clusterData = window.lastScanResults.semanticClusters[clusterIndex];
    const pulsePoints = window.lastScanResults.pulsePoints;
    if (!clusterData || !pulsePoints) return;

    // Validate pulse indices exist
    if (!clusterData.pulseIndices || clusterData.pulseIndices.length === 0) {
        showError('No pulse points found in cluster');
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
        }).filter(Boolean), // Remove any null entries
        semanticCluster: {
            clusterId: `scan_cluster_${clusterIndex}`,
            clusterName: clusterData.clusterName || 'Unnamed Cluster',
            clusterType: clusterData.clusterType || 'mathematical',
            relationships: clusterData.relationships || [],
            semanticRule: `Cluster created from article scan: ${clusterData.clusterName || 'Unnamed Cluster'}`
        }
    };

    if (convertedAnalysis.pulsePoints.length === 0) {
        showError('No valid pulse points found in cluster');
        return;
    }

    createSemanticCluster(convertedAnalysis);
    showSuccess(`Created semantic cluster: "${convertedAnalysis.semanticCluster.clusterName}" with ${convertedAnalysis.pulsePoints.length} pulse points`);
};

/**
 * Generate mock update for demo purposes
 */
function generateMockUpdate(pulse) {
    let newValue = pulse.currentValue;
    
    // Generate realistic updates based on pulse type
    if (pulse.pulseType === 'crypto' || pulse.specificType.includes('crypto')) {
        // Crypto prices - random variation
        const currentPrice = parseFloat(pulse.currentValue.replace(/[$,]/g, ''));
        if (!isNaN(currentPrice)) {
            const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
            const newPrice = currentPrice * (1 + variation);
            newValue = `${Math.round(newPrice).toLocaleString()}`;
        }
    } else if (pulse.pulseType === 'stock' || pulse.specificType.includes('stock')) {
        // Stock prices - smaller random variation
        const currentPrice = parseFloat(pulse.currentValue.replace(/[$,]/g, ''));
        if (!isNaN(currentPrice)) {
            const variation = (Math.random() - 0.5) * 0.06; // ±3% variation
            const newPrice = currentPrice * (1 + variation);
            newValue = `${newPrice.toFixed(2)}`;
        }
    } else if (pulse.pulseType === 'weather' || pulse.specificType.includes('weather')) {
        // Temperature - small realistic changes
        const tempMatch = pulse.currentValue.match(/(\d+)°([CF])/);
        if (tempMatch) {
            const currentTemp = parseInt(tempMatch[1]);
            const change = Math.floor(Math.random() * 6) - 3; // ±3 degrees
            const newTemp = Math.max(0, currentTemp + change);
            newValue = pulse.currentValue.replace(/\d+°/, `${newTemp}°`);
        }
    } else if (pulse.currentValue.includes('%')) {
        // Percentage values
        const percentMatch = pulse.currentValue.match(/([\d.]+)%/);
        if (percentMatch) {
            const currentPercent = parseFloat(percentMatch[1]);
            const change = (Math.random() - 0.5) * 2; // ±1% change
            const newPercent = Math.max(0, currentPercent + change);
            newValue = pulse.currentValue.replace(/[\d.]+%/, `${newPercent.toFixed(1)}%`);
        }
    } else {
        // Generic number updates
        const numberMatch = pulse.currentValue.match(/[\d,]+\.?\d*/);
        if (numberMatch) {
            const currentNumber = parseFloat(numberMatch[0].replace(/,/g, ''));
            if (!isNaN(currentNumber)) {
                const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
                const newNumber = Math.round(currentNumber * (1 + variation));
                newValue = pulse.currentValue.replace(/[\d,]+\.?\d*/, newNumber.toLocaleString());
            }
        }
    }
    
    return {
        success: true,
        updatedValue: newValue,
        timestamp: new Date().toISOString(),
        source: 'Mock Demo',
        reasoning: 'Simulated update for demonstration'
    };
}

// Mobile menu functions
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (menu && overlay) {
        menu.classList.toggle('open');
        overlay.classList.toggle('open');
    }
};

window.closeMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    const overlay = document.querySelector('.mobile-menu-overlay');
    
    if (menu && overlay) {
        menu.classList.remove('open');
        overlay.classList.remove('open');
    }
};

// Additional global functions for sidebar controls
window.updateAllPulses = function() {
    if (!isEditorMode) return;
    
    if (pulses.length === 0) {
        showError('No pulse points to update');
        return;
    }

    pulses.forEach(pulse => {
        if (pulse.isActive) {
            const updateData = generateMockUpdate(pulse);
            pulse.currentValue = updateData.updatedValue;
            pulse.lastUpdated = updateData.timestamp;
            pulse.updateCount++;
            
            const nextUpdate = new Date(Date.now() + (pulse.updateFrequency * 60 * 1000));
            pulse.nextUpdate = nextUpdate.toISOString();
        }
    });

    updatePulseList();
    updatePreview();
    updateStatsDisplay();
    showSuccess(`Updated ${pulses.filter(p => p.isActive).length} active pulse points`);
};

window.pauseAllPulses = function() {
    if (!isEditorMode) return;
    
    if (pulses.length === 0) {
        showError('No pulse points to pause');
        return;
    }

    pulses.forEach(pulse => {
        pulse.isActive = false;
    });

    semanticClusters.forEach(cluster => {
        cluster.isActive = false;
    });

    updatePulseList();
    updateStatsDisplay();
    showSuccess('All pulse points and clusters paused');
};

window.clearAllPulses = function() {
    if (!isEditorMode) return;
    
    if (pulses.length === 0 && semanticClusters.length === 0) {
        showError('No pulse points to clear');
        return;
    }

    const totalCount = pulses.length + semanticClusters.length;
    pulses = [];
    semanticClusters = [];
    pulseCounter = 1;
    clusterCounter = 1;

    updatePulseList();
    updatePreview();
    updateStatsDisplay();
    showSuccess(`Cleared ${totalCount} pulse points and clusters`);
};

// Helper functions
function formatFrequency(minutes) {
    if (minutes < 60) return `${minutes} minutes`;
    if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
    if (minutes < 10080) return `${Math.round(minutes / 1440)} days`;
    if (minutes < 43200) return `${Math.round(minutes / 10080)} weeks`;
    return `${Math.round(minutes / 43200)} months`;
}

function extractArticleTitle(content) {
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    return firstLine.length > 0 && firstLine.length < 100 ? firstLine : 'Untitled Article';
}

function debounce(func, wait) {
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

function setButtonLoading(button, loadingText, isLoading = true) {
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

function showError(message) {
    showNotification(message, 'error');
}

function showSuccess(message) {
    showNotification(message, 'success');
}

function showNotification(message, type = 'info') {
    // Only show notifications in editor mode
    if (!isEditorMode) {
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
        </div>
    `;
    
    // Position notifications
    const container = document.querySelector('.notifications-container') || createNotificationsContainer();
    container.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function createNotificationsContainer() {
    const container = document.createElement('div');
    container.className = 'notifications-container';
    document.body.appendChild(container);
    return container;
}