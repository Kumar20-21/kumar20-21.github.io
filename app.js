// Theme Management
class ThemeManager {
    constructor() {
        this.theme = this.getInitialTheme();
        this.themeToggle = document.getElementById('theme-toggle');
        this.sunIcon = document.querySelector('.sun-icon');
        this.moonIcon = document.querySelector('.moon-icon');
        
        this.init();
    }
    
    getInitialTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            return savedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    init() {
        this.applyTheme(this.theme);
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem('theme')) {
                this.theme = e.matches ? 'dark' : 'light';
                this.applyTheme(this.theme);
            }
        });
    }
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.theme);
        localStorage.setItem('theme', this.theme);
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-color-scheme', theme);
        
        if (theme === 'dark') {
            this.sunIcon.classList.add('hidden');
            this.moonIcon.classList.remove('hidden');
        } else {
            this.sunIcon.classList.remove('hidden');
            this.moonIcon.classList.add('hidden');
        }
    }
}

// Page Navigation Manager
class PageNavigationManager {
    constructor() {
        this.currentPage = 'home';
        this.pages = document.querySelectorAll('.page');
        this.navLinks = document.querySelectorAll('.nav__link');
        this.heroButtons = document.querySelectorAll('[data-page]');
        
        this.init();
    }
    
    init() {
        // Handle navigation link clicks
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = link.getAttribute('data-page');
                this.navigateToPage(targetPage);
            });
        });
        
        // Handle hero button clicks and other data-page elements
        this.heroButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = button.getAttribute('data-page');
                if (targetPage) {
                    this.navigateToPage(targetPage);
                }
            });
        });
        
        // Handle logo click
        const logo = document.querySelector('.nav__logo');
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateToPage('home');
        });
        
        // Set initial page state
        this.showPage(this.currentPage);
        this.updateActiveNavLink(this.currentPage);
    }
    
    navigateToPage(pageId) {
        if (pageId === this.currentPage) return;
        
        // Hide current page
        this.hidePage(this.currentPage);
        
        // Show new page with delay for smooth transition
        setTimeout(() => {
            this.showPage(pageId);
            this.currentPage = pageId;
            this.updateActiveNavLink(pageId);
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 150);
        
        // Close mobile menu if open
        this.closeMobileMenu();
    }
    
    showPage(pageId) {
        const page = document.getElementById(`${pageId}-page`);
        if (page) {
            page.classList.add('active');
        }
    }
    
    hidePage(pageId) {
        const page = document.getElementById(`${pageId}-page`);
        if (page) {
            page.classList.remove('active');
        }
    }
    
    updateActiveNavLink(pageId) {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            }
        });
    }
    
    closeMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        navMenu.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Mobile Navigation Manager
class MobileNavigationManager {
    constructor() {
        this.navToggle = document.getElementById('nav-toggle');
        this.navMenu = document.getElementById('nav-menu');
        this.navClose = document.getElementById('nav-close');
        
        this.init();
    }
    
