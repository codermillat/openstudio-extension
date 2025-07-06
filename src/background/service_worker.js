/**
 * OpenStudio Service Worker
 * Handles background tasks, API management, and cross-tab communication
 */

// Inline AI helper for service worker (Manifest V3 compatibility)
const GEMINI_API_CONFIG = {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-1.5-pro',
    maxTokens: 8192,
    temperature: 0.7
};

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

// Global AI helper instance
let geminiHelper = null;

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
 * Simple inline AI helper class for service worker
 */
class SimpleAIHelper {
    constructor() {
        this.apiKey = null;
        this.isReady = false;
    }

    async initialize(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Valid API key is required');
        }
        this.apiKey = apiKey;
        this.isReady = true;
        return true;
    }

    async generateTags(videoData) {
        if (!this.isReady) throw new Error('AI helper not initialized');
        
        const prompt = `Generate 10-15 relevant YouTube tags for this video:
Title: ${videoData.title || 'Untitled'}
Description: ${videoData.description || 'No description'}

Return only a comma-separated list of tags, no explanations.`;

        const response = await this.callGeminiAPI(prompt);
        return response.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0).slice(0, 15);
    }

    async optimizeTitle(videoData) {
        if (!this.isReady) throw new Error('AI helper not initialized');
        
        const prompt = `Optimize this YouTube video title for better SEO and engagement:
Current title: ${videoData.title || 'Untitled'}
Description: ${videoData.description || 'No description'}

Provide only the optimized title, no explanations.`;

        const optimizedTitle = await this.callGeminiAPI(prompt);
        return { optimizedTitle: optimizedTitle.trim() };
    }

    async enhanceDescription(videoData) {
        if (!this.isReady) throw new Error('AI helper not initialized');
        
        const prompt = `Enhance this YouTube video description for better engagement and SEO:
Title: ${videoData.title || 'Untitled'}
Current description: ${videoData.description || 'No description provided'}

Create an enhanced description that includes:
- Engaging opening
- Clear structure
- Call-to-action
- Relevant keywords

Keep it between 150-300 words.`;

        return await this.callGeminiAPI(prompt);
    }

    async callGeminiAPI(prompt) {
        if (!this.apiKey) throw new Error('API key not configured');

        const url = `${GEMINI_API_CONFIG.baseUrl}/models/${GEMINI_API_CONFIG.model}:generateContent?key=${this.apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: GEMINI_API_CONFIG.temperature,
                    maxOutputTokens: GEMINI_API_CONFIG.maxTokens
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
        }

        const data = await response.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!content) {
            throw new Error('No content generated by AI');
        }

        return content;
    }
}

/**
 * Initialize AI helper with available API keys
 */
async function initializeAIHelper() {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEYS);
        const apiKeys = result[STORAGE_KEYS.API_KEYS] || {};
        
        if (apiKeys.geminiApiKey) {
            geminiHelper = new SimpleAIHelper();
            await geminiHelper.initialize(apiKeys.geminiApiKey);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to initialize AI helper:', error);
        geminiHelper = null;
        return false;
    }
}

/**
 * Get or create AI helper instance
 */
async function getAIHelper() {
    if (!geminiHelper) {
        await initializeAIHelper();
    }
    return geminiHelper;
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
    // Validate message structure
    if (!message || typeof message !== 'object') {
        console.warn('Invalid message structure:', message);
        sendResponse({ success: false, error: 'Invalid message structure' });
        return true;
    }

    // Validate required fields for content generation actions
    const contentActions = ['generateTags', 'optimizeTitle', 'enhanceDescription'];
    if (contentActions.includes(message.action)) {
        if (!message.data || !message.data.title) {
            console.warn('Missing required data for action:', message.action);
            sendResponse({ 
                success: false, 
                error: 'Missing video title. Please refresh the page or enter a title manually.' 
            });
            return true;
        }
    }
    
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
        
        // Invalidate AI helper to reinitialize with new keys
        geminiHelper = null;
        
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
        const aiHelper = await getAIHelper();
        
        if (aiHelper) {
            // Use real AI to generate tags
            try {
                const tags = await aiHelper.generateTags(data);
                sendResponse({
                    success: true,
                    tags: tags,
                    message: 'Tags generated using AI',
                    source: 'ai'
                });
                return;
            } catch (aiError) {
                console.error('AI tag generation failed:', aiError);
                // Fall through to fallback
            }
        }

        // Fallback: Generate smart tags based on content analysis
        const fallbackTags = generateFallbackTags(data);
        const hasApiKey = await checkApiKeyStatus();
        
        sendResponse({
            success: true,
            tags: fallbackTags,
            message: hasApiKey ? 'Using fallback tag generation (AI temporarily unavailable)' : 'Using smart tag generation (configure AI for enhanced suggestions)',
            source: 'fallback'
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
 * Generate fallback tags based on content analysis
 */
function generateFallbackTags(data) {
    const tags = [];
    const title = (data.title || '').toLowerCase();
    const description = (data.description || '').toLowerCase();
    const content = `${title} ${description}`;
    
    // Extract meaningful words
    const words = content.split(/\s+/)
        .filter(word => word.length > 3)
        .filter(word => !/^(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|man|new|now|old|see|two|way|who|boy|did|its|let|put|say|she|too|use)$/.test(word))
        .slice(0, 10);
    
    // Add relevant keywords based on content analysis
    if (title.includes('tutorial') || title.includes('how to') || title.includes('guide')) {
        tags.push('tutorial', 'howto', 'guide');
    }
    if (title.includes('review') || description.includes('review')) {
        tags.push('review', 'analysis');
    }
    if (title.includes('tips') || description.includes('tips')) {
        tags.push('tips', 'advice');
    }
    if (content.includes('beginner') || content.includes('learn')) {
        tags.push('beginner', 'learning');
    }
    
    // Add unique words from title/description
    tags.push(...words.slice(0, 5));
    
    // Remove duplicates and limit to 12 tags
    return [...new Set(tags)].slice(0, 12);
}

/**
 * Check API key status
 */
async function checkApiKeyStatus() {
    try {
        const result = await chrome.storage.local.get(STORAGE_KEYS.API_KEYS);
        const apiKeys = result[STORAGE_KEYS.API_KEYS] || {};
        return !!(apiKeys.geminiApiKey && apiKeys.geminiApiKey.length > 0);
    } catch (error) {
        return false;
    }
}

/**
 * Handle title optimization requests
 */
async function handleOptimizeTitle(data, sendResponse) {
    try {
        const aiHelper = await getAIHelper();
        
        if (aiHelper) {
            // Use real AI to optimize title
            try {
                const optimization = await aiHelper.optimizeTitle(data);
                const optimizedTitle = optimization.optimizedTitles?.[0] || optimization.optimizedTitle;
                
                sendResponse({
                    success: true,
                    optimizedTitle: optimizedTitle,
                    optimization: optimization,
                    message: 'Title optimized using AI',
                    source: 'ai'
                });
                return;
            } catch (aiError) {
                console.error('AI title optimization failed:', aiError);
                // Fall through to fallback
            }
        }

        // Fallback: Generate optimized title using heuristics
        const optimizedTitle = generateOptimizedTitle(data);
        const hasApiKey = await checkApiKeyStatus();
        
        sendResponse({
            success: true,
            optimizedTitle: optimizedTitle,
            message: hasApiKey ? 'Using fallback optimization (AI temporarily unavailable)' : 'Using smart optimization (configure AI for enhanced suggestions)',
            source: 'fallback'
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
 * Generate optimized title using heuristics
 */
function generateOptimizedTitle(data) {
    const title = data.title || 'Untitled Video';
    const words = title.split(' ');
    
    // If title is too short, add compelling elements
    if (title.length < 30) {
        const year = new Date().getFullYear();
        const variations = [
            `${title} - Complete Guide ${year}`,
            `${title}: Everything You Need to Know`,
            `${title} (Step by Step Tutorial)`,
            `${title} - Pro Tips & Tricks`,
            `Ultimate ${title} Guide`
        ];
        
        // Choose variation based on content type
        if (title.toLowerCase().includes('how') || title.toLowerCase().includes('tutorial')) {
            return variations[2]; // Step by step
        } else if (title.toLowerCase().includes('review')) {
            return `${title} - Honest Review ${year}`;
        } else if (title.toLowerCase().includes('tips')) {
            return variations[3]; // Pro tips
        } else {
            return variations[0]; // Complete guide
        }
    }
    
    // If title is good length, just add year if missing
    if (!title.includes('2024') && !title.includes('2025')) {
        return `${title} (${new Date().getFullYear()})`;
    }
    
    return title;
}

/**
 * Handle description enhancement requests
 */
async function handleEnhanceDescription(data, sendResponse) {
    try {
        const aiHelper = await getAIHelper();
        
        if (aiHelper) {
            // Use real AI to enhance description
            try {
                const enhancedDescription = await aiHelper.enhanceDescription(data);
                
                sendResponse({
                    success: true,
                    enhancedDescription: enhancedDescription,
                    message: 'Description enhanced using AI',
                    source: 'ai'
                });
                return;
            } catch (aiError) {
                console.error('AI description enhancement failed:', aiError);
                // Fall through to fallback
            }
        }

        // Fallback: Enhance description using content analysis
        const enhancedDescription = enhanceDescriptionFallback(data);
        const hasApiKey = await checkApiKeyStatus();
        
        sendResponse({
            success: true,
            enhancedDescription: enhancedDescription,
            message: hasApiKey ? 'Using fallback enhancement (AI temporarily unavailable)' : 'Using smart enhancement (configure AI for personalized improvements)',
            source: 'fallback'
        });
        
    } catch (error) {
        console.error('Description enhancement failed:', error);
        sendResponse({ 
            success: false, 
            error: 'Description enhancement failed: ' + error.message 
        });
    }
}

/**
 * Enhance description using heuristics and templates
 */
function enhanceDescriptionFallback(data) {
    const title = data.title || '';
    const description = data.description || '';
    
    // If description is empty or very short, create a basic one
    if (description.length < 50) {
        const basicDescription = createBasicDescription(title);
        return addEngagementElements(basicDescription);
    }
    
    // If description exists, enhance it
    let enhanced = description;
    
    // Add engaging opening if missing
    if (!description.toLowerCase().includes('welcome') && !description.toLowerCase().includes('in this video')) {
        enhanced = `🎯 In this video, we'll dive deep into ${title.toLowerCase() || 'this topic'}.\n\n${enhanced}`;
    }
    
    // Add structure if it's just a wall of text
    if (!enhanced.includes('\n') && enhanced.length > 200) {
        const sentences = enhanced.split('. ');
        if (sentences.length > 3) {
            enhanced = sentences.slice(0, 2).join('. ') + '.\n\n' + sentences.slice(2).join('. ');
        }
    }
    
    return addEngagementElements(enhanced);
}

