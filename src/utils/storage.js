/**
 * OpenStudio Storage Utility
 * Centralized storage management for the extension
 */

// Constants for the storage utility
const VERSION = '1.0.2';

const STORAGE_KEYS = {
    API_KEYS: 'openstudio_api_keys',
    USER_SETTINGS: 'openstudio_settings',
    ANALYTICS_DATA: 'openstudio_analytics',
    SEO_CACHE: 'openstudio_seo_cache',
    VIDEO_DATA: 'openstudio_video_data',
    PERFORMANCE_METRICS: 'openstudio_performance',
    TAG_SUGGESTIONS: 'openstudio_tag_suggestions'
};

const CACHE_EXPIRATION = {
    SEO_ANALYSIS: 1 * 60 * 60 * 1000,     // 1 hour
    TAG_SUGGESTIONS: 24 * 60 * 60 * 1000,  // 24 hours
    ANALYTICS: 6 * 60 * 60 * 1000,         // 6 hours
    PERFORMANCE: 30 * 60 * 1000,           // 30 minutes
    CACHE_MAX_AGE: 7 * 24 * 60 * 60 * 1000 // 7 days
};

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

/**
 * Storage utility class for managing extension data
 */
class StorageManager {
    /**
     * Get data from chrome storage
     * @param {string} key - Storage key
     * @returns {Promise<any>} Stored data
     */
    static async get(key) {
        try {
            const result = await chrome.storage.local.get(key);
            return result[key] || null;
        } catch (error) {
            console.error('OpenStudio Storage: Get error:', error);
            return null;
        }
    }

    /**
     * Set data in chrome storage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     * @returns {Promise<boolean>} Success status
     */
    static async set(key, data) {
        try {
            await chrome.storage.local.set({ [key]: data });
            return true;
        } catch (error) {
            console.error('OpenStudio Storage: Set error:', error);
            return false;
        }
    }

    /**
     * Remove data from chrome storage
     * @param {string} key - Storage key
     * @returns {Promise<boolean>} Success status
     */
    static async remove(key) {
        try {
            await chrome.storage.local.remove(key);
            return true;
        } catch (error) {
            console.error('OpenStudio Storage: Remove error:', error);
            return false;
        }
    }

    /**
     * Clear all extension data
     * @returns {Promise<boolean>} Success status
     */
    static async clear() {
        try {
            const allKeys = Object.values(STORAGE_KEYS);
            await chrome.storage.local.remove(allKeys);
            return true;
        } catch (error) {
            console.error('OpenStudio Storage: Clear error:', error);
            return false;
        }
    }

    /**
     * Get multiple keys at once
     * @param {string[]} keys - Array of storage keys
     * @returns {Promise<Object>} Object with key-value pairs
     */
    static async getMultiple(keys) {
        try {
            return await chrome.storage.local.get(keys);
        } catch (error) {
            console.error('OpenStudio Storage: GetMultiple error:', error);
            return {};
        }
    }

    /**
     * Set multiple key-value pairs at once
     * @param {Object} data - Object with key-value pairs
     * @returns {Promise<boolean>} Success status
     */
    static async setMultiple(data) {
        try {
            await chrome.storage.local.set(data);
            return true;
        } catch (error) {
            console.error('Storage setMultiple error:', error);
            return false;
        }
    }
}

/**
 * Cache management utility
 */
class CacheManager {
    /**
     * Store data in cache with expiration
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     * @returns {Promise<boolean>} Success status
     */
    static async set(key, data, ttl = CACHE_EXPIRATION.SEO_ANALYSIS) {
        const cacheItem = {
            data,
            timestamp: Date.now(),
            expires: Date.now() + ttl
        };

        return await StorageManager.set(`${STORAGE_KEYS.SEO_CACHE}_${key}`, cacheItem);
    }

    /**
     * Get data from cache if not expired
     * @param {string} key - Cache key
     * @returns {Promise<any|null>} Cached data or null if expired/not found
     */
    static async get(key) {
        const cacheItem = await StorageManager.get(`${STORAGE_KEYS.SEO_CACHE}_${key}`);
        
        if (!cacheItem) {
            return null;
        }

        // Check if expired
        if (Date.now() > cacheItem.expires) {
            await this.remove(key);
            return null;
        }

        return cacheItem.data;
    }

