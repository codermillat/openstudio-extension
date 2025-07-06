(() => {
/**
 * OpenStudio Content Script - YouTube Studio UI Injection
 * Injects SEO assistant and optimization tools into YouTube Studio pages
 * v1.0.2-enterprise
 */

// Enhanced duplicate injection prevention for enterprise use
if (typeof window.OpenStudio === 'undefined') {
    console.error('OpenStudio: Core namespace not loaded - initialization failed');
    throw new Error('OpenStudio core dependencies not loaded');
}

if (window.OpenStudio.State && window.OpenStudio.State.isInjected) {
    console.log('OpenStudio: Content script already initialized, skipping');
    return;
}

// Global state in namespace
if (typeof window.OpenStudio.State === 'undefined') {
    window.OpenStudio.State = {
        isInjected: false,
        currentPage: null,
        seoPanel: null,
        observer: null,
        retryCount: 0
    };
}

// Initialize content script with enterprise-grade error handling
function initializeContentScript() {
    try {
        console.log('OpenStudio: Initializing content script v1.0.2-enterprise');
        
        // Verify required dependencies
        if (!window.OpenStudio.DOM || !window.OpenStudio.SELECTORS) {
            throw new Error('Required OpenStudio dependencies not loaded');
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
        window.OpenStudio.State.isInjected = true;
        console.log('OpenStudio: Content script initialized successfully');
        
    } catch (error) {
        console.error('OpenStudio: Critical initialization failure:', error);
        
        // Attempt graceful degradation
        try {
            if (window.OpenStudio && window.OpenStudio.State) {
                window.OpenStudio.State.isInjected = false;
                window.OpenStudio.State.currentPage = 'error';
            }
        } catch (recoveryError) {
            console.error('OpenStudio: Recovery failed:', recoveryError);
        }
        
        // Don't throw to prevent page breaking
        return false;
    }
}

/**
 * Detect the current YouTube Studio page type
 */
function detectPageType() {
    try {
        const url = window.location.href;
        
        if (url.includes('/video/') && url.includes('/edit')) {
            window.OpenStudio.State.currentPage = 'video-edit';
        } else if (url.includes('/create/upload')) {
            window.OpenStudio.State.currentPage = 'upload';
        } else if (url.includes('/analytics')) {
            window.OpenStudio.State.currentPage = 'analytics';
        } else if (url.includes('/dashboard')) {
            window.OpenStudio.State.currentPage = 'dashboard';
        } else {
            window.OpenStudio.State.currentPage = 'other';
        }
        
        console.log('OpenStudio: Detected page type:', window.OpenStudio.State.currentPage);
        
    } catch (error) {
        console.error('OpenStudio: Error detecting page type:', error);
        window.OpenStudio.State.currentPage = 'unknown';
    }
}

/**
 * Set up monitoring for page changes (SPA navigation)
 */
function setupPageMonitoring() {
    try {
        // Clean up existing observer
        if (window.OpenStudio.State.observer) {
            window.OpenStudio.State.observer.disconnect();
        }
        
        let lastUrl = window.location.href;
        
        window.OpenStudio.State.observer = new MutationObserver(() => {
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
        
        window.OpenStudio.State.observer.observe(document.body, {
            childList: true,
            subtree: true
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
        switch (window.OpenStudio.State.currentPage) {
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
                console.log('OpenStudio: No UI injection for page type:', window.OpenStudio.State.currentPage);
        }
    } catch (error) {
        console.error('OpenStudio: Error injecting UI:', error);
    }
}

/**
 * Inject SEO assistant panel into video edit page with proper retry logic
 */
async function injectVideoEditUI() {
    try {
        console.log('OpenStudio: Attempting to inject video edit UI');
        
        if (window.OpenStudio.State.isInjected) {
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
        
        // Try multiple injection locations
        const injectionTargets = [
            window.OpenStudio.SELECTORS.VIDEO_EDIT_SIDEBAR,
            '.ytcp-video-metadata-editor-sidebar',
            '.ytcp-video-edit-basics-sidebar',
            '.metadata-editor-sidebar',
            '.video-edit-right-panel'
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
        window.OpenStudio.State.seoPanel = createSEOAssistantPanel();
        
        if (window.OpenStudio.State.seoPanel && window.OpenStudio.DOM.safeAppendChild(sidebar, window.OpenStudio.State.seoPanel)) {
            window.OpenStudio.State.isInjected = true;
            console.log('OpenStudio: Video edit UI injected successfully');
            
            // Show success notification
                            showNotification('SEO Assistant panel injected successfully', 'success');
            
            // Initialize SEO analysis with delay
            setTimeout(() => {
                initializeSEOAnalysis();
            }, window.OpenStudio.TIMING.SEO_ANALYSIS_DELAY);
            
        } else {
            throw new Error('Failed to append SEO panel to container');
        }
        
    } catch (error) {
        console.error('OpenStudio: Failed to inject video edit UI:', error);
                    showNotification('Failed to inject SEO Assistant panel', 'error');
        
        // Reset retry count and try alternative injection
        window.OpenStudio.State.retryCount++;
        if (window.OpenStudio.State.retryCount < 3) {
            console.log('OpenStudio: Retrying injection, attempt:', window.OpenStudio.State.retryCount + 1);
            setTimeout(() => {
                injectVideoEditUI();
            }, window.OpenStudio.TIMING.RETRY_DELAY * 2);
        }
    }
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
            }
        `;
        
        window.OpenStudio.DOM.safeAppendChild(document.head, styles);
        
    } catch (error) {
        console.error('OpenStudio: Error adding panel styles:', error);
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
                        showNotification('Operation failed. Please try again.', 'error');
                    }
                });
            }
        });
        
    } catch (error) {
        console.error('OpenStudio: Error setting up panel event listeners:', error);
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
        
        // Send data to background for analysis
        const response = await chrome.runtime.sendMessage({
            action: 'analyzeVideo',
            data: videoData
        });
        
        if (response && response.success) {
            updateSEODisplay(response.analysis);
            showNotification('SEO analysis completed successfully', 'success');
        } else {
            throw new Error(response?.error || 'Analysis failed');
        }
        
    } catch (error) {
        console.error('OpenStudio: Failed to initialize SEO analysis:', error);
        
        // Show fallback data
        updateSEODisplay({
            seoScore: 0,
            suggestions: ['Unable to analyze. Please check your API keys in settings.']
        });
    }
}

/**
 * Get current video data from the page with defensive checks
 */
function getCurrentVideoData() {
    try {
        const titleElement = window.OpenStudio.DOM.safeQuerySelector(window.OpenStudio.SELECTORS.VIDEO_TITLE);
        const descriptionElement = window.OpenStudio.DOM.safeQuerySelector(window.OpenStudio.SELECTORS.VIDEO_DESCRIPTION);
        const tagsElement = window.OpenStudio.DOM.safeQuerySelector(window.OpenStudio.SELECTORS.VIDEO_TAGS);
        
        return {
            title: titleElement?.value || titleElement?.textContent || '',
            description: descriptionElement?.value || descriptionElement?.textContent || '',
            tags: tagsElement?.value || tagsElement?.textContent || '',
            url: window.location.href,
            timestamp: new Date().toISOString(),
            pageType: window.OpenStudio.State.currentPage
        };
        
    } catch (error) {
        console.error('OpenStudio: Error getting video data:', error);
        return null;
    }
}

/**
 * Update SEO display with analysis results (CSP-compliant)
 */
function updateSEODisplay(analysis) {
    try {
        if (!window.OpenStudio.State.seoPanel || !analysis) return;
        
        // Update main score
        const scoreElement = window.OpenStudio.DOM.safeQuerySelector('#seo-score', window.OpenStudio.State.seoPanel);
        if (scoreElement) {
            scoreElement.textContent = analysis.seoScore || '--';
        }
        
        // Update suggestions with safe DOM manipulation
        const suggestionsContainer = window.OpenStudio.DOM.safeQuerySelector('#seo-suggestions', window.OpenStudio.State.seoPanel);
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
            title: analysis?.titleScore || calculateTitleScore(),
            description: analysis?.descriptionScore || calculateDescriptionScore(),
            tags: analysis?.tagsScore || calculateTagsScore()
        };
        
        Object.keys(scores).forEach(metric => {
            const element = window.OpenStudio.DOM.safeQuerySelector(`#${metric}-score`, window.OpenStudio.State.seoPanel);
            if (element) {
                element.textContent = scores[metric];
            }
        });
        
    } catch (error) {
        console.error('OpenStudio: Error updating individual scores:', error);
    }
}

/**
 * Calculate title score based on current title
 */
function calculateTitleScore() {
    try {
        const titleElement = window.OpenStudio.DOM.safeQuerySelector(window.OpenStudio.SELECTORS.VIDEO_TITLE);
        const title = titleElement?.value || titleElement?.textContent || '';
        
        if (!title) return 0;
        
        let score = 0;
        
        // Length check (optimal 50-60 characters)
        if (title.length >= 30 && title.length <= 70) score += 30;
        else if (title.length >= 20 && title.length <= 80) score += 20;
        else score += 10;
        
        // Contains numbers (years, stats, etc.)
        if (/\d/.test(title)) score += 10;
        
        // Contains emotional words
        const emotionalWords = ['amazing', 'incredible', 'ultimate', 'best', 'worst', 'shocking'];
        if (emotionalWords.some(word => title.toLowerCase().includes(word))) score += 15;
        
        // Contains brackets or parentheses
        if (/[\[\]()]/.test(title)) score += 10;
        
        // All caps check (should be minimal)
        const capsRatio = (title.match(/[A-Z]/g) || []).length / title.length;
        if (capsRatio < 0.1) score += 15;
        
        return Math.min(score, 100);
        
    } catch (error) {
        console.error('OpenStudio: Error calculating title score:', error);
        return 0;
    }
}

/**
 * Calculate description score
 */
function calculateDescriptionScore() {
    try {
        const descElement = window.OpenStudio.DOM.safeQuerySelector(window.OpenStudio.SELECTORS.VIDEO_DESCRIPTION);
        const description = descElement?.value || descElement?.textContent || '';
        
        if (!description) return 0;
        
        let score = 0;
        
        // Length check (optimal 125+ characters)
        if (description.length >= 200) score += 30;
        else if (description.length >= 125) score += 20;
        else score += 10;
        
        // Contains links
        if (/https?:\/\//.test(description)) score += 15;
        
        // Contains hashtags
        if (/#\w+/.test(description)) score += 10;
        
        // Contains timestamps
        if (/\d+:\d+/.test(description)) score += 10;
        
        // Multiple lines/paragraphs
        if ((description.match(/\n/g) || []).length >= 2) score += 15;
        
        return Math.min(score, 100);
        
    } catch (error) {
        console.error('OpenStudio: Error calculating description score:', error);
        return 0;
    }
}

/**
 * Calculate tags score
 */
function calculateTagsScore() {
    try {
        const tagsElement = window.OpenStudio.DOM.safeQuerySelector(window.OpenStudio.SELECTORS.VIDEO_TAGS);
        const tags = tagsElement?.value || tagsElement?.textContent || '';
        
        if (!tags) return 0;
        
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        let score = 0;
        
        // Number of tags (optimal 5-15)
        if (tagArray.length >= 5 && tagArray.length <= 15) score += 40;
        else if (tagArray.length >= 3 && tagArray.length <= 20) score += 25;
        else score += 10;
        
        // Tag length variety
        const avgLength = tagArray.reduce((sum, tag) => sum + tag.length, 0) / tagArray.length;
        if (avgLength >= 3 && avgLength <= 15) score += 30;
        
        // Contains mix of single and multi-word tags
        const singleWords = tagArray.filter(tag => !tag.includes(' ')).length;
        const multiWords = tagArray.length - singleWords;
        if (singleWords > 0 && multiWords > 0) score += 30;
        
        return Math.min(score, 100);
        
    } catch (error) {
        console.error('OpenStudio: Error calculating tags score:', error);
        return 0;
    }
}

/**
 * Generate tag suggestions using AI
 */
async function generateTagSuggestions() {
    try {
        showNotification('Generating tags...', 'info');
        
        const videoData = getCurrentVideoData();
        if (!videoData || !videoData.title) {
            throw new Error('No video title available for tag generation');
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'generateTags',
            data: videoData
        });
        
        if (response && response.success && response.tags) {
            // Update tags field if available
            const tagsElement = window.OpenStudio.DOM.safeQuerySelector(window.OpenStudio.SELECTORS.VIDEO_TAGS);
            if (tagsElement) {
                const currentTags = tagsElement.value || '';
                const newTags = response.tags.join(', ');
                const combinedTags = currentTags ? `${currentTags}, ${newTags}` : newTags;
                
                tagsElement.value = combinedTags;
                tagsElement.dispatchEvent(new Event('input', { bubbles: true }));
            }
            
            showNotification(`Generated ${response.tags.length} tags successfully!`, 'success');
        } else {
            throw new Error(response?.error || 'Tag generation failed');
        }
        
    } catch (error) {
        console.error('OpenStudio: Tag generation failed:', error);
        showNotification('Tag generation feature requires API configuration', 'warning');
    }
}

/**
 * Optimize video title using AI
 */
async function optimizeTitle() {
    try {
        showNotification('Optimizing title...', 'info');
        
        const videoData = getCurrentVideoData();
        if (!videoData || !videoData.title) {
            throw new Error('No video title available for optimization');
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'optimizeTitle',
            data: videoData
        });
        
        if (response && response.success && response.optimizedTitle) {
            const titleElement = window.OpenStudio.DOM.safeQuerySelector(window.OpenStudio.SELECTORS.VIDEO_TITLE);
            if (titleElement) {
                titleElement.value = response.optimizedTitle;
                titleElement.dispatchEvent(new Event('input', { bubbles: true }));
                showNotification('Title optimized successfully!', 'success');
            }
        } else {
            throw new Error(response?.error || 'Title optimization failed');
        }
        
    } catch (error) {
        console.error('OpenStudio: Title optimization failed:', error);
        showNotification('Title optimization feature requires API configuration', 'warning');
    }
}

/**
 * Enhance video description using AI
 */
async function enhanceDescription() {
    try {
        showNotification('Enhancing description...', 'info');
        
        const videoData = getCurrentVideoData();
        if (!videoData) {
            throw new Error('No video data available for description enhancement');
        }
        
        const response = await chrome.runtime.sendMessage({
            action: 'enhanceDescription',
            data: videoData
        });
        
        if (response && response.success && response.enhancedDescription) {
            const descElement = window.OpenStudio.DOM.safeQuerySelector(window.OpenStudio.SELECTORS.VIDEO_DESCRIPTION);
            if (descElement) {
                descElement.value = response.enhancedDescription;
                descElement.dispatchEvent(new Event('input', { bubbles: true }));
                showNotification('Description enhanced successfully!', 'success');
            }
        } else {
            throw new Error(response?.error || 'Description enhancement failed');
        }
        
    } catch (error) {
        console.error('OpenStudio: Description enhancement failed:', error);
        showNotification('Description enhancement feature requires API configuration', 'warning');
    }
}

/**
 * Show notification to user (CSP-compliant)
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
            zIndex: '10000',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // Set color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4caf50';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#f44336';
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
 * Get current page data for popup
 */
function getCurrentPageData() {
    try {
        return {
            pageType: window.OpenStudio.State.currentPage,
            currentVideo: getCurrentVideoData(),
            isInjected: window.OpenStudio.State.isInjected,
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
        if (window.OpenStudio.State.isInjected && window.OpenStudio.State.seoPanel) {
            initializeSEOAnalysis();
        } else {
            showNotification('SEO Assistant not available on this page', 'warning');
        }
    } catch (error) {
        console.error('OpenStudio: Error triggering SEO analysis:', error);
        showNotification('Failed to trigger SEO analysis', 'error');
    }
}

/**
 * Update SEO score from external source
 */
function updateSEOScore(score) {
    try {
        if (window.OpenStudio.State.seoPanel) {
            const scoreElement = window.OpenStudio.DOM.safeQuerySelector('#seo-score', window.OpenStudio.State.seoPanel);
            if (scoreElement) {
                scoreElement.textContent = score || '--';
            }
        }
    } catch (error) {
        console.error('OpenStudio: Error updating SEO score:', error);
    }
}

/**
 * Clear SEO data display
 */
function clearSEOData() {
    try {
        if (window.OpenStudio.State.seoPanel) {
            const scoreElement = window.OpenStudio.DOM.safeQuerySelector('#seo-score', window.OpenStudio.State.seoPanel);
            const suggestionsElement = window.OpenStudio.DOM.safeQuerySelector('#seo-suggestions', window.OpenStudio.State.seoPanel);
            
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
                const element = window.OpenStudio.DOM.safeQuerySelector(`#${id}`, window.OpenStudio.State.seoPanel);
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
 * Inject UI for upload page
 */
async function injectUploadUI() {
    try {
        console.log('OpenStudio: Upload page UI injection not yet implemented');
        // TODO: Implement upload page UI injection
    } catch (error) {
        console.error('OpenStudio: Error injecting upload UI:', error);
    }
}

/**
 * Inject UI for analytics page
 */
async function injectAnalyticsUI() {
    try {
        console.log('OpenStudio: Analytics page UI injection not yet implemented');
        // TODO: Implement analytics page UI injection
    } catch (error) {
        console.error('OpenStudio: Error injecting analytics UI:', error);
    }
}

/**
 * Inject UI for dashboard page
 */
async function injectDashboardUI() {
    try {
        console.log('OpenStudio: Dashboard page UI injection not yet implemented');
        // TODO: Implement dashboard page UI injection
    } catch (error) {
        console.error('OpenStudio: Error injecting dashboard UI:', error);
    }
}

/**
 * Clean up previous injection
 */
function cleanupInjection() {
    try {
        if (window.OpenStudio.State.seoPanel) {
            window.OpenStudio.DOM.safeRemoveElement(window.OpenStudio.State.seoPanel);
        }
        
        // Remove styles if no panels exist
        const existingPanels = document.querySelectorAll('.openstudio-panel');
        if (existingPanels.length === 0) {
            const stylesElement = document.getElementById('openstudio-styles');
            if (stylesElement) {
                window.OpenStudio.DOM.safeRemoveElement(stylesElement);
            }
        }
        
        window.OpenStudio.State.isInjected = false;
        window.OpenStudio.State.seoPanel = null;
        window.OpenStudio.State.retryCount = 0;
        
    } catch (error) {
        console.error('OpenStudio: Error cleaning up injection:', error);
    }
}

// Initialize when script loads with proper error handling
try {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeContentScript);
    } else {
        initializeContentScript();
    }
} catch (error) {
    console.error('OpenStudio: Fatal error during initialization:', error);
}

})();
