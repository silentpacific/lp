// js/ui/mobile-menu.js - Mobile Navigation
// Handles mobile menu functionality and responsive navigation

/**
 * Mobile Menu Manager
 * Manages mobile navigation, hamburger menu, and responsive interactions
 */
export class MobileMenu {
    constructor() {
        this.isOpen = false;
        this.menuElement = null;
        this.overlayElement = null;
        this.toggleButton = null;
        this.menuItems = [];
    }

    /**
     * Initialize mobile menu functionality
     */
    init() {
        this.setupMenuElements();
        this.setupEventListeners();
        this.setupScrollSpy();
        this.handleResize();
        console.log('✅ Mobile menu initialized');
    }

    /**
     * Setup menu DOM elements
     */
    setupMenuElements() {
        this.menuElement = document.getElementById('mobile-menu');
        this.overlayElement = document.querySelector('.mobile-menu-overlay');
        this.toggleButton = document.getElementById('mobile-menu-toggle');
        this.menuItems = document.querySelectorAll('.mobile-menu-item');

        // Create elements if they don't exist
        if (!this.overlayElement) {
            this.createOverlayElement();
        }

        if (!this.toggleButton) {
            this.createToggleButton();
        }
    }

    /**
     * Create overlay element if missing
     */
    createOverlayElement() {
        this.overlayElement = document.createElement('div');
        this.overlayElement.className = 'mobile-menu-overlay';
        this.overlayElement.addEventListener('click', () => this.close());
        document.body.appendChild(this.overlayElement);
    }

