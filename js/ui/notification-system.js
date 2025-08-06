/**
 * Simple Notification System for LivePulse
 * Shows toast-style notifications with different types
 */

class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = new Map();
        this.init();
    }

    init() {
        // Create notifications container
        this.container = document.createElement('div');
        this.container.id = 'notifications-container';
        this.container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            pointer-events: none;
        `;
        
        document.body.appendChild(this.container);
        console.log('📢 Notification System initialized');
    }

    show(message, type = 'info', duration = 4000) {
        const notification = this.createNotification(message, type);
        
        // Add to container
        this.container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }
        
        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            success: { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', icon: '✅' },
            error: { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', icon: '❌' },
            warning: { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', icon: '⚠️' },
            info: { bg: 'rgba(14, 165, 233, 0.1)', border: '#0ea5e9', icon: 'ℹ️' }
        };
        
        const color = colors[type] || colors.info;
        
        notification.style.cssText = `
            background: ${color.bg};
            backdrop-filter: blur(30px);
            border: 1px solid ${color.border};
            border-radius: 12px;
            padding: 1rem;
            max-width: 400px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            color: white;
            font-size: 0.9rem;
            font-weight: 500;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: auto;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 1.2rem; flex-shrink: 0;">${color.icon}</span>
            <span style="flex: 1; line-height: 1.4;">${message}</span>
            <button style="
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                font-size: 1.2rem;
                padding: 0;
                margin-left: 0.5rem;
                flex-shrink: 0;
                transition: color 0.2s ease;
            " onclick="this.parentElement.remove()">×</button>
        `;
        
        // Add hover effect
        notification.addEventListener('mouseenter', () => {
            notification.style.transform = 'translateX(-5px)';
        });
        
        notification.addEventListener('mouseleave', () => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Click to dismiss
        notification.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                this.remove(notification);
            }
        });
        
        return notification;
    }

    remove(notification) {
        if (!notification || !notification.parentNode) return;
        
        // Animate out
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        
        // Remove from DOM
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    // Convenience methods
    success(message, duration) {
        return this.show(message, 'success', duration);
    }

    error(message, duration) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration) {
        return this.show(message, 'info', duration);
    }
}

// Auto-initialize if not already done
if (typeof window !== 'undefined' && !window.notificationSystem) {
    window.notificationSystem = new NotificationSystem();
}