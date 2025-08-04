// LivePulse Utility Functions
// js/core/utils.js

// Initialize namespace
window.LivePulse = window.LivePulse || {};
window.LivePulse.Utils = {};

// ===== GENERAL UTILITIES =====

/**
 * Debounce function to limit how often a function can be called
 */
window.LivePulse.Utils.debounce = function(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
};

/**
 * Throttle function to limit function calls to once per specified time
 */
window.LivePulse.Utils.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Generate unique ID
 */
window.LivePulse.Utils.generateId = function(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Deep clone object
 */
window.LivePulse.Utils.deepClone = function(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = this.deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
};

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 */
window.LivePulse.Utils.isEmpty = function(value) {
    if (value == null) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/**
 * Sanitize HTML string
 */
window.LivePulse.Utils.sanitizeHtml = function(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
};

/**
 * Format bytes to human readable format
 */
window.LivePulse.Utils.formatBytes = function(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// ===== DATE & TIME UTILITIES =====

/**
 * Format date to locale string with options
 */
window.LivePulse.Utils.formatDate = function(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    return new Date(date).toLocaleString(undefined, finalOptions);
};

/**
 * Get relative time string (e.g., "2 hours ago", "in 3 days")
 */
window.LivePulse.Utils.getRelativeTime = function(date) {
    const now = new Date();
    const targetDate = new Date(date);
    const diffInSeconds = Math.floor((targetDate - now) / 1000);
    
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'week', seconds: 604800 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 }
    ];
    
    const absSeconds = Math.abs(diffInSeconds);
    
    for (const interval of intervals) {
        const count = Math.floor(absSeconds / interval.seconds);
        if (count >= 1) {
            const suffix = diffInSeconds > 0 ? 'in' : 'ago';
            const prefix = diffInSeconds > 0 ? '' : '';
            const plural = count > 1 ? 's' : '';
            
            if (diffInSeconds > 0) {
                return `in ${count} ${interval.label}${plural}`;
            } else {
                return `${count} ${interval.label}${plural} ago`;
            }
        }
    }
    
    return 'just now';
};

/**
 * Add time to date
 */
window.LivePulse.Utils.addTime = function(date, amount, unit) {
    const newDate = new Date(date);
    
    switch (unit) {
        case 'minutes':
            newDate.setMinutes(newDate.getMinutes() + amount);
            break;
        case 'hours':
            newDate.setHours(newDate.getHours() + amount);
            break;
        case 'days':
            newDate.setDate(newDate.getDate() + amount);
            break;
        case 'weeks':
            newDate.setDate(newDate.getDate() + (amount * 7));
            break;
        case 'months':
            newDate.setMonth(newDate.getMonth() + amount);
            break;
        case 'years':
            newDate.setFullYear(newDate.getFullYear() + amount);
            break;
    }
    
    return newDate;
};

// ===== STRING UTILITIES =====

/**
 * Capitalize first letter
 */
window.LivePulse.Utils.capitalize = function(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Convert string to title case
 */
window.LivePulse.Utils.toTitleCase = function(str) {
    return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    );
};

/**
 * Truncate string with ellipsis
 */
window.LivePulse.Utils.truncate = function(str, length, suffix = '...') {
    if (!str || str.length <= length) return str;
    return str.substring(0, length).trim() + suffix;
};

/**
 * Extract article title from content
 */
window.LivePulse.Utils.extractArticleTitle = function(content) {
    if (!content) return 'Untitled Article';
    
    const lines = content.split('\n');
    const firstLine = lines[0].trim();
    
    // Return first line if it's a reasonable title length
    if (firstLine.length > 0 && firstLine.length < 100) {
        return firstLine;
    }
    
    // Fallback: try to find a title-like line
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length > 5 && trimmed.length < 100 && !trimmed.includes('.')) {
            return trimmed;
        }
    }
    
    return 'Untitled Article';
};

/**
 * Clean text for processing
 */
window.LivePulse.Utils.cleanText = function(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ').replace(/[^\w\s.,!?;:()-]/g, '');
};

/**
 * Get word count
 */
