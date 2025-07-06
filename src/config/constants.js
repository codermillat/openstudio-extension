/**
 * OpenStudio Configuration Constants
 * Central source of truth for all application constants
 */

// Ensure we don't redeclare the namespace
if (typeof window.OpenStudio === "undefined") {
    window.OpenStudio = {};
}

// Meta information
if (typeof window.OpenStudio.META === "undefined") {
    window.OpenStudio.META = {
        version: "1.0.2",
        label: "enterprise",
        name: "OpenStudio",
        description: "YouTube SEO & Optimization Assistant"
    };
}

// URLs and endpoints
if (typeof window.OpenStudio.URLS === "undefined") {
    window.OpenStudio.URLS = Object.freeze({
        YOUTUBE_STUDIO: 'https://studio.youtube.com',
        YOUTUBE_ANALYTICS: 'https://studio.youtube.com/channel/analytics',
        GOOGLE_CLOUD_CONSOLE: 'https://console.developers.google.com/',
        GOOGLE_AI_STUDIO: 'https://makersuite.google.com/app/apikey',
        GITHUB_REPO: 'https://github.com/openstudio-extension/openstudio',
        HELP_WIKI: 'https://github.com/openstudio-extension/openstudio/wiki/help',
        ISSUES_PAGE: 'https://github.com/openstudio-extension/openstudio/issues',
        SUPPORT_EMAIL: 'mailto:support@openstudio-extension.com'
    });
}

// API Configuration
if (typeof window.OpenStudio.API_CONFIG === "undefined") {
    window.OpenStudio.API_CONFIG = Object.freeze({
        YOUTUBE: {
            BASE_URL: 'https://www.googleapis.com/youtube/v3',
            SCOPES: [
                'https://www.googleapis.com/auth/youtube.readonly',
                'https://www.googleapis.com/auth/youtube.upload'
            ],
            DISCOVERY_DOCS: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
            DAILY_QUOTA_LIMIT: 10000
        },
        GEMINI: {
            BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
            MODEL: 'gemini-pro',
            MAX_TOKENS: 8192,
            TEMPERATURE: 0.7,
            TOP_P: 0.8,
            TOP_K: 40
        }
    });
}

// Timing configurations
if (typeof window.OpenStudio.TIMING === "undefined") {
    window.OpenStudio.TIMING = Object.freeze({
        CACHE_TIMEOUT: 5000,
        ANALYTICS_CACHE_TIMEOUT: 30000,
        REFRESH_INTERVAL: 60000,
        MESSAGE_TIMEOUT: 5000,
        INJECTION_RETRY_DELAY: 1000,
        SEO_ANALYSIS_DELAY: 500,
        PAGE_CHANGE_DELAY: 1000,
        CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour
        STATUS_HIDE_TIMEOUT: 5000,
        INJECTION_RETRIES: 20,
        RETRY_DELAY: 500,
        TIMEOUT: 10000,
        NOTIFICATION_TIMEOUT: 3000
    });
}

