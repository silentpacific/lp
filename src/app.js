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
    
    // CRITICAL: Add this missing line
    initializeEnhancedControls();
    
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

function updateEnhancedStats() {
    // Category breakdown
    const categoryStats = {};
    pulses.forEach(pulse => {
        const category = formatCategoryName(pulse.pulseType);
        categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    // Confidence breakdown
    const confidenceStats = {
        high: pulses.filter(p => p.confidence === 'high').length,
        medium: pulses.filter(p => p.confidence === 'medium').length,
        low: pulses.filter(p => p.confidence === 'low').length
    };
    
    // Source quality breakdown
    const sourceStats = {
        premium: pulses.filter(p => p.sourceQuality === 'premium').length,
        standard: pulses.filter(p => p.sourceQuality === 'standard').length,
        basic: pulses.filter(p => p.sourceQuality === 'basic').length,
        unknown: pulses.filter(p => p.sourceQuality === 'unknown').length
    };
    
    // Update category breakdown display
    const categoryBreakdown = document.getElementById('category-breakdown');
    if (categoryBreakdown) {
        categoryBreakdown.innerHTML = Object.entries(categoryStats)
            .map(([category, count]) => `<span class="stat-item">${category}: ${count}</span>`)
            .join('');
    }
    
    // Update confidence breakdown display
    const confidenceBreakdown = document.getElementById('confidence-breakdown');
    if (confidenceBreakdown) {
        confidenceBreakdown.innerHTML = `
            <span class="stat-item confidence-high">High: ${confidenceStats.high}</span>
            <span class="stat-item confidence-medium">Medium: ${confidenceStats.medium}</span>
            <span class="stat-item confidence-low">Low: ${confidenceStats.low}</span>
        `;
    }
    
    // Update source quality display
    const sourceBreakdown = document.getElementById('source-breakdown');
    if (sourceBreakdown) {
        sourceBreakdown.innerHTML = `
            <span class="stat-item source-premium">Premium: ${sourceStats.premium}</span>
            <span class="stat-item source-standard">Standard: ${sourceStats.standard}</span>
            <span class="stat-item source-basic">Basic: ${sourceStats.basic}</span>
        `;
    }
}

/**
 * NEW: Filter pulse points by various criteria
 */
function filterPulsePoints(criteria) {
    const filteredPulses = pulses.filter(pulse => {
        switch (criteria.type) {
            case 'category':
                return pulse.pulseType === criteria.value;
            
            case 'confidence':
                return pulse.confidence === criteria.value;
            
            case 'source-quality':
                return pulse.sourceQuality === criteria.value;
            
            case 'active-status':
                return criteria.value === 'active' ? pulse.isActive : !pulse.isActive;
            
            case 'overdue':
                return new Date(pulse.nextUpdate) < new Date();
            
            case 'cluster-status':
                return criteria.value === 'clustered' ? pulse.clusterId : !pulse.clusterId;
            
            default:
                return true;
        }
    });
    
    // Temporarily store original pulses and display filtered ones
    window.originalPulses = window.originalPulses || pulses;
    window.pulses = filteredPulses;
    
    updatePulseList();
    showSuccess(`Filtered to ${filteredPulses.length} pulse points (${criteria.type}: ${criteria.value})`);
}

/**
 * NEW: Clear all filters
 */
function clearFilters() {
    if (window.originalPulses) {
        window.pulses = window.originalPulses;
        window.originalPulses = null;
        updatePulseList();
        showSuccess('All filters cleared');
    }
}

/**
 * NEW: Search pulse points by text content
 */
function searchPulsePoints(searchTerm) {
    if (!searchTerm.trim()) {
        clearFilters();
        return;
    }
    
    const term = searchTerm.toLowerCase();
    const filteredPulses = pulses.filter(pulse => {
        return pulse.currentValue.toLowerCase().includes(term) ||
               pulse.originalText.toLowerCase().includes(term) ||
               pulse.specificType.toLowerCase().includes(term) ||
               pulse.dataSource.toLowerCase().includes(term) ||
               pulse.reasoning.toLowerCase().includes(term);
    });
    
    // Temporarily store original pulses and display filtered ones
    window.originalPulses = window.originalPulses || pulses;
    window.pulses = filteredPulses;
    
    updatePulseList();
    showSuccess(`Found ${filteredPulses.length} pulse points matching "${searchTerm}"`);
}

/**
 * NEW: Bulk operations for pulse management
 */
function bulkUpdatePulses(pulseIds = null) {
    const targetPulses = pulseIds ? 
        pulses.filter(p => pulseIds.includes(p.id)) : 
        pulses.filter(p => p.isActive);
    
    if (targetPulses.length === 0) {
        showError('No pulse points to update');
        return;
    }
    
    let updateCount = 0;
    const updatePromises = targetPulses.map(async (pulse) => {
        try {
            const updateData = generateMockUpdate(pulse);
            pulse.currentValue = updateData.updatedValue;
            pulse.lastUpdated = updateData.timestamp;
            pulse.updateCount++;
            
            const nextUpdate = new Date(Date.now() + (pulse.updateFrequency * 60 * 1000));
            pulse.nextUpdate = nextUpdate.toISOString();
            
            updateCount++;
        } catch (error) {
            console.error(`Failed to update pulse ${pulse.id}:`, error);
        }
    });
    
    Promise.all(updatePromises).then(() => {
        updatePulseList();
        updatePreview();
        updateStatsDisplay();
        showSuccess(`Bulk updated ${updateCount}/${targetPulses.length} pulse points`);
    });
}

/**
 * NEW: Bulk toggle active status
 */
function bulkTogglePulses(activate = true) {
    const targetPulses = activate ? 
        pulses.filter(p => !p.isActive) : 
        pulses.filter(p => p.isActive);
    
    if (targetPulses.length === 0) {
        showError(`No pulse points to ${activate ? 'activate' : 'deactivate'}`);
        return;
    }
    
    targetPulses.forEach(pulse => {
        pulse.isActive = activate;
    });
    
    // Also update clusters
    const affectedClusters = new Set(targetPulses.map(p => p.clusterId).filter(Boolean));
    affectedClusters.forEach(clusterId => {
        const cluster = semanticClusters.find(c => c.id === clusterId);
        if (cluster) {
            const clusterPulses = pulses.filter(p => p.clusterId === clusterId);
            cluster.isActive = clusterPulses.some(p => p.isActive);
        }
    });
    
    updatePulseList();
    updateStatsDisplay();
    showSuccess(`${activate ? 'Activated' : 'Deactivated'} ${targetPulses.length} pulse points`);
}

/**
 * NEW: Export pulse configuration
 */
function exportPulseConfig() {
    const config = {
        metadata: {
            exportedAt: new Date().toISOString(),
            version: '3.0',
            totalPulses: pulses.length,
            totalClusters: semanticClusters.length
        },
        pulses: pulses.map(pulse => ({
            id: pulse.id,
            originalText: pulse.originalText,
            currentValue: pulse.currentValue,
            pulseType: pulse.pulseType,
            specificType: pulse.specificType,
            updateFrequency: pulse.updateFrequency,
            dataSource: pulse.dataSource,
            confidence: pulse.confidence,
            isActive: pulse.isActive,
            clusterId: pulse.clusterId,
            role: pulse.role
        })),
        clusters: semanticClusters.map(cluster => ({
            id: cluster.id,
            name: cluster.name,
            type: cluster.type,
            semanticRule: cluster.semanticRule,
            isActive: cluster.isActive
        }))
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `livepulse-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Pulse configuration exported successfully!');
}

/**
 * NEW: Import pulse configuration
 */
function importPulseConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const config = JSON.parse(e.target.result);
            
            // Validate config structure
            if (!config.pulses || !Array.isArray(config.pulses)) {
                throw new Error('Invalid configuration file structure');
            }
            
            // Import pulses
            const importedPulses = config.pulses.map(pulseData => ({
                ...pulseData,
                id: pulseCounter++, // Assign new IDs to avoid conflicts
                lastUpdated: new Date().toISOString(),
                nextUpdate: new Date(Date.now() + (pulseData.updateFrequency * 60 * 1000)).toISOString(),
                updateCount: 0,
                sourceQuality: getSourceQuality(pulseData.dataSource),
                contextRelevance: 'medium'
            }));
            
            // Import clusters
            const importedClusters = config.clusters?.map(clusterData => ({
                ...clusterData,
                id: `cluster_${clusterCounter++}`,
                createdAt: new Date().toISOString()
            })) || [];
            
            // Add to existing data
            pulses.push(...importedPulses);
            semanticClusters.push(...importedClusters);
            
            updatePulseList();
            updatePreview();
            updateStatsDisplay();
            
            showSuccess(`Imported ${importedPulses.length} pulse points and ${importedClusters.length} clusters`);
            
        } catch (error) {
            showError('Failed to import configuration: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

/**
 * NEW: Validate all pulse points for issues
 */
function validateAllPulses() {
    const issues = [];
    
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
        if (pulse.updateFrequency < 15) {
            issues.push(`Pulse #${pulse.id}: Update frequency too aggressive (${pulse.updateFrequency} min)`);
        }
        
        // Check for low confidence with high frequency
        if (pulse.confidence === 'low' && pulse.updateFrequency < 180) {
            issues.push(`Pulse #${pulse.id}: Low confidence but frequent updates`);
        }
        
        // Check for broken clusters
        if (pulse.clusterId && !semanticClusters.find(c => c.id === pulse.clusterId)) {
            issues.push(`Pulse #${pulse.id}: References non-existent cluster ${pulse.clusterId}`);
        }
    });
    
    // Check cluster integrity
    semanticClusters.forEach(cluster => {
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
    if (issues.length === 0) {
        showSuccess('✅ All pulse points validated successfully - no issues found!');
    } else {
        const issueList = issues.slice(0, 10).join('\n• '); // Show first 10 issues
        const moreText = issues.length > 10 ? `\n... and ${issues.length - 10} more issues` : '';
        showError(`Found ${issues.length} validation issues:\n• ${issueList}${moreText}`);
    }
    
    return issues;
}

// Global functions for enhanced controls
window.filterPulsePoints = filterPulsePoints;
window.clearFilters = clearFilters;
window.searchPulsePoints = searchPulsePoints;
window.bulkUpdatePulses = bulkUpdatePulses;
window.bulkTogglePulses = bulkTogglePulses;
window.exportPulseConfig = exportPulseConfig;
window.importPulseConfig = importPulseConfig;
window.validateAllPulses = validateAllPulses;

/**
 * Initialize enhanced control panel (call this in initializeEditorApp)
 */
function initializeEnhancedControls() {
    if (!isEditorMode) return;
    
    console.log('🎛️ Initializing enhanced control panel...');
    
    // Setup filter controls
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            if (this.value === 'all') {
                clearFilters();
            } else {
                filterPulsePoints({ type: 'category', value: this.value });
            }
        });
    }
    
    const confidenceFilter = document.getElementById('confidence-filter');
    if (confidenceFilter) {
        confidenceFilter.addEventListener('change', function() {
            if (this.value === 'all') {
                clearFilters();
            } else {
                filterPulsePoints({ type: 'confidence', value: this.value });
            }
        });
    }
    
    // Setup search
    const searchInput = document.getElementById('pulse-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            searchPulsePoints(this.value);
        }, 300));
    }
    
    // Setup bulk operations
    const bulkUpdateBtn = document.getElementById('bulk-update-btn');
    if (bulkUpdateBtn) {
        bulkUpdateBtn.addEventListener('click', () => bulkUpdatePulses());
    }
    
    const bulkPauseBtn = document.getElementById('bulk-pause-btn');
    if (bulkPauseBtn) {
        bulkPauseBtn.addEventListener('click', () => bulkTogglePulses(false));
    }
    
    const bulkResumeBtn = document.getElementById('bulk-resume-btn');
    if (bulkResumeBtn) {
        bulkResumeBtn.addEventListener('click', () => bulkTogglePulses(true));
    }
    
    // Setup export/import
    const exportBtn = document.getElementById('export-config-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportPulseConfig);
    }
    
    const importInput = document.getElementById('import-config-input');
    if (importInput) {
        importInput.addEventListener('change', importPulseConfig);
    }
    
    // Setup validation
    const validateBtn = document.getElementById('validate-btn');
    if (validateBtn) {
        validateBtn.addEventListener('click', validateAllPulses);
    }
    
    console.log('✅ Enhanced control panel initialized');
}



