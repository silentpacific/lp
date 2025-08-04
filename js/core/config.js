// LivePulse Configuration & Constants
// js/core/config.js

// Initialize global namespace
window.LivePulse = window.LivePulse || {};
window.LivePulse.Config = {};

// ===== DATABASE CONFIGURATION =====
window.LivePulse.Config.Database = {
    // These will be injected by Netlify Functions or loaded from a config endpoint
    SUPABASE_URL: null, // Will be set by getEnvConfig()
    SUPABASE_ANON_KEY: null, // Will be set by getEnvConfig()
    
    // Table names
    TABLES: {
        ARTICLES: 'articles',
        PULSES: 'pulses',
        CLUSTERS: 'semantic_clusters',
        PULSE_UPDATES: 'pulse_updates'
    }
};

// ===== UI CONFIGURATION =====
window.LivePulse.Config.UI = {
    // Editor preferences
    SHOW_FOOTNOTES: true,
    SHOW_SUPERSCRIPTS: true,
    
    // Notification settings
    NOTIFICATION_DURATION: 5000, // 5 seconds
    
    // Mobile breakpoint
    MOBILE_BREAKPOINT: 768,
    
    // Animation durations (ms)
    ANIMATION_DURATION: 300,
    MODAL_ANIMATION_DURATION: 300,
    
    // Quick load menu limits
    RECENT_ARTICLES_LIMIT: 5,
    
    // Search debounce delay
    SEARCH_DEBOUNCE: 300
};

// ===== PULSE CONFIGURATION =====
window.LivePulse.Config.Pulse = {
    // Default update frequencies (in minutes)
    DEFAULT_FREQUENCIES: {
        crypto: 60,        // 1 hour
        stock: 240,        // 4 hours  
        weather: 180,      // 3 hours
        date: 1440,        // 24 hours
        population: 43200, // 1 month
        sports: 120,       // 2 hours
        technology: 720,   // 12 hours
        other: 360         // 6 hours
    },
    
    // Minimum and maximum update frequencies
    MIN_UPDATE_FREQUENCY: 15,      // 15 minutes
    MAX_UPDATE_FREQUENCY: 525600,  // 1 year
    
    // Confidence levels
    CONFIDENCE_LEVELS: ['low', 'medium', 'high'],
    
    // Source quality levels
    SOURCE_QUALITY_LEVELS: ['unknown', 'basic', 'standard', 'premium'],
    
    // Pulse types
    PULSE_TYPES: [
        'crypto', 'stock', 'weather', 'date', 'population', 
        'sports', 'news', 'technology', 'other'
    ],
    
    // Category display names
    CATEGORY_NAMES: {
        crypto: 'Crypto',
        stock: 'Finance',
        financial: 'Finance',
        weather: 'Weather',
        date: 'Temporal',
        population: 'Demographics',
        sports: 'Sports',
        news: 'News',
        technology: 'Tech',
        social: 'Social',
        other: 'General'
    },
    
    // Confidence icons
    CONFIDENCE_ICONS: {
        high: '🔥',
        medium: '⚡',
        low: '⚠️',
        error: '❓'
    }
};

// ===== ANALYSIS CONFIGURATION =====
window.LivePulse.Config.Analysis = {
    // Analysis version
    VERSION: '3.1-enhanced-semantic-clusters',
    
    // Gemini API settings
    GEMINI_CONFIG: {
        model: "gemini-1.5-flash",
        generationConfig: {
            temperature: 0.1,
            topP: 0.95,
            topK: 64,
            maxOutputTokens: 1500,
            responseMimeType: "application/json"
        }
    },
    
    // Full article scan settings
    FULL_SCAN_CONFIG: {
        temperature: 0.2,
        maxOutputTokens: 2000,
        responseMimeType: "application/json"
    },
    
    // Mock analysis settings
    MOCK_UPDATE_VARIATION: {
        crypto: 0.1,    // ±10% variation
        stock: 0.06,    // ±6% variation
        weather: 3,     // ±3 degrees
        percentage: 2   // ±2% points
    }
};

// ===== DATA SOURCE CONFIGURATION =====
window.LivePulse.Config.DataSources = {
    // API endpoints
    ENDPOINTS: {
        ANALYZE_PULSE: '/.netlify/functions/analyze-pulse',
        UPDATE_CONTENT: '/.netlify/functions/update-content',
        DATA_SOURCES: '/.netlify/functions/data-sources',
        SCHEDULER: '/.netlify/functions/auto-update-scheduler'
    },
    
    // Data source assignments
    SOURCES: {
        crypto: {
            bitcoin: 'CoinGecko API (Bitcoin)',
            ethereum: 'CoinGecko API (Ethereum)',
            default: 'CoinGecko API'
        },
        weather: 'OpenWeatherMap API',
        stock: {
            tesla: 'Yahoo Finance (TSLA)',
            apple: 'Yahoo Finance (AAPL)',
            default: 'Yahoo Finance API'
        },
        date: 'System Date/Time',
        population: 'Australian Bureau of Statistics',
        technology: 'Tech Industry APIs',
        sports: 'Sports Data API',
        fallback: 'AI Research Fallback'
    },
    
    // Source quality mapping
    QUALITY_MAPPING: {
        'coingecko': 'premium',
        'yahoo': 'premium',
        'openweather': 'premium',
        'government': 'premium',
        'official': 'premium',
        'api': 'standard',
        'ai': 'basic',
        'research': 'basic',
        'unknown': 'unknown'
    }
};

