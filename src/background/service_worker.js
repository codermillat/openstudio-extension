/**
 * OpenStudio Service Worker
 * Handles background tasks, API management, and cross-tab communication
 */

// Constants - inline for service worker compatibility
const STORAGE_KEYS = {
    API_KEYS: 'openstudio_api_keys',
    USER_SETTINGS: 'openstudio_settings',
    ANALYTICS_DATA: 'openstudio_analytics',
    SEO_CACHE: 'openstudio_seo_cache'
};

const TIMING = {
    CLEANUP_INTERVAL: 60 * 60 * 1000 // 1 hour
};

const URLS = {
    YOUTUBE_STUDIO: 'https://studio.youtube.com'
};

const VERSION = '1.0.2';

const DEFAULT_SETTINGS = {
    seoEnabled: true,
    autoSuggestions: true,
    tagRecommendations: false,
    titleOptimization: false,
    analyticsTracking: true,
    performanceAlerts: false,
    trendAnalysis: false,
    theme: 'light',
    notificationsEnabled: true,
    compactMode: false
};

// Service Worker Installation
chrome.runtime.onInstalled.addListener((details) => {
    // Initialize default settings
    initializeDefaultSettings();
    
    // Set up context menus if needed
    setupContextMenus();
});

/**
 * Initialize default settings on first install
 */
async function initializeDefaultSettings() {
    try {
        const existingSettings = await chrome.storage.local.get(STORAGE_KEYS.USER_SETTINGS);
        
        if (!existingSettings[STORAGE_KEYS.USER_SETTINGS]) {
            const defaultSettings = {
                ...DEFAULT_SETTINGS,
                installedDate: new Date().toISOString(),
                version: VERSION
            };
            
            await chrome.storage.local.set({
                [STORAGE_KEYS.USER_SETTINGS]: defaultSettings
            });
        }
    } catch (error) {
        console.error('Failed to initialize settings:', error);
    }
}

/**
 * Setup context menus for quick access
 */
function setupContextMenus() {
    try {
        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
                id: 'openstudio-seo-check',
                title: 'Analyze SEO for this video',
                contexts: ['page'],
                documentUrlPatterns: [URLS.YOUTUBE_STUDIO + '/*']
            });
            
            chrome.contextMenus.create({
                id: 'openstudio-quick-tags',
                title: 'Generate tag suggestions',
                contexts: ['page'],
                documentUrlPatterns: [URLS.YOUTUBE_STUDIO + '/*']
            });
        });
    } catch (error) {
        console.error('Failed to setup context menus:', error);
    }
}

// Context menu click handler
try {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        switch (info.menuItemId) {
            case 'openstudio-seo-check':
                handleSEOCheck(tab);
                break;
            case 'openstudio-quick-tags':
                handleTagGeneration(tab);
                break;
        }
    });
} catch (error) {
    console.error('Failed to setup context menu listener:', error);
}

/**
 * Handle SEO check request from context menu
 */
async function handleSEOCheck(tab) {
    try {
        await chrome.tabs.sendMessage(tab.id, {
            action: 'triggerSEOAnalysis',
            source: 'contextMenu'
        });
    } catch (error) {
        console.error('Failed to trigger SEO analysis:', error);
    }
}

/**
 * Handle tag generation request from context menu
 */
async function handleTagGeneration(tab) {
    try {
        await chrome.tabs.sendMessage(tab.id, {
            action: 'generateTags',
            source: 'contextMenu'
        });
    } catch (error) {
        console.error('Failed to generate tags:', error);
    }
}

// Message handling from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    switch (message.action) {
        case 'getSettings':
            handleGetSettings(sendResponse);
            break;
        case 'saveSettings':
            handleSaveSettings(message.settings, sendResponse);
            break;
        case 'getApiKeys':
            handleGetApiKeys(sendResponse);
            break;
        case 'saveApiKeys':
            handleSaveApiKeys(message.keys, sendResponse);
            break;
        case 'analyzeVideo':
            handleVideoAnalysis(message.data, sendResponse);
            break;
        case 'cacheData':
            handleCacheData(message.key, message.data, sendResponse);
            break;
        case 'getCachedData':
            handleGetCachedData(message.key, sendResponse);
            break;
        case 'generateTags':
            handleGenerateTags(message.data, sendResponse);
            break;
        case 'optimizeTitle':
            handleOptimizeTitle(message.data, sendResponse);
            break;
        case 'enhanceDescription':
            handleEnhanceDescription(message.data, sendResponse);
            break;
        default:
            console.warn('Unknown action:', message.action);
            sendResponse({ success: false, error: 'Unknown action' });
    }
    
    // Return true to indicate async response
    return true;
});

/**
 * Get user settings from storage
 */
