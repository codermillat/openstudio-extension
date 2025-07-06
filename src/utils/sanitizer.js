/**
 * OpenStudio HTML Sanitization Utility
 * Provides secure methods for handling user content and preventing XSS
 */

// Ensure we don't redeclare the namespace
if (typeof window.OpenStudio === "undefined") {
    window.OpenStudio = {};
}

// Create sanitizer utilities namespace
if (typeof window.OpenStudio.Sanitizer === "undefined") {
    window.OpenStudio.Sanitizer = {};
}

/**
 * Simple HTML escaping for basic text content
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
window.OpenStudio.Sanitizer.escapeHtml = function(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

/**
 * Sanitize HTML content by removing dangerous elements and attributes
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
window.OpenStudio.Sanitizer.sanitizeHtml = function(html) {
    if (typeof html !== 'string') return '';
    
    // Create a temporary DOM element
    const temp = document.createElement('div');
    temp.innerHTML = html;
    
    // Remove all script tags
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    // Remove dangerous attributes
    const dangerousAttributes = [
        'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
        'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown',
        'onkeyup', 'onkeypress', 'javascript:', 'vbscript:', 'data:'
    ];
    
    const allElements = temp.querySelectorAll('*');
    allElements.forEach(element => {
        // Remove dangerous attributes
        dangerousAttributes.forEach(attr => {
            if (element.hasAttribute(attr)) {
                element.removeAttribute(attr);
            }
        });
        
        // Check href attributes for dangerous protocols
        if (element.hasAttribute('href')) {
            const href = element.getAttribute('href');
            if (href && (href.startsWith('javascript:') || href.startsWith('data:') || href.startsWith('vbscript:'))) {
                element.removeAttribute('href');
            }
        }
        
        // Check src attributes for dangerous protocols
        if (element.hasAttribute('src')) {
            const src = element.getAttribute('src');
            if (src && (src.startsWith('javascript:') || src.startsWith('data:') || src.startsWith('vbscript:'))) {
                element.removeAttribute('src');
            }
        }
    });
    
    return temp.innerHTML;
};

/**
 * Safely set innerHTML with sanitization (deprecated - use createElement instead)
 * @param {HTMLElement} element - Target element
 * @param {string} html - HTML content to set
 */
window.OpenStudio.Sanitizer.safeSetInnerHTML = function(element, html) {
    if (!element || typeof element.innerHTML === 'undefined') {
        console.error('Invalid element provided to safeSetInnerHTML');
        return;
    }
    
    console.warn('OpenStudio: safeSetInnerHTML is deprecated for CSP compliance, use createElement instead');
    element.innerHTML = window.OpenStudio.Sanitizer.sanitizeHtml(html);
};

/**
 * Create safe text content (no HTML)
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text content to set
 */
window.OpenStudio.Sanitizer.safeSetTextContent = function(element, text) {
    if (!element || typeof element.textContent === 'undefined') {
        console.error('Invalid element provided to safeSetTextContent');
        return;
    }
    
    element.textContent = typeof text === 'string' ? text : '';
};

/**
 * Create a safe HTML element with sanitized content
 * @param {string} tagName - HTML tag name
 * @param {string} content - Content to add
 * @param {Object} attributes - Attributes to set
 * @returns {HTMLElement} Created element
 */
window.OpenStudio.Sanitizer.createSafeElement = function(tagName, content = '', attributes = {}) {
    const element = document.createElement(tagName);
    
    // Set safe content
    if (content) {
        window.OpenStudio.Sanitizer.safeSetTextContent(element, content);
    }
    
    // Set safe attributes
    Object.entries(attributes).forEach(([key, value]) => {
        // Skip dangerous attributes
        const dangerousAttrs = ['onclick', 'onload', 'onerror', 'javascript:', 'vbscript:'];
        if (!dangerousAttrs.some(dangerous => key.includes(dangerous) || String(value).includes(dangerous))) {
            element.setAttribute(key, value);
        }
    });
    
    return element;
};

/**
 * Safely append HTML to an element (deprecated - use createElement instead)
 * @param {HTMLElement} parent - Parent element
 * @param {string} html - HTML to append
 */
window.OpenStudio.Sanitizer.safeAppendHTML = function(parent, html) {
    if (!parent) {
        console.error('Invalid parent element provided to safeAppendHTML');
        return;
    }
    
    console.warn('OpenStudio: safeAppendHTML is deprecated for CSP compliance, use createElement instead');
    const temp = document.createElement('div');
    window.OpenStudio.Sanitizer.safeSetInnerHTML(temp, html);
    
    // Move all children from temp to parent
    while (temp.firstChild) {
        parent.appendChild(temp.firstChild);
    }
};

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @returns {string|null} Sanitized URL or null if invalid
 */
window.OpenStudio.Sanitizer.sanitizeUrl = function(url) {
    if (typeof url !== 'string') return null;
    
    try {
        const parsed = new URL(url);
        
        // Only allow http and https protocols
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:' && parsed.protocol !== 'mailto:') {
            return null;
        }
        
        return parsed.toString();
    } catch (error) {
        return null;
    }
};

/**
 * Create safe suggestions list HTML (deprecated - use createElement instead)
 * @param {Array} suggestions - Array of suggestion objects or strings
 * @returns {string} Safe HTML string
 */
window.OpenStudio.Sanitizer.createSafeSuggestionsList = function(suggestions) {
    console.warn('OpenStudio: createSafeSuggestionsList is deprecated for CSP compliance, use createElement instead');
    
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
        return '<p class="no-suggestions">No suggestions available.</p>';
    }
    
    const listItems = suggestions.map(suggestion => {
        const text = typeof suggestion === 'string' ? suggestion : suggestion.text || '';
        const priority = typeof suggestion === 'object' ? suggestion.priority || 'normal' : 'normal';
        
        return `<li class="suggestion-item priority-${window.OpenStudio.Sanitizer.escapeHtml(priority)}">${window.OpenStudio.Sanitizer.escapeHtml(text)}</li>`;
    }).join('');
    
    return `<ul class="suggestions-list">${listItems}</ul>`;
};
