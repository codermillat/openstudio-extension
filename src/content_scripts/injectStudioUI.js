(function() {
'use strict';

/**
 * OpenStudio Content Script - YouTube Studio UI Injection
 * Injects SEO assistant and optimization tools into YouTube Studio pages
 * v1.0.2-enterprise - Fixed with IIFE and robust fallback logic
 */

// Prevent duplicate injection
if (window.openStudioInjected) {
    console.log('OpenStudio: Content script already loaded, skipping');
    return;
}
window.openStudioInjected = true;

// Local state management (scoped to IIFE)
const state = {
    isInjected: false,
    currentPage: null,
    seoPanel: null,
    observer: null,
    retryCount: 0
};

// Cache for video data to prevent excessive DOM queries
const videoDataCache = {
    data: null,
    timestamp: 0,
    ttl: 5000, // 5 seconds TTL
    isValid() {
        return this.data && (Date.now() - this.timestamp) < this.ttl;
    },
    set(data) {
        this.data = data;
        this.timestamp = Date.now();
    },
    get() {
        return this.isValid() ? this.data : null;
    },
    clear() {
        this.data = null;
        this.timestamp = 0;
    }
};

// Initialize content script with comprehensive error handling
function initializeContentScript() {
    try {
        console.log('OpenStudio: Initializing content script v1.0.2-enterprise');
        
        // Verify required dependencies with fallbacks
        if (!window.OpenStudio) {
            console.warn('OpenStudio: Core namespace not loaded, using minimal fallback');
            setupMinimalOpenStudio();
        }
        
        // Detect current page type
        detectPageType();
        
        // Set up page monitoring
        setupPageMonitoring();
        
        // Inject UI based on page type
        injectUIForCurrentPage();
        
        // Listen for messages from popup/background
        setupMessageListener();
        
        // Mark as successfully initialized
        state.isInjected = true;
        console.log('OpenStudio: Content script initialized successfully');
        
    } catch (error) {
        console.error('OpenStudio: Critical initialization failure:', error);
        
        // Attempt graceful degradation
        try {
            state.isInjected = false;
            state.currentPage = 'error';
        } catch (recoveryError) {
            console.error('OpenStudio: Recovery failed:', recoveryError);
        }
        
        // Don't throw to prevent page breaking
        return false;
    }
}

/**
 * Setup minimal OpenStudio namespace if dependencies failed to load
 */
function setupMinimalOpenStudio() {
    window.OpenStudio = window.OpenStudio || {};
    
    // Minimal selectors fallback
    window.OpenStudio.SELECTORS = {
        VIDEO_TITLE: 'textarea[aria-label*="title" i], #video-title, input[placeholder*="title" i], textarea[placeholder*="title" i]',
        VIDEO_DESCRIPTION: 'textarea[aria-label*="description" i], #video-description, textarea[placeholder*="description" i]',
        VIDEO_TAGS: 'input[aria-label*="tags" i], #video-tags, input[placeholder*="tags" i]',
        MAIN_CONTENT: '.ytcp-main-content, .main-content, main, [role="main"]',
        VIDEO_EDIT_SIDEBAR: '.ytcp-video-edit-sidebar, .video-edit-sidebar, .sidebar, [data-testid*="sidebar"]'
    };
    
    // Minimal timing fallback
    window.OpenStudio.TIMING = {
        TIMEOUT: 10000,
        RETRY_DELAY: 500,
        INJECTION_RETRIES: 20,
        PAGE_CHANGE_DELAY: 1000,
        SEO_ANALYSIS_DELAY: 500,
        NOTIFICATION_TIMEOUT: 3000
    };
    
    // Minimal DOM utilities
    window.OpenStudio.DOM = {
        createElement: function(tag, attrs, text) {
            try {
                const element = document.createElement(tag);
                if (attrs) {
                    Object.entries(attrs).forEach(([key, value]) => {
                        if (key === 'className') {
                            element.className = value;
                        } else {
                            element.setAttribute(key, value);
                        }
                    });
                }
                if (text) {
                    element.textContent = text;
                }
                return element;
            } catch (error) {
                console.error('Failed to create element:', error);
                return null;
            }
        },
        
        safeAppendChild: function(parent, child) {
            try {
                if (parent && child) {
                    parent.appendChild(child);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Failed to append child:', error);
                return false;
            }
        },
        
        safeQuerySelector: function(selector, parent) {
            try {
                return (parent || document).querySelector(selector);
            } catch (error) {
                console.error('Query selector failed:', error);
                return null;
            }
        },
        
        safeAddEventListener: function(element, event, handler) {
            try {
                if (element && typeof handler === 'function') {
                    element.addEventListener(event, handler);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Failed to add event listener:', error);
                return false;
            }
        },
        
        safeRemoveElement: function(element) {
            try {
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                    return true;
                }
                return false;
            } catch (error) {
                console.error('Failed to remove element:', error);
                return false;
            }
        },
        
        waitForElement: async function(selector, options = {}) {
            const timeout = options.timeout || 10000;
            const retryInterval = options.retryInterval || 500;
            const maxRetries = options.maxRetries || 20;
            const parent = options.parent || document;
            
            let attempts = 0;
            
            return new Promise((resolve) => {
                function checkElement() {
                    const element = (parent || document).querySelector(selector);
                    
                    if (element) {
                        resolve(element);
                        return;
                    }
                    
                    attempts++;
                    if (attempts >= maxRetries) {
                        resolve(null);
                        return;
                    }
                    
                    setTimeout(checkElement, retryInterval);
                }
                
                checkElement();
            });
        }
    };
}

/**
 * Detect the current YouTube Studio page type
 */
function detectPageType() {
    try {
        const url = window.location.href;
        
        if (url.includes('/video/') && url.includes('/edit')) {
            state.currentPage = 'video-edit';
        } else if (url.includes('/create/upload')) {
            state.currentPage = 'upload';
        } else if (url.includes('/analytics')) {
            state.currentPage = 'analytics';
        } else if (url.includes('/dashboard')) {
            state.currentPage = 'dashboard';
        } else {
            state.currentPage = 'other';
        }
        
        console.log('OpenStudio: Detected page type:', state.currentPage);
        
    } catch (error) {
        console.error('OpenStudio: Error detecting page type:', error);
        state.currentPage = 'unknown';
    }
}

/**
 * Set up monitoring for page changes (SPA navigation)
 */
function setupPageMonitoring() {
    try {
        // Clean up existing observer
        if (state.observer) {
            state.observer.disconnect();
        }
        
        let lastUrl = window.location.href;
        
        state.observer = new MutationObserver(() => {
            try {
                if (window.location.href !== lastUrl) {
                    lastUrl = window.location.href;
                    console.log('OpenStudio: Page navigation detected');
                    
                    // Clean up previous injection
                    cleanupInjection();
                    
                    // Re-detect and inject with delay
                    detectPageType();
                    setTimeout(() => {
                        injectUIForCurrentPage();
                    }, window.OpenStudio.TIMING.PAGE_CHANGE_DELAY);
                }
            } catch (error) {
                console.error('OpenStudio: Error in page monitoring:', error);
            }
        });
        
        state.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Add form field change detection to invalidate cache
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea, [contenteditable="true"]')) {
                videoDataCache.clear();
                console.log('🔍 OpenStudio: Video data cache cleared due to form change');
            }
        });
        
    } catch (error) {
        console.error('OpenStudio: Error setting up page monitoring:', error);
    }
}

