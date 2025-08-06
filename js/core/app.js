/**
 * LivePulse Main Application Controller
 * Coordinates all subsystems and manages application state
 */

class LivePulseApp {
    constructor() {
        this.currentArticle = null;
        this.pulsePoints = [];
        this.clusters = [];
        this.isAnalyzing = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        console.log('🫀 LivePulse App Initializing...');
        
        // Get DOM elements
        this.elements = this.getDOMElements();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize modules
        this.initializeModules();
        
        // Update initial preview
        this.updatePreview();
        
        console.log('✅ LivePulse App Ready');
    }

    getDOMElements() {
        return {
            // Views
            articlesView: document.getElementById('articles-view'),
            articleEditorView: document.getElementById('article-editor-view'),
            
            // Controls
            createArticleBtn: document.getElementById('create-article-btn'),
            backToStartBtn: document.getElementById('back-to-start'),
            analyseBtn: document.getElementById('analyse-btn'),
            
            // Content
            articleContent: document.getElementById('article-content'),
            previewContent: document.getElementById('preview-content'),
            
            // Pulse Points
            pulsePointsList: document.getElementById('pulse-points-list'),
            pulseCount: document.getElementById('pulse-count'),
            analysisEmpty: document.getElementById('analysis-empty'),
            pulsePanelActions: document.getElementById('pulse-panel-actions'),
            acceptAllBtn: document.getElementById('accept-all'),
            ignoreAllBtn: document.getElementById('ignore-all'),
            
            // Stats
            activePulseCount: document.getElementById('active-pulse-count'),
            clusterCount: document.getElementById('cluster-count'),
            
            // Sidebar
            sidebar: document.getElementById('app-sidebar'),
            sidebarItems: document.querySelectorAll('.sidebar-item')
        };
    }

    setupEventListeners() {
        // Navigation
        this.elements.createArticleBtn?.addEventListener('click', () => this.showEditor());
        this.elements.backToStartBtn?.addEventListener('click', () => this.showWelcome());
        
        // Analysis
        this.elements.analyseBtn?.addEventListener('click', () => this.analyzeContent());
        
        // Content
        this.elements.articleContent?.addEventListener('input', () => this.updatePreview());
        
        // Bulk Actions
        this.elements.acceptAllBtn?.addEventListener('click', () => this.acceptAllPulses());
        this.elements.ignoreAllBtn?.addEventListener('click', () => this.ignoreAllPulses());
        
        // Sidebar
        this.elements.sidebar?.addEventListener('mouseenter', () => {
            this.elements.sidebar.classList.add('expanded');
        });
        this.elements.sidebar?.addEventListener('mouseleave', () => {
            this.elements.sidebar.classList.remove('expanded');
        });
        
        // Sidebar navigation
        this.elements.sidebarItems?.forEach(item => {
            item.addEventListener('click', (e) => this.handleSidebarClick(e));
        });
        
        // Pulse actions delegation
        document.addEventListener('click', (e) => this.handlePulseActions(e));
    }

    initializeModules() {
        // Initialize notification system
        if (typeof NotificationSystem !== 'undefined') {
            this.notifications = new NotificationSystem();
        }
        
        // Initialize preview manager
        if (typeof PreviewManager !== 'undefined') {
            this.previewManager = new PreviewManager();
        }
        
        // Initialize pulse analyzer
        if (typeof PulseAnalyzer !== 'undefined') {
            this.pulseAnalyzer = new PulseAnalyzer();
        }
        
        // Initialize pulse display
        if (typeof PulseDisplay !== 'undefined') {
            this.pulseDisplay = new PulseDisplay();
        }
    }

    // Navigation Methods
    showEditor() {
        this.elements.articlesView?.classList.add('hidden');
        this.elements.articleEditorView?.classList.remove('hidden');
        this.elements.articleContent?.focus();
        
        console.log('📝 Switched to Article Editor');
    }

    showWelcome() {
        this.elements.articleEditorView?.classList.add('hidden');
        this.elements.articlesView?.classList.remove('hidden');
        
        // Reset analysis state
        this.resetAnalysis();
        
        console.log('🏠 Switched to Welcome View');
    }

    handleSidebarClick(e) {
        e.preventDefault();
        
        const clickedItem = e.currentTarget;
        const viewName = clickedItem.dataset.view;
        
        // Update active state
        this.elements.sidebarItems.forEach(item => item.classList.remove('active'));
        clickedItem.classList.add('active');
        
        // For now, only handle articles view
        if (viewName === 'articles') {
            this.showWelcome();
        } else {
            this.showNotification(`${viewName} view coming soon!`, 'info');
        }
        
        console.log(`📍 Navigated to: ${viewName}`);
    }