    /**
     * Remove item from cache
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} Success status
     */
    static async remove(key) {
        return await StorageManager.remove(`${STORAGE_KEYS.SEO_CACHE}_${key}`);
    }

    /**
     * Check if cache item exists and is valid
     * @param {string} key - Cache key
     * @returns {Promise<boolean>} True if exists and valid
     */
    static async has(key) {
        const cacheItem = await StorageManager.get(`${STORAGE_KEYS.SEO_CACHE}_${key}`);
        return cacheItem && Date.now() <= cacheItem.expires;
    }

    /**
     * Clean up expired cache entries
     * @returns {Promise<number>} Number of items removed
     */
    static async cleanup() {
        try {
            const storage = await chrome.storage.local.get();
            const expiredKeys = [];
            
            Object.keys(storage).forEach(key => {
                if (key.startsWith(STORAGE_KEYS.SEO_CACHE)) {
                    const item = storage[key];
                    if (item.expires && Date.now() > item.expires) {
                        expiredKeys.push(key);
                    }
                }
            });

            if (expiredKeys.length > 0) {
                await chrome.storage.local.remove(expiredKeys);
            }

            return expiredKeys.length;
        } catch (error) {
            console.error('Cache cleanup error:', error);
            return 0;
        }
    }
}

/**
 * Settings management utility
 */
class SettingsManager {
    /**
     * Get user settings with defaults
     * @returns {Promise<Object>} User settings
     */
    static async getSettings() {
        const defaults = {
            ...DEFAULT_SETTINGS,
            installedDate: new Date().toISOString(),
            version: VERSION
        };

        const stored = await StorageManager.get(STORAGE_KEYS.USER_SETTINGS);
        return { ...defaults, ...stored };
    }

    /**
     * Save user settings
     * @param {Object} settings - Settings to save
     * @returns {Promise<boolean>} Success status
     */
    static async saveSettings(settings) {
        const current = await this.getSettings();
        const updated = { 
            ...current, 
            ...settings, 
            lastUpdated: new Date().toISOString() 
        };
        
        return await StorageManager.set(STORAGE_KEYS.USER_SETTINGS, updated);
    }

    /**
     * Reset settings to defaults
     * @returns {Promise<boolean>} Success status
     */
    static async resetSettings() {
        await StorageManager.remove(STORAGE_KEYS.USER_SETTINGS);
        return true;
    }
}

/**
 * API keys management utility
 */
class ApiKeysManager {
    /**
     * Get API keys
     * @returns {Promise<Object>} API keys
     */
    static async getKeys() {
        return await StorageManager.get(STORAGE_KEYS.API_KEYS) || {};
    }

    /**
     * Save API keys
     * @param {Object} keys - API keys to save
     * @returns {Promise<boolean>} Success status
     */
    static async saveKeys(keys) {
        const current = await this.getKeys();
        const updated = { 
            ...current, 
            ...keys,
            lastUpdated: new Date().toISOString()
        };
        
        return await StorageManager.set(STORAGE_KEYS.API_KEYS, updated);
    }

    /**
     * Check if API keys are configured
     * @returns {Promise<Object>} Status of each API key
     */
    static async getKeysStatus() {
        const keys = await this.getKeys();
        
        return {
            youtube: !!(keys.youtube && keys.youtube.length > 0),
            gemini: !!(keys.gemini && keys.gemini.length > 0),
            allConfigured: !!(keys.youtube && keys.gemini)
        };
    }

    /**
     * Clear all API keys
     * @returns {Promise<boolean>} Success status
     */
    static async clearKeys() {
        return await StorageManager.remove(STORAGE_KEYS.API_KEYS);
    }
}

/**
 * Analytics data management utility
 */
class AnalyticsManager {
    /**
     * Store video analysis data
     * @param {string} videoId - Video ID
     * @param {Object} analysisData - Analysis results
     * @returns {Promise<boolean>} Success status
     */
    static async storeVideoAnalysis(videoId, analysisData) {
        const key = `${STORAGE_KEYS.VIDEO_DATA}_${videoId}`;
        const data = {
            ...analysisData,
            videoId,
            timestamp: new Date().toISOString()
        };
        
        return await StorageManager.set(key, data);
    }

    /**
     * Get video analysis data
     * @param {string} videoId - Video ID
     * @returns {Promise<Object|null>} Analysis data
     */
    static async getVideoAnalysis(videoId) {
        const key = `${STORAGE_KEYS.VIDEO_DATA}_${videoId}`;
        return await StorageManager.get(key);
    }

