// LivePulse Modal Manager
// js/ui/modal-manager.js

// Initialize namespace
window.LivePulse = window.LivePulse || {};
window.LivePulse.UI = window.LivePulse.UI || {};
window.LivePulse.UI.Modals = {};

// ===== MODAL MANAGER CLASS =====

class ModalManager {
    constructor() {
        this.activeModals = new Map();
        this.modalCounter = 0;
        this.init();
    }

    /**
     * Initialize the modal system
     */
    init() {
        this.addStyles();
        this.setupEventListeners();
        console.log('🎭 Modal Manager initialized');
    }

    /**
     * Add modal styles
     */
    addStyles() {
        if (document.getElementById('modal-styles')) return;

        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
                animation: fadeIn 0.3s ease;
                padding: 1rem;
            }

            .modal {
                background: var(--app-glass-bg, rgba(15, 23, 42, 0.95));
                backdrop-filter: blur(30px);
                border: 1px solid var(--app-glass-border, rgba(255, 255, 255, 0.15));
                border-radius: 16px;
                width: 90%;
                max-width: 500px;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                animation: slideUp 0.3s ease;
                display: flex;
                flex-direction: column;
            }

            .modal.large {
                max-width: 800px;
            }

            .modal.small {
                max-width: 400px;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem;
                border-bottom: 1px solid var(--app-glass-border, rgba(255, 255, 255, 0.15));
                flex: 0 0 auto;
            }

            .modal-title {
                color: white;
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
            }