/**
 * Create a basic description from title
 */
function createBasicDescription(title) {
    if (!title) {
        return 'Welcome to our channel! In this video, we share valuable insights and tips to help you succeed.';
    }
    
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('how to') || lowerTitle.includes('tutorial')) {
        return `🎯 In this comprehensive tutorial, we'll walk you through ${title.toLowerCase()} step by step.\n\nWhether you're a beginner or looking to improve your skills, this guide has everything you need to get started.`;
    } else if (lowerTitle.includes('review')) {
        return `📝 In this honest review, we take a deep dive into ${title.toLowerCase()}.\n\nWe'll cover the pros, cons, and everything you need to know before making a decision.`;
    } else if (lowerTitle.includes('tips')) {
        return `💡 In this video, we share the best ${title.toLowerCase()} that have helped countless people achieve their goals.\n\nThese proven strategies will help you get results faster.`;
    } else {
        return `🔥 Welcome to our video about ${title.toLowerCase()}!\n\nIn this comprehensive guide, we'll explore everything you need to know about this topic.`;
    }
}

/**
 * Add engagement elements to description
 */
function addEngagementElements(description) {
    // Check if engagement elements already exist
    const hasEngagement = description.toLowerCase().includes('subscribe') || 
                         description.toLowerCase().includes('like') ||
                         description.toLowerCase().includes('comment');
    
    if (hasEngagement) {
        return description; // Don't duplicate engagement elements
    }
    
    const engagementSection = `\n\n🔔 Don't forget to LIKE this video if it helped you!
📺 SUBSCRIBE for more helpful content
💬 Share your thoughts in the COMMENTS below
🔗 Follow us for more updates

#tutorial #tips #guide`;
    
    return description + engagementSection;
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
