// Universal LivePulse Frontend with Semantic Cluster Support
// src/app.js

let currentAnalysis = null;
let pulses = [];
let semanticClusters = [];
let pulseCounter = 1;
let clusterCounter = 1;

document.addEventListener('DOMContentLoaded', function() {
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

    // Initialize UI event listeners
    initializeEventListeners();

    /**
     * Initialize all event listeners
     */
    function initializeEventListeners() {
        // Analyze single pulse button
        analyzeBtn.addEventListener('click', analyzeSinglePulse);
        
        // Create pulse button
        createPulseBtn.addEventListener('click', createPulseFromAnalysis);
        
        // Scan full article button
        scanFullArticleBtn.addEventListener('click', scanFullArticle);
        
        // Article content change - update preview
        articleContent.addEventListener('input', debounce(updatePreview, 300));
        
        // Selected text change - clear previous analysis
        selectedText.addEventListener('input', function() {
            if (currentAnalysis) {
                analysisResult.classList.add('hidden');
                createPulseBtn.classList.add('hidden');
                currentAnalysis = null;
            }
        });
    }

    /**
     * Analyze selected text for pulse points and semantic relationships
     */
    async function analyzeSinglePulse() {
        const selectedTextValue = selectedText.value.trim();
        const articleContentValue = articleContent.value.trim();

        if (!selectedTextValue) {
            showError('Please enter the text you want to make dynamic');
            return;
        }

        if (!articleContentValue) {
            showError('Please enter some article content first');
            return;
        }

        // Show loading state
        setButtonLoading(analyzeBtn, 'Analyzing...');
        
        try {
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
                currentAnalysis = data.analysis;
                displaySmartAnalysis(data.analysis, selectedTextValue);
                analysisResult.classList.remove('hidden');
                createPulseBtn.classList.remove('hidden');
            } else {
                showError('Analysis failed: ' + data.error);
            }

        } catch (error) {
            showError('Network error: ' + error.message);
        } finally {
            setButtonLoading(analyzeBtn, 'Analyze Pulse', false);
        }
    }

    /**
     * Scan entire article for pulse points and clusters
     */
    async function scanFullArticle() {
        const articleContentValue = articleContent.value.trim();

        if (!articleContentValue) {
            showError('Please enter article content to scan');
            return;
        }

        setButtonLoading(scanFullArticleBtn, 'Scanning Article...');
        
        try {
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
                displayFullArticleScan(data.analysis);
                showSuccess(`Found ${data.analysis.pulsePoints?.length || 0} potential pulse points and ${data.analysis.semanticClusters?.length || 0} clusters`);
            } else {
                showError('Article scan failed: ' + data.error);
            }

        } catch (error) {
            showError('Network error: ' + error.message);
        } finally {
            setButtonLoading(scanFullArticleBtn, 'Scan Full Article', false);
        }
    }

    /**
     * Display smart analysis results with semantic cluster information
     */
    function displaySmartAnalysis(analysis, originalText) {
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
            
            analysisHTML += `
                <div class="pulse-point-card ${pulse.role}">
                    <div class="pulse-header">
                        <span class="pulse-role">${roleIcon} ${pulse.role.toUpperCase()}</span>
                        <span class="pulse-confidence confidence-${pulse.confidence}">${pulse.confidence}</span>
                    </div>
                    
                    <div class="text-breakdown">
                        <div class="text-parts">
                            <span class="static-text">${pulse.staticPrefix || ''}</span><span class="dynamic-text" title="This will update automatically">${pulse.dynamicPart}</span><span class="static-text">${pulse.staticSuffix || ''}</span>
                        </div>
                    </div>
                    
                    <div class="pulse-details">
                        <div class="detail-row">
                            <label>Type:</label>
                            <span>${pulse.pulseType} → ${pulse.specificType}</span>
                        </div>
                        <div class="detail-row">
                            <label>Update Frequency:</label>
                            <span>${formatFrequency(pulse.updateFrequency)}</span>
                        </div>
                        <div class="detail-row">
                            <label>Data Source:</label>
                            <span>${pulse.dataSource}</span>
                        </div>
                        <div class="detail-row">
                            <label>Reasoning:</label>
                            <span>${pulse.reasoning}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        analysisHTML += '</div>';

        // Display relationships if cluster
        if (isCluster && cluster.relationships && cluster.relationships.length > 0) {
            analysisHTML += '<div class="relationships-section"><h4>🔄 Relationships:</h4>';
            
            cluster.relationships.forEach(rel => {
                const sourcePulse = pulsePoints[rel.sourcePulseIndex];
                const targetPulse = pulsePoints[rel.targetPulseIndex];
                
                analysisHTML += `
                    <div class="relationship-card">
                        <div class="relationship-flow">
                            <span class="source-pulse">${sourcePulse?.dynamicPart}</span>
                            <span class="relationship-arrow">→</span>
                            <span class="target-pulse">${targetPulse?.dynamicPart}</span>
                        </div>
                        <div class="relationship-details">
                            <strong>${rel.relationshipType}</strong>: ${rel.calculationRule}
                        </div>
                    </div>
                `;
            });
            
            analysisHTML += '</div>';
        }

        analysisContent.innerHTML = analysisHTML;
    }

    /**
     * Display full article scan results
     */
    function displayFullArticleScan(analysis) {
        const modal = createModal('full-article-scan', 'Full Article Scan Results');
        
        let modalContent = `
            <div class="scan-summary">
                <h3>📖 Article Analysis</h3>
                <div class="scan-stats">
                    <div class="stat-item">
                        <span class="stat-number">${analysis.pulsePoints?.length || 0}</span>
                        <span class="stat-label">Pulse Points</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${analysis.semanticClusters?.length || 0}</span>
                        <span class="stat-label">Clusters</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number">${analysis.recommendations?.highPriority || 0}</span>
                        <span class="stat-label">High Priority</span>
                    </div>
                </div>
            </div>
        `;

        if (analysis.pulsePoints && analysis.pulsePoints.length > 0) {
            modalContent += '<div class="discovered-pulses"><h4>🎯 Discovered Pulse Points:</h4>';
            
            analysis.pulsePoints.forEach((pulse, index) => {
                modalContent += `
                    <div class="discovered-pulse-card priority-${pulse.priority}">
                        <div class="pulse-preview">
                            <span class="pulse-text">"${pulse.text}"</span>
                            <span class="pulse-priority">${pulse.priority}</span>
                        </div>
                        <div class="pulse-info">
                            <span>${pulse.pulseType}</span>
                            <span>${formatFrequency(pulse.updateFrequency)}</span>
                            <span>Confidence: ${pulse.confidence}</span>
                        </div>
                        <button onclick="createPulseFromScan(${index})" class="btn-small">Create Pulse</button>
                    </div>
                `;
            });
            
            modalContent += '</div>';
        }

        if (analysis.semanticClusters && analysis.semanticClusters.length > 0) {
            modalContent += '<div class="discovered-clusters"><h4>🔗 Discovered Clusters:</h4>';
            
            analysis.semanticClusters.forEach((cluster, index) => {
                modalContent += `
                    <div class="discovered-cluster-card">
                        <h5>${cluster.clusterName}</h5>
                        <div class="cluster-pulses">
                            ${cluster.pulseIndices.map(i => `<span class="cluster-pulse">"${analysis.pulsePoints[i]?.dynamicPart}"</span>`).join(' → ')}
                        </div>
                        <button onclick="createClusterFromScan(${index})" class="btn-small">Create Cluster</button>
                    </div>
                `;
            });
            
            modalContent += '</div>';
        }

        modal.querySelector('.modal-content').innerHTML = modalContent;
        
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
        selectedText.value = '';
        analysisResult.classList.add('hidden');
        createPulseBtn.classList.add('hidden');
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
        
        return {
            id: pulseCounter++,
            originalText: pulseData.fullSelection || pulseData.dynamicPart,
            dynamicPart: pulseData.dynamicPart,
            staticPrefix: pulseData.staticPrefix || '',
            staticSuffix: pulseData.staticSuffix || '',
            currentValue: pulseData.dynamicPart,
            pulseType: pulseData.pulseType,
            specificType: pulseData.specificType,
            updateFrequency: pulseData.updateFrequency,
            dataSource: pulseData.dataSource,
            reasoning: pulseData.reasoning,
            confidence: pulseData.confidence,
            action: pulseData.action,
            subject: pulseData.subject,
            entity: pulseData.entity,
            emotion: pulseData.emotion,
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
        if (pulses.length === 0 && semanticClusters.length === 0) {
            pulseList.innerHTML = '<p>No pulses created yet.</p>';
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
                        <button onclick="testClusterUpdate('${cluster.id}')" class="btn-small">Test Update</button>
                        <button onclick="toggleCluster('${cluster.id}')" class="btn-small ${cluster.isActive ? 'warning' : 'success'}">${cluster.isActive ? 'Pause' : 'Resume'}</button>
                        <button onclick="removeCluster('${cluster.id}')" class="btn-small danger">Remove</button>
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
                        <button onclick="testPulseUpdate(${pulse.id})" class="btn-small">Test Update</button>
                        <button onclick="togglePulse(${pulse.id})" class="btn-small ${pulse.isActive ? 'warning' : 'success'}">${pulse.isActive ? 'Pause' : 'Resume'}</button>
                        <button onclick="removePulse(${pulse.id})" class="btn-small danger">Remove</button>
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
        let content = articleContent.value;
        
        if (!content.trim()) {
            articlePreview.innerHTML = '<p>Your article with pulse points will appear here...</p>';
            return;
        }

        // Replace pulse text with highlighted versions
        pulses.forEach(pulse => {
            const fullText = pulse.staticPrefix + pulse.currentValue + pulse.staticSuffix;
            const originalRegex = new RegExp(escapeRegExp(pulse.originalText), 'g');
            content = content.replace(originalRegex, 
                `<span class="pulse-point" data-pulse-id="${pulse.id}" title="${pulse.specificType}">${fullText}<sup><a href="#footnote-${pulse.id}">${pulse.id}</a></sup></span>`
            );
        });

        // Add footnotes
        let footnotes = '';
        if (pulses.length > 0) {
            footnotes = '<div class="footnotes-section"><h4>📝 Footnotes & Sources:</h4>';
            
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
            
            // Display cluster footnotes
            clusteredFootnotes.forEach((clusterPulses, clusterId) => {
                const cluster = semanticClusters.find(c => c.id === clusterId);
                footnotes += `
                    <div class="footnote-cluster">
                        <strong>🔗 ${cluster?.name || 'Cluster'}:</strong>
                        ${clusterPulses.map(pulse => `
                            <div id="footnote-${pulse.id}" class="footnote-item">
                                <strong>${pulse.id}.</strong> ${pulse.role}: "${pulse.currentValue}" updated from ${pulse.dataSource} 
                                on ${new Date(pulse.lastUpdated).toLocaleString()}
                                (${pulse.updateCount} updates total)
                            </div>
                        `).join('')}
                    </div>
                `;
            });
            
            // Display individual footnotes
            individualFootnotes.forEach(pulse => {
                footnotes += `
                    <div id="footnote-${pulse.id}" class="footnote-item">
                        <strong>${pulse.id}.</strong> Updated from ${pulse.dataSource} 
                        on ${new Date(pulse.lastUpdated).toLocaleString()}
                        (${pulse.updateCount} updates total)
                    </div>
                `;
            });
            
            footnotes += '</div>';
        }

        articlePreview.innerHTML = `
            <div class="article-content">
                ${content.replace(/\n/g, '<br>')}
                ${footnotes}
            </div>
        `;
    }

    // Global functions for pulse and cluster management
    window.testPulseUpdate = async function(pulseId) {
        const pulse = pulses.find(p => p.id === pulseId);
        if (!pulse) return;

        const button = event.target;
        setButtonLoading(button, 'Updating...');

        try {
            const response = await fetch('/.netlify/functions/update-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pulseType: pulse.pulseType,
                    specificType: pulse.specificType,
                    currentValue: pulse.currentValue,
                    articleContext: articleContent.value,
                    promptTemplate: pulse.promptTemplate,
                    surroundingText: pulse.originalText,
                    staticPrefix: pulse.staticPrefix,
                    staticSuffix: pulse.staticSuffix
                })
            });

            const data = await response.json();

            if (data.success) {
                pulse.currentValue = data.updatedValue;
                pulse.lastUpdated = data.timestamp;
                pulse.updateCount++;
                
                const nextUpdate = new Date(Date.now() + (pulse.updateFrequency * 60 * 1000));
                pulse.nextUpdate = nextUpdate.toISOString();
                
                updatePulseList();
                updatePreview();
                showSuccess(`✅ Pulse updated: "${data.updatedValue}" (Next: ${nextUpdate.toLocaleTimeString()})`);
            } else {
                showError('Update failed: ' + data.error);
            }

        } catch (error) {
            showError('Network error: ' + error.message);
        } finally {
            setButtonLoading(button, 'Test Update', false);
        }
    };

    window.testClusterUpdate = async function(clusterId) {
        const cluster = semanticClusters.find(c => c.id === clusterId);
        if (!cluster) return;

        const button = event.target;
        setButtonLoading(button, 'Updating Cluster...');

        try {
            // For frontend testing, update the primary pulse and calculate dependencies
            const clusterPulses = pulses.filter(p => p.clusterId === clusterId);
            const primaryPulse = clusterPulses.find(p => p.isPrimaryInCluster);
            
            if (!primaryPulse) {
                throw new Error('No primary pulse found in cluster');
            }

            const response = await fetch('/.netlify/functions/update-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pulseType: primaryPulse.pulseType,
                    specificType: primaryPulse.specificType,
                    currentValue: primaryPulse.currentValue,
                    articleContext: articleContent.value,
                    staticPrefix: primaryPulse.staticPrefix,
                    staticSuffix: primaryPulse.staticSuffix
                })
            });

            const data = await response.json();

            if (data.success) {
                // Update primary pulse
                primaryPulse.currentValue = data.updatedValue;
                primaryPulse.lastUpdated = data.timestamp;
                primaryPulse.updateCount++;
                
                const nextUpdate = new Date(Date.now() + (primaryPulse.updateFrequency * 60 * 1000));
                primaryPulse.nextUpdate = nextUpdate.toISOString();
                
                // TODO: Calculate dependent pulse updates based on relationships
                // For now, we'll just update the primary pulse
                
                updatePulseList();
                updatePreview();
                showSuccess(`✅ Cluster updated: "${cluster.name}" (Primary: "${data.updatedValue}")`);
            } else {
                showError('Cluster update failed: ' + data.error);
            }

        } catch (error) {
            showError('Network error: ' + error.message);
        } finally {
            setButtonLoading(button, 'Test Update', false);
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

    // Helper functions
    function formatFrequency(minutes) {
        if (minutes < 60) return `${minutes} minutes`;
        if (minutes < 1440) return `${Math.round(minutes / 60)} hours`;
        if (minutes < 10080) return `${Math.round(minutes / 1440)} days`;
        if (minutes < 43200) return `${Math.round(minutes / 10080)} weeks`;
        return `${Math.round(minutes / 43200)} months`;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = loadingText;
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || loadingText;
        }
    }

    function createModal(id, title) {
        // Remove existing modal if present
        const existingModal = document.getElementById(id);
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="closeModal('${id}')">&times;</button>
                </div>
                <div class="modal-content">
                    <!-- Content will be inserted here -->
                </div>
                <div class="modal-footer">
                    <button onclick="closeModal('${id}')" class="btn-secondary">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Close on backdrop click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(id);
            }
        });

        return modal;
    }

    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.remove();
        }
    };

    window.createPulseFromScan = function(pulseIndex) {
        if (!window.lastScanResults || !window.lastScanResults.pulsePoints) return;
        
        const pulseData = window.lastScanResults.pulsePoints[pulseIndex];
        if (!pulseData) return;

        // Convert scan result to pulse format
        const convertedPulse = {
            dynamicPart: pulseData.dynamicPart || pulseData.text,
            staticPrefix: pulseData.staticContext?.split(pulseData.dynamicPart)[0] || '',
            staticSuffix: pulseData.staticContext?.split(pulseData.dynamicPart)[1] || '',
            fullSelection: pulseData.text,
            pulseType: pulseData.pulseType,
            specificType: pulseData.specificType,
            updateFrequency: pulseData.updateFrequency,
            dataSource: pulseData.dataSource || 'Unknown',
            reasoning: pulseData.reasoning,
            confidence: pulseData.confidence,
            role: 'single'
        };

        createSinglePulse(convertedPulse);
        closeModal('full-article-scan');
        showSuccess(`Created pulse point: "${convertedPulse.dynamicPart}"`);
    };

    window.createClusterFromScan = function(clusterIndex) {
        if (!window.lastScanResults || !window.lastScanResults.semanticClusters) return;
        
        const clusterData = window.lastScanResults.semanticClusters[clusterIndex];
        const pulsePoints = window.lastScanResults.pulsePoints;
        if (!clusterData || !pulsePoints) return;

        // Convert scan cluster to analysis format
        const convertedAnalysis = {
            analysisType: 'semantic_cluster',
            pulsePoints: clusterData.pulseIndices.map((pulseIndex, i) => {
                const pulse = pulsePoints[pulseIndex];
                return {
                    dynamicPart: pulse.dynamicPart || pulse.text,
                    staticPrefix: pulse.staticContext?.split(pulse.dynamicPart)[0] || '',
                    staticSuffix: pulse.staticContext?.split(pulse.dynamicPart)[1] || '',
                    fullSelection: pulse.text,
                    pulseType: pulse.pulseType,
                    specificType: pulse.specificType,
                    updateFrequency: pulse.updateFrequency,
                    dataSource: pulse.dataSource || 'Unknown',
                    reasoning: pulse.reasoning,
                    confidence: pulse.confidence,
                    role: i === 0 ? 'primary' : 'dependent'
                };
            }),
            semanticCluster: {
                clusterId: `scan_cluster_${clusterIndex}`,
                clusterName: clusterData.clusterName,
                clusterType: clusterData.clusterType || 'mathematical',
                relationships: clusterData.relationships || [],
                semanticRule: `Cluster created from article scan: ${clusterData.clusterName}`
            }
        };

        createSemanticCluster(convertedAnalysis);
        closeModal('full-article-scan');
        showSuccess(`Created semantic cluster: "${clusterData.clusterName}" with ${clusterData.pulseIndices.length} pulse points`);
    };

    function showError(message) {
        showNotification(message, 'error');
    }

    function showSuccess(message) {
        showNotification(message, 'success');
    }

    function showNotification(message, type = 'info') {
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

    // Initialize the application
    updatePreview();
});