            .modal-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 8px;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
            }

            .modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .modal-content {
                padding: 1.5rem;
                overflow-y: auto;
                flex: 1 1 auto;
                color: white;
            }

            .modal-footer {
                display: flex;
                gap: 1rem;
                padding: 1.5rem;
                border-top: 1px solid var(--app-glass-border, rgba(255, 255, 255, 0.15));
                justify-content: flex-end;
                flex: 0 0 auto;
            }

            .modal-footer.center {
                justify-content: center;
            }

            .modal-footer.space-between {
                justify-content: space-between;
            }

            /* Form styles within modals */
            .modal .form-group {
                margin-bottom: 1.5rem;
            }

            .modal .form-label {
                display: block;
                color: rgba(255, 255, 255, 0.9);
                font-weight: 500;
                margin-bottom: 0.5rem;
                font-size: 0.9rem;
            }

            .modal .form-input,
            .modal .form-textarea,
            .modal .form-select {
                width: 100%;
                padding: 0.75rem;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--app-glass-border, rgba(255, 255, 255, 0.15));
                border-radius: 8px;
                color: white;
                font-size: 0.9rem;
                transition: all 0.3s ease;
                box-sizing: border-box;
            }

            .modal .form-input:focus,
            .modal .form-textarea:focus,
            .modal .form-select:focus {
                outline: none;
                border-color: #ff6b6b;
                box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
                background: rgba(255, 255, 255, 0.08);
            }

            .modal .form-input::placeholder,
            .modal .form-textarea::placeholder {
                color: rgba(255, 255, 255, 0.5);
            }

            .modal .form-textarea {
                min-height: 80px;
                resize: vertical;
                font-family: inherit;
                line-height: 1.4;
            }

            .modal .form-select {
                cursor: pointer;
            }

            .modal .form-select option {
                background: #1e293b;
                color: white;
            }

            /* Button styles within modals */
            .modal .btn {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.3s ease;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                text-decoration: none;
                justify-content: center;
                min-width: 100px;
            }

            .modal .btn-primary {
                background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                color: white;
            }

            .modal .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
            }

            .modal .btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid var(--app-glass-border, rgba(255, 255, 255, 0.15));
            }

            .modal .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-2px);
            }

            .modal .btn-success {
                background: #10b981;
                color: white;
            }

            .modal .btn-success:hover {
                background: #059669;
                transform: translateY(-2px);
            }

            .modal .btn-danger {
                background: #ef4444;
                color: white;
            }

            .modal .btn-danger:hover {
                background: #dc2626;
                transform: translateY(-2px);
            }

            .modal .btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none !important;
            }

            /* Animations */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from { 
                    transform: translateY(50px); 
                    opacity: 0; 
                }
                to { 
                    transform: translateY(0); 
                    opacity: 1; 
                }
            }

            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }

            @keyframes slideDown {
                from { 
                    transform: translateY(0); 
                    opacity: 1; 
                }
                to { 
                    transform: translateY(50px); 
                    opacity: 0; 
                }
            }

            .modal-overlay.closing {
                animation: fadeOut 0.3s ease forwards;
            }

            .modal.closing {
                animation: slideDown 0.3s ease forwards;
            }

            /* Responsive design */
            @media (max-width: 768px) {
                .modal {
                    width: 95%;
                    max-height: 95vh;
                    margin: 0;
                }

                .modal-header,
                .modal-content,
                .modal-footer {
                    padding: 1rem;
                }

                .modal-footer {
                    flex-direction: column;
                }

                .modal .btn {
                    width: 100%;
                    justify-content: center;
                }
            }

            /* Special modal types */
            .modal.confirmation .modal-content {
                text-align: center;
                padding: 2rem;
            }

            .modal.confirmation .confirmation-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
            }

            .modal.confirmation .confirmation-message {
                font-size: 1.1rem;
                margin-bottom: 1.5rem;
                line-height: 1.5;
            }

            /* Article details modal specific styles */
            .article-details {
                color: rgba(255, 255, 255, 0.9);
            }

            .detail-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.75rem;
                gap: 1rem;
            }

            .detail-row strong {
                color: white;
                min-width: 100px;
                flex-shrink: 0;
            }

            .detail-row span {
                flex: 1;
                text-align: right;
            }

            .tags-display {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
                justify-content: flex-end;
            }

            .tag {
                background: rgba(59, 130, 246, 0.3);
                color: #93c5fd;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                border: 1px solid rgba(59, 130, 246, 0.5);
            }

            .content-preview {
                margin-top: 1rem;
            }

            .preview-text {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--app-glass-border, rgba(255, 255, 255, 0.15));
                border-radius: 8px;
                padding: 1rem;
                max-height: 200px;
                overflow-y: auto;
                color: rgba(255, 255, 255, 0.8);
                font-size: 0.9rem;
                line-height: 1.5;
                white-space: pre-wrap;
                font-family: 'Georgia', serif;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Close modals on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeTopmost();
            }
        });

        // Prevent body scroll when modal is open
        this.updateBodyScrollLock();
    }

    /**
     * Create a basic modal
     */
    create(options = {}) {
        const id = ++this.modalCounter;
        const {
            title = 'Modal',
            content = '',
            size = 'default', // 'small', 'default', 'large'
            closable = true,
            className = '',
            onClose = null
        } = options;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.dataset.modalId = id;

        const modal = document.createElement('div');
        modal.className = `modal ${size} ${className}`;

        // Header
        const header = document.createElement('div');
        header.className = 'modal-header';
        header.innerHTML = `
            <h3 class="modal-title">${title}</h3>
            ${closable ? `<button class="modal-close" onclick="window.LivePulse.UI.Modals.manager.close(${id})">&times;</button>` : ''}
        `;

        // Content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'modal-content';
        
        if (typeof content === 'string') {
            contentDiv.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            contentDiv.appendChild(content);
        }

        modal.appendChild(header);
        modal.appendChild(contentDiv);
        overlay.appendChild(modal);

        // Store modal reference
        this.activeModals.set(id, {
            overlay,
            modal,
            contentDiv,
            onClose,
            options
        });

        // Add to DOM
        document.body.appendChild(overlay);
        this.updateBodyScrollLock();

        // Focus trap
        this.setupFocusTrap(modal);

        return {
            id,
            overlay,
            modal,
            contentDiv,
            setContent: (newContent) => this.setContent(id, newContent),
            addFooter: (footerContent, alignment = 'flex-end') => this.addFooter(id, footerContent, alignment),
            close: () => this.close(id)
        };
    }

    /**
     * Set modal content
     */
    setContent(id, content) {
        const modalData = this.activeModals.get(id);
        if (!modalData) return;

        if (typeof content === 'string') {
            modalData.contentDiv.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            modalData.contentDiv.innerHTML = '';
            modalData.contentDiv.appendChild(content);
        }
    }

    /**
     * Add footer to modal
     */
    addFooter(id, footerContent, alignment = 'flex-end') {
        const modalData = this.activeModals.get(id);
        if (!modalData) return;

        // Remove existing footer
        const existingFooter = modalData.modal.querySelector('.modal-footer');
        if (existingFooter) {
            existingFooter.remove();
        }

        // Create new footer
        const footer = document.createElement('div');
        footer.className = `modal-footer`;
        footer.style.justifyContent = alignment;

        if (typeof footerContent === 'string') {
            footer.innerHTML = footerContent;
        } else if (footerContent instanceof HTMLElement) {
            footer.appendChild(footerContent);
        }

        modalData.modal.appendChild(footer);
    }

    /**
     * Close modal
     */
    close(id) {
        const modalData = this.activeModals.get(id);
        if (!modalData) return;

        // Call onClose callback
        if (modalData.onClose) {
            modalData.onClose();
        }

        // Animate out
        modalData.overlay.classList.add('closing');
        modalData.modal.classList.add('closing');

        setTimeout(() => {
            if (modalData.overlay.parentNode) {
                modalData.overlay.parentNode.removeChild(modalData.overlay);
            }
            this.activeModals.delete(id);
            this.updateBodyScrollLock();
        }, 300);
    }

    /**
     * Close topmost modal
     */
    closeTopmost() {
        if (this.activeModals.size === 0) return;
        
        const lastModalId = Array.from(this.activeModals.keys()).pop();
        this.close(lastModalId);
    }

    /**
     * Close all modals
     */
    closeAll() {
        Array.from(this.activeModals.keys()).forEach(id => this.close(id));
    }

    /**
     * Update body scroll lock
     */
    updateBodyScrollLock() {
        if (this.activeModals.size > 0) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    /**
     * Setup focus trap for accessibility
     */
    setupFocusTrap(modal) {
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // Focus first element
        setTimeout(() => firstFocusable.focus(), 100);

        // Trap focus
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        e.preventDefault();
                        lastFocusable.focus();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        e.preventDefault();
                        firstFocusable.focus();
                    }
                }
            }
        });
    }

    /**
     * Show confirmation dialog
     */
    confirm(message, options = {}) {
        const {
            title = 'Confirm',
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            confirmClass = 'btn-danger',
            icon = '❓'
        } = options;

        return new Promise((resolve) => {
            const modal = this.create({
                title,
                size: 'small',
                className: 'confirmation',
                content: `
                    <div class="confirmation-icon">${icon}</div>
                    <div class="confirmation-message">${message}</div>
                `
            });

            modal.addFooter(`
                <button class="btn btn-secondary" onclick="window.LivePulse.UI.Modals.manager.close(${modal.id}); window.LivePulse.UI.Modals._confirmResolve(false);">
                    ${cancelText}
                </button>
                <button class="btn ${confirmClass}" onclick="window.LivePulse.UI.Modals.manager.close(${modal.id}); window.LivePulse.UI.Modals._confirmResolve(true);">
                    ${confirmText}
                </button>
            `);

            // Store resolve function temporarily
            window.LivePulse.UI.Modals._confirmResolve = resolve;
        });
    }

    /**
     * Show alert dialog
     */
    alert(message, options = {}) {
        const {
            title = 'Alert',
            buttonText = 'OK',
            icon = 'ℹ️'
        } = options;

        return new Promise((resolve) => {
            const modal = this.create({
                title,
                size: 'small',
                className: 'confirmation',
                content: `
                    <div class="confirmation-icon">${icon}</div>
                    <div class="confirmation-message">${message}</div>
                `
            });

            modal.addFooter(`
                <button class="btn btn-primary" onclick="window.LivePulse.UI.Modals.manager.close(${modal.id}); window.LivePulse.UI.Modals._alertResolve();">
                    ${buttonText}
                </button>
            `, 'center');

            // Store resolve function temporarily
            window.LivePulse.UI.Modals._alertResolve = resolve;
        });
    }
}

