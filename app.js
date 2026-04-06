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
        this.pageToPath = {
            home: '/',
            about: '/aboutme',
            projects: '/projects',
            publications: '/publications',
            blog: '/blog',
            'conference-tracker': '/conference-tracker'
        };
        this.pathToPage = Object.fromEntries(
            Object.entries(this.pageToPath).map(([page, path]) => [path, page])
        );
        
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

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            const targetPage = this.getPageFromLocation();
            if (targetPage !== this.currentPage) {
                this.hidePage(this.currentPage);
                this.showPage(targetPage);
                this.currentPage = targetPage;
                this.updateActiveNavLink(targetPage);
                window.scrollTo({ top: 0, behavior: 'auto' });
            }
        });

        // Set initial page state from URL
        const initialPage = this.getPageFromLocation();
        this.currentPage = initialPage;
        this.showPage(initialPage);
        this.updateActiveNavLink(initialPage);
        this.updateUrlForPage(initialPage, true);
    }
    
    getNormalizedPath(rawPath) {
        if (!rawPath) return '/';
        if (rawPath === '/index.html') return '/';
        const cleaned = rawPath.endsWith('/') && rawPath !== '/' ? rawPath.slice(0, -1) : rawPath;
        return cleaned || '/';
    }

    getPageFromLocation() {
        const searchParams = new URLSearchParams(window.location.search);
        const redirectedPath = searchParams.get('redirect');
        if (redirectedPath) {
            const decodedPath = decodeURIComponent(redirectedPath);
            const normalizedRedirectPath = this.getNormalizedPath(decodedPath.split('?')[0]);
            const redirectedPage = this.pathToPage[normalizedRedirectPath] || 'home';
            this.updateUrlForPage(redirectedPage, true);
            return redirectedPage;
        }

        const normalizedPath = this.getNormalizedPath(window.location.pathname);
        return this.pathToPage[normalizedPath] || 'home';
    }

    updateUrlForPage(pageId, replace = false) {
        const path = this.pageToPath[pageId] || '/';
        const targetUrl = `${path}${window.location.hash || ''}`;
        if (replace) {
            window.history.replaceState({ pageId }, '', targetUrl);
        } else {
            window.history.pushState({ pageId }, '', targetUrl);
        }
    }

    navigateToPage(pageId, replace = false) {
        if (!this.pageToPath[pageId]) return;
        if (pageId === this.currentPage) return;
        
        // Hide current page
        this.hidePage(this.currentPage);

        // Show new page immediately and update URL immediately.
        this.showPage(pageId);
        this.currentPage = pageId;
        this.updateActiveNavLink(pageId);
        this.updateUrlForPage(pageId, replace);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
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

// Conference Deadline Tracker Manager
class ConferenceTrackerManager {
    constructor() {
        this.root = document.getElementById('conference-tracker-page');
        this.cardsContainer = document.getElementById('deadline-cards-container');
        this.statsContainer = document.getElementById('deadline-stats-container');
        this.searchInput = document.getElementById('deadline-search');
        this.typeFilter = document.getElementById('deadline-type-filter');
        this.rankFilter = document.getElementById('deadline-rank-filter');
        this.areaFilter = document.getElementById('deadline-area-filter');
        this.timeFilter = document.getElementById('deadline-time-filter');
        this.sortSelect = document.getElementById('deadline-sort-select');
        this.toggleViewBtn = document.getElementById('deadline-toggle-view');
        this.lastUpdatedEl = document.getElementById('deadline-last-updated');
        this.DateTime = window.luxon?.DateTime;
        this.countdownTimer = null;

        this.data = {
            meta: {
                last_updated: '2026-04-06',
                maintainer: 'Keshav Kumar',
                notes: 'Conference and journal tracker data for portfolio site'
            },
            conferences: [
                {
                    title: "AAMAS",
                    full_name: "International Conference on Autonomous Agents and Multiagent Systems",
                    year: 2026,
                    id: "aamas26",
                    link: "https://cyprusconferences.org/aamas2026/",
                    deadline: "2025-10-08 23:59",
                    abstract_deadline: "2025-10-01 23:59",
                    timezone: "UTC-12",
                    date: "May 25-29, 2026",
                    city: "Cyprus",
                    country: "Cyprus",
                    tags: ["RL", "MARL", "Agents", "ML"],
                    rank: "A+"
                },
                {
                    title: "WWW",
                    full_name: "International World Wide Web Conference",
                    year: 2026,
                    id: "www26",
                    link: "https://www.thewebconf.org/",
                    deadline: "2025-10-14 23:59",
                    timezone: "AoE",
                    date: "April-May 2026",
                    city: "TBD",
                    country: "TBD",
                    tags: ["Web", "Social", "Networks"],
                    rank: "A+",
                    note: "Estimated dates based on historical patterns"
                },
                {
                    title: "AISTATS",
                    full_name: "International Conference on Artificial Intelligence and Statistics",
                    year: 2026,
                    id: "aistats26",
                    link: "https://aistats.org/",
                    deadline: "2025-10-10 23:59",
                    timezone: "AoE",
                    date: "Spring 2026",
                    city: "TBD",
                    country: "TBD",
                    tags: ["ML", "Statistics", "RL"],
                    rank: "A+",
                    note: "Estimated dates based on historical patterns"
                },
                {
                    title: "PAKDD",
                    full_name: "Pacific-Asia Conference on Knowledge Discovery and Data Mining",
                    year: 2026,
                    id: "pakdd26",
                    link: "https://pakdd.org/",
                    deadline: "2025-12-14 23:59",
                    timezone: "PST",
                    date: "June 2026",
                    city: "TBD",
                    country: "TBD",
                    tags: ["KDD", "DM", "ML"],
                    rank: "A",
                    note: "Estimated dates based on historical patterns"
                },
                {
                    title: "ICML",
                    full_name: "International Conference on Machine Learning",
                    year: 2026,
                    id: "icml26",
                    link: "https://icml.cc/",
                    deadline: "2026-01-30 23:59",
                    abstract_deadline: "2026-01-23 23:59",
                    timezone: "AoE",
                    date: "July 2026",
                    city: "TBD",
                    country: "TBD",
                    tags: ["ML", "RL", "DL"],
                    rank: "A+",
                    note: "Estimated dates based on historical patterns"
                },
                {
                    title: "IJCAI",
                    full_name: "International Joint Conference on Artificial Intelligence",
                    year: 2026,
                    id: "ijcai26",
                    link: "https://ijcai.org/",
                    deadline: "2026-01-23 23:59",
                    abstract_deadline: "2026-01-16 23:59",
                    timezone: "AoE",
                    date: "August 2026",
                    city: "TBD",
                    country: "TBD",
                    tags: ["AI", "RL", "ML"],
                    rank: "A+",
                    note: "Estimated dates based on historical patterns"
                },
                {
                    title: "COLT",
                    full_name: "Annual Conference on Computational Learning Theory",
                    year: 2026,
                    id: "colt26",
                    link: "https://learningtheory.org/",
                    deadline: "2026-02-06 17:00",
                    timezone: "US/Eastern",
                    date: "June-July 2026",
                    city: "TBD",
                    country: "TBD",
                    tags: ["LT", "RL", "Theory"],
                    rank: "A+",
                    note: "Estimated dates based on historical patterns"
                },
                {
                    title: "UAI",
                    full_name: "Conference on Uncertainty in Artificial Intelligence",
                    year: 2026,
                    id: "uai26",
                    link: "https://www.auai.org/",
                    deadline: "2026-02-10 23:59",
                    timezone: "AoE",
                    date: "July 2026",
                    city: "TBD",
                    country: "TBD",
                    tags: ["Uncertainty", "Probability", "RL"],
                    rank: "A+",
                    note: "Estimated dates based on historical patterns"
                },
                {
                    title: "SIGKDD",
                    full_name: "ACM International Conference on Knowledge Discovery and Data Mining",
                    year: 2026,
                    id: "kdd26",
                    link: "https://kdd.org/",
                    deadline: "2026-02-10 23:59",
                    abstract_deadline: "2026-02-03 23:59",
                    timezone: "AoE",
                    date: "August 2026",
                    city: "TBD",
                    country: "TBD",
                    tags: ["DM", "ML", "RL"],
                    rank: "A+",
                    note: "Estimated dates based on historical patterns"
                },
                {
                    title: "ICAIF",
                    full_name: "ACM International Conference on AI in Finance",
                    year: 2026,
                    id: "icaif26",
                    link: "https://ai-finance.org/",
                    deadline: "2026-06-15 23:59",
                    timezone: "AoE",
                    date: "November 2026",
                    city: "TBD",
                    country: "TBD",
                    tags: ["Finance", "AI", "RL", "Quant"],
                    rank: "None",
                    note: "Finance-specific AI conference; not CORE ranked but highly relevant"
                },
                {
                    title: "NeurIPS",
                    full_name: "Advances in Neural Information Processing Systems",
                    year: 2026,
                    id: "neurips26",
                    link: "https://neurips.cc/",
                    deadline: "2026-05-15 23:59",
                    abstract_deadline: "2026-05-11 23:59",
                    timezone: "AoE",
                    date: "December 2026",
                    city: "TBD",
                    country: "TBD",
                    tags: ["ML", "DL", "RL"],
                    rank: "A+",
                    note: "Estimated dates based on historical patterns"
                }
            ],
            journals: [
                {
                    title: "Journal of Finance",
                    id: "jfinance",
                    submission_type: "continuous",
                    link: "https://onlinelibrary.wiley.com/journal/15406261",
                    tags: ["quantitative-finance", "asset-pricing", "finance"],
                    notes: "Flagship finance journal for empirical and theoretical quantitative finance work.",
                    rank: "Q1"
                },
                {
                    title: "Journal of Machine Learning Research",
                    id: "jmlr",
                    submission_type: "continuous",
                    link: "https://www.jmlr.org/",
                    tags: ["machine-learning", "RL", "open-access"],
                    notes: "Open-access flagship ML journal, including reinforcement-learning research.",
                    rank: "Q1"
                },
                {
                    title: "IEEE Transactions on Neural Networks and Learning Systems",
                    id: "ieeetnnls",
                    submission_type: "continuous",
                    link: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=5962385",
                    tags: ["neural-networks", "deep-learning", "RL", "multi-agent"],
                    notes: "High-impact venue for RL, deep-learning, and multi-agent algorithms.",
                    rank: "Q1"
                },
                {
                    title: "ACM Computing Surveys",
                    id: "acmcsur",
                    submission_type: "continuous",
                    link: "https://dl.acm.org/journal/csur",
                    tags: ["surveys", "RL", "multi-agent", "finance-applications"],
                    notes: "Authoritative survey journal.",
                    rank: "Q1"
                },
                {
                    title: "Expert Systems with Applications",
                    id: "eswa",
                    submission_type: "continuous",
                    link: "https://www.journals.elsevier.com/expert-systems-with-applications",
                    tags: ["AI-applications", "RL", "financial-systems", "trading"],
                    notes: "Leading venue for AI applications in trading and financial decision systems.",
                    rank: "Q1"
                }
            ]
        };

        this.init();
    }

    async init() {
        if (!this.root || !this.cardsContainer || !this.statsContainer) {
            return;
        }

        await this.loadExternalData();
        this.renderLastUpdated();

        if (!this.DateTime) {
            this.cardsContainer.innerHTML = '<p class="deadline-empty">Tracker could not initialize (missing date library).</p>';
            return;
        }

        this.populateAreaFilter();
        this.bindEvents();
        this.render();
        this.countdownTimer = setInterval(() => this.updateCountdowns(), 60000);
    }

    async loadExternalData() {
        try {
            const response = await fetch('data/deadlines.json', { cache: 'no-store' });
            if (!response.ok) return;
            const loadedData = await response.json();
            if (!loadedData || !Array.isArray(loadedData.conferences) || !Array.isArray(loadedData.journals)) {
                return;
            }
            this.data = loadedData;
        } catch (error) {
            console.warn('Conference tracker data fetch failed, using bundled data.', error);
        }
    }

    bindEvents() {
        const rerender = () => this.render();
        this.searchInput?.addEventListener('input', rerender);
        this.typeFilter?.addEventListener('change', rerender);
        this.rankFilter?.addEventListener('change', rerender);
        this.areaFilter?.addEventListener('change', rerender);
        this.timeFilter?.addEventListener('change', rerender);
        this.sortSelect?.addEventListener('change', rerender);

        this.toggleViewBtn?.addEventListener('click', () => {
            const isGrid = this.cardsContainer.classList.contains('deadline-grid-view');
            this.cardsContainer.classList.toggle('deadline-grid-view', !isGrid);
            this.cardsContainer.classList.toggle('deadline-list-view', isGrid);
            this.toggleViewBtn.textContent = isGrid ? 'Grid View' : 'List View';
        });
    }

    getAllItems() {
        const conferences = this.data.conferences.map((item) => ({ ...item, type: 'conference' }));
        const journals = this.data.journals.map((item) => ({ ...item, type: 'journal' }));
        return [...conferences, ...journals];
    }

    populateAreaFilter() {
        if (!this.areaFilter) return;
        const tags = new Set();
        this.getAllItems().forEach((item) => {
            (item.tags || []).forEach((tag) => tags.add(tag));
        });

        [...tags].sort().forEach((tag) => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            this.areaFilter.appendChild(option);
        });
    }

    renderLastUpdated() {
        if (!this.lastUpdatedEl) return;
        const updated = this.data?.meta?.last_updated;
        if (updated) {
            this.lastUpdatedEl.textContent = `Data last updated: ${updated}`;
            return;
        }
        this.lastUpdatedEl.textContent = 'Data last updated: Unknown';
    }

    parseDeadline(dateStr, timezone) {
        if (!dateStr) return null;
        const tz = timezone === 'AoE' ? 'UTC-12' : (timezone || 'UTC');
        return this.DateTime.fromFormat(dateStr, 'yyyy-MM-dd HH:mm', { zone: tz });
    }

    daysUntil(dt) {
        if (!dt || !dt.isValid) return Infinity;
        const ms = dt.toMillis() - Date.now();
        return Math.floor(ms / 86400000);
    }

    urgencyStatus(dt) {
        if (!dt || !dt.isValid) return 'success';
        const days = this.daysUntil(dt);
        if (days < 0) return 'info';
        if (days <= 7) return 'error';
        if (days <= 30) return 'warning';
        return 'success';
    }

    rankWeight(rank) {
        switch (rank) {
            case 'A+':
                return 1;
            case 'A':
            case 'Q1':
                return 2;
            default:
                return 3;
        }
    }

    deadlineBucket(item) {
        const deadline = item._deadlineDT;
        if (!deadline || !deadline.isValid) return 1; // Continuous/TBA
        return deadline.toMillis() <= Date.now() ? 2 : 0; // 0=open, 2=closed
    }

    buildICS(item) {
        const dt = this.parseDeadline(item.deadline, item.timezone);
        if (!dt || !dt.isValid) return null;

        const lines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Portfolio-Conference-Tracker//EN',
            'BEGIN:VEVENT',
            `UID:${item.id}-deadline`,
            `DTSTAMP:${this.DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'")}`,
            `DTSTART:${dt.toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'")}`,
            `SUMMARY:${item.title} Paper Deadline`,
            `DESCRIPTION:${item.full_name || item.title} submission deadline`,
            `URL:${item.link}`,
            'END:VEVENT',
            'END:VCALENDAR'
        ];

        return `data:text/calendar;charset=utf8,${encodeURIComponent(lines.join('\r\n'))}`;
    }

    applyFiltersAndSort() {
        const searchTerm = this.searchInput?.value.trim().toLowerCase() || '';
        const typeVal = this.typeFilter?.value || 'all';
        const rankVal = this.rankFilter?.value || 'all';
        const areaVal = this.areaFilter?.value || 'all';
        const timeVal = this.timeFilter?.value || 'all';
        const sortVal = this.sortSelect?.value || 'priority';
        const priorityOrder = ['aamas26', 'ijcai26', 'colt26', 'icml26', 'neurips26', 'icaif26'];
        const priorityRank = new Map(priorityOrder.map((id, idx) => [id, idx]));

        let items = this.getAllItems().map((item, sourceIndex) => {
            const parsedDeadline = this.parseDeadline(item.deadline, item.timezone);
            const prepared = { ...item, _deadlineDT: parsedDeadline, _sourceIndex: sourceIndex };
            if (item.deadline) {
                prepared._ics = this.buildICS(item);
            }
            return prepared;
        });

        items = items.filter((item) => {
            if (searchTerm) {
                const titleMatch = item.title.toLowerCase().includes(searchTerm);
                const fullNameMatch = (item.full_name || '').toLowerCase().includes(searchTerm);
                if (!titleMatch && !fullNameMatch) return false;
            }

            if (typeVal !== 'all' && item.type !== typeVal) return false;

            if (rankVal !== 'all') {
                const itemRank = item.rank || 'None';
                if (itemRank !== rankVal) return false;
            }

            if (areaVal !== 'all' && !(item.tags || []).includes(areaVal)) return false;

            if (timeVal !== 'all') {
                if (timeVal === '2026' && item.year !== 2026) return false;
                const days = this.daysUntil(item._deadlineDT);
                if (timeVal === '30' && (days < 0 || days > 30)) return false;
                if (timeVal === '90' && (days < 0 || days > 90)) return false;
            }

            return true;
        });

        items.sort((a, b) => {
            if (sortVal === 'priority') {
                const aRank = priorityRank.has(a.id) ? priorityRank.get(a.id) : 1000;
                const bRank = priorityRank.has(b.id) ? priorityRank.get(b.id) : 1000;
                if (aRank !== bRank) return aRank - bRank;
                return a._sourceIndex - b._sourceIndex;
            }
            if (sortVal === 'name') return a.title.localeCompare(b.title);
            if (sortVal === 'rank') return this.rankWeight(a.rank) - this.rankWeight(b.rank);

            // Sort by deadline with closed venues always listed last.
            const aBucket = this.deadlineBucket(a);
            const bBucket = this.deadlineBucket(b);
            if (aBucket !== bBucket) return aBucket - bBucket;

            if (aBucket === 0) {
                return a._deadlineDT.toMillis() - b._deadlineDT.toMillis();
            }

            if (aBucket === 2) {
                return a._deadlineDT.toMillis() - b._deadlineDT.toMillis();
            }

            return a._sourceIndex - b._sourceIndex;
        });

        return items;
    }

    renderStats(items) {
        const upcoming30 = items.filter((item) => {
            const days = this.daysUntil(item._deadlineDT);
            return days >= 0 && days <= 30;
        }).length;
        const upcoming90 = items.filter((item) => {
            const days = this.daysUntil(item._deadlineDT);
            return days >= 0 && days <= 90;
        }).length;

        this.statsContainer.innerHTML = '';
        const stats = [
            { label: 'Total Venues', value: items.length },
            { label: 'Next 30 Days', value: upcoming30 },
            { label: 'Next 90 Days', value: upcoming90 }
        ];

        stats.forEach((stat) => {
            const card = document.createElement('div');
            card.className = 'deadline-stats-card';
            card.innerHTML = `<h4>${stat.label}</h4><p>${stat.value}</p>`;
            this.statsContainer.appendChild(card);
        });
    }

    createCard(item) {
        const article = document.createElement('article');
        article.className = 'card deadline-card';

        const body = document.createElement('div');
        body.className = 'card__body';

        const titleRow = document.createElement('div');
        titleRow.className = 'deadline-card-title';
        const title = document.createElement('h3');
        title.textContent = item.title;
        titleRow.appendChild(title);
        if (item.rank) {
            const rank = document.createElement('span');
            rank.className = 'deadline-rank';
            rank.textContent = item.rank;
            titleRow.appendChild(rank);
        }

        const countdown = document.createElement('span');
        countdown.className = `status countdown status--${this.urgencyStatus(item._deadlineDT)}`;
        countdown.dataset.id = item.id;

        const info = document.createElement('small');
        if (item._deadlineDT && item._deadlineDT.isValid) {
            info.textContent = `Deadline: ${item._deadlineDT.toLocaleString(this.DateTime.DATETIME_MED)}`;
        } else if (item.submission_type === 'continuous') {
            info.textContent = 'Continuous submissions';
        } else {
            info.textContent = 'TBA';
        }

        const tagList = document.createElement('div');
        tagList.className = 'deadline-tag-list';
        (item.tags || []).forEach((tagText) => {
            const tag = document.createElement('span');
            tag.className = 'deadline-tag';
            tag.textContent = tagText;
            tagList.appendChild(tag);
        });

        const details = document.createElement('div');
        details.className = 'deadline-details';
        let detailsHTML = `<p><strong>Full Name:</strong> ${item.full_name || item.title}</p>`;
        if (item.abstract_deadline) {
            const abstractDeadline = this.parseDeadline(item.abstract_deadline, item.timezone);
            if (abstractDeadline?.isValid) {
                detailsHTML += `<p><strong>Abstract Deadline:</strong> ${abstractDeadline.toLocaleString(this.DateTime.DATETIME_MED)}</p>`;
            }
        }
        if (item.date) detailsHTML += `<p><strong>Event Date:</strong> ${item.date}</p>`;
        if (item.city) detailsHTML += `<p><strong>Location:</strong> ${item.city}${item.country ? `, ${item.country}` : ''}</p>`;
        if (item.link) detailsHTML += `<p><strong>Website:</strong> <a href="${item.link}" target="_blank" rel="noopener noreferrer">${item.link}</a></p>`;
        if (item.crawl?.last_checked) detailsHTML += `<p><strong>Last Checked:</strong> ${item.crawl.last_checked}</p>`;
        if (item.crawl?.status) detailsHTML += `<p><strong>Crawl Status:</strong> ${item.crawl.status}</p>`;
        if (item.notes || item.note) detailsHTML += `<p><em>${item.notes || item.note}</em></p>`;
        if (item._ics) detailsHTML += `<p><a href="${item._ics}" download="${item.id}.ics" rel="noopener noreferrer">Add to calendar (.ics)</a></p>`;
        details.innerHTML = detailsHTML;

        body.appendChild(titleRow);
        body.appendChild(countdown);
        body.appendChild(info);
        body.appendChild(tagList);
        body.appendChild(details);
        article.appendChild(body);

        article.addEventListener('click', (event) => {
            if (event.target.tagName === 'A') return;
            article.classList.toggle('expanded');
        });

        return article;
    }

    render() {
        const items = this.applyFiltersAndSort();
        this.renderStats(items);
        this.cardsContainer.innerHTML = '';

        if (!items.length) {
            this.cardsContainer.innerHTML = '<p class="deadline-empty">No venues match the current filters.</p>';
            return;
        }

        items.forEach((item) => {
            this.cardsContainer.appendChild(this.createCard(item));
        });

        this.updateCountdowns();
    }

    updateCountdowns() {
        const nowMillis = this.DateTime.local().toMillis();
        const allItems = this.getAllItems();

        this.cardsContainer.querySelectorAll('.countdown').forEach((element) => {
            const itemId = element.dataset.id;
            const item = allItems.find((candidate) => candidate.id === itemId);
            if (!item) return;

            const deadline = this.parseDeadline(item.deadline, item.timezone);
            if (!deadline || !deadline.isValid) {
                element.textContent = 'Continuous';
                element.className = 'status countdown status--success';
                return;
            }

            const remainingMillis = deadline.toMillis() - nowMillis;
            if (remainingMillis <= 0) {
                element.textContent = 'Closed';
                element.className = 'status countdown status--info';
                return;
            }

            const totalMinutes = Math.floor(remainingMillis / 60000);
            const days = Math.floor(totalMinutes / (24 * 60));
            const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
            const minutes = totalMinutes % 60;
            element.textContent = `${days}d ${hours}h ${minutes}m`;
            element.className = `status countdown status--${this.urgencyStatus(deadline)}`;
        });
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
    new ConferenceTrackerManager();
    
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