/**
 * Setup message listener for communication with popup/background
 */
function setupMessageListener() {
    try {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            try {
                switch (message.action) {
                    case 'getPageData':
                        sendResponse({
                            success: true,
                            data: getCurrentPageData()
                        });
                        break;
                        
                    case 'triggerSEOAnalysis':
                        triggerSEOAnalysis();
                        sendResponse({ success: true });
                        break;
                        
                    case 'generateTags':
                        generateTagSuggestions();
                        sendResponse({ success: true });
                        break;
                        
                    case 'updateSEOScore':
                        updateSEOScore(message.score);
                        sendResponse({ success: true });
                        break;
                        
                    default:
                        console.warn('OpenStudio: Unknown message action:', message.action);
                        sendResponse({ success: false, error: 'Unknown action' });
                }
            } catch (error) {
                console.error('OpenStudio: Error handling message:', error);
                sendResponse({ success: false, error: error.message });
            }
            
            return true;
        });
        
    } catch (error) {
        console.error('OpenStudio: Error setting up message listener:', error);
    }
}

/**
 * Inject UI components based on current page type
 */
async function injectUIForCurrentPage() {
    try {
        switch (state.currentPage) {
            case 'video-edit':
                await injectVideoEditUI();
                break;
            case 'upload':
                await injectUploadUI();
                break;
            case 'analytics':
                await injectAnalyticsUI();
                break;
            case 'dashboard':
                await injectDashboardUI();
                break;
            default:
                console.log('OpenStudio: No UI injection for page type:', state.currentPage);
        }
    } catch (error) {
        console.error('OpenStudio: Error injecting UI:', error);
    }
}

/**
 * Inject SEO assistant panel into video edit page with robust field detection
 */
async function injectVideoEditUI() {
    try {
        console.log('OpenStudio: Attempting to inject video edit UI');
        
        if (state.isInjected) {
            console.log('OpenStudio: UI already injected');
            return;
        }
        
        // Wait for main content container with retry logic
        const container = await window.OpenStudio.DOM.waitForElement(window.OpenStudio.SELECTORS.MAIN_CONTENT, {
            timeout: window.OpenStudio.TIMING.TIMEOUT,
            retryInterval: window.OpenStudio.TIMING.RETRY_DELAY,
            maxRetries: window.OpenStudio.TIMING.INJECTION_RETRIES
        });
        
        if (!container) {
            throw new Error('Main content container not found');
        }
        
        console.log('OpenStudio: Found main container:', container);
        
        // Try multiple injection locations with robust selectors
        const injectionTargets = [
            window.OpenStudio.SELECTORS.VIDEO_EDIT_SIDEBAR,
            '.ytcp-video-metadata-editor-sidebar',
            '.ytcp-video-edit-basics-sidebar',
            '.metadata-editor-sidebar',
            '.video-edit-right-panel',
            '[data-testid*="sidebar"]',
            '.ytcp-sidebar'
        ];
        
        let sidebar = null;
        for (const targetSelector of injectionTargets) {
            try {
                sidebar = await window.OpenStudio.DOM.waitForElement(targetSelector, {
                    timeout: 3000,
                    retryInterval: 200,
                    maxRetries: 5,
                    parent: container
                });
                if (sidebar) {
                    console.log('OpenStudio: Found sidebar with selector:', targetSelector);
                    break;
                }
            } catch (e) {
                console.log('OpenStudio: Sidebar not found with selector:', targetSelector);
            }
        }
        
        // If no sidebar found, try to inject into main container
        if (!sidebar) {
            console.log('OpenStudio: No sidebar found, injecting into main container');
            sidebar = container;
        }
        
        // Create and inject SEO assistant panel
        state.seoPanel = createSEOAssistantPanel();
        
        if (state.seoPanel && window.OpenStudio.DOM.safeAppendChild(sidebar, state.seoPanel)) {
            state.isInjected = true;
            console.log('OpenStudio: Video edit UI injected successfully');
            
            // Show success notification
            showNotification('✅ SEO Assistant panel injected successfully', 'success');
            
            // Initialize SEO analysis with delay
            setTimeout(() => {
                initializeSEOAnalysis();
            }, window.OpenStudio.TIMING.SEO_ANALYSIS_DELAY);
            
        } else {
            throw new Error('Failed to append SEO panel to container');
        }
        
    } catch (error) {
        console.error('OpenStudio: Failed to inject video edit UI:', error);
        showNotification('❌ Failed to inject SEO Assistant panel', 'error');
        
        // Reset retry count and try alternative injection
        state.retryCount++;
        if (state.retryCount < 3) {
            console.log('OpenStudio: Retrying injection, attempt:', state.retryCount + 1);
            setTimeout(() => {
                injectVideoEditUI();
            }, window.OpenStudio.TIMING.RETRY_DELAY * 2);
        }
    }
}

/**
 * Get current video data from the page with defensive field detection
 */
