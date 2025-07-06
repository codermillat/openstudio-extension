/**
 * OpenStudio DOM Utility
 * Provides safe and defensive DOM manipulation methods
 */

// Ensure we don't redeclare the namespace
if (typeof window.OpenStudio === "undefined") {
    window.OpenStudio = {};
}

// Create DOM utilities namespace
if (typeof window.OpenStudio.DOM === "undefined") {
    window.OpenStudio.DOM = {};
}

// Simple UI messages for this utility
const UI_MESSAGES = {
    ERRORS: {
        GENERIC: 'An unexpected error occurred. Please try again.'
    }
};

/**
 * Safely query for an element with null checks
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (optional)
 * @returns {HTMLElement|null} Found element or null
 */
window.OpenStudio.DOM.safeQuerySelector = function(selector, parent = document) {
    try {
        if (!selector || typeof selector !== 'string') {
            console.warn('Invalid selector provided to safeQuerySelector:', selector);
            return null;
        }
        
        const element = parent.querySelector(selector);
        return element;
    } catch (error) {
        console.error('Error in safeQuerySelector:', error);
        return null;
    }
};

/**
 * Safely query for multiple elements
 * @param {string} selector - CSS selector
 * @param {HTMLElement} parent - Parent element (optional)
 * @returns {NodeList|Array} Found elements or empty array
 */
window.OpenStudio.DOM.safeQuerySelectorAll = function(selector, parent = document) {
    try {
        if (!selector || typeof selector !== 'string') {
            console.warn('Invalid selector provided to safeQuerySelectorAll:', selector);
            return [];
        }
        
        const elements = parent.querySelectorAll(selector);
        return elements || [];
    } catch (error) {
        console.error('Error in safeQuerySelectorAll:', error);
        return [];
    }
};

/**
 * Safely get element by ID with null checks
 * @param {string} id - Element ID
 * @returns {HTMLElement|null} Found element or null
 */
window.OpenStudio.DOM.safeGetElementById = function(id) {
    try {
        if (!id || typeof id !== 'string') {
            console.warn('Invalid ID provided to safeGetElementById:', id);
            return null;
        }
        
        const element = document.getElementById(id);
        return element;
    } catch (error) {
        console.error('Error in safeGetElementById:', error);
        return null;
    }
};

/**
 * Safely append child with validation
 * @param {HTMLElement} parent - Parent element
 * @param {HTMLElement} child - Child element to append
 * @returns {boolean} Success status
 */
window.OpenStudio.DOM.safeAppendChild = function(parent, child) {
    try {
        if (!parent || !child) {
            console.warn('Invalid parent or child provided to safeAppendChild');
            return false;
        }
        
        if (typeof parent.appendChild !== 'function') {
            console.warn('Parent element does not support appendChild');
            return false;
        }
        
        parent.appendChild(child);
        return true;
    } catch (error) {
        console.error('Error in safeAppendChild:', error);
        return false;
    }
};

/**
 * Safely remove element with validation
 * @param {HTMLElement} element - Element to remove
 * @returns {boolean} Success status
 */
