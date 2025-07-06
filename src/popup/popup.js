/**
 * OpenStudio Popup JavaScript
 * Handles popup UI interactions and status updates
 */

// Simple utility functions for safe DOM manipulation
function safeGetElementById(id) {
    try {
        return id ? document.getElementById(id) : null;
    } catch (error) {
        console.error('Error getting element by ID:', error);
        return null;
    }
}

function safeSetInnerHTML(element, html) {
    if (!element) return;
    
    // Simple HTML escaping
    const temp = document.createElement('div');
    temp.textContent = html;
    element.innerHTML = temp.innerHTML;
}

function createSafeSuggestionsList(suggestions) {
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return '<p class="no-suggestions">No suggestions available.</p>';
    }
    
    const listItems = suggestions.map(suggestion => {
        const text = typeof suggestion === 'string' ? suggestion : suggestion.text || '';
        const escapeDiv = document.createElement('div');
        escapeDiv.textContent = text;
        return `<li class="suggestion-item">${escapeDiv.innerHTML}</li>`;
    }).join('');
    
    return `<ul class="suggestions-list">${listItems}</ul>`;
}

function showError(message) {
    console.error('Error:', message);
    // You could implement a toast notification here
}

// Constants for configuration
const TIMING = {
    CACHE_TIMEOUT: 5000,
    ANALYTICS_CACHE_TIMEOUT: 30000,
    REFRESH_INTERVAL: 60000
};

const URLS = {
    YOUTUBE_STUDIO: 'https://studio.youtube.com',
    YOUTUBE_ANALYTICS: 'https://studio.youtube.com/channel/analytics',
    HELP_WIKI: 'https://github.com/openstudio-extension/openstudio/wiki/help'
};

const UI_MESSAGES = {
    ERRORS: {
        GENERIC: 'An unexpected error occurred. Please try again.'
    }
};

// DOM elements
let elements = {};

// Constants for configuration
const CACHE_TIMEOUT = TIMING.CACHE_TIMEOUT;
const ANALYTICS_CACHE_TIMEOUT = TIMING.ANALYTICS_CACHE_TIMEOUT;
const REFRESH_INTERVAL = TIMING.REFRESH_INTERVAL;

// Cache for popup data to avoid repeated API calls
let dataCache = {
    settings: null,
    apiKeys: null,
    lastUpdate: 0,
    cacheTimeout: CACHE_TIMEOUT
};

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', initializePopup);

/**
 * Initialize popup interface and load data
 */
async function initializePopup() {
    // Cache DOM elements
    cacheElements();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial data
    await loadPopupData();
    
    // Check current tab status
    await checkCurrentTabStatus();
}

/**
 * Cache frequently used DOM elements
 */
function cacheElements() {
    elements = {
        youtubeStatus: safeGetElementById('youtube-status'),
        apiStatus: safeGetElementById('api-status'),
        seoStatus: safeGetElementById('seo-status'),
        videosAnalyzed: safeGetElementById('videos-analyzed'),
        seoScore: safeGetElementById('seo-score'),
        openStudioBtn: safeGetElementById('open-studio'),
        openSettingsBtn: safeGetElementById('open-settings'),
        viewAnalyticsBtn: safeGetElementById('view-analytics'),
        
        // SEO Summary elements
        seoSummary: safeGetElementById('seo-summary'),
        titleScore: safeGetElementById('title-score'),
        descriptionScore: safeGetElementById('description-score'),
        tagsScore: safeGetElementById('tags-score'),
        seoSuggestions: safeGetElementById('seo-suggestions'),
        helpLink: safeGetElementById('help-link')
    };
}

/**
 * Set up event listeners for popup interactions
 */
