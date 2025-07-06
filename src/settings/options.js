/**
 * OpenStudio Options/Settings Page JavaScript
 * Handles settings UI and API key management
 */

// Simple utility functions
function safeGetElementById(id) {
    try {
        return id ? document.getElementById(id) : null;
    } catch (error) {
        console.error('Error getting element by ID:', error);
        return null;
    }
}

function showError(message) {
    console.error('Error:', message);
}

function showSuccess(message) {
    console.log('Success:', message);
}

// Constants for configuration
const TIMING = {
    MESSAGE_TIMEOUT: 5000
};

const API_VALIDATION = {
    MIN_LENGTH: 10,
    YOUTUBE_API_KEY_LENGTH: 39,
    GEMINI_API_KEY_MIN_LENGTH: 35
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

const UI_MESSAGES = {
    ERRORS: {
        GENERIC: 'An unexpected error occurred. Please try again.',
        API_KEY_INVALID: 'Invalid API key. Please check your settings.',
        STORAGE_FAILED: 'Failed to save settings. Please try again.'
    },
    SUCCESS: {
        SETTINGS_SAVED: 'Settings saved successfully!',
        API_KEY_SAVED: 'API key saved successfully!',
        EXPORT_COMPLETE: 'Data exported successfully!',
        RESET_COMPLETE: 'Settings reset to defaults!'
    }
};

const MESSAGE_TIMEOUT = TIMING.MESSAGE_TIMEOUT;
const API_KEY_MIN_LENGTH = API_VALIDATION.MIN_LENGTH;
const YOUTUBE_API_KEY_LENGTH = API_VALIDATION.YOUTUBE_API_KEY_LENGTH;
const GEMINI_API_KEY_MIN_LENGTH = API_VALIDATION.GEMINI_API_KEY_MIN_LENGTH;

// DOM elements cache
let elements = {};

// Settings structure - use defaults from constants
const defaultSettings = DEFAULT_SETTINGS;

// Initialize options page
document.addEventListener('DOMContentLoaded', initializeOptionsPage);

/**
 * Initialize the options page
 */
async function initializeOptionsPage() {
    
    // Cache DOM elements
    cacheElements();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup API key validation
    setupApiKeyValidation();
    
    // Load current settings
    await loadSettings();
    
    // Load API keys
    await loadApiKeys();
    
}

/**
 * Cache frequently used DOM elements
 */
function cacheElements() {
    elements = {
        // API Keys
        youtubeApiKey: safeGetElementById('youtube-api-key'),
        geminiApiKey: safeGetElementById('gemini-api-key'),
        
        // SEO Settings
        seoEnabled: safeGetElementById('seo-enabled'),
        autoSuggestions: safeGetElementById('auto-suggestions'),
        tagRecommendations: safeGetElementById('tag-recommendations'),
        titleOptimization: safeGetElementById('title-optimization'),
        
        // Analytics Settings
        analyticsTracking: safeGetElementById('analytics-tracking'),
        performanceAlerts: safeGetElementById('performance-alerts'),
        trendAnalysis: safeGetElementById('trend-analysis'),
        
        // UI Preferences
        themeSelect: safeGetElementById('theme-select'),
        notificationsEnabled: safeGetElementById('notifications-enabled'),
        compactMode: safeGetElementById('compact-mode'),
        
        // Buttons
        saveButton: safeGetElementById('save-settings'),
        resetButton: safeGetElementById('reset-settings'),
        exportButton: safeGetElementById('export-settings'),
        
        // Status
        statusMessage: safeGetElementById('status-message')
    };
    
    // Verify critical elements exist
    const criticalElements = ['saveButton', 'themeSelect', 'statusMessage'];
    for (const elementName of criticalElements) {
        if (!elements[elementName]) {
            console.error(`Critical element missing: ${elementName}`);
        }
    }
}

/**
 * Setup event listeners for the options page
 */
function setupEventListeners() {
    
    // Save settings button
    if (elements.saveButton) {
        elements.saveButton.addEventListener('click', (e) => {
            e.preventDefault();
            saveSettings();
        });
    } else {
        console.error('Save button not found!');
    }
    
    // Reset settings button
    if (elements.resetButton) {
        elements.resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            resetSettings();
        });
    } else {
        console.error('Reset button not found!');
    }
    
    // Export settings button
    if (elements.exportButton) {
        elements.exportButton.addEventListener('click', (e) => {
            e.preventDefault();
            exportSettings();
        });
    } else {
        console.error('Export button not found!');
    }
    
    // Auto-save on certain changes
    const autoSaveElements = [
        elements.seoEnabled,
        elements.autoSuggestions,
        elements.analyticsTracking,
        elements.notificationsEnabled
    ].filter(el => el !== null);
    
    
    autoSaveElements.forEach(element => {
        element.addEventListener('change', () => {
            // Auto-save critical settings
            saveSettings(true);
        });
    });
    
    // Theme change handler
    if (elements.themeSelect) {
        elements.themeSelect.addEventListener('change', (e) => {
            applyTheme(e.target.value);
            saveSettings(true);
        });
    } else {
        console.error('Theme select not found!');
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // API key toggle buttons
    const apiKeyToggles = document.querySelectorAll('.api-key-toggle');
    apiKeyToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.dataset.target;
            if (targetId) {
                toggleApiKeyVisibility(targetId);
            }
        });
    });
}