// ===== VALIDATION CONFIGURATION =====
window.LivePulse.Config.Validation = {
    // Validation rules
    RULES: {
        MIN_TITLE_LENGTH: 1,
        MAX_TITLE_LENGTH: 200,
        MIN_CONTENT_LENGTH: 10,
        MAX_CONTENT_LENGTH: 100000,
        MIN_PULSE_VALUE_LENGTH: 1,
        MAX_PULSE_VALUE_LENGTH: 500
    },
    
    // Required fields for pulse points
    REQUIRED_PULSE_FIELDS: [
        'dynamicPart', 'pulseType', 'specificType', 'updateFrequency'
    ]
};

// ===== UTILITY FUNCTIONS FOR CONFIG =====
window.LivePulse.Config.Utils = {
    // Get category display name
    getCategoryName(pulseType) {
        return this.CATEGORY_NAMES[pulseType?.toLowerCase()] || 
               pulseType?.charAt(0).toUpperCase() + pulseType?.slice(1) || 
               'Unknown';
    },
    
    // Get confidence icon
    getConfidenceIcon(confidence) {
        return this.CONFIDENCE_ICONS[confidence] || '❓';
    },
    
    // Get default update frequency for pulse type
    getDefaultFrequency(pulseType) {
        return this.DEFAULT_FREQUENCIES[pulseType?.toLowerCase()] || 
               this.DEFAULT_FREQUENCIES.other;
    },
    
    // Validate configuration on load
    validate() {
        const issues = [];
        
        // Check required database config
        if (!this.SUPABASE_URL || this.SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            issues.push('Supabase URL not configured');
        }
        
        if (!this.SUPABASE_ANON_KEY || this.SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY') {
            issues.push('Supabase anon key not configured');
        }
        
        // Log issues if any
        if (issues.length > 0) {
            console.warn('⚠️ LivePulse Configuration Issues:', issues);
        } else {
            console.log('✅ LivePulse Configuration validated successfully');
        }
        
        return issues.length === 0;
    }
};

// Fix reference paths for utility functions
Object.defineProperty(window.LivePulse.Config.Utils, 'CATEGORY_NAMES', {
    get: function() { return window.LivePulse.Config.Pulse.CATEGORY_NAMES; }
});

Object.defineProperty(window.LivePulse.Config.Utils, 'CONFIDENCE_ICONS', {
    get: function() { return window.LivePulse.Config.Pulse.CONFIDENCE_ICONS; }
});

Object.defineProperty(window.LivePulse.Config.Utils, 'DEFAULT_FREQUENCIES', {
    get: function() { return window.LivePulse.Config.Pulse.DEFAULT_FREQUENCIES; }
});

Object.defineProperty(window.LivePulse.Config.Utils, 'SUPABASE_URL', {
    get: function() { return window.LivePulse.Config.Database.SUPABASE_URL; }
});

Object.defineProperty(window.LivePulse.Config.Utils, 'SUPABASE_ANON_KEY', {
    get: function() { return window.LivePulse.Config.Database.SUPABASE_ANON_KEY; }
});

// ===== INITIALIZATION =====

// Function to load environment config from Netlify Function
window.LivePulse.Config.loadEnvConfig = async function() {
    try {
        const response = await fetch('/.netlify/functions/env-config');
        const envData = await response.json();
        
        if (envData.success) {
            // Set database config
            this.Database.SUPABASE_URL = envData.SUPABASE_URL;
            this.Database.SUPABASE_ANON_KEY = envData.SUPABASE_ANON_KEY;
            
            console.log('✅ Environment configuration loaded');
            return true;
        } else {
            throw new Error('Failed to load environment config');
        }
    } catch (error) {
        console.warn('⚠️ Could not load environment config:', error.message);
        console.warn('⚠️ Database features will be disabled');
        return false;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 LivePulse Configuration loaded');
    
    // Load environment config asynchronously
    window.LivePulse.Config.loadEnvConfig().then(success => {
        if (success) {
            // Validate configuration after env vars are loaded
            window.LivePulse.Config.Utils.validate();
        }
    });
});

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LivePulse.Config;
}