// ===== GLOBAL INSTANCE =====
window.LivePulse.UI.Modals.manager = new ModalManager();

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Create modal
 */
window.LivePulse.UI.Modals.create = function(options) {
    return this.manager.create(options);
};

/**
 * Close modal
 */
window.LivePulse.UI.Modals.close = function(id) {
    return this.manager.close(id);
};

/**
 * Close all modals
 */
window.LivePulse.UI.Modals.closeAll = function() {
    return this.manager.closeAll();
};

/**
 * Show confirmation dialog
 */
window.LivePulse.UI.Modals.confirm = function(message, options) {
    return this.manager.confirm(message, options);
};

/**
 * Show alert dialog
 */
window.LivePulse.UI.Modals.alert = function(message, options) {
    return this.manager.alert(message, options);
};

// ===== SPECIALIZED MODALS =====

/**
 * Show save article modal
 */
window.LivePulse.UI.Modals.showSaveArticleModal = function(content) {
    const utils = window.LivePulse.Utils;
    const extractedTitle = utils ? utils.extractArticleTitle(content) : 'Untitled Article';
    
    const modal = this.create({
        title: '💾 Save Article',
        size: 'default',
        content: `
            <div class="form-group">
                <label class="form-label">Title *</label>
                <input type="text" id="save-title" class="form-input" 
                       value="${extractedTitle}" placeholder="Enter article title..." required>
            </div>
            
            <div class="form-group">
                <label class="form-label">Author</label>
                <input type="text" id="save-author" class="form-input" 
                       placeholder="Enter author name...">
            </div>
            
            <div class="form-group">
                <label class="form-label">Tags</label>
                <input type="text" id="save-tags" class="form-input" 
                       placeholder="e.g., finance, technology, news (comma-separated)">
            </div>
            
            <div class="form-group">
                <label class="form-label">Category</label>
                <select id="save-category" class="form-select">
                    <option value="">Select category...</option>
                    <option value="news">News</option>
                    <option value="analysis">Analysis</option>
                    <option value="guide">Guide</option>
                    <option value="opinion">Opinion</option>
                    <option value="technical">Technical</option>
                    <option value="finance">Finance</option>
                    <option value="technology">Technology</option>
                    <option value="sports">Sports</option>
                    <option value="weather">Weather</option>
                    <option value="other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Content Preview</label>
                <textarea class="form-textarea" rows="4" readonly>${content.substring(0, 300)}${content.length > 300 ? '...' : ''}</textarea>
            </div>
        `
    });

    modal.addFooter(`
        <button class="btn btn-secondary" onclick="window.LivePulse.UI.Modals.close(${modal.id})">
            Cancel
        </button>
        <button class="btn btn-primary" onclick="window.LivePulse.UI.Modals.confirmSaveArticle(${modal.id}, '${content.replace(/'/g, "\\'")}')">
            💾 Save Article
        </button>
    `);

    // Focus on title input
    setTimeout(() => {
        const titleInput = document.getElementById('save-title');
        if (titleInput) titleInput.focus();
    }, 100);

    return modal;
};