function setupEventListeners() {
    // Open YouTube Studio button
    if (elements.openStudioBtn) {
        elements.openStudioBtn.addEventListener('click', () => {
            chrome.tabs.create({ 
                url: URLS.YOUTUBE_STUDIO
            });
            window.close();
        });
    }
    
    // Open settings button
    if (elements.openSettingsBtn) {
        elements.openSettingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
            window.close();
        });
    }
    
    // View analytics button
    if (elements.viewAnalyticsBtn) {
        elements.viewAnalyticsBtn.addEventListener('click', async () => {
            try {
                // Try to find existing YouTube Studio tab
                const tabs = await chrome.tabs.query({
                    url: 'https://studio.youtube.com/*'
                });
                
                if (tabs.length > 0) {
                    // Switch to existing tab
                    chrome.tabs.update(tabs[0].id, { active: true });
                    chrome.windows.update(tabs[0].windowId, { focused: true });
                } else {
                    // Open new tab to analytics
                    chrome.tabs.create({ 
                        url: URLS.YOUTUBE_ANALYTICS
                    });
                }
                window.close();
            } catch (error) {
                console.error('Failed to open analytics:', error);
                showError(UI_MESSAGES.ERRORS.GENERIC);
            }
        });
    }

    // Help link handler
    if (elements.helpLink) {
        elements.helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ 
                url: URLS.HELP_WIKI
            });
            window.close();
        });
    }
}

/**
 * Load initial popup data from storage and background with caching
 */
async function loadPopupData() {
    try {
        const now = Date.now();
        
        // Check if cached data is still valid
        if (dataCache.lastUpdate && (now - dataCache.lastUpdate) < dataCache.cacheTimeout) {
            if (dataCache.settings) updateUIFromSettings(dataCache.settings);
            if (dataCache.apiKeys) updateApiStatus(dataCache.apiKeys);
            return;
        }
        
        // Get user settings
        const settingsResponse = await sendMessageToBackground('getSettings');
        if (settingsResponse.success) {
            dataCache.settings = settingsResponse.settings;
            updateUIFromSettings(dataCache.settings);
        }
        
        // Get API key status
        const apiResponse = await sendMessageToBackground('getApiKeys');
        if (apiResponse.success) {
            dataCache.apiKeys = apiResponse.keys;
            updateApiStatus(dataCache.apiKeys);
        }
        
        // Update cache timestamp
        dataCache.lastUpdate = now;
        
        // Load analytics data (less frequent)
        if (!dataCache.lastAnalyticsUpdate || (now - dataCache.lastAnalyticsUpdate) > ANALYTICS_CACHE_TIMEOUT) {
            await loadAnalyticsData();
            dataCache.lastAnalyticsUpdate = now;
        }
        
    } catch (error) {
        console.error('Failed to load popup data:', error);
        showError('Failed to load extension data');
    }
}

/**
 * Check the status of the current tab
 */
async function checkCurrentTabStatus() {
    try {
        const [activeTab] = await chrome.tabs.query({ 
            active: true, 
            currentWindow: true 
        });
        
        if (activeTab && activeTab.url) {
            if (activeTab.url.includes('studio.youtube.com')) {
                updateYouTubeStatus('active', 'Active');
                
                // Try to get current page data
                try {
                    const response = await chrome.tabs.sendMessage(activeTab.id, {
                        action: 'getPageData'
                    });
                    
                    if (response && response.success) {
                        updatePageSpecificData(response.data);
                    }
                } catch (error) {
                    // Content script might not be injected yet
                }
            } else if (activeTab.url.includes('youtube.com')) {
                updateYouTubeStatus('pending', 'YouTube detected');
            } else {
                updateYouTubeStatus('inactive', 'Not on YouTube');
            }
        }
    } catch (error) {
        console.error('Failed to check tab status:', error);
        updateYouTubeStatus('inactive', 'Unknown');
    }
}

/**
 * Update UI elements based on user settings
 */
function updateUIFromSettings(settings) {
    if (settings.seoEnabled) {
        elements.seoStatus.textContent = 'Enabled';
        updateStatusIndicator(elements.seoStatus, 'active');
    } else {
        elements.seoStatus.textContent = 'Disabled';
        updateStatusIndicator(elements.seoStatus, 'inactive');
    }
}

/**
 * Update API key status in UI
 */
function updateApiStatus(keys) {
    const hasYouTubeKey = keys.youtube && keys.youtube.length > 0;
    const hasGeminiKey = keys.gemini && keys.gemini.length > 0;
    
    if (hasYouTubeKey && hasGeminiKey) {
        elements.apiStatus.textContent = 'Configured';
        updateStatusIndicator(elements.apiStatus, 'active');
    } else if (hasYouTubeKey || hasGeminiKey) {
        elements.apiStatus.textContent = 'Partial';
        updateStatusIndicator(elements.apiStatus, 'pending');
    } else {
        elements.apiStatus.textContent = 'Not configured';
        updateStatusIndicator(elements.apiStatus, 'inactive');
    }
}