/**
 * Load current settings from storage
 */
async function loadSettings() {
    try {
        const response = await sendMessageToBackground('getSettings');
        if (response.success) {
            const settings = { ...defaultSettings, ...response.settings };
            populateSettingsForm(settings);
            applyTheme(settings.theme);
        } else {
            console.error('Failed to load settings:', response.error);
            showStatusMessage('Failed to load settings', 'error');
        }
    } catch (error) {
        console.error('Error loading settings:', error);
        showStatusMessage('Error loading settings', 'error');
    }
}

/**
 * Load API keys from storage
 */
async function loadApiKeys() {
    try {
        const response = await sendMessageToBackground('getApiKeys');
        if (response.success) {
            const keys = response.keys;
            
            if (keys.youtube) {
                elements.youtubeApiKey.value = keys.youtube;
            }
            
            if (keys.geminiApiKey) {
                elements.geminiApiKey.value = keys.geminiApiKey;
            }
        }
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
}

/**
 * Populate form with settings values
 */
function populateSettingsForm(settings) {
    // SEO Settings
    if (elements.seoEnabled) elements.seoEnabled.checked = settings.seoEnabled;
    if (elements.autoSuggestions) elements.autoSuggestions.checked = settings.autoSuggestions;
    if (elements.tagRecommendations) elements.tagRecommendations.checked = settings.tagRecommendations;
    if (elements.titleOptimization) elements.titleOptimization.checked = settings.titleOptimization;
    
    // Analytics Settings
    if (elements.analyticsTracking) elements.analyticsTracking.checked = settings.analyticsTracking;
    if (elements.performanceAlerts) elements.performanceAlerts.checked = settings.performanceAlerts;
    if (elements.trendAnalysis) elements.trendAnalysis.checked = settings.trendAnalysis;
    
    // UI Preferences
    if (elements.themeSelect) elements.themeSelect.value = settings.theme;
    if (elements.notificationsEnabled) elements.notificationsEnabled.checked = settings.notificationsEnabled;
    if (elements.compactMode) elements.compactMode.checked = settings.compactMode;
}

/**
 * Save settings to storage
 */
async function saveSettings(silent = false) {
    try {
        
        // Collect settings from form
        const settings = {
            seoEnabled: elements.seoEnabled?.checked ?? true,
            autoSuggestions: elements.autoSuggestions?.checked ?? true,
            tagRecommendations: elements.tagRecommendations?.checked ?? false,
            titleOptimization: elements.titleOptimization?.checked ?? false,
            analyticsTracking: elements.analyticsTracking?.checked ?? true,
            performanceAlerts: elements.performanceAlerts?.checked ?? false,
            trendAnalysis: elements.trendAnalysis?.checked ?? false,
            theme: elements.themeSelect?.value ?? 'light',
            notificationsEnabled: elements.notificationsEnabled?.checked ?? true,
            compactMode: elements.compactMode?.checked ?? false,
            lastUpdated: new Date().toISOString()
        };
        
        
        // Save settings
        const settingsResponse = await sendMessageToBackground('saveSettings', { settings });
        
        // Collect and save API keys with proper camelCase naming
        const apiKeys = {
            youtube: elements.youtubeApiKey?.value?.trim() ?? '',
            geminiApiKey: elements.geminiApiKey?.value?.trim() ?? ''
        };
        
        
        const keysResponse = await sendMessageToBackground('saveApiKeys', { keys: apiKeys });
        
        if (settingsResponse.success && keysResponse.success) {
            if (!silent) {
                showStatusMessage('Settings saved successfully!', 'success');
            }
        } else {
            throw new Error(`Failed to save - Settings: ${settingsResponse.error}, Keys: ${keysResponse.error}`);
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showStatusMessage('Failed to save settings: ' + error.message, 'error');
    }
}

/**
 * Reset settings to defaults
 */
async function resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
        try {
            populateSettingsForm(defaultSettings);
            applyTheme(defaultSettings.theme);
            
            // Clear API keys
            if (elements.youtubeApiKey) elements.youtubeApiKey.value = '';
            if (elements.geminiApiKey) elements.geminiApiKey.value = '';
            
            await saveSettings();
            showStatusMessage('Settings reset to defaults', 'success');
        } catch (error) {
            console.error('Error resetting settings:', error);
            showStatusMessage('Failed to reset settings', 'error');
        }
    }
}

