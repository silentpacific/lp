// LivePulse Notification System
// js/ui/notification-system.js

// Initialize namespace
window.LivePulse = window.LivePulse || {};
window.LivePulse.UI = window.LivePulse.UI || {};
window.LivePulse.UI.Notifications = {};

// ===== NOTIFICATION SYSTEM =====

class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.counter = 0;
        this.maxNotifications = 5;
        this.defaultDuration = 5000;
        this.init();
    }

    /**
     * Initialize the notification system
     */
    init() {
        this.createContainer();
        this.addStyles();
        console.log('🔔 Notification system initialized');
    }

    /**
     * Create the notifications container
     */
    createContainer() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.id = 'livepulse-notifications';
        this.container.className = 'notifications-container';
        document.body.appendChild(this.container);
    }

    /**
     * Add notification styles
     */
    addStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notifications-container {
                position: fixed;
                top: 100px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                pointer-events: none;
                max-width: 400px;
            }

            .notification {
                background: var(--app-glass-bg, rgba(15, 23, 42, 0.95));
                backdrop-filter: blur(30px);
                border: 1px solid var(--app-glass-border, rgba(255, 255, 255, 0.15));
                border-radius: 12px;
                padding: 1rem;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                animation: slideIn 0.3s ease;
                pointer-events: auto;
                position: relative;
                overflow: hidden;
                max-width: 100%;
                word-wrap: break-word;
            }

            .notification.success {
                border-left: 4px solid #10b981;
                background: rgba(16, 185, 129, 0.1);
            }

            .notification.error {
                border-left: 4px solid #ef4444;
                background: rgba(239, 68, 68, 0.1);
            }

            .notification.warning {
                border-left: 4px solid #f59e0b;
                background: rgba(245, 158, 11, 0.1);
            }

            .notification.info {
                border-left: 4px solid #3b82f6;
                background: rgba(59, 130, 246, 0.1);
            }

            .notification-content {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                color: white;
                position: relative;
            }

            .notification-icon {
                font-size: 1.2rem;
                flex-shrink: 0;
                margin-top: 0.1rem;
            }

            .notification-message {
                flex: 1;
                font-size: 0.9rem;
                line-height: 1.4;
                word-break: break-word;
            }

            .notification-close {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.6);
                cursor: pointer;
                font-size: 1.2rem;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s ease;
                flex-shrink: 0;
            }

            .notification-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .notification-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 0 0 12px 12px;
                transition: width 0.1s ease;
            }

            .notification.success .notification-progress {
                background: #10b981;
            }

            .notification.error .notification-progress {
                background: #ef4444;
            }

            .notification.warning .notification-progress {
                background: #f59e0b;
            }

            .notification.info .notification-progress {
                background: #3b82f6;
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes slideOut {
                from {
                    transform: translateX(0);
                    opacity: 1;
                    max-height: 200px;
                    margin-bottom: 0.5rem;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                    max-height: 0;
                    margin-bottom: 0;
                    padding-top: 0;
                    padding-bottom: 0;
                }
            }

            .notification.removing {
                animation: slideOut 0.3s ease forwards;
            }

            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .notifications-container {
                    top: 80px;
                    left: 10px;
                    right: 10px;
                    max-width: none;
                }

                .notification {
                    padding: 0.75rem;
                }

                .notification-message {
                    font-size: 0.85rem;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Show a notification
     */
    show(message, type = 'info', options = {}) {
        const config = window.LivePulse.Config;
        const duration = options.duration !== undefined ? options.duration : 
                        (config?.UI?.NOTIFICATION_DURATION || this.defaultDuration);
        
        const id = ++this.counter;
        
        // Remove oldest notification if we have too many
        if (this.notifications.size >= this.maxNotifications) {
            const oldestId = this.notifications.keys().next().value;
            this.remove(oldestId);
        }

        // Create notification element
        const notification = this.createNotificationElement(id, message, type, options);
        
        // Add to container
        this.container.appendChild(notification);
        
        // Store reference
        this.notifications.set(id, {
            element: notification,
            type,
            message,
            createdAt: Date.now()
        });

        // Auto-remove after duration (if not persistent)
        if (duration > 0) {
            const progressBar = notification.querySelector('.notification-progress');
            if (progressBar) {
                this.animateProgress(progressBar, duration);
            }

            setTimeout(() => {
                this.remove(id);
            }, duration);
        }

        return id;
    }

    /**
     * Create notification DOM element
     */
    createNotificationElement(id, message, type, options) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.dataset.id = id;

        const icon = this.getIcon(type);
        const showClose = options.closable !== false;
        const showProgress = options.progress !== false && options.duration !== 0;

        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${icon}</span>
                <div class="notification-message">${this.formatMessage(message)}</div>
                ${showClose ? '<button class="notification-close" onclick="window.LivePulse.UI.Notifications.manager.remove(' + id + ')">&times;</button>' : ''}
            </div>
            ${showProgress ? '<div class="notification-progress"></div>' : ''}
        `;

        return notification;
    }

    /**
     * Get icon for notification type
     */
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    /**
     * Format message for display
     */
    formatMessage(message) {
        if (typeof message === 'string') {
            return message.replace(/\n/g, '<br>');
        }
        if (typeof message === 'object') {
            return JSON.stringify(message, null, 2);
        }
        return String(message);
    }

    /**
     * Animate progress bar
     */
    animateProgress(progressBar, duration) {
        let width = 100;
        const interval = 50; // Update every 50ms
        const decrement = (100 / duration) * interval;

        const timer = setInterval(() => {
            width -= decrement;
            if (width <= 0) {
                clearInterval(timer);
                width = 0;
            }
            progressBar.style.width = width + '%';
        }, interval);
    }

    /**
     * Remove a notification
     */
    remove(id) {
        const notificationData = this.notifications.get(id);
        if (!notificationData) return;

        const element = notificationData.element;
        element.classList.add('removing');

        // Remove from DOM after animation
        setTimeout(() => {
            if (element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.notifications.delete(id);
        }, 300);
    }

    /**
     * Clear all notifications
     */
    clear() {
        this.notifications.forEach((_, id) => {
            this.remove(id);
        });
    }

    /**
     * Get notification statistics
     */
    getStats() {
        const stats = {
            total: this.notifications.size,
            byType: {}
        };

        this.notifications.forEach(notification => {
            const type = notification.type;
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });

        return stats;
    }
}

// ===== GLOBAL INSTANCE =====
window.LivePulse.UI.Notifications.manager = new NotificationManager();

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Show success notification
 */
window.LivePulse.UI.Notifications.success = function(message, options = {}) {
    return this.manager.show(message, 'success', options);
};

/**
 * Show error notification
 */
window.LivePulse.UI.Notifications.error = function(message, options = {}) {
    return this.manager.show(message, 'error', { duration: 8000, ...options });
};

/**
 * Show warning notification
 */
window.LivePulse.UI.Notifications.warning = function(message, options = {}) {
    return this.manager.show(message, 'warning', options);
};

/**
 * Show info notification
 */
window.LivePulse.UI.Notifications.info = function(message, options = {}) {
    return this.manager.show(message, 'info', options);
};

/**
 * Show persistent notification (doesn't auto-dismiss)
 */
window.LivePulse.UI.Notifications.persistent = function(message, type = 'info', options = {}) {
    return this.manager.show(message, type, { duration: 0, ...options });
};

/**
 * Remove specific notification
 */
window.LivePulse.UI.Notifications.remove = function(id) {
    return this.manager.remove(id);
};

/**
 * Clear all notifications
 */
window.LivePulse.UI.Notifications.clear = function() {
    return this.manager.clear();
};

// ===== GLOBAL CONVENIENCE FUNCTIONS (for backward compatibility) =====

/**
 * Global success notification function
 */
window.showSuccess = function(message, options = {}) {
    return window.LivePulse.UI.Notifications.success(message, options);
};

/**
 * Global error notification function
 */
window.showError = function(message, options = {}) {
    return window.LivePulse.UI.Notifications.error(message, options);
};

/**
 * Global warning notification function
 */
window.showWarning = function(message, options = {}) {
    return window.LivePulse.UI.Notifications.warning(message, options);
};

/**
 * Global info notification function
 */
window.showInfo = function(message, options = {}) {
    return window.LivePulse.UI.Notifications.info(message, options);
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔔 LivePulse Notification System loaded');
});

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LivePulse.UI.Notifications;
}