window.LivePulse.Utils.getWordCount = function(text) {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

// ===== NUMBER & FORMATTING UTILITIES =====

/**
 * Format update frequency to human readable
 */
window.LivePulse.Utils.formatFrequency = function(minutes) {
    if (!minutes || minutes <= 0) return 'Unknown';
    
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    if (minutes < 1440) {
        const hours = Math.round(minutes / 60);
        return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    if (minutes < 10080) {
        const days = Math.round(minutes / 1440);
        return `${days} day${days !== 1 ? 's' : ''}`;
    }
    if (minutes < 43200) {
        const weeks = Math.round(minutes / 10080);
        return `${weeks} week${weeks !== 1 ? 's' : ''}`;
    }
    
    const months = Math.round(minutes / 43200);
    return `${months} month${months !== 1 ? 's' : ''}`;
};

/**
 * Format number with commas
 */
window.LivePulse.Utils.formatNumber = function(num) {
    if (typeof num !== 'number') return num;
    return num.toLocaleString();
};

/**
 * Parse number from string with currency symbols
 */
window.LivePulse.Utils.parseNumber = function(str) {
    if (typeof str === 'number') return str;
    if (!str) return null;
    
    // Remove currency symbols and commas
    const cleaned = str.replace(/[$€£¥,]/g, '');
    const parsed = parseFloat(cleaned);
    
    return isNaN(parsed) ? null : parsed;
};

/**
 * Generate random number within range
 */
window.LivePulse.Utils.randomBetween = function(min, max, decimals = 0) {
    const random = Math.random() * (max - min) + min;
    return decimals > 0 ? parseFloat(random.toFixed(decimals)) : Math.floor(random);
};

// ===== DOM UTILITIES =====

/**
 * Get element by ID with error handling
 */
window.LivePulse.Utils.getElement = function(id) {
    const element = document.getElementById(id);
    if (!element) {
        console.warn(`Element with ID '${id}' not found`);
    }
    return element;
};

/**
 * Create element with attributes and content
 */
window.LivePulse.Utils.createElement = function(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Set content
    if (content) {
        if (typeof content === 'string') {
            element.textContent = content;
        } else if (content instanceof HTMLElement) {
            element.appendChild(content);
        }
    }
    
    return element;
};

/**
 * Add CSS class if not present
 */
window.LivePulse.Utils.addClass = function(element, className) {
    if (element && !element.classList.contains(className)) {
        element.classList.add(className);
    }
};

/**
 * Remove CSS class if present
 */
window.LivePulse.Utils.removeClass = function(element, className) {
    if (element && element.classList.contains(className)) {
        element.classList.remove(className);
    }
};

/**
 * Toggle CSS class
 */
window.LivePulse.Utils.toggleClass = function(element, className) {
    if (element) {
        element.classList.toggle(className);
    }
};

/**
 * Scroll element into view smoothly
 */
window.LivePulse.Utils.scrollIntoView = function(element, options = {}) {
    if (!element) return;
    
    const defaultOptions = {
        behavior: 'smooth',
        block: 'start',
        inline: 'nearest'
    };
    
    element.scrollIntoView({ ...defaultOptions, ...options });
};

// ===== LOCAL STORAGE UTILITIES =====

/**
 * Set item in localStorage with error handling
 */
window.LivePulse.Utils.setStorage = function(key, value) {
    try {
        const serialized = JSON.stringify(value);
        localStorage.setItem(key, serialized);
        return true;
    } catch (error) {
        console.warn('Failed to save to localStorage:', error);
        return false;
    }
};

/**
 * Get item from localStorage with error handling
 */
window.LivePulse.Utils.getStorage = function(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.warn('Failed to read from localStorage:', error);
        return defaultValue;
    }
};

/**
 * Remove item from localStorage
 */
window.LivePulse.Utils.removeStorage = function(key) {
    try {
        localStorage.removeItem(key);
        return true;
    } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
        return false;
    }
};

/**
 * Clear all localStorage items with prefix
 */
window.LivePulse.Utils.clearStorage = function(prefix = 'livepulse_') {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(prefix)) {
                localStorage.removeItem(key);
            }
        });
        return true;
    } catch (error) {
        console.warn('Failed to clear localStorage:', error);
        return false;
    }
};

// ===== VALIDATION UTILITIES =====

/**
 * Validate email format
 */