/**
 * Update YouTube Studio status
 */
function updateYouTubeStatus(status, text) {
    elements.youtubeStatus.textContent = text;
    updateStatusIndicator(elements.youtubeStatus, status);
}

/**
 * Update status indicator color
 */
function updateStatusIndicator(element, status) {
    const parent = element.parentElement;
    const indicator = parent.querySelector('.status-indicator');
    
    if (indicator) {
        indicator.className = `status-indicator status-${status}`;
    }
}

/**
 * Load analytics data from storage
 */
async function loadAnalyticsData() {
    try {
        const cachedResponse = await sendMessageToBackground('getCachedData', {
            key: 'popup_analytics'
        });
        
        if (cachedResponse.success && cachedResponse.data) {
            const analytics = cachedResponse.data;
            elements.videosAnalyzed.textContent = analytics.videosAnalyzed || '0';
            elements.seoScore.textContent = analytics.avgSeoScore || '--';
        }
    } catch (error) {
        console.error('Failed to load analytics:', error);
    }
}

/**
 * Update page-specific data when on YouTube Studio
 */
function updatePageSpecificData(pageData) {
    if (pageData.currentVideo) {
        // Show SEO summary section
        elements.seoSummary.style.display = 'block';
        
        // Update individual scores
        if (pageData.currentVideo.seoAnalysis) {
            const analysis = pageData.currentVideo.seoAnalysis;
            updateScoreDisplay(elements.titleScore, analysis.titleScore);
            updateScoreDisplay(elements.descriptionScore, analysis.descriptionScore);
            updateScoreDisplay(elements.tagsScore, analysis.tagsScore);
            
            // Update overall SEO score
            elements.seoScore.textContent = analysis.overallScore || '--';
            
            // Update suggestions
            if (analysis.suggestions && analysis.suggestions.length > 0) {
                const suggestionsList = createSafeSuggestionsList(
                    analysis.suggestions.slice(0, 3) // Show top 3 suggestions
                );
                safeSetInnerHTML(elements.seoSuggestions, suggestionsList);
            } else {
                safeSetInnerHTML(elements.seoSuggestions, '<p class="no-suggestions">Analysis in progress...</p>');
            }
        }
        
        // Enable view analytics button if we have video data
        elements.viewAnalyticsBtn.disabled = false;
    } else {
        // Hide SEO summary if no video
        elements.seoSummary.style.display = 'none';
    }
}

/**
 * Update score display with color coding
 */
function updateScoreDisplay(element, score) {
    if (!element || !score) return;
    
    element.textContent = score;
    
    // Remove existing score classes
    element.classList.remove('good', 'average', 'poor');
    
    // Add appropriate class based on score
    if (score >= 80) {
        element.classList.add('good');
    } else if (score >= 60) {
        element.classList.add('average');
    } else if (score > 0) {
        element.classList.add('poor');
    }
}

/**
 * Send message to background script
 */
function sendMessageToBackground(action, data = {}) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({
            action,
            ...data
        }, (response) => {
            resolve(response || { success: false });
        });
    });
}

/**
 * Show error message in popup
 */
function showError(message) {
    // Create error element if it doesn't exist
    let errorElement = document.querySelector('.error-message');
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.cssText = `
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            margin: 10px 20px;
            border-radius: 4px;
            font-size: 12px;
            border: 1px solid #f5c6cb;
        `;
        document.querySelector('.content').prepend(errorElement);
    }
    
    errorElement.textContent = message;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.parentNode.removeChild(errorElement);
        }
    }, 5000);
}

/**
 * Handle keyboard shortcuts in popup
 */
document.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'Enter':
            if (event.target === elements.openStudioBtn) {
                elements.openStudioBtn.click();
            }
            break;
        case 'Escape':
            window.close();
            break;
        case 's':
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                elements.openSettingsBtn.click();
            }
            break;
    }
});

// Auto-refresh popup data using constant interval (reduced for production)
setInterval(loadPopupData, REFRESH_INTERVAL);