    init() {
        // Mobile navigation toggle
        this.navToggle.addEventListener('click', () => this.showMenu());
        this.navClose.addEventListener('click', () => this.hideMenu());
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.navMenu.contains(e.target) && !this.navToggle.contains(e.target)) {
                this.hideMenu();
            }
        });
        
        // Close menu when pressing escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideMenu();
            }
        });
    }
    
    showMenu() {
        this.navMenu.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus management for accessibility
        const firstNavLink = this.navMenu.querySelector('.nav__link');
        if (firstNavLink) {
            firstNavLink.focus();
        }
    }
    
    hideMenu() {
        this.navMenu.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Animation Manager
class AnimationManager {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        this.init();
    }
    
    init() {
        // Intersection Observer for scroll animations
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, this.observerOptions);
        
        // Apply animations to elements
        const animatedElements = document.querySelectorAll('.about__container, .construction-content, .conference-tracker-content, .feature-item');
        animatedElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
        
        // Stagger animations for feature items
        const featureItems = document.querySelectorAll('.feature-item');
        featureItems.forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.1}s`;
        });
    }
}

// Social Links Manager
class SocialLinksManager {
    constructor() {
        this.init();
    }
    
    init() {
        const socialLinks = document.querySelectorAll('.social-link');
        
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // Add ripple effect
                this.createRippleEffect(e, link);
                
                // Add click tracking
                const platform = this.getPlatformFromLink(link);
                this.trackSocialClick(platform);
            });
            
            // Add hover effects
            link.addEventListener('mouseenter', () => this.handleLinkHover(link, true));
            link.addEventListener('mouseleave', () => this.handleLinkHover(link, false));
        });
    }
    
    createRippleEffect(event, element) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(33, 128, 141, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        // Add ripple animation CSS if not exists
        if (!document.querySelector('#ripple-styles')) {
            const style = document.createElement('style');
            style.id = 'ripple-styles';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                .social-link {
                    position: relative;
                    overflow: hidden;
                }
            `;
            document.head.appendChild(style);
        }
        
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    handleLinkHover(link, isHovering) {
        const icon = link.querySelector('svg');
        if (icon) {
            if (isHovering) {
                icon.style.transform = 'scale(1.1) rotate(5deg)';
            } else {
                icon.style.transform = 'scale(1) rotate(0deg)';
            }
        }
    }
    
    getPlatformFromLink(link) {
        const ariaLabel = link.getAttribute('aria-label');
        return ariaLabel ? ariaLabel.toLowerCase() : 'unknown';
    }
    
    trackSocialClick(platform) {
        // Analytics tracking could be added here
        console.log(`Social link clicked: ${platform}`);
    }
}

// Button Enhancement Manager
class ButtonManager {
    constructor() {
        this.init();
    }
    
    init() {
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(button => {
            // Add click effects
            button.addEventListener('click', (e) => {
                this.addClickEffect(button);
            });
            
            // Add keyboard navigation
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });
    }
    
    addClickEffect(button) {
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
    }
}

// Utility Functions
class Utils {
    static debounce(func, wait) {
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
    
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let last = +new Date();
        const tick = function() {
            element.style.opacity = +element.style.opacity + (new Date() - last) / duration;
            last = +new Date();
            
            if (+element.style.opacity < 1) {
                requestAnimationFrame(tick);
            }
        };
        
        tick();
    }
    
    static fadeOut(element, duration = 300) {
        let last = +new Date();
        const tick = function() {
            element.style.opacity = +element.style.opacity - (new Date() - last) / duration;
            last = +new Date();
            
            if (+element.style.opacity > 0) {
                requestAnimationFrame(tick);
            } else {
                element.style.display = 'none';
            }
        };
        
        tick();
    }
}

// Loading Manager
class LoadingManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add loading class to body initially
        document.body.classList.add('loading');
        
        // Remove loading class when everything is loaded
        window.addEventListener('load', () => {
            setTimeout(() => {
                document.body.classList.remove('loading');
                this.startInitialAnimations();
            }, 300);
        });
    }
    
    startInitialAnimations() {
        // Trigger hero section animation
        const heroContent = document.querySelector('.hero__content');
        if (heroContent) {
            heroContent.style.animation = 'fadeInUp 1s ease-out forwards';
        }
        
        // Stagger navigation links animation
        const navLinks = document.querySelectorAll('.nav__link');
        navLinks.forEach((link, index) => {
            link.style.opacity = '0';
            link.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                link.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                link.style.opacity = '1';
                link.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

// Header Scroll Effects
class HeaderManager {
    constructor() {
        this.header = document.getElementById('header');
        this.init();
    }
    
    init() {
        const throttledScrollHandler = Utils.throttle(() => {
            this.handleScroll();
        }, 16);
        
        window.addEventListener('scroll', throttledScrollHandler);
    }
    
    handleScroll() {
        if (window.scrollY > 50) {
            this.header.style.background = 'rgba(252, 252, 249, 0.98)';
            this.header.style.boxShadow = 'var(--shadow-sm)';
        } else {
            this.header.style.background = 'rgba(252, 252, 249, 0.95)';
            this.header.style.boxShadow = 'none';
        }
        
        // Update for dark mode
        if (document.documentElement.getAttribute('data-color-scheme') === 'dark') {
            if (window.scrollY > 50) {
                this.header.style.background = 'rgba(31, 33, 33, 0.98)';
            } else {
                this.header.style.background = 'rgba(31, 33, 33, 0.95)';
            }
        }
    }
}

// Accessibility Manager
class AccessibilityManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Add focus handling for accessibility
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('user-is-tabbing');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('user-is-tabbing');
        });
        
        // Skip to main content functionality
        this.addSkipLink();
        
        // Enhanced focus management
        this.setupFocusManagement();
    }
    
    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--color-primary);
            color: var(--color-btn-primary-text);
            padding: 8px 12px;
            text-decoration: none;
            border-radius: var(--radius-base);
            z-index: 1000;
            transition: top 0.2s ease;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
        
        // Add id to main content
        const main = document.querySelector('.main');
        if (main) {
            main.id = 'main-content';
            main.setAttribute('tabindex', '-1');
        }
    }
    
    setupFocusManagement() {
        // Ensure interactive elements are properly focusable
        const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [tabindex]');
        
        interactiveElements.forEach(element => {
            if (!element.hasAttribute('tabindex') && element.tagName !== 'A') {
                element.setAttribute('tabindex', '0');
            }
        });
    }
}