// Cache expiration times (in milliseconds)
if (typeof window.OpenStudio.CACHE_EXPIRATION === "undefined") {
    window.OpenStudio.CACHE_EXPIRATION = Object.freeze({
        SEO_ANALYSIS: 1 * 60 * 60 * 1000,     // 1 hour
        TAG_SUGGESTIONS: 24 * 60 * 60 * 1000,  // 24 hours
        ANALYTICS: 6 * 60 * 60 * 1000,         // 6 hours
        PERFORMANCE: 30 * 60 * 1000,           // 30 minutes
        CACHE_MAX_AGE: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
}

// Storage keys
if (typeof window.OpenStudio.STORAGE_KEYS === "undefined") {
    window.OpenStudio.STORAGE_KEYS = Object.freeze({
        API_KEYS: 'openstudio_api_keys',
        USER_SETTINGS: 'openstudio_settings',
        ANALYTICS_DATA: 'openstudio_analytics',
        SEO_CACHE: 'openstudio_seo_cache',
        VIDEO_DATA: 'openstudio_video_data',
        PERFORMANCE_METRICS: 'openstudio_performance',
        TAG_SUGGESTIONS: 'openstudio_tag_suggestions'
    });
}

// UI injection configuration
if (typeof window.OpenStudio.SELECTORS === "undefined") {
    window.OpenStudio.SELECTORS = Object.freeze({
        VIDEO_TITLE: 'textarea[aria-label*="title" i], #video-title, [data-testid*="title"], textarea[placeholder*="title" i]',
        VIDEO_DESCRIPTION: 'textarea[aria-label*="description" i], #video-description, [data-testid*="description"], textarea[placeholder*="description" i]',
        VIDEO_TAGS: 'input[aria-label*="tags" i], #video-tags, [data-testid*="tags"], input[placeholder*="tags" i]',
        UPLOAD_DIALOG: '[data-testid="upload-dialog"], .upload-dialog, [role="dialog"]',
        EDIT_VIDEO_CONTAINER: '[data-testid="video-edit-container"], .video-edit-container, .video-edit',
        STUDIO_SIDEBAR: '.ytcp-navigation-drawer, .ytcp-video-edit-sidebar, .video-edit-sidebar, [role="complementary"]',
        MAIN_CONTENT: '.ytcp-main-content, .main-content, main, [role="main"]',
        VIDEO_EDIT_SIDEBAR: '.ytcp-video-edit-sidebar, .video-edit-sidebar, .sidebar, [data-testid*="sidebar"]'
    });
}

// SEO scoring configuration
if (typeof window.OpenStudio.SEO_CONFIG === "undefined") {
    window.OpenStudio.SEO_CONFIG = Object.freeze({
        WEIGHTS: {
            TITLE: 0.4,
            DESCRIPTION: 0.35,
            TAGS: 0.25
        },
        CRITERIA: {
            TITLE: {
                MIN_LENGTH: 30,
                MAX_LENGTH: 100,
                OPTIMAL_LENGTH: 60,
                KEYWORD_DENSITY: 0.02
            },
            DESCRIPTION: {
                MIN_LENGTH: 125,
                MAX_LENGTH: 5000,
                OPTIMAL_LENGTH: 250,
                KEYWORD_DENSITY: 0.015
            },
            TAGS: {
                MIN_COUNT: 5,
                MAX_COUNT: 15,
                OPTIMAL_COUNT: 10
            }
        }
    });
}

// API key validation
if (typeof window.OpenStudio.API_VALIDATION === "undefined") {
    window.OpenStudio.API_VALIDATION = Object.freeze({
        MIN_LENGTH: 10,
        YOUTUBE_API_KEY_LENGTH: 39,
        GEMINI_API_KEY_MIN_LENGTH: 35
    });
}

// Default settings
if (typeof window.OpenStudio.DEFAULT_SETTINGS === "undefined") {
    window.OpenStudio.DEFAULT_SETTINGS = Object.freeze({
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
    });
}

// UI Messages
if (typeof window.OpenStudio.UI_MESSAGES === "undefined") {
    window.OpenStudio.UI_MESSAGES = Object.freeze({
    ERRORS: {
        GENERIC: 'An unexpected error occurred. Please try again.',
        NETWORK: 'Network error. Please check your connection and try again.',
        API_KEY_INVALID: 'Invalid API key. Please check your settings.',
        STORAGE_FAILED: 'Failed to save settings. Please try again.',
        YOUTUBE_NOT_DETECTED: 'YouTube Studio not detected. Please navigate to studio.youtube.com',
        DOM_ERROR: 'Failed to inject UI. YouTube may have updated their interface.',
        RATE_LIMIT: 'API rate limit exceeded. Please try again later.'
    },
    SUCCESS: {
        SETTINGS_SAVED: 'Settings saved successfully!',
        API_KEY_SAVED: 'API key saved successfully!',
        EXPORT_COMPLETE: 'Data exported successfully!',
        RESET_COMPLETE: 'Settings reset to defaults!'
    },
    INFO: {
        ANALYZING: 'Analyzing video metadata...',
        LOADING: 'Loading...',
        NO_SUGGESTIONS: 'No suggestions available at this time.',
        FIRST_TIME_SETUP: 'Welcome! Please configure your API keys in settings.'
    }
    });
}

// Performance limits
if (typeof window.OpenStudio.PERFORMANCE_LIMITS === "undefined") {
    window.OpenStudio.PERFORMANCE_LIMITS = Object.freeze({
        MAX_STORAGE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_CACHE_ITEMS: 1000,
        MAX_RETRY_ATTEMPTS: 3,
        BATCH_SIZE: 50
    });
}

// Status constants
if (typeof window.OpenStudio.STATUS === "undefined") {
    window.OpenStudio.STATUS = Object.freeze({
        INJECTION_SUCCESS: 'OpenStudio: UI panel injected',
        INJECTION_FAILED: 'OpenStudio: UI injection failed',
        READY: 'OpenStudio: Extension ready',
        ERROR: 'OpenStudio: Error occurred',
        LOADING: 'OpenStudio: Loading...',
        INITIALIZED: 'OpenStudio: Initialized',
        API_READY: 'OpenStudio: API ready',
        VIDEO_DETECTED: 'OpenStudio: Video detected'
    });
}

// CONSTANTS namespace for backwards compatibility and organization
if (typeof window.OpenStudio.CONSTANTS === "undefined") {
    window.OpenStudio.CONSTANTS = {
        SELECTORS: window.OpenStudio.SELECTORS,
        TIMING: window.OpenStudio.TIMING,
        STATUS: window.OpenStudio.STATUS,
        SEO_CONFIG: window.OpenStudio.SEO_CONFIG,
        API_VALIDATION: window.OpenStudio.API_VALIDATION,
        UI_MESSAGES: window.OpenStudio.UI_MESSAGES,
        STORAGE_KEYS: window.OpenStudio.STORAGE_KEYS,
        CACHE_EXPIRATION: window.OpenStudio.CACHE_EXPIRATION,
        PERFORMANCE_LIMITS: window.OpenStudio.PERFORMANCE_LIMITS,
        DEFAULT_SETTINGS: window.OpenStudio.DEFAULT_SETTINGS,
        API_CONFIG: window.OpenStudio.API_CONFIG,
        URLS: window.OpenStudio.URLS,
        META: window.OpenStudio.META
    };
}