    // Content Management
    updatePreview() {
        const content = this.elements.articleContent?.value.trim() || '';
        
        if (content) {
            const paragraphs = content
                .split('\n')
                .filter(p => p.trim())
                .map(p => `<p>${this.escapeHtml(p)}</p>`)
                .join('');
            
            if (this.elements.previewContent) {
                this.elements.previewContent.innerHTML = paragraphs;
            }
        } else {
            if (this.elements.previewContent) {
                this.elements.previewContent.innerHTML = `
                    <div style="text-align: center; color: #6b7280; padding: 2rem;">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">👁️</div>
                        <p>Your article preview will appear here</p>
                    </div>
                `;
            }
        }
    }

    // Analysis Methods
    async analyzeContent() {
        const content = this.elements.articleContent?.value.trim();
        
        if (!content) {
            this.showNotification('Please write some content first!', 'warning');
            return;
        }
        
        if (this.isAnalyzing) {
            console.log('⏳ Analysis already in progress...');
            return;
        }
        
        console.log('🔍 Starting content analysis...');
        this.isAnalyzing = true;
        
        // Update UI to show loading state
        this.setAnalysisLoadingState();
        
        try {
            // Call the analysis function
            const results = await this.performAnalysis(content);
            
            // Process results
            this.handleAnalysisResults(results);
            
            // Show success notification
            this.showNotification('Analysis complete! Review the pulse points found.', 'success');
            
        } catch (error) {
            console.error('❌ Analysis failed:', error);
            this.showNotification('Analysis failed. Please try again.', 'error');
            this.resetAnalysis();
        } finally {
            this.isAnalyzing = false;
            this.resetAnalyzeButton();
        }
    }