    /**
     * Create toggle button if missing
     */
    createToggleButton() {
        // Look for common header locations
        const header = document.querySelector('.header, .app-header, header');
        if (!header) return;

        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'mobile-menu-toggle';
        this.toggleButton.className = 'mobile-menu-toggle';
        this.toggleButton.innerHTML = `
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        `;
        this.toggleButton.setAttribute('aria-label', 'Toggle mobile menu');
        this.toggleButton.addEventListener('click', () => this.toggle());

        header.appendChild(this.toggleButton);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Toggle button
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggle();
            });
        }

        // Overlay click to close
        if (this.overlayElement) {
            this.overlayElement.addEventListener('click', () => this.close());
        }

        // Menu item clicks
        this.menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleMenuItemClick(e, item);
            });
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Prevent scroll when menu is open
        document.addEventListener('touchmove', (e) => {
            if (this.isOpen && !this.menuElement.contains(e.target)) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Setup scroll spy for navigation highlighting
     */
    setupScrollSpy() {
        const sections = document.querySelectorAll('.section-anchor, [id]');
        const menuLinks = document.querySelectorAll('.mobile-menu-item[href^="#"]');
        
        if (sections.length === 0 || menuLinks.length === 0) return;

        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const targetId = entry.target.id;
                    this.updateActiveMenuItem(targetId);
                }
            });
        }, observerOptions);

        sections.forEach(section => {
            if (section.id) {
                observer.observe(section);
            }
        });

        // Also setup scroll-based highlighting as fallback
        window.addEventListener('scroll', this.debounce(() => {
            this.updateActiveMenuItemOnScroll();
        }, 100));
    }

    /**
     * Handle menu item clicks
     */
    handleMenuItemClick(event, item) {
        const href = item.getAttribute('href');
        
        if (href && href.startsWith('#')) {
            event.preventDefault();
            
            // Smooth scroll to target
            const targetId = href.substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                this.smoothScrollTo(targetElement);
                this.close();
                
                // Update active state immediately
                this.setActiveMenuItem(item);
            }
        } else {
            // External link or action - just close menu
            this.close();
        }
    }

    /**
     * Smooth scroll to target element
     */
    smoothScrollTo(element) {
        const headerHeight = this.getHeaderHeight();
        const targetPosition = element.offsetTop - headerHeight - 20;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }

    /**
     * Get header height for scroll offset calculation
     */
    getHeaderHeight() {
        const header = document.querySelector('.header, .app-header, header');
        return header ? header.offsetHeight : 0;
    }

    /**
     * Update active menu item based on current section
     */
    updateActiveMenuItem(targetId) {
        this.menuItems.forEach(item => {
            const href = item.getAttribute('href');
            if (href === `#${targetId}`) {
                this.setActiveMenuItem(item);
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Update active menu item on scroll (fallback method)
     */
    updateActiveMenuItemOnScroll() {
        let current = '';
        const sections = document.querySelectorAll('.section-anchor, [id]');
        const headerHeight = this.getHeaderHeight();
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= (sectionTop - headerHeight - 150)) {
                current = section.getAttribute('id');
            }
        });
        
        if (current) {
            this.updateActiveMenuItem(current);
        }
    }

    /**
     * Set active menu item
     */
    setActiveMenuItem(activeItem) {
        this.menuItems.forEach(item => {
            if (item === activeItem) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Toggle menu open/closed
     */
    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    /**
     * Open mobile menu
     */
    open() {
        if (!this.menuElement) return;
        
        this.isOpen = true;
        this.menuElement.classList.add('open');
        
        if (this.overlayElement) {
            this.overlayElement.classList.add('open');
        }
        
        if (this.toggleButton) {
            this.toggleButton.classList.add('open');
            this.toggleButton.setAttribute('aria-expanded', 'true');
        }
        
        // Prevent body scrolling
        document.body.classList.add('mobile-menu-open');
        
        // Focus management for accessibility
        this.focusFirstMenuItem();
        
        // Add class to html for CSS targeting
        document.documentElement.classList.add('mobile-menu-active');
    }

    /**
     * Close mobile menu
     */
    close() {
        if (!this.menuElement) return;
        
        this.isOpen = false;
        this.menuElement.classList.remove('open');
        
        if (this.overlayElement) {
            this.overlayElement.classList.remove('open');
        }
        
        if (this.toggleButton) {
            this.toggleButton.classList.remove('open');
            this.toggleButton.setAttribute('aria-expanded', 'false');
        }
        
        // Restore body scrolling
        document.body.classList.remove('mobile-menu-open');
        
        // Remove class from html
        document.documentElement.classList.remove('mobile-menu-active');
    }

    /**
     * Focus first menu item for accessibility
     */
    focusFirstMenuItem() {
        const firstItem = this.menuElement?.querySelector('.mobile-menu-item, a, button');
        if (firstItem) {
            firstItem.focus();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const isDesktop = window.innerWidth >= 768; // Adjust breakpoint as needed
        
        if (isDesktop && this.isOpen) {
            this.close();
        }
        
        // Update menu visibility based on screen size
        this.updateMenuVisibility();
    }

    /**
     * Update menu visibility based on screen size
     */
    updateMenuVisibility() {
        if (!this.toggleButton) return;
        
        const isDesktop = window.innerWidth >= 768;
        
        if (isDesktop) {
            this.toggleButton.style.display = 'none';
        } else {
            this.toggleButton.style.display = 'block';
        }
    }

    /**
     * Add menu item dynamically
     */
    addMenuItem(text, href, icon = null) {
        if (!this.menuElement) return null;
        
        const menuItem = document.createElement('a');
        menuItem.className = 'mobile-menu-item';
        menuItem.href = href;
        menuItem.innerHTML = `
            ${icon ? `<span class="menu-icon">${icon}</span>` : ''}
            <span class="menu-text">${text}</span>
        `;
        
        // Add event listener
        menuItem.addEventListener('click', (e) => {
            this.handleMenuItemClick(e, menuItem);
        });
        
        this.menuElement.appendChild(menuItem);
        this.menuItems = document.querySelectorAll('.mobile-menu-item');
        
        return menuItem;
    }

    /**
     * Remove menu item
     */
    removeMenuItem(href) {
        const item = document.querySelector(`.mobile-menu-item[href="${href}"]`);
        if (item) {
            item.remove();
            this.menuItems = document.querySelectorAll('.mobile-menu-item');
        }
    }

    /**
     * Update menu item badge (for notifications, counts, etc.)
     */
    updateMenuItemBadge(href, badgeText) {
        const item = document.querySelector(`.mobile-menu-item[href="${href}"]`);
        if (!item) return;
        
        let badge = item.querySelector('.menu-badge');
        
        if (badgeText) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'menu-badge';
                item.appendChild(badge);
            }
            badge.textContent = badgeText;
            badge.style.display = 'inline';
        } else if (badge) {
            badge.style.display = 'none';
        }
    }

    /**
     * Set menu theme (light/dark)
     */
    setTheme(theme) {
        if (this.menuElement) {
            this.menuElement.classList.remove('theme-light', 'theme-dark');
            this.menuElement.classList.add(`theme-${theme}`);
        }
        
        if (this.overlayElement) {
            this.overlayElement.classList.remove('theme-light', 'theme-dark');
            this.overlayElement.classList.add(`theme-${theme}`);
        }
    }

    /**
     * Get menu state
     */
    getState() {
        return {
            isOpen: this.isOpen,
            itemCount: this.menuItems.length,
            hasOverlay: !!this.overlayElement,
            hasToggleButton: !!this.toggleButton
        };
    }

    /**
     * Debounce utility function
     */
    debounce(func, wait) {
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

    /**
     * Destroy mobile menu (cleanup)
     */
    destroy() {
        this.close();
        
        // Remove event listeners
        if (this.toggleButton) {
            this.toggleButton.removeEventListener('click', this.toggle);
        }
        
        if (this.overlayElement) {
            this.overlayElement.removeEventListener('click', this.close);
        }
        
        // Remove created elements
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
        
        // Clean up body classes
        document.body.classList.remove('mobile-menu-open');
        document.documentElement.classList.remove('mobile-menu-active');
        
        // Reset properties
        this.isOpen = false;
        this.menuElement = null;
        this.overlayElement = null;
        this.toggleButton = null;
        this.menuItems = [];
    }
}

// Global functions for external access
window.toggleMobileMenu = function() {
    if (window.mobileMenu) {
        window.mobileMenu.toggle();
    }
};

window.closeMobileMenu = function() {
    if (window.mobileMenu) {
        window.mobileMenu.close();
    }
};