function getCurrentVideoData() {
    try {
        // Check cache first
        const cachedData = videoDataCache.get();
        if (cachedData) {
            console.log('🔍 OpenStudio: Using cached video data');
            return cachedData;
        }
        
        console.log('🔍 OpenStudio: Fetching fresh video data...');
        // Fixed selectors based on debug findings - YouTube Studio uses contenteditable
        const titleSelectors = [
            // Look for contenteditable that's likely to be title (shorter content, first occurrence)
            '[contenteditable="true"]',
            'ytcp-social-suggestion-input input',
            'textarea[aria-label*="title" i]',
            '#video-title',
            'input[placeholder*="title" i]',
            'textarea[placeholder*="title" i]',
            '[data-testid*="title"] input',
            '[data-testid*="title"] textarea',
            '.ytcp-video-title input',
            '.ytcp-video-title textarea'
        ];
        
        const descriptionSelectors = [
            // Look for contenteditable that's likely to be description (longer content)  
            'div[contenteditable="true"]',
            'ytcp-mention-textbox textarea',
            'textarea[aria-label*="description" i]',
            '#video-description',
            'textarea[placeholder*="description" i]',
            '[data-testid*="description"] textarea',
            '.ytcp-video-description textarea',
            'textarea[rows]',
            '.ytcp-mention-textbox',
            '[role="textbox"]'
        ];
        
        const tagSelectors = [
            // Primary selectors for current YouTube Studio (2024-2025)
            'input[aria-describedby*="tags"]',
            'input[data-testid*="tags"]',
            'input[placeholder*="tag" i]',
            'input[placeholder*="keyword" i]',
            'input[aria-label*="tag" i]',
            'input[aria-label*="keyword" i]',
            // Legacy and fallback selectors
            'ytcp-form-input-container[internalname="keywords"] input',
            '#video-tags',
            '[data-testid*="tags"] input',
            '.ytcp-video-tags input',
            'ytcp-chip-bar input',
            '.ytcp-chip-bar input',
            'ytcp-form-tags input',
            // Pattern-based detection for new layouts
            'input[type="text"]', // Will be filtered by context
            '[class*="tag"] input',
            '[class*="keyword"] input',
            '[class*="chip"] input',
            // Broader search for any input in a tags context
            '[role="textbox"][aria-label*="tag" i]',
            'input[name*="tag" i]',
            'input[id*="tag" i]'
        ];

        console.log('🔍 OpenStudio: Starting field detection debug...');
        
        // Debug: Log all available form elements with detailed info
        const allInputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
        console.log(`🔍 OpenStudio: Found ${allInputs.length} total input/textarea elements on page`);
        
        // Enhanced debugging - show first 10 inputs with all attributes
        Array.from(allInputs).slice(0, 10).forEach((input, index) => {
            const attrs = Array.from(input.attributes).map(attr => `${attr.name}="${attr.value}"`).join(' ');
            const content = (input.value || input.textContent || input.placeholder || '').substring(0, 50);
            console.log(`🔍 Input ${index + 1}: <${input.tagName.toLowerCase()} ${attrs}> content="${content}"`);
        });
        
        // Smart detection for contenteditable fields - need to distinguish title from description
        let titleElement = null;
        let titleSelectorUsed = null;
        let descriptionElement = null;
        let descriptionSelectorUsed = null;
        
        // First try specific non-contenteditable selectors
        console.log('🔍 OpenStudio: Searching for title field...');
        for (let i = 1; i < titleSelectors.length; i++) { // Skip first contenteditable selector
            const selector = titleSelectors[i];
            const element = document.querySelector(selector);
            console.log(`🔍 Title selector ${i + 1}/${titleSelectors.length}: "${selector}" -> ${element ? '✅ FOUND' : '❌ not found'}`);
            if (element) {
                titleElement = element;
                titleSelectorUsed = selector;
                console.log(`🔍 Title field value: "${element.value || element.textContent || element.innerText || 'EMPTY'}"`);
                break;
            }
        }
        
        console.log('🔍 OpenStudio: Searching for description field...');
        for (let i = 1; i < descriptionSelectors.length; i++) { // Skip first contenteditable selector
            const selector = descriptionSelectors[i];
            const element = document.querySelector(selector);
            console.log(`🔍 Description selector ${i + 1}/${descriptionSelectors.length}: "${selector}" -> ${element ? '✅ FOUND' : '❌ not found'}`);
            if (element) {
                descriptionElement = element;
                descriptionSelectorUsed = selector;
                const content = element.value || element.textContent || element.innerText || 'EMPTY';
                console.log(`🔍 Description field content: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
                break;
            }
        }
        
        // If no specific selectors worked, try smart contenteditable detection
        if (!titleElement || !descriptionElement) {
            console.log('🔍 OpenStudio: Using smart contenteditable detection...');
            const editableElements = document.querySelectorAll('[contenteditable="true"]');
            console.log(`🔍 Found ${editableElements.length} contenteditable elements`);
            
            if (editableElements.length >= 2) {
                // Assume first contenteditable is title, second is description
                if (!titleElement) {
                    titleElement = editableElements[0];
                    titleSelectorUsed = '[contenteditable="true"]:first-of-type';
                    console.log(`🔍 Title from contenteditable[0]: "${titleElement.textContent || 'EMPTY'}"`);
                }
                
                if (!descriptionElement) {
                    descriptionElement = editableElements[1];
                    descriptionSelectorUsed = '[contenteditable="true"]:nth-of-type(2)';
                    console.log(`🔍 Description from contenteditable[1]: "${(descriptionElement.textContent || 'EMPTY').substring(0, 100)}..."`);
                }
            } else if (editableElements.length === 1) {
                // Only one contenteditable found - determine if it's title or description by content length
                const content = editableElements[0].textContent || '';
                if (content.length < 150) {
                    // Likely title (shorter content)
                    if (!titleElement) {
                        titleElement = editableElements[0];
                        titleSelectorUsed = '[contenteditable="true"] (detected as title by length)';
                        console.log(`🔍 Title from single contenteditable: "${content}"`);
                    }
                } else {
                    // Likely description (longer content)
                    if (!descriptionElement) {
                        descriptionElement = editableElements[0];
                        descriptionSelectorUsed = '[contenteditable="true"] (detected as description by length)';
                        console.log(`🔍 Description from single contenteditable: "${content.substring(0, 100)}..."`);
                    }
                }
            }
        }
        
        // Try to find tags field with detailed logging and smart fallback
        let tagsElement = null;
        let tagsSelectorUsed = null;
        console.log('🔍 OpenStudio: Searching for tags field...');
        
        // First, try specific tag selectors
        for (let i = 0; i < tagSelectors.length; i++) {
            const selector = tagSelectors[i];
            const element = document.querySelector(selector);
            console.log(`🔍 Tags selector ${i + 1}/${tagSelectors.length}: "${selector}" -> ${element ? '✅ FOUND' : '❌ not found'}`);
            if (element) {
                tagsElement = element;
                tagsSelectorUsed = selector;
                console.log(`🔍 Tags field value: "${element.value || element.textContent || element.innerText || 'EMPTY'}"`);
                break;
            }
        }
        
        // Smart fallback: Look for inputs that are likely to be tags based on context
        if (!tagsElement) {
            console.log('🔍 OpenStudio: Trying smart tags detection...');
            const allTextInputs = document.querySelectorAll('input[type="text"], input:not([type])');
            
            for (const input of allTextInputs) {
                // Skip if it's already identified as title or description
                if (input === titleElement || input === descriptionElement) continue;
                
                // Check parent containers for tags-related keywords
                const container = input.closest('div, section, form, [class*="tag"], [class*="keyword"], [class*="chip"]');
                if (container) {
                    const containerText = container.textContent?.toLowerCase() || '';
                    const containerClass = container.className?.toLowerCase() || '';
                    const containerHtml = container.outerHTML?.toLowerCase() || '';
                    
                    if (containerText.includes('tag') || containerText.includes('keyword') || 
                        containerClass.includes('tag') || containerClass.includes('keyword') ||
                        containerHtml.includes('tag') || containerHtml.includes('keyword')) {
                        
                        tagsElement = input;
                        tagsSelectorUsed = 'Smart detection (container context)';
                        console.log(`🔍 Tags field found via smart detection: ${input.outerHTML.substring(0, 100)}...`);
                        break;
                    }
                }
                
                // Check if input has tags-related attributes
                const placeholder = input.placeholder?.toLowerCase() || '';
                const ariaLabel = input.getAttribute('aria-label')?.toLowerCase() || '';
                const id = input.id?.toLowerCase() || '';
                const name = input.name?.toLowerCase() || '';
                
                if (placeholder.includes('tag') || placeholder.includes('keyword') ||
                    ariaLabel.includes('tag') || ariaLabel.includes('keyword') ||
                    id.includes('tag') || id.includes('keyword') ||
                    name.includes('tag') || name.includes('keyword')) {
                    
                    tagsElement = input;
                    tagsSelectorUsed = 'Smart detection (attribute context)';
                    console.log(`🔍 Tags field found via attribute detection: ${input.outerHTML.substring(0, 100)}...`);
                    break;
                }
            }
        }
        
        // Last resort: Look for empty text inputs that might be tags
        if (!tagsElement) {
            console.log('🔍 OpenStudio: Trying last resort tags detection...');
            const emptyInputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'))
                .filter(input => !input.value && input !== titleElement && input !== descriptionElement);
            
            if (emptyInputs.length > 0) {
                // Take the first unused text input as potential tags field
                tagsElement = emptyInputs[0];
                tagsSelectorUsed = 'Last resort (empty input)';
                console.log(`🔍 Tags field found via last resort: ${tagsElement.outerHTML.substring(0, 100)}...`);
            }
        }

        // Enhanced debugging - show what we actually found
        console.log('🔍 OpenStudio: Field detection summary:');
        console.log(`  📝 Title: ${titleElement ? `FOUND with "${titleSelectorUsed}"` : '❌ NOT FOUND'}`);
        console.log(`  📄 Description: ${descriptionElement ? `FOUND with "${descriptionSelectorUsed}"` : '❌ NOT FOUND'}`);
        console.log(`  🏷️ Tags: ${tagsElement ? `FOUND with "${tagsSelectorUsed}"` : '❌ NOT FOUND'}`);

        // If no fields found, let's explore the page structure
        if (!titleElement && !descriptionElement && !tagsElement) {
            console.log('🔍 OpenStudio: No fields found! Exploring page structure...');
            explorePageStructure();
        }
        
        // Additional debugging if only tags is missing
        if ((titleElement || descriptionElement) && !tagsElement) {
            console.log('🔍 OpenStudio: Tags field missing, analyzing page for clues...');
            analyzePageForTags();
        }
        
        // Log warnings for missing fields
        if (!titleElement) {
            console.warn('OpenStudio: Missing video title field');
        }
        if (!descriptionElement) {
            console.warn('OpenStudio: Missing video description field');
        }
        if (!tagsElement) {
            console.warn('OpenStudio: Missing video tags field');
        }
        
        const videoData = {
            title: titleElement?.value || titleElement?.textContent || '',
            description: descriptionElement?.value || descriptionElement?.textContent || '',
            tags: tagsElement?.value || tagsElement?.textContent || '',
            url: window.location.href,
            timestamp: new Date().toISOString(),
            pageType: state.currentPage,
            fieldsFound: {
                title: !!titleElement,
                description: !!descriptionElement,
                tags: !!tagsElement
            }
        };
        
        // Cache the result
        videoDataCache.set(videoData);
        
        return videoData;
        
    } catch (error) {
        console.error('OpenStudio: Error getting video data:', error);
        return {
            title: '',
            description: '',
            tags: '',
            url: window.location.href,
            timestamp: new Date().toISOString(),
            pageType: state.currentPage,
            error: error.message
        };
    }
}

/**
 * Comprehensive page structure exploration for debugging
 */
function explorePageStructure() {
    try {
        const allInputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
        
        // Look for ytcp elements
        const ytcpElements = document.querySelectorAll('[class*="ytcp"]');
        console.log(`🔍 Found ${ytcpElements.length} elements with "ytcp" in class name`);
        
        // Look for form containers
        const formContainers = document.querySelectorAll('form, [class*="form"], [class*="input"], [class*="field"]');
        console.log(`🔍 Found ${formContainers.length} potential form containers`);
        
        // Log some form elements for inspection
        const sampleInputs = Array.from(allInputs).slice(0, 5);
        sampleInputs.forEach((input, index) => {
            const classes = input.className || 'no-class';
            const id = input.id || 'no-id';
            const placeholder = input.placeholder || 'no-placeholder';
            const type = input.type || input.tagName.toLowerCase();
            console.log(`🔍 Sample input ${index + 1}: <${type}> id="${id}" class="${classes}" placeholder="${placeholder}"`);
        });
        
        // Look for any elements with "tag" or "keyword" in their text content
        const potentialTagContainers = Array.from(document.querySelectorAll('*')).filter(el => {
            const text = el.textContent?.toLowerCase() || '';
            return text.includes('tag') || text.includes('keyword');
        }).slice(0, 5);
        
        console.log(`🔍 Found ${potentialTagContainers.length} elements with tag/keyword text`);
        potentialTagContainers.forEach((el, index) => {
            console.log(`🔍 Tag container ${index + 1}: ${el.tagName} "${el.textContent?.substring(0, 50)}..."`);
        });
        
    } catch (error) {
        console.error('🔍 Error exploring page structure:', error);
    }
}

/**
 * Analyze page specifically for tags field clues
 */
function analyzePageForTags() {
    try {
        // Look for sections that might contain tags
        const sections = document.querySelectorAll('section, div[class*="section"], div[class*="container"]');
        
        for (const section of sections) {
            const sectionText = section.textContent?.toLowerCase() || '';
            const sectionHtml = section.outerHTML?.toLowerCase() || '';
            
            if (sectionText.includes('tag') || sectionText.includes('keyword') || 
                sectionHtml.includes('tag') || sectionHtml.includes('keyword')) {
                
                console.log('🔍 Potential tags section found:');
                console.log(`   Text: "${sectionText.substring(0, 100)}..."`);
                
                // Look for inputs in this section
                const inputsInSection = section.querySelectorAll('input, textarea');
                console.log(`   Contains ${inputsInSection.length} input elements`);
                
                inputsInSection.forEach((input, index) => {
                    console.log(`   Input ${index + 1}: ${input.outerHTML.substring(0, 100)}...`);
                });
                
                break; // Found potential section, don't spam console
            }
        }
        
        // Check if tags section might be collapsed or hidden
        const hiddenInputs = document.querySelectorAll('input[style*="display: none"], input[hidden]');
        if (hiddenInputs.length > 0) {
            console.log(`🔍 Found ${hiddenInputs.length} hidden inputs that might be tags`);
        }
        
    } catch (error) {
        console.error('🔍 Error analyzing page for tags:', error);
    }
}

/**
 * Generate tag suggestions using AI or fallback
 */
async function generateTagSuggestions() {
    try {
        showNotification('🏷️ Generating tags...', 'info');
        
        const videoData = getCurrentVideoData();
        if (!videoData.title && !videoData.description) {
            showNotification('⚠️ No video title or description found. Please refresh or enter content manually.', 'warning');
            return;
        }
        
        // Send message to background script with proper structure
        const response = await chrome.runtime.sendMessage({
            action: 'generateTags',
            feature: 'tags',
            videoTitle: videoData.title,
            data: videoData
        });
        
        if (response && response.success && response.tags) {
            // Update tags field if available
            const tagsElement = findTagsField();
            if (tagsElement) {
                const currentTags = tagsElement.value || '';
                const newTags = response.tags.join(', ');
                const combinedTags = currentTags ? `${currentTags}, ${newTags}` : newTags;
                
                tagsElement.value = combinedTags;
                tagsElement.dispatchEvent(new Event('input', { bubbles: true }));
                tagsElement.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Show appropriate message based on source
            const message = response.message || `Generated ${response.tags.length} tags successfully!`;
            const notificationType = response.source === 'ai' ? 'success' : 'info';
            showNotification(`${notificationType === 'success' ? '✅' : '🧠'} ${message}`, notificationType);
        } else if (response && response.error) {
            throw new Error(response.error);
        } else {
            throw new Error('Invalid response from background script');
        }
        
    } catch (error) {
        console.error('OpenStudio: Tag generation failed:', error);
        const errorMessage = error.message.includes('title') ? 
            error.message : 
            'Tag generation failed. Please try again or check your settings.';
        showNotification(`❌ ${errorMessage}`, 'error');
    }
}

/**
 * Optimize video title using AI or fallback
 */
async function optimizeTitle() {
    try {
        showNotification('✨ Optimizing title...', 'info');
        
        const videoData = getCurrentVideoData();
        if (!videoData.title) {
            showNotification('⚠️ No video title found. Please refresh or enter a title manually.', 'warning');
            return;
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'optimizeTitle',
            feature: 'title',
            videoTitle: videoData.title,
            data: videoData
        });
        
        if (response && response.success && response.optimizedTitle) {
            const titleElement = findTitleField();
            if (titleElement) {
                titleElement.value = response.optimizedTitle;
                titleElement.dispatchEvent(new Event('input', { bubbles: true }));
                titleElement.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Show appropriate message based on source
                const message = response.message || 'Title optimized successfully!';
                const notificationType = response.source === 'ai' ? 'success' : 'info';
                showNotification(`${notificationType === 'success' ? '✅' : '🧠'} ${message}`, notificationType);
            }
        } else if (response && response.error) {
            throw new Error(response.error);
        } else {
            throw new Error('Invalid response from background script');
        }
        
    } catch (error) {
        console.error('OpenStudio: Title optimization failed:', error);
        const errorMessage = error.message.includes('title') ? 
            error.message : 
            'Title optimization failed. Please try again or check your settings.';
        showNotification(`❌ ${errorMessage}`, 'error');
    }
}

/**
 * Enhance video description using AI or fallback
 */
async function enhanceDescription() {
    try {
        showNotification('📝 Enhancing description...', 'info');
        
        const videoData = getCurrentVideoData();
        if (!videoData.title && !videoData.description) {
            showNotification('⚠️ No video content found. Please refresh or enter content manually.', 'warning');
            return;
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'enhanceDescription',
            feature: 'description',
            videoTitle: videoData.title,
            data: videoData
        });
        
        if (response && response.success && response.enhancedDescription) {
            const descElement = findDescriptionField();
            if (descElement) {
                descElement.value = response.enhancedDescription;
                descElement.dispatchEvent(new Event('input', { bubbles: true }));
                descElement.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Show appropriate message based on source
                const message = response.message || 'Description enhanced successfully!';
                const notificationType = response.source === 'ai' ? 'success' : 'info';
                showNotification(`${notificationType === 'success' ? '✅' : '🧠'} ${message}`, notificationType);
            }
        } else if (response && response.error) {
            throw new Error(response.error);
        } else {
            throw new Error('Invalid response from background script');
        }
        
    } catch (error) {
        console.error('OpenStudio: Description enhancement failed:', error);
        const errorMessage = error.message.includes('title') ? 
            error.message : 
            'Description enhancement failed. Please try again or check your settings.';
        showNotification(`❌ ${errorMessage}`, 'error');
    }
}

/**
 * Find title field with multiple selector attempts
 */
function findTitleField() {
    const selectors = [
        'ytcp-social-suggestion-input input',  // Primary current selector
        'textarea[aria-label*="title" i]',
        '#video-title',
        'input[placeholder*="title" i]',
        'textarea[placeholder*="title" i]',
        '[data-testid*="title"] input',
        '[data-testid*="title"] textarea'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}

/**
 * Find description field with multiple selector attempts
 */
function findDescriptionField() {
    const selectors = [
        'ytcp-mention-textbox textarea',  // Primary current selector
        'textarea[aria-label*="description" i]',
        '#video-description',
        'textarea[placeholder*="description" i]',
        '[data-testid*="description"] textarea'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}

/**
 * Find tags field with multiple selector attempts
 */
function findTagsField() {
    const selectors = [
        'ytcp-form-input-container[internalname="keywords"] input',  // Primary current selector
        'input[aria-label*="tags" i]',
        '#video-tags',
        'input[placeholder*="tags" i]',
        '[data-testid*="tags"] input'
    ];
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
    }
    return null;
}

/**
 * Create SEO Assistant Panel component using DOM API (CSP-compliant)
 */
function createSEOAssistantPanel() {
    try {
        // Main panel container
        const panel = window.OpenStudio.DOM.createElement('div', {
            id: 'openstudio-seo-panel',
            className: 'openstudio-panel'
        });
        
        if (!panel) {
            throw new Error('Failed to create panel element');
        }
        
        // Add styles first
        addPanelStyles();
        
        // Create header
        const header = createPanelHeader();
        
        // Create content
        const content = createPanelContent();
        
        // Append sections
        if (header && content) {
            window.OpenStudio.DOM.safeAppendChild(panel, header);
            window.OpenStudio.DOM.safeAppendChild(panel, content);
        }
        
        // Setup event listeners
        setupPanelEventListeners(panel);
        
        return panel;
        
    } catch (error) {
        console.error('OpenStudio: Error creating SEO assistant panel:', error);
        return null;
    }
}

/**
 * Create panel header (CSP-compliant)
 */
function createPanelHeader() {
    try {
        const header = window.OpenStudio.DOM.createElement('div', { className: 'openstudio-header' });
        
        const title = window.OpenStudio.DOM.createElement('h3', {}, '🎯 SEO Assistant');
        
        const toggleContainer = window.OpenStudio.DOM.createElement('div', { className: 'openstudio-toggle' });
        const toggleInput = window.OpenStudio.DOM.createElement('input', {
            type: 'checkbox',
            id: 'seo-enabled'
        });
        
        // Set checked property properly for CSP compliance
        if (toggleInput) {
            toggleInput.checked = true;
        }
        const toggleLabel = window.OpenStudio.DOM.createElement('label', { for: 'seo-enabled' }, 'Enabled');
        
        window.OpenStudio.DOM.safeAppendChild(toggleContainer, toggleInput);
        window.OpenStudio.DOM.safeAppendChild(toggleContainer, toggleLabel);
        
        window.OpenStudio.DOM.safeAppendChild(header, title);
        window.OpenStudio.DOM.safeAppendChild(header, toggleContainer);
        
        return header;
        
    } catch (error) {
        console.error('OpenStudio: Error creating panel header:', error);
        return null;
    }
}

/**
 * Create panel content (CSP-compliant)
 */
function createPanelContent() {
    try {
        const content = window.OpenStudio.DOM.createElement('div', { className: 'openstudio-content' });
        
        // Create score card
        const scoreCard = createScoreCard();
        
        // Create suggestions section
        const suggestionsSection = createSuggestionsSection();
        
        // Create actions section
        const actionsSection = createActionsSection();
        
        // Append all sections
        if (scoreCard) window.OpenStudio.DOM.safeAppendChild(content, scoreCard);
        if (suggestionsSection) window.OpenStudio.DOM.safeAppendChild(content, suggestionsSection);
        if (actionsSection) window.OpenStudio.DOM.safeAppendChild(content, actionsSection);
        
        return content;
        
    } catch (error) {
        console.error('OpenStudio: Error creating panel content:', error);
        return null;
    }
}

/**
 * Create score card section (CSP-compliant)
 */
function createScoreCard() {
    try {
        const scoreCard = window.OpenStudio.DOM.createElement('div', { className: 'seo-score-card' });
        
        // Score circle
        const scoreCircle = window.OpenStudio.DOM.createElement('div', { className: 'score-circle' });
        const scoreNumber = window.OpenStudio.DOM.createElement('span', { 
            className: 'score-number',
            id: 'seo-score'
        }, '--');
        const scoreLabel = window.OpenStudio.DOM.createElement('span', { className: 'score-label' }, 'SEO Score');
        
        window.OpenStudio.DOM.safeAppendChild(scoreCircle, scoreNumber);
        window.OpenStudio.DOM.safeAppendChild(scoreCircle, scoreLabel);
        
        // Score details
        const scoreDetails = window.OpenStudio.DOM.createElement('div', { className: 'score-details' });
        
        const metrics = [
            { id: 'title-score', label: 'Title' },
            { id: 'description-score', label: 'Description' },
            { id: 'tags-score', label: 'Tags' }
        ];
        
        metrics.forEach(metric => {
            const scoreItem = window.OpenStudio.DOM.createElement('div', { className: 'score-item' });
            const metricLabel = window.OpenStudio.DOM.createElement('span', { className: 'score-metric' }, metric.label);
            const metricValue = window.OpenStudio.DOM.createElement('span', { 
                className: 'score-value',
                id: metric.id
            }, '--');
            
            window.OpenStudio.DOM.safeAppendChild(scoreItem, metricLabel);
            window.OpenStudio.DOM.safeAppendChild(scoreItem, metricValue);
            window.OpenStudio.DOM.safeAppendChild(scoreDetails, scoreItem);
        });
        
        window.OpenStudio.DOM.safeAppendChild(scoreCard, scoreCircle);
        window.OpenStudio.DOM.safeAppendChild(scoreCard, scoreDetails);
        
        return scoreCard;
        
    } catch (error) {
        console.error('OpenStudio: Error creating score card:', error);
        return null;
    }
}

/**
 * Create suggestions section (CSP-compliant)
 */
function createSuggestionsSection() {
    try {
        const section = window.OpenStudio.DOM.createElement('div', { className: 'suggestions-section' });
        
        const title = window.OpenStudio.DOM.createElement('h4', {}, '💡 Suggestions');
        const suggestionsContainer = window.OpenStudio.DOM.createElement('div', { 
            id: 'seo-suggestions',
            className: 'suggestions-list'
        });
        
        const analyzingMessage = window.OpenStudio.DOM.createElement('p', { className: 'analyzing' }, 'Analyzing video metadata...');
        window.OpenStudio.DOM.safeAppendChild(suggestionsContainer, analyzingMessage);
        
        window.OpenStudio.DOM.safeAppendChild(section, title);
        window.OpenStudio.DOM.safeAppendChild(section, suggestionsContainer);
        
        return section;
        
    } catch (error) {
        console.error('OpenStudio: Error creating suggestions section:', error);
        return null;
    }
}

/**
 * Create actions section (CSP-compliant)
 */
function createActionsSection() {
    try {
        const section = window.OpenStudio.DOM.createElement('div', { className: 'actions-section' });
        
        const buttons = [
            { id: 'generate-tags', text: '🏷️ Generate Tags', className: 'action-btn primary' },
            { id: 'optimize-title', text: '✨ Optimize Title', className: 'action-btn secondary' },
            { id: 'enhance-description', text: '📝 Enhance Description', className: 'action-btn secondary' }
        ];
        
        buttons.forEach(buttonConfig => {
            const button = window.OpenStudio.DOM.createElement('button', {
                id: buttonConfig.id,
                className: buttonConfig.className
            }, buttonConfig.text);
            
            window.OpenStudio.DOM.safeAppendChild(section, button);
        });
        
        return section;
        
    } catch (error) {
        console.error('OpenStudio: Error creating actions section:', error);
        return null;
    }
}

/**
 * Setup event listeners for panel interactions (CSP-compliant)
 */
function setupPanelEventListeners(panel) {
    try {
        if (!panel) return;
        
        // SEO enabled toggle
        const toggleSwitch = window.OpenStudio.DOM.safeQuerySelector('#seo-enabled', panel);
        if (toggleSwitch) {
            window.OpenStudio.DOM.safeAddEventListener(toggleSwitch, 'change', (e) => {
                try {
                    if (e.target.checked) {
                        initializeSEOAnalysis();
                    } else {
                        clearSEOData();
                    }
                } catch (error) {
                    console.error('OpenStudio: Error in toggle handler:', error);
                }
            });
        }
        
        // Action buttons with defensive error handling
        const buttons = [
            { id: 'generate-tags', handler: generateTagSuggestions },
            { id: 'optimize-title', handler: optimizeTitle },
            { id: 'enhance-description', handler: enhanceDescription }
        ];
        
        buttons.forEach(({ id, handler }) => {
            const button = window.OpenStudio.DOM.safeQuerySelector(`#${id}`, panel);
            if (button) {
                window.OpenStudio.DOM.safeAddEventListener(button, 'click', (e) => {
                    try {
                        e.preventDefault();
                        handler();
                    } catch (error) {
                        console.error(`OpenStudio: Error in ${id} handler:`, error);
                        showNotification('❌ Operation failed. Please try again.', 'error');
                    }
                });
            }
        });
        
    } catch (error) {
        console.error('OpenStudio: Error setting up panel event listeners:', error);
    }
}

/**
 * Add CSS styles for the injected panels (CSP-compliant)
 */
function addPanelStyles() {
    try {
        // Check if styles already exist
        if (document.getElementById('openstudio-styles')) {
            return;
        }
        
        const styles = window.OpenStudio.DOM.createElement('style', { 
            id: 'openstudio-styles',
            type: 'text/css'
        });
        
        if (!styles) return;
        
        // Add styles using textContent for CSP compliance
        styles.textContent = `
            .openstudio-panel {
                background: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                margin: 16px 0;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                font-family: 'YouTube Sans', Roboto, Arial, sans-serif;
                max-width: 400px;
                z-index: 10000;
            }
            
            .openstudio-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #e0e0e0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px 8px 0 0;
            }
            
            .openstudio-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 500;
            }
            
            .openstudio-toggle {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .openstudio-toggle label {
                font-size: 14px;
                cursor: pointer;
            }
            
            .openstudio-content {
                padding: 20px;
            }
            
            .seo-score-card {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
                padding: 16px;
                background: #f8f9fa;
                border-radius: 6px;
            }
            
            .score-circle {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: conic-gradient(#667eea 0%, #e0e0e0 70%);
                position: relative;
            }
            
            .score-circle::before {
                content: '';
                position: absolute;
                inset: 6px;
                border-radius: 50%;
                background: white;
            }
            
            .score-number {
                font-size: 18px;
                font-weight: 600;
                color: #667eea;
                z-index: 1;
            }
            
            .score-label {
                font-size: 10px;
                color: #666;
                z-index: 1;
            }
            
            .score-details {
                flex: 1;
            }
            
            .score-item {
                display: flex;
                justify-content: space-between;
                margin: 8px 0;
                font-size: 14px;
            }
            
            .score-metric {
                color: #666;
            }
            
            .score-value {
                font-weight: 500;
                color: #333;
            }
            
            .suggestions-section h4 {
                margin: 0 0 12px 0;
                font-size: 14px;
                color: #333;
            }
            
            .suggestions-list {
                max-height: 120px;
                overflow-y: auto;
                margin: 0;
                padding: 0;
                list-style: none;
            }
            
            .suggestion-item {
                padding: 8px 12px;
                margin: 4px 0;
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 4px;
                font-size: 13px;
                color: #856404;
            }
            
            .analyzing {
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 20px;
                margin: 0;
            }
            
            .no-suggestions {
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 20px;
                margin: 0;
            }
            
            .actions-section {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-top: 16px;
            }
            
            .action-btn {
                padding: 10px 16px;
                border: none;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .action-btn.primary {
                background: #667eea;
                color: white;
            }
            
            .action-btn.primary:hover {
                background: #5a6fd8;
            }
            
            .action-btn.secondary {
                background: #f8f9fa;
                color: #495057;
                border: 1px solid #dee2e6;
            }
            
            .action-btn.secondary:hover {
                background: #e9ecef;
            }
            
            .openstudio-notification {
                font-family: 'YouTube Sans', Roboto, Arial, sans-serif;
                pointer-events: auto;
                z-index: 20000;
            }
        `;
        
        window.OpenStudio.DOM.safeAppendChild(document.head, styles);
        
    } catch (error) {
        console.error('OpenStudio: Error adding panel styles:', error);
    }
}

/**
 * Show notification to user (CSP-compliant) with proper color coding
 */
function showNotification(message, type = 'info') {
    try {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.openstudio-notification');
        existingNotifications.forEach(notification => {
            window.OpenStudio.DOM.safeRemoveElement(notification);
        });
        
        const notification = window.OpenStudio.DOM.createElement('div', {
            className: `openstudio-notification notification-${type}`
        }, message);
        
        if (!notification) return;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '4px',
            zIndex: '20000',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // Set color based on type - Green for AI, Blue for fallback, Red for errors
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4caf50';  // Green for AI success
                notification.style.color = 'white';
                break;
            case 'info':
                notification.style.backgroundColor = '#2196f3';  // Blue for fallback
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#f44336';  // Red for errors
                notification.style.color = 'white';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ff9800';
                notification.style.color = 'white';
                break;
            default:
                notification.style.backgroundColor = '#2196f3';
                notification.style.color = 'white';
        }
        
        window.OpenStudio.DOM.safeAppendChild(document.body, notification);
        
        // Auto-remove after timeout
        setTimeout(() => {
            window.OpenStudio.DOM.safeRemoveElement(notification);
        }, window.OpenStudio.TIMING.NOTIFICATION_TIMEOUT);
        
    } catch (error) {
        console.error('OpenStudio: Error showing notification:', error);
        console.log('OpenStudio:', message);
    }
}

