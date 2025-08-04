// js/core/app.js - Main App Initialization & Coordination
// Entry point for the LivePulse application

import { CONFIG } from './config.js';
import { debounce, formatFrequency } from './utils.js';
import { NotificationSystem } from '../ui/notification-system.js';
import { PulseAnalyzer } from '../analysis/pulse-analyzer.js';
import { PulseCreator } from '../pulse-management/pulse-creator.js';
import { PreviewManager } from '../preview/preview-manager.js';
import { StatsDisplay } from '../ui/stats-display.js';
import { MobileMenu } from '../ui/mobile-menu.js';
import { EnhancedControls } from '../enhanced-controls/filter-system.js';
import { ArticleManagement } from '../storage/article-management.js';

/**
 * Main LivePulse Application Class
 * Coordinates all subsystems and manages application state
 */
class LivePulseApp {
    constructor() {
        this.isEditorMode = false;
        this.currentAnalysis = null;
        this.pulses = [];
        this.semanticClusters = [];
        this.pulseCounter = 1;
        this.clusterCounter = 1;
        
        // Subsystem instances
        this.notifications = null;
        this.analyzer = null;
        this.pulseCreator = null;
        this.previewManager = null;
        this.statsDisplay = null;
        this.mobileMenu = null;
        this.enhancedControls = null;
        this.articleManagement = null;
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log('🫀 LivePulse App loading...');
        
        try {
            // Detect application mode
            this.detectMode();
            
            // Initialize core subsystems
            await this.initializeSubsystems();
            
            // Setup event listeners and UI
            this.setupEventListeners();
            
            // Initialize mode-specific features
            if (this.isEditorMode) {
                await this.initializeEditorMode();
                console.log('✅ Editor mode fully loaded!');
            } else {
                this.initializeLandingPage();
                console.log('✅ Landing page mode loaded!');
            }
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('Application failed to initialize: ' + error.message);
        }
    }

    /**
     * Detect if we're in editor mode or landing page mode
     */
    detectMode() {
        this.isEditorMode = document.body.classList.contains('app-body') || 
                           document.querySelector('.app-header') !== null;
        
        console.log(`Mode detected: ${this.isEditorMode ? 'Editor' : 'Landing Page'}`);
    }

    /**
     * Initialize all subsystems
     */
    async initializeSubsystems() {
        console.log('🔧 Initializing subsystems...');
        
        // Core UI systems (always needed)
        this.notifications = new NotificationSystem();
        this.mobileMenu = new MobileMenu();
        
        // Editor-specific systems
        if (this.isEditorMode) {
            this.analyzer = new PulseAnalyzer();
            this.pulseCreator = new PulseCreator();
            this.previewManager = new PreviewManager();
            this.statsDisplay = new StatsDisplay();
            this.enhancedControls = new EnhancedControls();
            this.articleManagement = new ArticleManagement();
            
            // Initialize with app reference
            this.analyzer.init(this);
            this.pulseCreator.init(this);
            this.previewManager.init(this);
            this.statsDisplay.init(this);
            this.enhancedControls.init(this);
            this.articleManagement.init(this);
        }
        
        console.log('✅ Subsystems initialized');
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        console.log('🔧 Setting up global event listeners...');
        
        if (this.isEditorMode) {
            // Article content changes
            const articleContent = document.getElementById('article-content');
            if (articleContent) {
                articleContent.addEventListener('input', debounce(() => {
                    this.handleArticleContentChange();
                }, CONFIG.DEBOUNCE_DELAY));
            }
            
            // Selected text changes
            const selectedText = document.getElementById('selected-text');
            if (selectedText) {
                selectedText.addEventListener('input', () => {
                    this.handleSelectedTextChange();
                });
            }
            
            // Main action buttons
            this.setupActionButtons();
        } else {
            // Landing page specific listeners
            this.setupLandingPageListeners();
        }
        
        console.log('✅ Event listeners set up');
    }