/**
 * Enhanced stats display with filtering and search capabilities
 */
function updateStatsDisplay() {
    // Update basic stats
    const activePulseCount = document.getElementById('active-pulse-count');
    const clusterCount = document.getElementById('cluster-count');
    const nextUpdateTime = document.getElementById('next-update-time');
    const successRate = document.getElementById('success-rate');
    
    const activePulses = pulses.filter(p => p.isActive);
    const totalUpdates = pulses.reduce((sum, p) => sum + p.updateCount, 0);
    
    if (activePulseCount) {
        activePulseCount.textContent = activePulses.length;
    }
    
    if (clusterCount) {
        clusterCount.textContent = semanticClusters.length;
    }
    
    if (nextUpdateTime && activePulses.length > 0) {
        const nextUpdate = activePulses
            .map(p => new Date(p.nextUpdate))
            .sort((a, b) => a - b)[0];
        
        if (nextUpdate) {
            nextUpdateTime.textContent = nextUpdate.toLocaleTimeString();
        }
    }
    
    if (successRate) {
        // Calculate success rate based on updates without errors
        const successfulUpdates = pulses.filter(p => p.confidence !== 'error').length;
        const rate = pulses.length > 0 ? Math.round((successfulUpdates / pulses.length) * 100) : 100;
        successRate.textContent = `${rate}%`;
    }
    
    // Update enhanced stats
    updateEnhancedStats();
    
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
    
    // 4. Date patterns
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
    
    // 5. Percentage patterns (standalone)
    const percentMatches = articleContent.match(/\b\d+\.?\d*%(?!\s*(?:up|down|change))/gi) || [];
    percentMatches.forEach((match, i) => {
        if (i < 2 && !pulsePoints.some(p => p.text === match)) {
            pulsePoints.push({
                text: match,
                dynamicPart: match,
                staticContext: `Statistical reference: ${match}`,
                pulseType: 'other',
                specificType: 'data:percentage',
                updateFrequency: 720,
                priority: 'medium',
                reasoning: 'Statistical percentages may update with new data',
                confidence: 'medium',
                location: { position: 'middle' }
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
            title: extractArticleTitle(articleContent),
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
    
    // Enhanced confidence scoring based on framework rules
    const enhancedConfidence = calculateEnhancedConfidence(pulseData);
    
    // Improved data source assignment
    const enhancedDataSource = assignOptimalDataSource(pulseData);
    
    // Better update frequency based on content type
    const optimizedFrequency = optimizeUpdateFrequency(pulseData);
    
    return {
        id: pulseCounter++,
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
        sourceQuality: getSourceQuality(enhancedDataSource),
        contextRelevance: calculateContextRelevance(pulseData)
    };
}

function calculateEnhancedConfidence(pulseData) {
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


function assignOptimalDataSource(pulseData) {
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

function optimizeUpdateFrequency(pulseData) {
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
            // Sports scores during active season vs off-season
            return 120; // 2 hours - active updates during games
            
        case 'technology':
            return 720; // 12 hours - tech specs change moderately
            
        default:
            // Use original frequency but ensure it's within reasonable bounds
            return Math.max(60, Math.min(43200, originalFreq)); // 1 hour to 1 month
    }
}

function getSourceQuality(dataSource) {
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

function calculateContextRelevance(pulseData) {
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
            <div class="cluster-item enhanced">
                <div class="cluster-header">
                    <h4>${statusIcon} ${cluster.name}</h4>
                    <div class="cluster-badges">
                        <span class="cluster-type-badge ${cluster.type}">${cluster.type}</span>
                        <span class="pulse-count-badge">${clusterPulses.length} pulses</span>
                    </div>
                </div>
                <p class="cluster-description">${cluster.semanticRule}</p>
                <div class="cluster-pulses">
                    ${clusterPulses.map(pulse => `
                        <div class="cluster-pulse-item ${pulse.role}">
                            <span class="pulse-role">${pulse.role}</span>
                            <span class="pulse-value">"${pulse.currentValue}"</span>
                            <span class="pulse-confidence ${pulse.confidence}">${getConfidenceIcon(pulse.confidence)}</span>
                            <span class="pulse-source">${pulse.dataSource}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="cluster-meta enhanced">
                    <span>Updates: Every ${formatFrequency(primaryPulse?.updateFrequency || 60)}</span>
                    <span>Next: ${primaryPulse ? new Date(primaryPulse.nextUpdate).toLocaleTimeString() : 'N/A'}${overdueWarning}</span>
                    <span>Source Quality: ${primaryPulse?.sourceQuality || 'unknown'}</span>
                </div>
                <div class="cluster-actions">
                    <button onclick="testClusterUpdate('${cluster.id}')" class="btn btn-small btn-primary">Update Cluster</button>
                    <button onclick="toggleCluster('${cluster.id}')" class="btn btn-small ${cluster.isActive ? 'btn-warning' : 'btn-success'}">${cluster.isActive ? 'Pause' : 'Resume'}</button>
                    <button onclick="removeCluster('${cluster.id}')" class="btn btn-small btn-danger">Remove</button>
                </div>
            </div>
        `;
    });

    // Display individual pulse points with enhanced metadata
    const individualPulses = pulses.filter(p => !p.clusterId);
    individualPulses.forEach(pulse => {
        const nextUpdate = new Date(pulse.nextUpdate);
        const isOverdue = nextUpdate < new Date();
        const statusIcon = pulse.isActive ? '🔄' : '⏸️';
        const overdueWarning = isOverdue ? ' ⚠️ OVERDUE' : '';
        
        listHTML += `
            <div class="pulse-item enhanced">
                <div class="pulse-header">
                    <h4>${statusIcon} Pulse #${pulse.id}: ${formatCategoryName(pulse.pulseType)}</h4>
                    <div class="pulse-badges">
                        <span class="confidence-badge-list ${pulse.confidence}">${getConfidenceIcon(pulse.confidence)} ${pulse.confidence}</span>
                        <span class="source-quality-badge ${pulse.sourceQuality || 'unknown'}">${pulse.sourceQuality || 'unknown'}</span>
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
                </div>
                <div class="pulse-reasoning">
                    <strong>Reasoning:</strong> ${pulse.reasoning}
                </div>
                <div class="pulse-actions">
                    <button onclick="testPulseUpdate(${pulse.id})" class="btn btn-small btn-primary">Update Now</button>
                    <button onclick="togglePulse(${pulse.id})" class="btn btn-small ${pulse.isActive ? 'btn-warning' : 'btn-success'}">${pulse.isActive ? 'Pause' : 'Resume'}</button>
                    <button onclick="editPulseSource(${pulse.id})" class="btn btn-small btn-info">Edit Source</button>
                    <button onclick="removePulse(${pulse.id})" class="btn btn-small btn-danger">Remove</button>
                </div>
            </div>
        `;
    });

    pulseList.innerHTML = listHTML;
}

window.editPulseSource = function(pulseId) {
    const pulse = pulses.find(p => p.id === pulseId);
    if (!pulse) return;

    const newSource = prompt('Enter new data source:', pulse.dataSource);
    if (newSource && newSource.trim()) {
        pulse.dataSource = newSource.trim();
        pulse.sourceQuality = getSourceQuality(newSource);
        updatePulseList();
        updatePreview();
        showSuccess(`Updated data source for pulse #${pulseId} to: ${newSource}`);
    }
};

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
            ? '<div class="preview-placeholder"><div style="font-size: 3rem; margin-bottom: 1rem;">📄</div><h3>Live Preview</h3><p>Articles with pulse points will appear here with highlighted dynamic content, confidence scores, categories, and automatic footnotes for editorial review.</p></div>'
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

window.debugLivePulse = function() {
    console.log('🐛 LivePulse Debug Info:');
    console.log('- Editor Mode:', isEditorMode);
    console.log('- Current Analysis:', currentAnalysis);
    console.log('- Pulses:', pulses?.length || 0);
    console.log('- Clusters:', semanticClusters?.length || 0);
    
    // Test button accessibility
    const buttons = [
        'analyze-btn',
        'scan-full-article', 
        'create-pulse-btn'
    ];
    
    buttons.forEach(id => {
        const btn = document.getElementById(id);
        console.log(`- Button ${id}:`, btn ? 'Found ✅' : 'Missing ❌');
        if (btn) {
            console.log(`  - Disabled: ${btn.disabled}`);
            console.log(`  - Event listeners: ${btn.onclick ? 'onclick' : 'addEventListener'}`);
        }
    });
    
    return {
        editorMode: isEditorMode,
        currentAnalysis,
        pulses: pulses?.length || 0,
        clusters: semanticClusters?.length || 0,
        buttonsFound: buttons.filter(id => document.getElementById(id)).length
    };
};

class LivePreviewManager {
  constructor() {
    this.currentArticleId = null;
    this.stagingResult = null;
    this.processingSteps = ['applying', 'quality', 'corrections', 'validation'];
    this.currentStep = 0;
  }

  /**
   * Initialize live preview system
   */
  init() {
    this.bindEventListeners();
    this.updateStagingStatus('ready');
  }

  /**
   * Bind event listeners for live preview functionality
   */
  bindEventListeners() {
    const generateBtn = document.getElementById('generate-preview-btn');
    const refreshBtn = document.getElementById('refresh-preview-btn');
    const approveBtn = document.getElementById('approve-preview-btn');

    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generatePreview());
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshPreview());
    }

    if (approveBtn) {
      approveBtn.addEventListener('click', () => this.approvePreview());
    }
  }

  /**
   * Generate live preview with staging validation
   */
  async generatePreview() {
    try {
      this.updateStagingStatus('processing');
      this.showProcessingStatus(true);
      
      // Get current article content and updates
      const articleData = this.getCurrentArticleData();
      if (!articleData) {
        throw new Error('No article data available');
      }

      // Start processing animation
      this.animateProcessingSteps();

      // Call live preview staging endpoint
      const response = await fetch('/.netlify/functions/live-preview-staging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: articleData.id,
          pulseUpdates: this.getPendingPulseUpdates(),
          clusterUpdates: this.getPendingClusterUpdates(),
          originalContent: articleData.content,
          articleContext: articleData.context
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Preview generation failed');
      }

      this.stagingResult = result.stagingResult;
      this.displayStagingResults();
      
    } catch (error) {
      console.error('Preview generation error:', error);
      this.displayError(error.message);
    } finally {
      this.showProcessingStatus(false);
    }
  }

  /**
   * Refresh existing preview
   */
  async refreshPreview() {
    await this.generatePreview();
  }

  /**
   * Approve preview for publishing
   */
  async approvePreview() {
    if (!this.stagingResult || !this.stagingResult.readyForPreview) {
      alert('Preview is not ready for approval. Please address quality issues first.');
      return;
    }

    try {
      // Call publish endpoint with approved content
      const response = await fetch('/.netlify/functions/publish-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId: this.currentArticleId,
          approvedContent: this.stagingResult.finalContent,
          stagingMetadata: this.stagingResult.stagingMetadata
        })
      });

      const result = await response.json();
      
      if (result.success) {
        this.updateStagingStatus('approved');
        alert('Content approved and published successfully!');
      } else {
        throw new Error(result.error || 'Publishing failed');
      }
      
    } catch (error) {
      console.error('Approval error:', error);
      alert('Failed to approve content: ' + error.message);
    }
  }

  /**
   * Display staging results in the UI
   */
  displayStagingResults() {
    if (!this.stagingResult) return;

    const { qualityAssessment, corrections, finalValidation, previewStatus } = this.stagingResult;

    // Update staging status
    this.updateStagingStatus(previewStatus.status);

    // Display quality metrics
    this.displayQualityMetrics(qualityAssessment.qualityScores);

    // Display corrections if any
    if (corrections && corrections.length > 0) {
      this.displayCorrections(corrections);
    }

    // Display final content
    this.displayPreviewContent(this.stagingResult.finalContent);

    // Update button states
    this.updateButtonStates();
  }

  /**
   * Display quality metrics with visual scores
   */
  displayQualityMetrics(scores) {
    const metricsContainer = document.getElementById('quality-metrics');
    if (!metricsContainer) return;

    metricsContainer.style.display = 'block';

    const scoreTypes = ['grammar', 'semantic', 'tone', 'meaning', 'overall'];
    
    scoreTypes.forEach(type => {
      const score = scores[type] || 0;
      const percentage = Math.round(score * 100);
      
      const fillElement = document.getElementById(`${type}-score`);
      const textElement = document.getElementById(`${type}-text`);
      
      if (fillElement && textElement) {
        fillElement.style.width = `${percentage}%`;
        fillElement.className = `score-fill ${this.getScoreClass(score)}`;
        textElement.textContent = `${percentage}%`;
      }
    });
  }

  /**
   * Get CSS class based on score value
   */
  getScoreClass(score) {
    if (score >= 0.9) return 'excellent';
    if (score >= 0.8) return 'good';
    if (score >= 0.6) return 'fair';
    return 'poor';
  }

  /**
   * Display corrections that were applied
   */
  displayCorrections(corrections) {
    const correctionsList = document.getElementById('corrections-list');
    const correctionsContainer = document.getElementById('corrections-summary');
    
    if (!correctionsList || !correctionsContainer) return;

    correctionsContainer.style.display = 'block';
    correctionsList.innerHTML = '';

    corrections.forEach(correction => {
      const correctionItem = this.createCorrectionItem(correction);
      correctionsList.appendChild(correctionItem);
    });
  }

  /**
   * Create a correction item element
   */
  createCorrectionItem(correction) {
    const item = document.createElement('div');
    item.className = `correction-item ${correction.issueType}`;
    
    item.innerHTML = `
      <div class="correction-header">
        <span class="correction-type">${correction.issueType.replace('_', ' ')}</span>
        <span class="correction-severity ${correction.severity}">${correction.severity}</span>
      </div>
      <div class="correction-details">${correction.reasoning}</div>
      <div class="correction-changes">
        <div class="change-item">
          <div class="change-label">Original:</div>
          <div class="change-text original">${correction.originalText}</div>
        </div>
        <div class="change-item">
          <div class="change-label">Corrected:</div>
          <div class="change-text corrected">${correction.correctedText}</div>
        </div>
      </div>
    `;
    
    return item;
  }

  /**
   * Display preview content
   */
  displayPreviewContent(content) {
    const container = document.getElementById('preview-container');
    if (!container) return;

    container.innerHTML = `
      <div class="preview-content-display">
        ${content}
      </div>
    `;
  }

  /**
   * Update staging status badge
   */
  updateStagingStatus(status) {
    const badge = document.getElementById('staging-status-badge');
    if (!badge) return;

    badge.className = `status-badge ${status}`;
    badge.textContent = status.charAt(0).toUpperCase() + status.slice(1);
  }

  /**
   * Show/hide processing status
   */
  showProcessingStatus(show) {
    const statusContainer = document.getElementById('processing-status');
    const previewContainer = document.getElementById('preview-container');
    
    if (statusContainer) {
      statusContainer.style.display = show ? 'block' : 'none';
    }
    
    if (previewContainer && show) {
      previewContainer.innerHTML = '';
    }
  }

  /**
   * Animate processing steps
   */
  animateProcessingSteps() {
    this.currentStep = 0;
    
    const interval = setInterval(() => {
      // Mark current step as active
      const currentStepElement = document.getElementById(`step-${this.processingSteps[this.currentStep]}`);
      if (currentStepElement) {
        currentStepElement.classList.add('active');
      }

      // Mark previous step as completed
      if (this.currentStep > 0) {
        const prevStepElement = document.getElementById(`step-${this.processingSteps[this.currentStep - 1]}`);
        if (prevStepElement) {
          prevStepElement.classList.remove('active');
          prevStepElement.classList.add('completed');
        }
      }

      this.currentStep++;
      
      if (this.currentStep >= this.processingSteps.length) {
        clearInterval(interval);
        // Mark final step as completed
        const finalStepElement = document.getElementById(`step-${this.processingSteps[this.processingSteps.length - 1]}`);
        if (finalStepElement) {
          finalStepElement.classList.remove('active');
          finalStepElement.classList.add('completed');
        }
      }
    }, 1500); // 1.5 seconds per step
  }

  /**
   * Update button states based on staging results
   */
  updateButtonStates() {
    const generateBtn = document.getElementById('generate-preview-btn');
    const refreshBtn = document.getElementById('refresh-preview-btn');
    const approveBtn = document.getElementById('approve-preview-btn');

    if (generateBtn) generateBtn.style.display = 'none';
    if (refreshBtn) refreshBtn.style.display = 'inline-block';
    
    if (approveBtn) {
      approveBtn.style.display = 'inline-block';
      approveBtn.disabled = !this.stagingResult?.readyForPreview;
    }
  }

  /**
   * Get current article data
   */
  getCurrentArticleData() {
    // This should integrate with your existing article management system
    // Return current article ID, content, and context
    return {
      id: this.currentArticleId || 'default-article',
      content: document.getElementById('article-content')?.value || '',
      context: document.getElementById('article-context')?.value || ''
    };
  }

  /**
   * Get pending pulse updates
   */
  getPendingPulseUpdates() {
    // This should integrate with your pulse management system
    // Return array of pending pulse updates
    return window.pendingPulseUpdates || [];
  }

  /**
   * Get pending cluster updates
   */
  getPendingClusterUpdates() {
    // This should integrate with your cluster management system
    // Return array of pending cluster updates
    return window.pendingClusterUpdates || [];
  }

  /**
   * Display error message
   */
  displayError(message) {
    const container = document.getElementById('preview-container');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger">
          <strong>Error:</strong> ${message}
          <br><small>Please check your content and try again.</small>
        </div>
      `;
    }
    this.updateStagingStatus('blocked');
  }

  /**
   * Set current article ID
   */
  setCurrentArticle(articleId) {
    this.currentArticleId = articleId;
  }
}

// Initialize Live Preview Manager
const livePreviewManager = new LivePreviewManager();

// Integration with existing app initialization
document.addEventListener('DOMContentLoaded', function() {
  // Your existing initialization code...
  
  // Initialize live preview system
  livePreviewManager.init();
  
  // Set up integration hooks with existing pulse/cluster systems
  window.livePreviewManager = livePreviewManager;
});

// Integration hooks for existing systems
window.updateLivePreview = function() {
  if (window.livePreviewManager) {
    window.livePreviewManager.refreshPreview();
  }
};

window.setCurrentArticle = function(articleId) {
  if (window.livePreviewManager) {
    window.livePreviewManager.setCurrentArticle(articleId);
  }
};

console.log('🐛 Debug function added. Type debugLivePulse() in console to check status.');