/**
 * Initialize SEO analysis for current video
 */
async function initializeSEOAnalysis() {
    try {
        console.log('OpenStudio: Initializing SEO analysis');
        
        const videoData = getCurrentVideoData();
        if (!videoData) {
            throw new Error('No video data available');
        }
        
        // Use fallback analysis if FallbackHelper is available
        if (window.OpenStudio && window.OpenStudio.FallbackHelper) {
            const analysis = window.OpenStudio.FallbackHelper.analyzeSEOScore(
                videoData.title, 
                videoData.description, 
                videoData.tags
            );
            updateSEODisplay({
                seoScore: analysis.overallScore,
                titleScore: analysis.titleScore,
                descriptionScore: analysis.descriptionScore,
                tagsScore: analysis.tagsScore,
                suggestions: analysis.suggestions
            });
        } else {
            // Fallback to simple analysis
            updateSEODisplay({
                seoScore: videoData.title ? 50 : 0,
                suggestions: ['Configure API keys for detailed analysis', 'Add a compelling title', 'Write detailed description']
            });
        }
        
    } catch (error) {
        console.error('OpenStudio: Failed to initialize SEO analysis:', error);
        
        // Show fallback data
        updateSEODisplay({
            seoScore: 0,
            suggestions: ['Unable to analyze. Please check video content.']
        });
    }
}