window.LivePulse.Utils.isValidEmail = function(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate URL format
 */
window.LivePulse.Utils.isValidUrl = function(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

/**
 * Validate JSON string
 */
window.LivePulse.Utils.isValidJson = function(str) {
    try {
        JSON.parse(str);
        return true;
    } catch {
        return false;
    }
};

/**
 * Validate pulse point data
 */
window.LivePulse.Utils.validatePulsePoint = function(pulse) {
    const config = window.LivePulse.Config;
    const required = config?.Validation?.REQUIRED_PULSE_FIELDS || [];
    
    const errors = [];
    
    // Check required fields
    required.forEach(field => {
        if (!pulse[field] || pulse[field].toString().trim() === '') {
            errors.push(`Missing required field: ${field}`);
        }
    });
    
    // Validate update frequency
    if (pulse.updateFrequency) {
        const freq = parseInt(pulse.updateFrequency);
        const min = config?.Pulse?.MIN_UPDATE_FREQUENCY || 15;
        const max = config?.Pulse?.MAX_UPDATE_FREQUENCY || 525600;
        
        if (freq < min || freq > max) {
            errors.push(`Update frequency must be between ${min} and ${max} minutes`);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
};

// ===== ARRAY UTILITIES =====

/**
 * Remove duplicates from array
 */
window.LivePulse.Utils.uniqueArray = function(arr, key = null) {
    if (!Array.isArray(arr)) return [];
    
    if (key) {
        // Remove duplicates based on object property
        const seen = new Set();
        return arr.filter(item => {
            const value = item[key];
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    } else {
        // Remove primitive duplicates
        return [...new Set(arr)];
    }
};

/**
 * Group array by property
 */
window.LivePulse.Utils.groupBy = function(arr, key) {
    if (!Array.isArray(arr)) return {};
    
    return arr.reduce((groups, item) => {
        const value = typeof key === 'function' ? key(item) : item[key];
        (groups[value] = groups[value] || []).push(item);
        return groups;
    }, {});
};

/**
 * Sort array by property with direction
 */
window.LivePulse.Utils.sortBy = function(arr, key, direction = 'asc') {
    if (!Array.isArray(arr)) return [];
    
    return [...arr].sort((a, b) => {
        let aVal = typeof key === 'function' ? key(a) : a[key];
        let bVal = typeof key === 'function' ? key(b) : b[key];
        
        // Handle dates
        if (aVal instanceof Date) aVal = aVal.getTime();
        if (bVal instanceof Date) bVal = bVal.getTime();
        
        // Handle strings
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        let result = 0;
        if (aVal < bVal) result = -1;
        if (aVal > bVal) result = 1;
        
        return direction === 'desc' ? -result : result;
    });
};

/**
 * Chunk array into smaller arrays
 */
window.LivePulse.Utils.chunk = function(arr, size) {
    if (!Array.isArray(arr) || size <= 0) return [];
    
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

// ===== ERROR HANDLING UTILITIES =====

/**
 * Safe function execution with error handling
 */
window.LivePulse.Utils.safeExecute = function(fn, defaultValue = null, context = null) {
    try {
        return context ? fn.call(context) : fn();
    } catch (error) {
        console.error('Safe execution failed:', error);
        return defaultValue;
    }
};

/**
 * Retry function with exponential backoff
 */
window.LivePulse.Utils.retry = async function(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            
            if (i === maxRetries) break;
            
            // Exponential backoff
            const waitTime = delay * Math.pow(2, i);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    throw lastError;
};

/**
 * Create error object with context
 */
window.LivePulse.Utils.createError = function(message, code, context = {}) {
    const error = new Error(message);
    error.code = code;
    error.context = context;
    error.timestamp = new Date().toISOString();
    return error;
};

// ===== PERFORMANCE UTILITIES =====

/**
 * Measure function execution time
 */
window.LivePulse.Utils.measureTime = function(fn, label = 'Function') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`${label} executed in ${(end - start).toFixed(2)}ms`);
    return result;
};

/**
 * Measure async function execution time
 */
window.LivePulse.Utils.measureTimeAsync = async function(fn, label = 'Async Function') {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    
    console.log(`${label} executed in ${(end - start).toFixed(2)}ms`);
    return result;
};

// ===== BROWSER DETECTION UTILITIES =====

/**
 * Detect if user is on mobile device
 */
window.LivePulse.Utils.isMobile = function() {
    return window.innerWidth <= (window.LivePulse.Config?.UI?.MOBILE_BREAKPOINT || 768);
};

/**
 * Detect if browser supports feature
 */
window.LivePulse.Utils.supports = {
    localStorage: () => {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    },
    
    clipboard: () => {
        return navigator.clipboard && navigator.clipboard.writeText;
    },
    
    fetch: () => {
        return typeof fetch !== 'undefined';
    },
    
    webWorkers: () => {
        return typeof Worker !== 'undefined';
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🛠️ LivePulse Utils loaded');
    
    // Set up global error handler for debugging
    if (window.LivePulse.Config?.Development?.DEBUG_MODE) {
        window.addEventListener('error', function(event) {
            console.error('Global error caught by LivePulse Utils:', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            });
        });
    }
});

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LivePulse.Utils;
}