/**
 * Confirm save article
 */
window.LivePulse.UI.Modals.confirmSaveArticle = async function(modalId, content) {
    const title = document.getElementById('save-title')?.value.trim();
    const author = document.getElementById('save-author')?.value.trim();
    const tags = document.getElementById('save-tags')?.value.trim();
    const category = document.getElementById('save-category')?.value;

    if (!title) {
        window.showError('Please enter a title for the article.');
        return;
    }

    try {
        const articleData = {
            title: title,
            content: content,
            author: author || null,
            tags: tags ? tags.split(',').map(t => t.trim()) : [],
            category: category || null,
            pulseCount: window.pulses ? window.pulses.length : 0
        };

        const result = await window.LivePulse.Storage.Articles.save(articleData);
        
        if (result) {
            window.showSuccess(`✅ Article "${title}" saved successfully!`);
            this.close(modalId);
            
            // Trigger article saved event
            document.dispatchEvent(new CustomEvent('livepulse:articleSaved', {
                detail: { article: result }
            }));
        }
    } catch (error) {
        window.showError('Failed to save article: ' + error.message);
    }
};

/**
 * Show article details modal
 */
window.LivePulse.UI.Modals.showArticleDetails = function(article) {
    const modal = this.create({
        title: `📄 ${article.title}`,
        size: 'large',
        content: `
            <div class="article-details">
                <div class="detail-row">
                    <strong>Created:</strong>
                    <span>${new Date(article.created_at).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <strong>Author:</strong>
                    <span>${article.metadata?.author || 'Unknown'}</span>
                </div>
                <div class="detail-row">
                    <strong>Category:</strong>
                    <span>${article.metadata?.category || 'None'}</span>
                </div>
                <div class="detail-row">
                    <strong>Pulse Points:</strong>
                    <span>${article.pulse_count || 0}</span>
                </div>
                <div class="detail-row">
                    <strong>Content Length:</strong>
                    <span>${article.raw_content.length} characters</span>
                </div>
                
                ${article.metadata?.tags && article.metadata.tags.length > 0 ? `
                    <div class="detail-row">
                        <strong>Tags:</strong>
                        <div class="tags-display">
                            ${article.metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="content-preview">
                    <strong>Content Preview:</strong>
                    <div class="preview-text">${article.raw_content}</div>
                </div>
            </div>
        `
    });

    modal.addFooter(`
        <button class="btn btn-primary" onclick="window.LivePulse.UI.Modals.loadArticleFromModal('${article.id}', ${modal.id})">
            📖 Load Article
        </button>
        <button class="btn btn-secondary" onclick="window.LivePulse.UI.Modals.close(${modal.id})">
            Close
        </button>
    `);

    return modal;
};

/**
 * Load article from modal
 */
window.LivePulse.UI.Modals.loadArticleFromModal = function(articleId, modalId) {
    // Close modal first
    this.close(modalId);
    
    // Load article (this will be handled by article management system)
    if (window.loadArticleContent) {
        window.loadArticleContent(articleId);
    } else {
        window.showError('Article loading function not available');
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎭 LivePulse Modal Manager loaded');
});

// Export for ES6 modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.LivePulse.UI.Modals;
}