/**
 * Update SEO display with analysis results (CSP-compliant)
 */
function updateSEODisplay(analysis) {
    try {
        if (!state.seoPanel || !analysis) return;
        
        // Update main score
        const scoreElement = window.OpenStudio.DOM.safeQuerySelector('#seo-score', state.seoPanel);
        if (scoreElement) {
            scoreElement.textContent = analysis.seoScore || '--';
        }
        
        // Update suggestions with safe DOM manipulation
        const suggestionsContainer = window.OpenStudio.DOM.safeQuerySelector('#seo-suggestions', state.seoPanel);
        if (suggestionsContainer && analysis.suggestions) {
            // Clear existing content safely
            while (suggestionsContainer.firstChild) {
                suggestionsContainer.removeChild(suggestionsContainer.firstChild);
            }
            
            if (Array.isArray(analysis.suggestions) && analysis.suggestions.length > 0) {
                const suggestionsList = window.OpenStudio.DOM.createElement('ul', { className: 'suggestions-list' });
                
                analysis.suggestions.forEach(suggestion => {
                    const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text || '';
                    const listItem = window.OpenStudio.DOM.createElement('li', { className: 'suggestion-item' }, suggestionText);
                    window.OpenStudio.DOM.safeAppendChild(suggestionsList, listItem);
                });
                
                window.OpenStudio.DOM.safeAppendChild(suggestionsContainer, suggestionsList);
            } else {
                const noSuggestions = window.OpenStudio.DOM.createElement('p', { className: 'no-suggestions' }, 'No suggestions available.');
                window.OpenStudio.DOM.safeAppendChild(suggestionsContainer, noSuggestions);
            }
        }
        
        // Update individual scores
        updateIndividualScores(analysis);
        
    } catch (error) {
        console.error('OpenStudio: Error updating SEO display:', error);
    }
}