// Performance Manager
class PerformanceManager {
    constructor() {
        this.init();
    }
    
    init() {
        // Preload critical resources
        this.preloadResources();
        
        // Lazy load non-critical elements
        this.setupLazyLoading();
        
        // Monitor performance metrics
        this.monitorPerformance();
    }
    
    preloadResources() {
        // Preload fonts
        const fontLink = document.createElement('link');
        fontLink.rel = 'preload';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
        fontLink.as = 'style';
        document.head.appendChild(fontLink);
    }
    
    setupLazyLoading() {
        // Setup intersection observer for lazy loading
        const lazyElements = document.querySelectorAll('[data-lazy]');
        
        if (lazyElements.length > 0) {
            const lazyObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        // Load lazy content
                        element.classList.add('loaded');
                        lazyObserver.unobserve(element);
                    }
                });
            });
            
            lazyElements.forEach(element => {
                lazyObserver.observe(element);
            });
        }
    }
    
    monitorPerformance() {
        // Monitor Core Web Vitals
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach((entry) => {
                        // Log performance metrics
                        console.log(`${entry.name}: ${entry.value}`);
                    });
                });
                
                observer.observe({ entryTypes: ['paint', 'navigation', 'measure'] });
            } catch (e) {
                console.log('Performance monitoring not supported');
            }
        }
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all managers
    new LoadingManager();
    new ThemeManager();
    new PageNavigationManager();
    new MobileNavigationManager();
    new AnimationManager();
    new SocialLinksManager();
    new ButtonManager();
    new HeaderManager();
    new AccessibilityManager();
    new PerformanceManager();
    
    // Add additional interactive features
    initializeAdditionalFeatures();
});

function initializeAdditionalFeatures() {
    // Add print styles handling
    window.addEventListener('beforeprint', () => {
        document.body.classList.add('printing');
    });
    
    window.addEventListener('afterprint', () => {
        document.body.classList.remove('printing');
    });
    
    // Add error handling
    window.addEventListener('error', (e) => {
        console.error('JavaScript error:', e.error);
    });
    
    // Add online/offline handling
    window.addEventListener('online', () => {
        document.body.classList.remove('offline');
    });
    
    window.addEventListener('offline', () => {
        document.body.classList.add('offline');
    });
    
    // Add resize handling
    const debouncedResize = Utils.debounce(() => {
        // Handle responsive breakpoint changes
        const isMobile = window.innerWidth <= 768;
        document.body.classList.toggle('mobile-view', isMobile);
    }, 250);
    
    window.addEventListener('resize', debouncedResize);
    
    // Initial mobile check
    debouncedResize();
}

// Global utility functions
window.navigateToPage = function(pageId) {
    const pageNav = window.pageNavigationManager;
    if (pageNav) {
        pageNav.navigateToPage(pageId);
    }
};

// Export managers to global scope for debugging
window.appManagers = {
    theme: null,
    navigation: null,
    animation: null,
    social: null,
    button: null,
    header: null,
    accessibility: null,
    performance: null
};