/**
 * OpenStudio Google Gemini AI Helper
 * Handles AI-powered content generation and analysis using Google's Gemini API
 */

// Gemini API configuration
const GEMINI_API_CONFIG = {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-pro',
    maxTokens: 8192,
    temperature: 0.7,
    topP: 0.8,
    topK: 40
};

// Content generation prompts
const PROMPTS = {
    titleOptimization: `
    As a YouTube SEO expert, optimize this video title for better searchability and engagement.
    
    Current title: "{title}"
    Video description: "{description}"
    Target audience: General
    
    Please provide:
    1. 3 optimized title variations
    2. Explanation of changes made
    3. SEO keywords incorporated
    
    Format your response as JSON with this structure:
    {
      "optimizedTitles": ["title1", "title2", "title3"],
      "explanation": "explanation text",
      "keywords": ["keyword1", "keyword2"],
      "reasoning": "why these changes improve SEO"
    }
    `,
    
    descriptionEnhancement: `
    As a YouTube content strategist, enhance this video description for better engagement and SEO.
    
    Current description: "{description}"
    Video title: "{title}"
    
    Please provide an enhanced description that includes:
    1. Engaging opening hook
    2. Clear value proposition
    3. Relevant keywords naturally integrated
    4. Call-to-action elements
    5. Proper structure with paragraphs
    
    Keep it between 150-300 words and maintain the original tone.
    `,
    
    tagGeneration: `
    As a YouTube SEO specialist, generate relevant tags for this video.
    
    Video title: "{title}"
    Video description: "{description}"
    Category: {category}
    
    Generate 10-15 highly relevant tags that will help with discoverability.
    Include a mix of:
    - Broad topic tags
    - Specific niche tags  
    - Long-tail keyword tags
    - Trending terms if applicable
    
    Return only the tags separated by commas, no additional text.
    `,
    
    contentIdeas: `
    Based on this channel's content and current trends, suggest 5 video ideas.
    
    Channel info: {channelInfo}
    Recent videos: {recentVideos}
    Current trends: {trends}
    
    For each idea provide:
    - Compelling title
    - Brief description
    - Why it would perform well
    - Estimated engagement potential
    
    Format as JSON array with objects containing: title, description, reasoning, potential
    `,
    
    thumbnailSuggestions: `
    Suggest thumbnail concepts for this video that would maximize click-through rate.
    
    Video title: "{title}"
    Video content: "{description}"
    Target audience: General YouTube viewers
    
    Provide 3 thumbnail concepts with:
    - Visual elements to include
    - Text overlay suggestions
    - Color scheme recommendations
    - Psychological appeal explanation
    
    Focus on concepts that create curiosity and emotional engagement.
    `,
    
    competitorAnalysis: `
    Analyze these competitor videos and suggest how to improve content strategy.
    
    Our video: "{title}" - "{description}"
    Competitor videos: {competitorData}
    
    Provide insights on:
    1. What competitors are doing well
    2. Content gaps we can fill
    3. Unique angles we can take
    4. SEO opportunities they're missing
    
    Be specific and actionable.
    `
};

/**
 * Google Gemini AI Helper class
 */
class GeminiAIHelper {
    constructor() {
        this.apiKey = null;
        this.requestCount = 0;
        this.lastRequestTime = null;
        this.rateLimitRemaining = 60; // Requests per minute
    }

    /**
     * Initialize Gemini AI with API key
     * @param {string} apiKey - Gemini API key
     * @returns {Promise<boolean>} Success status
     */
    async initialize(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Valid Gemini API key is required');
        }

        this.apiKey = apiKey;
        