/**
 * Export settings as JSON file
 */
async function exportSettings() {
    try {
        
        const settingsResponse = await sendMessageToBackground('getSettings');
        
        const keysResponse = await sendMessageToBackground('getApiKeys');
        
        if (settingsResponse.success && keysResponse.success) {
            const exportData = {
                settings: settingsResponse.settings,
                apiKeys: keysResponse.keys,
                exportDate: new Date().toISOString(),
                version: '1.0.0'
            };
            
            
            // Create and download file
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `openstudio-settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showStatusMessage('Settings exported successfully', 'success');
        } else {
            throw new Error(`Export failed - Settings: ${settingsResponse.error}, Keys: ${keysResponse.error}`);
        }
    } catch (error) {
        console.error('Error exporting settings:', error);
        showStatusMessage('Failed to export settings: ' + error.message, 'error');
    }
}

/**
 * Apply theme to the page
 */
function applyTheme(theme) {
    const body = document.body;
    
    // Remove existing theme classes
    body.classList.remove('theme-light', 'theme-dark');
    
    if (theme === 'dark') {
        body.classList.add('theme-dark');
    } else if (theme === 'auto') {
        // Check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        body.classList.add(prefersDark ? 'theme-dark' : 'theme-light');
    } else {
        body.classList.add('theme-light');
    }
}

/**
 * Toggle API key visibility
 */
function toggleApiKeyVisibility(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = 'Hide';
    } else {
        input.type = 'password';
        button.textContent = 'Show';
    }
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboardShortcuts(event) {
    if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
            case 's':
                event.preventDefault();
                saveSettings();
                break;
            case 'r':
                event.preventDefault();
                if (event.shiftKey) {
                    resetSettings();
                }
                break;
            case 'e':
                event.preventDefault();
                exportSettings();
                break;
        }
    }
}

/**
 * Show status message to user
 */
function showStatusMessage(message, type = 'success') {
    const statusElement = elements.statusMessage;
    
    if (!statusElement) {
        return;
    }
    
    statusElement.textContent = message;
    statusElement.className = `status-message status-${type}`;
    statusElement.style.display = 'block';
    
    // Auto-hide after defined timeout
    setTimeout(() => {
        statusElement.style.display = 'none';
    }, MESSAGE_TIMEOUT);
}

/**
 * Send message to background script
 */
function sendMessageToBackground(action, data = {}) {
    return new Promise((resolve) => {
        try {
            chrome.runtime.sendMessage({
                action,
                ...data
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                    resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    resolve(response || { success: false, error: 'No response from background script' });
                }
            });
        } catch (error) {
            console.error('Error sending message to background:', error);
            resolve({ success: false, error: error.message });
        }
    });
}

/**
 * Validate API key format using constants
 */
function validateApiKey(key, type) {
    if (!key || key.length < API_KEY_MIN_LENGTH) {
        return false;
    }
    
    switch (type) {
        case 'youtube':
            return key.startsWith('AIza') && key.length === YOUTUBE_API_KEY_LENGTH;
        case 'gemini':
            return key.startsWith('AIza') && key.length >= GEMINI_API_KEY_MIN_LENGTH;
        default:
            return true;
    }
}

/**
 * Real-time validation for API keys
 */
function setupApiKeyValidation() {
    const youtubeKey = elements.youtubeApiKey;
    const geminiKey = elements.geminiApiKey;
    
    if (youtubeKey) {
        youtubeKey.addEventListener('blur', function() {
            const isValid = validateApiKey(this.value, 'youtube');
            this.style.borderColor = isValid || !this.value ? '' : '#dc3545';
        });
    }
    
    if (geminiKey) {
        geminiKey.addEventListener('blur', function() {
            const isValid = validateApiKey(this.value, 'gemini');
            this.style.borderColor = isValid || !this.value ? '' : '#dc3545';
        });
    }
}

// Removed global window assignment - using proper event listeners instead