async function handleGetSettings(sendResponse) {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.USER_SETTINGS);
        const settings = result[STORAGE_KEYS.USER_SETTINGS] || {};
        sendResponse({ 
            success: true, 
            settings: settings
        });
    } catch (error) {
        console.error('Failed to get settings:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Save user settings to storage
 */
async function handleSaveSettings(settings, sendResponse) {
    try {
        await chrome.storage.local.set({
            [STORAGE_KEYS.USER_SETTINGS]: settings
        });
        sendResponse({ success: true });
    } catch (error) {
        console.error('Failed to save settings:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Get API keys from storage
 */
async function handleGetApiKeys(sendResponse) {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEYS);
        const keys = result[STORAGE_KEYS.API_KEYS] || {};
        sendResponse({ 
            success: true, 
            keys: keys
        });
    } catch (error) {
        console.error('Failed to get API keys:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Save API keys to storage
 */
async function handleSaveApiKeys(keys, sendResponse) {
    try {
        await chrome.storage.local.set({
            [STORAGE_KEYS.API_KEYS]: keys
        });
        sendResponse({ success: true });
    } catch (error) {
        console.error('Failed to save API keys:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle video analysis requests
 */
async function handleVideoAnalysis(videoData, sendResponse) {
    try {
        // This would integrate with the SEO scoring logic
        
        // Placeholder for actual analysis
        const analysis = {
            seoScore: 75,
            suggestions: [
                'Consider adding more relevant keywords to title',
                'Description could be longer and more detailed',
                'Add more specific tags'
            ],
            timestamp: new Date().toISOString()
        };
        
        sendResponse({ success: true, analysis });
    } catch (error) {
        console.error('Failed to analyze video:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Cache data for performance optimization
 */
async function handleCacheData(key, data, sendResponse) {
    try {
        const cacheKey = `${STORAGE_KEYS.SEO_CACHE}_${key}`;
        await chrome.storage.local.set({
            [cacheKey]: {
                data,
                timestamp: Date.now()
            }
        });
        sendResponse({ success: true });
    } catch (error) {
        console.error('Failed to cache data:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Get cached data
 */
async function handleGetCachedData(key, sendResponse) {
    try {
        const cacheKey = `${STORAGE_KEYS.SEO_CACHE}_${key}`;
        const result = await chrome.storage.local.get(cacheKey);
        const cachedItem = result[cacheKey];
        
        // Check if cache is still valid (24 hours)
        const isValid = cachedItem && 
                       (Date.now() - cachedItem.timestamp) < (24 * 60 * 60 * 1000);
        
        sendResponse({ 
            success: true, 
            data: isValid ? cachedItem.data : null,
            cached: !!isValid
        });
    } catch (error) {
        console.error('Failed to get cached data:', error);
        sendResponse({ success: false, error: error.message });
    }
}

/**
 * Handle tag generation requests
 */
async function handleGenerateTags(data, sendResponse) {
    try {
        // Check if API keys are configured
        const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEYS);
        const apiKeys = result[STORAGE_KEYS.API_KEYS] || {};
        
        if (!apiKeys.gemini) {
            sendResponse({ 
                success: false, 
                error: 'API key configuration required. Please configure your Google Gemini API key in settings.' 
            });
            return;
        }

        // For now, return a simple mock response
        // In a real implementation, this would call the Gemini API
        const mockTags = [
            data.title ? data.title.split(' ').slice(0, 3).join(', ') : 'video',
            'tutorial',
            'educational'
        ];

        sendResponse({
            success: true,
            tags: mockTags,
            message: 'Tags generated successfully'
        });
    } catch (error) {
        console.error('Tag generation failed:', error);
        sendResponse({ 
            success: false, 
            error: 'Tag generation failed: ' + error.message 
        });
    }
}

/**
 * Handle title optimization requests
 */
async function handleOptimizeTitle(data, sendResponse) {
    try {
        // Check if API keys are configured
        const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEYS);
        const apiKeys = result[STORAGE_KEYS.API_KEYS] || {};
        
        if (!apiKeys.gemini) {
            sendResponse({ 
                success: false, 
                error: 'API key configuration required. Please configure your Google Gemini API key in settings.' 
            });
            return;
        }

        // For now, return a simple mock response
        const optimizedTitle = data.title ? 
            `${data.title} | Ultimate Guide 2025` : 
            'Optimized Video Title | Ultimate Guide 2025';

        sendResponse({
            success: true,
            optimizedTitle: optimizedTitle,
            message: 'Title optimized successfully'
        });
    } catch (error) {
        console.error('Title optimization failed:', error);
        sendResponse({ 
            success: false, 
            error: 'Title optimization failed: ' + error.message 
        });
    }
}

/**
 * Handle description enhancement requests
 */
async function handleEnhanceDescription(data, sendResponse) {
    try {
        // Check if API keys are configured
        const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEYS);
        const apiKeys = result[STORAGE_KEYS.API_KEYS] || {};
        
        if (!apiKeys.gemini) {
            sendResponse({ 
                success: false, 
                error: 'API key configuration required. Please configure your Google Gemini API key in settings.' 
            });
            return;
        }

        // For now, return a simple mock response
        const enhancedDescription = data.description ? 
            `${data.description}\n\n🔥 Don't forget to LIKE and SUBSCRIBE for more content!\n📱 Follow us on social media for updates.\n💬 Let us know your thoughts in the comments below!` : 
            'Enhanced video description with engaging call-to-action and social media promotion.';

        sendResponse({
            success: true,
            enhancedDescription: enhancedDescription,
            message: 'Description enhanced successfully'
        });
    } catch (error) {
        console.error('Description enhancement failed:', error);
        sendResponse({ 
            success: false, 
            error: 'Description enhancement failed: ' + error.message 
        });
    }
}



// Content scripts are automatically injected via manifest.json
// Tab listener removed to prevent conflicts with manifest injection

// Clean up old cache data periodically
setInterval(cleanupCache, TIMING.CLEANUP_INTERVAL);

/**
 * Clean up expired cache entries
 */
async function cleanupCache() {
    try {
        const storage = await chrome.storage.local.get();
        const expiredKeys = [];
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        
        Object.keys(storage).forEach(key => {
            if (key.startsWith(STORAGE_KEYS.SEO_CACHE)) {
                const item = storage[key];
                if (item.timestamp && (Date.now() - item.timestamp) > maxAge) {
                    expiredKeys.push(key);
                }
            }
        });
        
        if (expiredKeys.length > 0) {
            await chrome.storage.local.remove(expiredKeys);
        }
    } catch (error) {
        console.error('Failed to cleanup cache:', error);
    }
}