    /**
     * Store performance metrics
     * @param {Object} metrics - Performance data
     * @returns {Promise<boolean>} Success status
     */
    static async storePerformanceMetrics(metrics) {
        const data = {
            ...metrics,
            timestamp: new Date().toISOString()
        };
        
        return await StorageManager.set(STORAGE_KEYS.PERFORMANCE_METRICS, data);
    }

    /**
     * Get performance metrics
     * @returns {Promise<Object|null>} Performance data
     */
    static async getPerformanceMetrics() {
        return await StorageManager.get(STORAGE_KEYS.PERFORMANCE_METRICS);
    }

    /**
     * Get analytics summary for popup
     * @returns {Promise<Object>} Analytics summary
     */
    static async getAnalyticsSummary() {
        try {
            const storage = await chrome.storage.local.get();
            const videoDataKeys = Object.keys(storage).filter(key => 
                key.startsWith(STORAGE_KEYS.VIDEO_DATA)
            );

            let totalVideos = videoDataKeys.length;
            let totalScore = 0;
            let scoreCount = 0;

            videoDataKeys.forEach(key => {
                const data = storage[key];
                if (data && data.seoScore) {
                    totalScore += data.seoScore;
                    scoreCount++;
                }
            });

            const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

            return {
                videosAnalyzed: totalVideos,
                avgSeoScore: avgScore,
                lastAnalysis: scoreCount > 0 ? new Date().toISOString() : null
            };
        } catch (error) {
            console.error('Error getting analytics summary:', error);
            return {
                videosAnalyzed: 0,
                avgSeoScore: 0,
                lastAnalysis: null
            };
        }
    }
}

/**
 * Data export/import utilities
 */
class DataManager {
    /**
     * Export all extension data
     * @returns {Promise<Object>} Exported data
     */
    static async exportAllData() {
        const data = {
            settings: await SettingsManager.getSettings(),
            apiKeys: await ApiKeysManager.getKeys(),
            analytics: await AnalyticsManager.getAnalyticsSummary(),
            performance: await AnalyticsManager.getPerformanceMetrics(),
            exportDate: new Date().toISOString(),
            version: VERSION
        };

        return data;
    }

    /**
     * Import extension data
     * @param {Object} data - Data to import
     * @returns {Promise<boolean>} Success status
     */
    static async importData(data) {
        try {
            if (data.settings) {
                await SettingsManager.saveSettings(data.settings);
            }
            
            if (data.apiKeys) {
                await ApiKeysManager.saveKeys(data.apiKeys);
            }

            return true;
        } catch (error) {
            console.error('Data import error:', error);
            return false;
        }
    }

    /**
     * Get storage usage statistics
     * @returns {Promise<Object>} Storage stats
     */
    static async getStorageStats() {
        try {
            const storage = await chrome.storage.local.get();
            const storageSize = JSON.stringify(storage).length;
            const itemCount = Object.keys(storage).length;
            
            // Calculate size by category
            const categories = {
                settings: 0,
                apiKeys: 0,
                cache: 0,
                videoData: 0,
                other: 0
            };

            Object.keys(storage).forEach(key => {
                const size = JSON.stringify(storage[key]).length;
                
                if (key === STORAGE_KEYS.USER_SETTINGS) {
                    categories.settings += size;
                } else if (key === STORAGE_KEYS.API_KEYS) {
                    categories.apiKeys += size;
                } else if (key.startsWith(STORAGE_KEYS.SEO_CACHE)) {
                    categories.cache += size;
                } else if (key.startsWith(STORAGE_KEYS.VIDEO_DATA)) {
                    categories.videoData += size;
                } else {
                    categories.other += size;
                }
            });

            return {
                totalSize: storageSize,
                itemCount,
                categories,
                maxSize: 10 * 1024 * 1024, // 10MB limit
                usagePercentage: (storageSize / (10 * 1024 * 1024)) * 100
            };
        } catch (error) {
            console.error('Storage stats error:', error);
            return null;
        }
    }
}

// Export utilities
export {
    StorageManager,
    CacheManager,
    SettingsManager,
    ApiKeysManager,
    AnalyticsManager,
    DataManager,
    CACHE_EXPIRATION
};
