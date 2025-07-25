// LivePulse MVP Frontend JavaScript

let currentAnalysis = null;

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

    // Store pulses
    let pulses = [];
    let pulseCounter = 1;

    // Analyze pulse button click
    analyzeBtn.addEventListener('click', async function() {
        const selectedTextValue = selectedText.value.trim();
        const articleContentValue = articleContent.value.trim();

        if (!selectedTextValue) {
            alert('Please enter the text you want to make dynamic');
            return;
        }

        if (!articleContentValue) {
            alert('Please enter some article content first');
            return;
        }

        // Show loading state
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Analyzing...';
        
        try {
            const response = await fetch('/.netlify/functions/analyze-pulse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    selectedText: selectedTextValue,
                    articleContent: articleContentValue
                })
            });

            const data = await response.json();

            if (data.success) {
                currentAnalysis = data.analysis;
                displayAnalysis(data.analysis, selectedTextValue);
                analysisResult.classList.remove('hidden');
                createPulseBtn.classList.remove('hidden');
            } else {
                showError('Analysis failed: ' + data.error);
            }

        } catch (error) {
            showError('Network error: ' + error.message);
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Analyze Pulse';
        }
    });

    // Create pulse button click
    createPulseBtn.addEventListener('click', function() {
        if (currentAnalysis) {
            createPulse(currentAnalysis, selectedText.value);
            selectedText.value = '';
            analysisResult.classList.add('hidden');
            createPulseBtn.classList.add('hidden');
            currentAnalysis = null;
        }
    });

    // Article content change - update preview
    articleContent.addEventListener('input', function() {
        updatePreview();
    });

    function displayAnalysis(analysis, originalText) {
        analysisContent.innerHTML = `
            <div class="analysis-item">
                <strong>Selected Text:</strong> "${originalText}"
            </div>
            <div class="analysis-item">
                <strong>Pulse Type:</strong> ${analysis.pulseType} (${analysis.specificType})
            </div>
            <div class="analysis-item">
                <strong>Update Frequency:</strong> Every ${analysis.updateFrequency} minutes
            </div>
            <div class="analysis-item">
                <strong>Data Source:</strong> ${analysis.dataSource}
            </div>
            <div class="analysis-item">
                <strong>Reasoning:</strong> ${analysis.reasoning}
            </div>
            <div class="analysis-item">
                <strong>Confidence:</strong> ${analysis.confidence || 'medium'}
            </div>
            <div class="analysis-item">
                <strong>Current Value:</strong> ${analysis.currentValue || originalText}
            </div>
        `;
    }

    function createPulse(analysis, originalText) {
        const nextUpdate = new Date(Date.now() + (analysis.updateFrequency * 60 * 1000));
        
        const pulse = {
            id: pulseCounter++,
            originalText: originalText,
            currentValue: analysis.currentValue || originalText,
            pulseType: analysis.pulseType,
            specificType: analysis.specificType,
            updateFrequency: analysis.updateFrequency,
            dataSource: analysis.dataSource,
            reasoning: analysis.reasoning,
            promptTemplate: analysis.promptTemplate,
            lastUpdated: new Date().toISOString(),
            nextUpdate: nextUpdate.toISOString(),
            updateCount: 0,
            isActive: true
        };

        pulses.push(pulse);
        updatePulseList();
        updatePreview();
        
        showSuccess(`Pulse point created! "${originalText}" will auto-update every ${analysis.updateFrequency} minutes. Next update: ${nextUpdate.toLocaleTimeString()}`);
    }

    function updatePulseList() {
        if (pulses.length === 0) {
            pulseList.innerHTML = '<p>No pulses created yet.</p>';
            return;
        }

        pulseList.innerHTML = pulses.map(pulse => {
            const nextUpdate = new Date(pulse.nextUpdate);
            const isOverdue = nextUpdate < new Date();
            const statusIcon = pulse.isActive ? '🔄' : '⏸️';
            const overdueWarning = isOverdue ? ' ⚠️ OVERDUE' : '';
            
            return `
            <div class="pulse-item">
                <h4>${statusIcon} Pulse #${pulse.id}: ${pulse.specificType}</h4>
                <p><strong>Text:</strong> "${pulse.currentValue}"</p>
                <div class="pulse-meta">
                    <span>Updates: Every ${pulse.updateFrequency} min</span>
                    <span>Source: ${pulse.dataSource}</span>
                    <span>Last updated: ${new Date(pulse.lastUpdated).toLocaleString()}</span>
                    <span>Next update: ${nextUpdate.toLocaleString()}${overdueWarning}</span>
                    <span>Count: ${pulse.updateCount} updates</span>
                </div>
                <div style="margin-top: 10px;">
                    <button onclick="testUpdate(${pulse.id})" style="padding: 4px 8px; font-size: 12px;">Manual Update</button>
                    <button onclick="togglePulse(${pulse.id})" style="padding: 4px 8px; font-size: 12px; background: ${pulse.isActive ? '#f59e0b' : '#10b981'};">${pulse.isActive ? 'Pause' : 'Resume'}</button>
                    <button onclick="removePulse(${pulse.id})" style="padding: 4px 8px; font-size: 12px; background: #dc2626;">Remove</button>
                </div>
            </div>
        `}).join('');
    }

    function updatePreview() {
        let content = articleContent.value;
        
        if (!content.trim()) {
            articlePreview.innerHTML = '<p>Your article with pulse points will appear here...</p>';
            return;
        }

        // Replace pulse text with highlighted versions
        pulses.forEach(pulse => {
            const regex = new RegExp(escapeRegExp(pulse.originalText), 'g');
            content = content.replace(regex, 
                `<span class="pulse-point">${pulse.currentValue}<sup><a href="#footnote-${pulse.id}">${pulse.id}</a></sup></span>`
            );
        });

        // Add footnotes
        let footnotes = '';
        if (pulses.length > 0) {
            footnotes = '<div style="margin-top: 30px; border-top: 1px solid #ccc; padding-top: 20px;"><h4>Footnotes:</h4>';
            pulses.forEach(pulse => {
                footnotes += `
                    <div id="footnote-${pulse.id}" style="font-size: 14px; margin-bottom: 10px;">
                        <strong>${pulse.id}.</strong> Updated from ${pulse.dataSource} 
                        on ${new Date(pulse.lastUpdated).toLocaleString()}
                        (${pulse.updateCount} updates total)
                    </div>
                `;
            });
            footnotes += '</div>';
        }

        articlePreview.innerHTML = `
            <div style="line-height: 1.6;">
                ${content.replace(/\n/g, '<br>')}
                ${footnotes}
            </div>
        `;
    }

    // Global functions for pulse management
    window.testUpdate = async function(pulseId) {
        const pulse = pulses.find(p => p.id === pulseId);
        if (!pulse) return;

        const button = event.target;
        button.disabled = true;
        button.textContent = 'Updating...';

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
                    surroundingText: getContext(pulse.originalText)
                })
            });

            const data = await response.json();

            if (data.success) {
                pulse.currentValue = data.updatedValue;
                pulse.lastUpdated = data.timestamp;
                pulse.updateCount++;
                
                // Set next update time
                const nextUpdate = new Date(Date.now() + (pulse.updateFrequency * 60 * 1000));
                pulse.nextUpdate = nextUpdate.toISOString();
                
                updatePulseList();
                updatePreview();
                showSuccess(`✅ Pulse updated: "${data.updatedValue}" (Next update: ${nextUpdate.toLocaleTimeString()})`);
            } else {
                showError('Update failed: ' + data.error);
            }

        } catch (error) {
            showError('Network error: ' + error.message);
        } finally {
            button.disabled = false;
            button.textContent = 'Manual Update';
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

    window.removePulse = function(pulseId) {
        pulses = pulses.filter(p => p.id !== pulseId);
        updatePulseList();
        updatePreview();
        showSuccess('Pulse removed');
    };

    function getContext(text) {
        const content = articleContent.value;
        const index = content.indexOf(text);
        if (index === -1) return content.substring(0, 200);
        
        const start = Math.max(0, index - 100);
        const end = Math.min(content.length, index + text.length + 100);
        return content.substring(start, end);
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        document.querySelector('.container').appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
    }

    function showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'error';
        successDiv.style.background = '#f0f9ff';
        successDiv.style.color = '#0c4a6e';
        successDiv.style.borderLeftColor = '#0ea5e9';
        successDiv.textContent = message;
        document.querySelector('.container').appendChild(successDiv);
        setTimeout(() => successDiv.remove(), 3000);
    }
});