        try {
            // Test API key with a simple request
            await this.generateText('Test prompt to validate API key', { maxTokens: 10 });
            return true;
        } catch (error) {
            console.error('Gemini AI initialization failed:', error);
            this.apiKey = null;
            throw error;
        }
    }

    /**
     * Generate optimized video titles
     * @param {Object} videoData - Video information
     * @returns {Promise<Object>} Optimized titles and analysis
     */
    async optimizeTitle(videoData) {
        const prompt = PROMPTS.titleOptimization
            .replace('{title}', videoData.title || '')
            .replace('{description}', videoData.description || '');

        try {
            const response = await this.generateText(prompt, {
                temperature: 0.8,
                maxTokens: 1000
            });

            // Try to parse JSON response
            try {
                return JSON.parse(response);
            } catch {
                // Fallback if response isn't JSON
                return {
                    optimizedTitles: [this.extractTitlesFromText(response)],
                    explanation: response,
                    keywords: [],
                    reasoning: 'AI provided optimization suggestions'
                };
            }
        } catch (error) {
            console.error('Title optimization failed:', error);
            throw new Error('Failed to generate optimized titles');
        }
    }

    /**
     * Enhance video description
     * @param {Object} videoData - Video information
     * @returns {Promise<string>} Enhanced description
     */
    async enhanceDescription(videoData) {
        const prompt = PROMPTS.descriptionEnhancement
            .replace('{title}', videoData.title || '')
            .replace('{description}', videoData.description || '');

        try {
            return await this.generateText(prompt, {
                temperature: 0.7,
                maxTokens: 800
            });
        } catch (error) {
            console.error('Description enhancement failed:', error);
            throw new Error('Failed to enhance description');
        }
    }

    /**
     * Generate relevant tags
     * @param {Object} videoData - Video information
     * @returns {Promise<Array>} Generated tags
     */
    async generateTags(videoData) {
        const prompt = PROMPTS.tagGeneration
            .replace('{title}', videoData.title || '')
            .replace('{description}', videoData.description || '')
            .replace('{category}', videoData.category || 'General');

        try {
            const response = await this.generateText(prompt, {
                temperature: 0.6,
                maxTokens: 300
            });

            // Parse tags from response
            const tags = response
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0 && tag.length <= 50)
                .slice(0, 15); // Limit to 15 tags

            return tags;
        } catch (error) {
            console.error('Tag generation failed:', error);
            throw new Error('Failed to generate tags');
        }
    }

    /**
     * Generate content ideas
     * @param {Object} channelData - Channel information
     * @param {Array} recentVideos - Recent videos data
     * @returns {Promise<Array>} Content ideas
     */
    async generateContentIdeas(channelData, recentVideos = []) {
        const prompt = PROMPTS.contentIdeas
            .replace('{channelInfo}', JSON.stringify(channelData))
            .replace('{recentVideos}', JSON.stringify(recentVideos.slice(0, 5)))
            .replace('{trends}', 'Current YouTube trends'); // This could be enhanced with real trend data

        try {
            const response = await this.generateText(prompt, {
                temperature: 0.8,
                maxTokens: 1500
            });

            // Try to parse JSON response
            try {
                const ideas = JSON.parse(response);
                return Array.isArray(ideas) ? ideas : [];
            } catch {
                // Fallback parsing
                return this.extractIdeasFromText(response);
            }
        } catch (error) {
            console.error('Content ideas generation failed:', error);
            throw new Error('Failed to generate content ideas');
        }
    }

    /**
     * Generate thumbnail suggestions
     * @param {Object} videoData - Video information
     * @returns {Promise<Array>} Thumbnail concepts
     */
    async generateThumbnailSuggestions(videoData) {
        const prompt = PROMPTS.thumbnailSuggestions
            .replace('{title}', videoData.title || '')
            .replace('{description}', videoData.description || '');

        try {
            const response = await this.generateText(prompt, {
                temperature: 0.7,
                maxTokens: 800
            });

            return this.parseThumbnailSuggestions(response);
        } catch (error) {
            console.error('Thumbnail suggestions failed:', error);
            throw new Error('Failed to generate thumbnail suggestions');
        }
    }

    /**
     * Analyze competitors and suggest improvements
     * @param {Object} videoData - Our video data
     * @param {Array} competitorVideos - Competitor videos data
     * @returns {Promise<Object>} Analysis and suggestions
     */
    async analyzeCompetitors(videoData, competitorVideos) {
        const prompt = PROMPTS.competitorAnalysis
            .replace('{title}', videoData.title || '')
            .replace('{description}', videoData.description || '')
            .replace('{competitorData}', JSON.stringify(competitorVideos.slice(0, 5)));

        try {
            const response = await this.generateText(prompt, {
                temperature: 0.6,
                maxTokens: 1200
            });

            return {
                analysis: response,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Competitor analysis failed:', error);
            throw new Error('Failed to analyze competitors');
        }
    }

    /**
     * Generate custom content based on prompt
     * @param {string} customPrompt - Custom prompt
     * @param {Object} context - Additional context data
     * @returns {Promise<string>} Generated content
     */
    async generateCustomContent(customPrompt, context = {}) {
        let prompt = customPrompt;
        
        // Replace context variables in prompt
        Object.keys(context).forEach(key => {
            const placeholder = `{${key}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), context[key] || '');
        });

        try {
            return await this.generateText(prompt, {
                temperature: 0.7,
                maxTokens: 1000
            });
        } catch (error) {
            console.error('Custom content generation failed:', error);
            throw new Error('Failed to generate custom content');
        }
    }

    /**
     * Core text generation method
     * @param {string} prompt - Input prompt
     * @param {Object} options - Generation options
     * @returns {Promise<string>} Generated text
     */
    async generateText(prompt, options = {}) {
        if (!this.apiKey) {
            throw new Error('Gemini API not initialized');
        }

        // Rate limiting check
        await this.checkRateLimit();

        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: options.temperature || GEMINI_API_CONFIG.temperature,
                topP: options.topP || GEMINI_API_CONFIG.topP,
                topK: options.topK || GEMINI_API_CONFIG.topK,
                maxOutputTokens: options.maxTokens || GEMINI_API_CONFIG.maxTokens
            }
        };

        const url = `${GEMINI_API_CONFIG.baseUrl}/models/${GEMINI_API_CONFIG.model}:generateContent?key=${this.apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
            }

            const data = await response.json();
            
            // Update usage tracking
            this.requestCount++;
            this.lastRequestTime = Date.now();

            // Extract generated text
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const parts = data.candidates[0].content.parts;
                return parts.map(part => part.text).join('');
            } else {
                throw new Error('No content generated');
            }
        } catch (error) {
            console.error('Gemini API request failed:', error);
            throw error;
        }
    }

    /**
     * Check and enforce rate limiting
     * @returns {Promise<void>}
     */
    async checkRateLimit() {
        const now = Date.now();
        const oneMinute = 60 * 1000;

        // Reset counter if more than a minute has passed
        if (this.lastRequestTime && (now - this.lastRequestTime) > oneMinute) {
            this.requestCount = 0;
        }

        // Check if we've exceeded rate limit
        if (this.requestCount >= this.rateLimitRemaining) {
            const waitTime = oneMinute - (now - (this.lastRequestTime || now));
            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
                this.requestCount = 0;
            }
        }
    }

    /**
     * Extract titles from text response
     * @param {string} text - Response text
     * @returns {Array} Extracted titles
     */
    extractTitlesFromText(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const titles = [];
        
        for (const line of lines) {
            // Look for numbered lists or quoted text
            if (/^\d+\./.test(line) || /^["""'].*["""']$/.test(line)) {
                const cleaned = line.replace(/^\d+\.\s*/, '').replace(/^["""']|["""']$/g, '').trim();
                if (cleaned.length > 10 && cleaned.length <= 100) {
                    titles.push(cleaned);
                }
            }
        }
        
        return titles.slice(0, 3);
    }

    /**
     * Extract content ideas from text response
     * @param {string} text - Response text
     * @returns {Array} Extracted ideas
     */
    extractIdeasFromText(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const ideas = [];
        
        let currentIdea = null;
        for (const line of lines) {
            if (/^\d+\./.test(line)) {
                if (currentIdea) ideas.push(currentIdea);
                currentIdea = {
                    title: line.replace(/^\d+\.\s*/, '').trim(),
                    description: '',
                    reasoning: '',
                    potential: 'Medium'
                };
            } else if (currentIdea && line.trim()) {
                currentIdea.description += line.trim() + ' ';
            }
        }
        
        if (currentIdea) ideas.push(currentIdea);
        return ideas.slice(0, 5);
    }

    /**
     * Parse thumbnail suggestions from response
     * @param {string} text - Response text
     * @returns {Array} Thumbnail concepts
     */
    parseThumbnailSuggestions(text) {
        const concepts = [];
        const sections = text.split(/concept \d+:|thumbnail \d+:/i);
        
        for (let i = 1; i < sections.length; i++) {
            const section = sections[i].trim();
            if (section.length > 20) {
                concepts.push({
                    concept: `Concept ${i}`,
                    description: section.substring(0, 200) + (section.length > 200 ? '...' : ''),
                    elements: this.extractElements(section)
                });
            }
        }
        
        return concepts.slice(0, 3);
    }

    /**
     * Extract visual elements from thumbnail description
     * @param {string} text - Description text
     * @returns {Array} Visual elements
     */
    extractElements(text) {
        const elements = [];
        const keywords = ['color', 'text', 'face', 'background', 'emotion', 'object', 'style'];
        
        keywords.forEach(keyword => {
            const regex = new RegExp(`${keyword}[^.]*`, 'gi');
            const matches = text.match(regex);
            if (matches) {
                elements.push(...matches.slice(0, 2));
            }
        });
        
        return elements.slice(0, 5);
    }

    /**
     * Get usage statistics
     * @returns {Object} Usage stats
     */
    getUsageStats() {
        return {
            requestCount: this.requestCount,
            rateLimitRemaining: Math.max(0, this.rateLimitRemaining - this.requestCount),
            lastRequestTime: this.lastRequestTime,
            isInitialized: !!this.apiKey
        };
    }

    /**
     * Clear API key and reset state
     */
    clearApiKey() {
        this.apiKey = null;
        this.requestCount = 0;
        this.lastRequestTime = null;
    }
}

export default GeminiAIHelper;