/**
 * Update individual metric scores
 */
function updateIndividualScores(analysis) {
    try {
        // Extract scores from analysis or use defaults
        const scores = {
            title: analysis?.titleScore || '--',
            description: analysis?.descriptionScore || '--',
            tags: analysis?.tagsScore || '--'
        };
        
        Object.keys(scores).forEach(metric => {
            const element = window.OpenStudio.DOM.safeQuerySelector(`#${metric}-score`, state.seoPanel);
            if (element) {
                element.textContent = scores[metric];
            }
        });
        
    } catch (error) {
        console.error('OpenStudio: Error updating individual scores:', error);
    }
}

/**
 * Clear SEO data display
 */
function clearSEOData() {
    try {
        if (state.seoPanel) {
            const scoreElement = window.OpenStudio.DOM.safeQuerySelector('#seo-score', state.seoPanel);
            const suggestionsElement = window.OpenStudio.DOM.safeQuerySelector('#seo-suggestions', state.seoPanel);
            
            if (scoreElement) {
                scoreElement.textContent = '--';
            }
            
            if (suggestionsElement) {
                // Clear content safely
                while (suggestionsElement.firstChild) {
                    suggestionsElement.removeChild(suggestionsElement.firstChild);
                }
                const disabledMessage = window.OpenStudio.DOM.createElement('p', { className: 'analyzing' }, 'SEO Assistant disabled');
                window.OpenStudio.DOM.safeAppendChild(suggestionsElement, disabledMessage);
            }
            
            // Clear individual scores
            ['title-score', 'description-score', 'tags-score'].forEach(id => {
                const element = window.OpenStudio.DOM.safeQuerySelector(`#${id}`, state.seoPanel);
                if (element) {
                    element.textContent = '--';
                }
            });
        }
    } catch (error) {
        console.error('OpenStudio: Error clearing SEO data:', error);
    }
}