window.OpenStudio.DOM.safeRemoveElement = function(element) {
    try {
        if (!element) {
            return false;
        }
        
        if (element.parentNode && typeof element.parentNode.removeChild === 'function') {
            element.parentNode.removeChild(element);
            return true;
        } else if (typeof element.remove === 'function') {
            element.remove();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error in safeRemoveElement:', error);
        return false;
    }
};

/**
 * Safely add event listener with validation
 * @param {HTMLElement} element - Target element
 * @param {string} event - Event type
 * @param {Function} handler - Event handler
 * @param {Object} options - Event options
 * @returns {boolean} Success status
 */
window.OpenStudio.DOM.safeAddEventListener = function(element, event, handler, options = {}) {
    try {
        if (!element || !event || typeof handler !== 'function') {
            console.warn('Invalid parameters provided to safeAddEventListener');
            return false;
        }
        
        if (typeof element.addEventListener !== 'function') {
            console.warn('Element does not support addEventListener');
            return false;
        }
        
        element.addEventListener(event, handler, options);
        return true;
    } catch (error) {
        console.error('Error in safeAddEventListener:', error);
        return false;
    }
};

/**
 * Safely set element attribute
 * @param {HTMLElement} element - Target element
 * @param {string} attribute - Attribute name
 * @param {string} value - Attribute value
 * @returns {boolean} Success status
 */
window.OpenStudio.DOM.safeSetAttribute = function(element, attribute, value) {
    try {
        if (!element || !attribute || typeof element.setAttribute !== 'function') {
            console.warn('Invalid parameters provided to safeSetAttribute');
            return false;
        }
        
        // Validate attribute name for security
        const dangerousAttrs = ['onclick', 'onload', 'onerror', 'javascript:', 'vbscript:'];
        if (dangerousAttrs.some(dangerous => attribute.includes(dangerous) || String(value).includes(dangerous))) {
            console.warn('Dangerous attribute blocked:', attribute, value);
            return false;
        }
        
        element.setAttribute(attribute, value);
        return true;
    } catch (error) {
        console.error('Error in safeSetAttribute:', error);
        return false;
    }
};

/**
 * Safely toggle class with validation
 * @param {HTMLElement} element - Target element
 * @param {string} className - Class name to toggle
 * @param {boolean} force - Force add/remove
 * @returns {boolean} Success status
 */
window.OpenStudio.DOM.safeToggleClass = function(element, className, force = undefined) {
    try {
        if (!element || !className || !element.classList) {
            console.warn('Invalid parameters provided to safeToggleClass');
            return false;
        }
        
        if (force !== undefined) {
            element.classList.toggle(className, force);
        } else {
            element.classList.toggle(className);
        }
        
        return true;
    } catch (error) {
        console.error('Error in safeToggleClass:', error);
        return false;
    }
};

/**
 * Wait for element to appear with timeout and retry logic
 * @param {string} selector - CSS selector
 * @param {Object} options - Configuration options
 * @returns {Promise<HTMLElement>} Found element or rejection
 */
window.OpenStudio.DOM.waitForElement = function(selector, options = {}) {
    const {
        timeout = 10000,
        retryInterval = 500,
        parent = document,
        maxRetries = 20
    } = options;

    return new Promise((resolve, reject) => {
        let retries = 0;
        
        const checkForElement = () => {
            const element = window.OpenStudio.DOM.safeQuerySelector(selector, parent);
            
            if (element) {
                resolve(element);
                return;
            }
            
            retries++;
            
            if (retries >= maxRetries) {
                reject(new Error(`Element ${selector} not found after ${maxRetries} retries`));
                return;
            }
            
            setTimeout(checkForElement, retryInterval);
        };
        
        // Start checking immediately
        checkForElement();
        
        // Set overall timeout
        setTimeout(() => {
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
};

/**
 * Safely check if element is visible
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Visibility status
 */
window.OpenStudio.DOM.isElementVisible = function(element) {
    try {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               element.offsetWidth > 0 && 
               element.offsetHeight > 0;
    } catch (error) {
        console.error('Error checking element visibility:', error);
        return false;
    }
};

/**
 * Create a status message element
 * @param {string} message - Message text
 * @param {string} type - Message type (success, error, info, warning)
 * @returns {HTMLElement} Status message element
 */
window.OpenStudio.DOM.createStatusMessage = function(message, type = 'info') {
    const statusElement = document.createElement('div');
    statusElement.className = `status-message status-${type}`;
    statusElement.textContent = message;
    
    // Auto-hide after timeout
    setTimeout(() => {
        window.OpenStudio.DOM.safeRemoveElement(statusElement);
    }, 5000);
    
    return statusElement;
};

/**
 * Show error message to user
 * @param {string} message - Error message
 * @param {HTMLElement} container - Container element
 */
window.OpenStudio.DOM.showError = function(message = UI_MESSAGES.ERRORS.GENERIC, container = null) {
    const errorElement = window.OpenStudio.DOM.createStatusMessage(message, 'error');
    
    if (container) {
        window.OpenStudio.DOM.safeAppendChild(container, errorElement);
    } else {
        // Try to find a suitable container
        const statusContainer = window.OpenStudio.DOM.safeQuerySelector('#status-message, .status-container, .message-container');
        if (statusContainer) {
            window.OpenStudio.DOM.safeAppendChild(statusContainer, errorElement);
        } else {
            console.error('Error message:', message);
        }
    }
};

/**
 * Show success message to user
 * @param {string} message - Success message
 * @param {HTMLElement} container - Container element
 */
window.OpenStudio.DOM.showSuccess = function(message, container = null) {
    const successElement = window.OpenStudio.DOM.createStatusMessage(message, 'success');
    
    if (container) {
        window.OpenStudio.DOM.safeAppendChild(container, successElement);
    } else {
        // Try to find a suitable container
        const statusContainer = window.OpenStudio.DOM.safeQuerySelector('#status-message, .status-container, .message-container');
        if (statusContainer) {
            window.OpenStudio.DOM.safeAppendChild(statusContainer, successElement);
        }
    }
};

/**
 * Create element with attributes and text content (CSP-compliant)
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string} textContent - Text content
 * @returns {HTMLElement} Created element
 */
window.OpenStudio.DOM.createElement = function(tag, attributes = {}, textContent = '') {
    try {
        const element = document.createElement(tag);
        
        // Set attributes safely
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'innerHTML') {
                // Never allow innerHTML through attributes for CSP compliance
                console.warn('OpenStudio: innerHTML not allowed in createElement');
            } else {
                window.OpenStudio.DOM.safeSetAttribute(element, key, value);
            }
        });
        
        // Set text content if provided
        if (textContent) {
            element.textContent = textContent;
        }
        
        return element;
    } catch (error) {
        console.error('OpenStudio: Error creating element:', error);
        return null;
    }
};

/**
 * Create document fragment for efficient DOM operations
 * @returns {DocumentFragment} Document fragment
 */
window.OpenStudio.DOM.createFragment = function() {
    try {
        return document.createDocumentFragment();
    } catch (error) {
        console.error('OpenStudio: Error creating fragment:', error);
        return null;
    }
};

/**
 * Create text node safely
 * @param {string} text - Text content
 * @returns {Text} Text node
 */
window.OpenStudio.DOM.createTextNode = function(text) {
    try {
        return document.createTextNode(text || '');
    } catch (error) {
        console.error('OpenStudio: Error creating text node:', error);
        return document.createTextNode('');
    }
};

/**
 * Batch append children to improve performance
 * @param {HTMLElement} parent - Parent element
 * @param {Array} children - Array of child elements
 * @returns {boolean} Success status
 */
window.OpenStudio.DOM.batchAppendChildren = function(parent, children) {
    if (!parent || !Array.isArray(children)) return false;
    
    try {
        const fragment = window.OpenStudio.DOM.createFragment();
        if (!fragment) return false;
        
        children.forEach(child => {
            if (child) {
                fragment.appendChild(child);
            }
        });
        
        return window.OpenStudio.DOM.safeAppendChild(parent, fragment);
    } catch (error) {
        console.error('OpenStudio: Error in batch append:', error);
        return false;
    }
};

/**
 * Escape HTML content for safe text insertion
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
window.OpenStudio.DOM.escapeHtml = function(text) {
    if (typeof text !== 'string') return '';
    
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, char => map[char]);
};

/**
 * Get element position safely
 * @param {HTMLElement} element - Target element
 * @returns {Object} Position object with top, left, width, height
 */
window.OpenStudio.DOM.getElementPosition = function(element) {
    try {
        if (!element) return { top: 0, left: 0, width: 0, height: 0 };
        
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.pageYOffset,
            left: rect.left + window.pageXOffset,
            width: rect.width,
            height: rect.height
        };
    } catch (error) {
        console.error('OpenStudio: Error getting element position:', error);
        return { top: 0, left: 0, width: 0, height: 0 };
    }
};

/**
 * Check if element is visible in viewport
 * @param {HTMLElement} element - Element to check
 * @returns {boolean} Visibility status
 */
window.OpenStudio.DOM.isElementInViewport = function(element) {
    try {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    } catch (error) {
        console.error('OpenStudio: Error checking element viewport visibility:', error);
        return false;
    }
};