    /**
     * Setup main action buttons for editor mode
     */
    setupActionButtons() {
        const buttons = [
            { id: 'analyze-btn', handler: () => this.handleAnalyzeClick() },
            { id: 'create-pulse-btn', handler: () => this.handleCreatePulseClick() },
            { id: 'scan-full-article', handler: () => this.handleScanArticleClick() }
        ];
        
        buttons.forEach(({ id, handler }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', handler);
            }
        });
    }

    /**
     * Setup landing page specific listeners
     */
    setupLandingPageListeners() {
        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        
        // Header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.header');
            if (header) {
                header.style.background = window.scrollY > 100 
                    ? 'rgba(255, 255, 255, 0.98)' 
                    : 'rgba(255, 255, 255, 0.95)';
            }
        });
    }

    /**
     * Initialize editor mode specific features
     */
    async initializeEditorMode() {
        console.log('🎨 Initializing editor mode...');
        
        // Update initial displays
        this.updatePreview();
        this.updateStatsDisplay();
        
        // Initialize enhanced controls
        this.enhancedControls.initialize();
        
        // Setup editor preferences
        this.setupEditorPreferences();
        
        console.log('✅ Editor mode initialized');
    }

    /**
     * Initialize landing page mode
     */
    initializeLandingPage() {
        console.log('🏠 Initializing landing page mode...');
        // Landing page is mostly static, minimal initialization needed
    }

    /**
     * Setup editor preferences (footnotes, superscripts, etc.)
     */
    setupEditorPreferences() {
        const toggleFootnotesBtn = document.getElementById('toggle-footnotes');
        const toggleSuperscriptsBtn = document.getElementById('toggle-superscripts');
        const exportHtmlBtn = document.getElementById('export-html');

        if (toggleFootnotesBtn) {
            toggleFootnotesBtn.addEventListener('click', () => {
                this.previewManager.toggleFootnotes();
            });
        }

        if (toggleSuperscriptsBtn) {
            toggleSuperscriptsBtn.addEventListener('click', () => {
                this.previewManager.toggleSuperscripts();
            });
        }

        if (exportHtmlBtn) {
            exportHtmlBtn.addEventListener('click', () => {
                this.previewManager.exportHtml();
            });
        }
    }

    /**
     * Event Handlers
     */
    
    async handleAnalyzeClick() {
        try {
            const result = await this.analyzer.analyzeSinglePulse();
            if (result) {
                this.currentAnalysis = result;
                this.showCreatePulseButton();
            }
        } catch (error) {
            this.showError('Analysis failed: ' + error.message);
        }
    }

    async handleCreatePulseClick() {
        if (!this.currentAnalysis) return;
        
        try {
            const result = await this.pulseCreator.createFromAnalysis(this.currentAnalysis);
            if (result) {
                this.addPulses(result.pulses);
                if (result.cluster) {
                    this.addCluster(result.cluster);
                }
                this.clearCurrentAnalysis();
                this.updateAllDisplays();
            }
        } catch (error) {
            this.showError('Pulse creation failed: ' + error.message);
        }
    }

    async handleScanArticleClick() {
        try {
            const results = await this.analyzer.scanFullArticle();
            if (results) {
                // Display scan results
                this.displayScanResults(results);
            }
        } catch (error) {
            this.showError('Article scan failed: ' + error.message);
        }
    }

    handleArticleContentChange() {
        this.updatePreview();
        this.clearScanResults();
        this.statsDisplay.update();
    }

    handleSelectedTextChange() {
        if (this.currentAnalysis) {
            this.clearCurrentAnalysis();
        }
    }

    /**
     * State Management Methods
     */
    
    addPulses(newPulses) {
        if (Array.isArray(newPulses)) {
            this.pulses.push(...newPulses);
        } else {
            this.pulses.push(newPulses);
        }
    }

    addCluster(cluster) {
        this.semanticClusters.push(cluster);
    }

    removePulse(pulseId) {
        this.pulses = this.pulses.filter(p => p.id !== pulseId);
        this.updateAllDisplays();
    }

    removeCluster(clusterId) {
        this.semanticClusters = this.semanticClusters.filter(c => c.id !== clusterId);
        this.pulses = this.pulses.filter(p => p.clusterId !== clusterId);
        this.updateAllDisplays();
    }

    clearCurrentAnalysis() {
        this.currentAnalysis = null;
        this.hideAnalysisResults();
        this.hideCreatePulseButton();
        this.clearSelectedText();
    }

    clearScanResults() {
        const scanResults = document.getElementById('full-scan-results');
        if (scanResults) {
            scanResults.classList.add('hidden');
        }
        this.resetScanButton();
    }

    /**
     * UI Update Methods
     */
    
    updateAllDisplays() {
        this.updatePreview();
        this.updatePulseList();
        this.updateStatsDisplay();
    }

    updatePreview() {
        if (this.previewManager) {
            this.previewManager.update(this.pulses, this.semanticClusters);
        }
    }

    updatePulseList() {
        if (this.pulseCreator) {
            this.pulseCreator.updatePulseList(this.pulses, this.semanticClusters);
        }
    }

    updateStatsDisplay() {
        if (this.statsDisplay) {
            this.statsDisplay.update(this.pulses, this.semanticClusters);
        }
    }

    showCreatePulseButton() {
        const button = document.getElementById('create-pulse-btn');
        if (button) {
            button.classList.remove('hidden');
        }
    }

    hideCreatePulseButton() {
        const button = document.getElementById('create-pulse-btn');
        if (button) {
            button.classList.add('hidden');
        }
    }

    hideAnalysisResults() {
        const results = document.getElementById('analysis-result');
        if (results) {
            results.classList.add('hidden');
        }
    }

    clearSelectedText() {
        const selectedText = document.getElementById('selected-text');
        if (selectedText) {
            selectedText.value = '';
        }
    }

    resetScanButton() {
        const scanBtn = document.getElementById('scan-full-article');
        if (scanBtn) {
            scanBtn.textContent = '🔍 Scan Full Article for Pulse Points';
            scanBtn.classList.remove('btn-disabled');
            scanBtn.disabled = false;
        }
    }

    displayScanResults(results) {
        // This will be handled by the analyzer module
        if (this.analyzer) {
            this.analyzer.displayScanResults(results);
        }
    }

    /**
     * Notification wrapper methods
     */
    
    showSuccess(message) {
        if (this.notifications) {
            this.notifications.showSuccess(message);
        }
    }

    showError(message) {
        if (this.notifications) {
            this.notifications.showError(message);
        }
    }

    showInfo(message) {
        if (this.notifications) {
            this.notifications.showInfo(message);
        }
    }

    /**
     * Public API for external access
     */
    
    getPulses() {
        return this.pulses;
    }

    getClusters() {
        return this.semanticClusters;
    }

    getCurrentAnalysis() {
        return this.currentAnalysis;
    }

    isInEditorMode() {
        return this.isEditorMode;
    }

    /**
     * Debug information
     */
    getDebugInfo() {
        return {
            editorMode: this.isEditorMode,
            currentAnalysis: this.currentAnalysis,
            pulses: this.pulses?.length || 0,
            clusters: this.semanticClusters?.length || 0,
            subsystems: {
                notifications: !!this.notifications,
                analyzer: !!this.analyzer,
                pulseCreator: !!this.pulseCreator,
                previewManager: !!this.previewManager,
                statsDisplay: !!this.statsDisplay
            }
        };
    }
}

// Initialize the application when DOM is ready
let app;

document.addEventListener('DOMContentLoaded', async function() {
    app = new LivePulseApp();
    await app.init();
    
    // Make app globally available for debugging
    window.livePulseApp = app;
    window.debugLivePulse = () => app.getDebugInfo();
});

// Export for module usage
export { LivePulseApp };