/**
 * Get current page data for popup
 */
function getCurrentPageData() {
    try {
        return {
            pageType: state.currentPage,
            currentVideo: getCurrentVideoData(),
            isInjected: state.isInjected,
            timestamp: new Date().toISOString(),
            version: '1.0.2-enterprise'
        };
    } catch (error) {
        console.error('OpenStudio: Error getting page data:', error);
        return {
            pageType: 'unknown',
            isInjected: false,
            timestamp: new Date().toISOString(),
            error: error.message
        };
    }
}

/**
 * Trigger SEO analysis from external request
 */
function triggerSEOAnalysis() {
    try {
        if (state.isInjected && state.seoPanel) {
            initializeSEOAnalysis();
        } else {
            showNotification('⚠️ SEO Assistant not available on this page', 'warning');
        }
    } catch (error) {
        console.error('OpenStudio: Error triggering SEO analysis:', error);
        showNotification('❌ Failed to trigger SEO analysis', 'error');
    }
}

/**
 * Update SEO score from external source
 */
function updateSEOScore(score) {
    try {
        if (state.seoPanel) {
            const scoreElement = window.OpenStudio.DOM.safeQuerySelector('#seo-score', state.seoPanel);
            if (scoreElement) {
                scoreElement.textContent = score || '--';
            }
        }
    } catch (error) {
        console.error('OpenStudio: Error updating SEO score:', error);
    }
}

/**
 * Clean up previous injection
 */
function cleanupInjection() {
    try {
        if (state.seoPanel) {
            window.OpenStudio.DOM.safeRemoveElement(state.seoPanel);
        }
        
        // Remove styles if no panels exist
        const existingPanels = document.querySelectorAll('.openstudio-panel');
        if (existingPanels.length === 0) {
            const stylesElement = document.getElementById('openstudio-styles');
            if (stylesElement) {
                window.OpenStudio.DOM.safeRemoveElement(stylesElement);
            }
        }
        
        state.isInjected = false;
        state.seoPanel = null;
        state.retryCount = 0;
        
    } catch (error) {
        console.error('OpenStudio: Error cleaning up injection:', error);
    }
}

})(); // End IIFE