    async performAnalysis(content) {
        // Use mock analysis for now - replace with real API call later
        if (typeof MockAnalysis !== 'undefined') {
            return await MockAnalysis.analyzeContent(content);
        }
        
        // Fallback mock analysis
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(this.generateMockResults(content));
            }, 2000);
        });
    }

    generateMockResults(content) {
        const results = [];
        
        // Check for Bitcoin price
        if (content.includes('$67,500') || content.includes('Bitcoin')) {
            results.push({
                id: 'btc-price',
                text: '$67,500',
                type: 'crypto',
                entity: 'Bitcoin (BTC)',
                confidence: 'high',
                source: 'CoinGecko API',
                quality: 'premium',
                lastUpdated: '2 minutes ago',
                nextUpdate: 'In 58 minutes',
                frequency: 'hourly'
            });
        }
        
        // Check for temperature
        if (content.includes('22 degrees') || content.includes('weather')) {
            results.push({
                id: 'adelaide-temp',
                text: '22°C',
                type: 'weather',
                entity: 'Temperature',
                location: 'Adelaide, SA',
                confidence: 'high',
                source: 'OpenWeather API',
                quality: 'premium',
                lastUpdated: '15 minutes ago',
                nextUpdate: 'In 3 hours',
                frequency: 'daily'
            });
        }
        
        // Check for year
        if (content.includes('2025')) {
            results.push({
                id: 'current-year',
                text: '2025',
                type: 'date',
                entity: 'Current Year',
                context: 'Current year reference',
                confidence: 'medium',
                source: 'System Date',
                quality: 'standard',
                lastUpdated: 'Today',
                nextUpdate: 'January 1st',
                frequency: 'yearly'
            });
        }
        
        return results;
    }

    handleAnalysisResults(results) {
        this.pulsePoints = results;
        
        // Update UI
        this.displayPulsePoints(results);
        this.updateStats();
        
        console.log(`✅ Found ${results.length} pulse points`);
    }

    displayPulsePoints(pulsePoints) {
        if (!this.elements.pulsePointsList) return;
        
        if (pulsePoints.length === 0) {
            this.elements.pulsePointsList.innerHTML = `
                <div class="analysis-empty">
                    <div class="analysis-empty-icon">🤷‍♂️</div>
                    <h3>No Pulse Points Found</h3>
                    <p>Try adding some dynamic content like prices, dates, or statistics.</p>
                </div>
            `;
            this.elements.pulsePanelActions.style.display = 'none';
            return;
        }
        
        // Generate pulse point cards
        const cardsHtml = pulsePoints.map(pulse => this.generatePulseCard(pulse)).join('');
        this.elements.pulsePointsList.innerHTML = cardsHtml;
        
        // Update pulse count
        this.elements.pulseCount.textContent = `${pulsePoints.length} pulse points found`;
        
        // Show panel actions
        this.elements.pulsePanelActions.style.display = 'flex';
    }

    generatePulseCard(pulse) {
        const confidenceClass = pulse.confidence.toLowerCase();
        const confidenceIcon = pulse.confidence === 'high' ? '🔥' : '⚡';
        
        return `
            <div class="pulse-point-card" data-pulse-id="${pulse.id}">
                <div class="pulse-card-header">
                    <div class="pulse-text">"${pulse.text}"</div>
                    <div class="pulse-confidence ${confidenceClass}">${confidenceIcon} ${pulse.confidence.toUpperCase()}</div>
                </div>
                
                <div class="pulse-card-body">
                    ${this.generatePulseMetaItems(pulse)}
                    
                    <div class="pulse-frequency">
                        <label>Update Frequency:</label>
                        <select data-pulse-id="${pulse.id}">
                            <option value="hourly" ${pulse.frequency === 'hourly' ? 'selected' : ''}>Hourly</option>
                            <option value="daily" ${pulse.frequency === 'daily' ? 'selected' : ''}>Daily</option>
                            <option value="weekly" ${pulse.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                            <option value="yearly" ${pulse.frequency === 'yearly' ? 'selected' : ''}>Yearly</option>
                        </select>
                    </div>
                </div>

                <div class="pulse-actions">
                    <button class="btn btn-success btn-small accept-pulse" data-pulse-id="${pulse.id}">✅ Accept</button>
                    <button class="btn btn-danger btn-small ignore-pulse" data-pulse-id="${pulse.id}">❌ Ignore</button>
                    <button class="btn btn-secondary btn-small pulse-details" data-pulse-id="${pulse.id}">⚙️ Details</button>
                </div>
            </div>
        `;
    }

    generatePulseMetaItems(pulse) {
        const items = [
            { label: 'Type:', value: pulse.type },
            { label: 'Entity:', value: pulse.entity || pulse.text }
        ];
        
        if (pulse.location) {
            items.push({ label: 'Location:', value: pulse.location });
        }
        
        if (pulse.context) {
            items.push({ label: 'Context:', value: pulse.context });
        }
        
        items.push(
            { label: 'Source:', value: pulse.source, isLink: true },
            { label: 'Quality:', value: pulse.quality, isQuality: true },
            { label: 'Last Updated:', value: pulse.lastUpdated },
            { label: 'Next Update:', value: pulse.nextUpdate }
        );
        
        return items.map(item => `
            <div class="pulse-meta-item">
                <span class="label">${item.label}</span>
                ${item.isLink ? 
                    `<a href="#" class="pulse-source">${item.value}</a>` :
                    item.isQuality ?
                        `<span class="source-quality ${item.value.toLowerCase()}">${item.value.toUpperCase()}</span>` :
                        `<span class="value">${item.value}</span>`
                }
            </div>
        `).join('');
    }

    // Pulse Actions
    handlePulseActions(e) {
        const pulseId = e.target.dataset.pulseId;
        
        if (e.target.classList.contains('accept-pulse')) {
            this.acceptPulse(pulseId, e.target);
        } else if (e.target.classList.contains('ignore-pulse')) {
            this.ignorePulse(pulseId, e.target);
        } else if (e.target.classList.contains('pulse-details')) {
            this.showPulseDetails(pulseId);
        }
    }

    acceptPulse(pulseId, button) {
        const card = button.closest('.pulse-point-card');
        
        // Update visual state
        card.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        card.style.background = 'rgba(16, 185, 129, 0.1)';
        
        // Update button
        button.textContent = '✅ Accepted';
        button.disabled = true;
        button.style.opacity = '0.6';
        
        // Hide ignore button
        const ignoreBtn = card.querySelector('.ignore-pulse');
        if (ignoreBtn) ignoreBtn.style.display = 'none';
        
        // Update pulse state
        const pulse = this.pulsePoints.find(p => p.id === pulseId);
        if (pulse) {
            pulse.status = 'accepted';
        }
        
        this.updateStats();
        this.showNotification(`Pulse point "${pulse?.text}" accepted!`, 'success');
        
        console.log(`✅ Accepted pulse: ${pulseId}`);
    }

    ignorePulse(pulseId, button) {
        const card = button.closest('.pulse-point-card');
        
        // Update visual state
        card.style.opacity = '0.3';
        card.style.filter = 'grayscale(1)';
        
        // Update button
        button.textContent = '❌ Ignored';
        button.disabled = true;
        
        // Hide accept button
        const acceptBtn = card.querySelector('.accept-pulse');
        if (acceptBtn) acceptBtn.style.display = 'none';
        
        // Update pulse state
        const pulse = this.pulsePoints.find(p => p.id === pulseId);
        if (pulse) {
            pulse.status = 'ignored';
        }
        
        this.updateStats();
        this.showNotification(`Pulse point "${pulse?.text}" ignored.`, 'info');
        
        console.log(`❌ Ignored pulse: ${pulseId}`);
    }

    showPulseDetails(pulseId) {
        const pulse = this.pulsePoints.find(p => p.id === pulseId);
        if (!pulse) return;
        
        // For now, just show a notification - later implement modal
        this.showNotification(`Details for "${pulse.text}" - coming soon!`, 'info');
        
        console.log(`ℹ️ Showing details for pulse: ${pulseId}`, pulse);
    }

    acceptAllPulses() {
        const acceptButtons = document.querySelectorAll('.accept-pulse:not([disabled])');
        let count = 0;
        
        acceptButtons.forEach(btn => {
            if (btn.textContent.includes('Accept')) {
                btn.click();
                count++;
            }
        });
        
        if (count > 0) {
            this.showNotification(`Accepted ${count} pulse points!`, 'success');
        }
    }

    ignoreAllPulses() {
        const ignoreButtons = document.querySelectorAll('.ignore-pulse:not([disabled])');
        let count = 0;
        
        ignoreButtons.forEach(btn => {
            if (btn.textContent.includes('Ignore')) {
                btn.click();
                count++;
            }
        });
        
        if (count > 0) {
            this.showNotification(`Ignored ${count} pulse points.`, 'info');
        }
    }

    // UI State Management
    setAnalysisLoadingState() {
        if (this.elements.analysisEmpty) {
            this.elements.analysisEmpty.innerHTML = `
                <div class="analysis-empty-icon">⏳</div>
                <h3>Analysing...</h3>
                <p>Detecting pulse points in your content...</p>
            `;
        }
        
        if (this.elements.analyseBtn) {
            this.elements.analyseBtn.textContent = '⏳ Analysing...';
            this.elements.analyseBtn.disabled = true;
        }
        
        if (this.elements.pulseCount) {
            this.elements.pulseCount.textContent = 'Analysing content...';
        }
    }

    resetAnalyzeButton() {
        if (this.elements.analyseBtn) {
            this.elements.analyseBtn.textContent = '🔍 Analyse';
            this.elements.analyseBtn.disabled = false;
            this.elements.analyseBtn.style.background = '';
        }
    }

    resetAnalysis() {
        this.pulsePoints = [];
        this.clusters = [];
        
        if (this.elements.analysisEmpty) {
            this.elements.analysisEmpty.innerHTML = `
                <div class="analysis-empty-icon">🔍</div>
                <h3>Ready to Analyse</h3>
                <p>Write your article content and click "Analyse" to discover pulse points.</p>
            `;
        }
        
        if (this.elements.pulsePointsList) {
            this.elements.pulsePointsList.innerHTML = `
                <div class="analysis-empty" id="analysis-empty">
                    <div class="analysis-empty-icon">🔍</div>
                    <h3>Ready to Analyse</h3>
                    <p>Write your article content and click "Analyse" to discover pulse points.</p>
                </div>
            `;
        }
        
        if (this.elements.pulseCount) {
            this.elements.pulseCount.textContent = 'Ready to analyse';
        }
        
        if (this.elements.pulsePanelActions) {
            this.elements.pulsePanelActions.style.display = 'none';
        }
        
        this.updateStats();
    }

    updateStats() {
        const acceptedPulses = this.pulsePoints.filter(p => p.status === 'accepted');
        const activeClusters = this.clusters.length;
        
        if (this.elements.activePulseCount) {
            this.elements.activePulseCount.textContent = acceptedPulses.length;
        }
        
        if (this.elements.clusterCount) {
            this.elements.clusterCount.textContent = activeClusters;
        }
    }

    // Utility Methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'info') {
        if (this.notifications) {
            this.notifications.show(message, type);
        } else {
            // Fallback to console
            console.log(`📢 ${type.toUpperCase()}: ${message}`);
        }
    }

    // Debug Methods
    getDebugInfo() {
        return {
            pulsePoints: this.pulsePoints,
            clusters: this.clusters,
            isAnalyzing: this.isAnalyzing,
            currentArticle: this.currentArticle
        };
    }
}

// Initialize the app
const livePulseApp = new LivePulseApp();

// Make it globally available for debugging
window.livePulseApp = livePulseApp;