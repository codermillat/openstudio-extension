/**
 * OpenStudio Fallback Helper
 * Provides smart content generation when AI is unavailable
 * Uses SEO heuristics, keyword analysis, and content patterns
 */

// SEO keyword database for different content types
const SEO_KEYWORDS = {
    tutorial: ['tutorial', 'guide', 'how-to', 'step-by-step', 'learn', 'beginner', 'complete'],
    review: ['review', 'analysis', 'honest', 'pros', 'cons', 'comparison', 'worth-it'],
    tips: ['tips', 'tricks', 'hacks', 'secrets', 'pro-tips', 'advice', 'best-practices'],
    gaming: ['gameplay', 'walkthrough', 'strategy', 'guide', 'boss-fight', 'speedrun'],
    tech: ['technology', 'gadget', 'device', 'software', 'app', 'tech-review'],
    lifestyle: ['lifestyle', 'daily', 'routine', 'vlog', 'personal', 'experience'],
    business: ['business', 'entrepreneur', 'marketing', 'strategy', 'growth', 'success']
};

// Common engagement phrases
const ENGAGEMENT_PHRASES = [
    'Don\'t forget to subscribe!',
    'Let me know in the comments',
    'Hit that like button',
    'Share your thoughts below',
    'What do you think?',
    'Follow for more content'
];

// Title optimization patterns
const TITLE_PATTERNS = {
    year: () => new Date().getFullYear(),
    ultimate: ['Ultimate', 'Complete', 'Comprehensive', 'Definitive'],
    emotional: ['Amazing', 'Incredible', 'Shocking', 'Unbelievable', 'Must-See'],
    numbers: ['Top 10', '5 Best', '7 Ways', '3 Steps', '10 Tips'],
    urgency: ['Right Now', 'Today', 'This Year', 'Before It\'s Too Late']
};

/**
 * Generate fallback tags based on content analysis
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @returns {Array} Array of relevant tags
 */
function generateFallbackTags(title = '', description = '') {
    const tags = new Set();
    const content = `${title} ${description}`.toLowerCase();
    
    // Extract meaningful words (remove common stop words)
    const stopWords = new Set([
        'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 
        'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 
        'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 
        'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'with', 'have',
        'this', 'will', 'your', 'from', 'they', 'know', 'want', 'been', 'good',
        'much', 'some', 'time', 'very', 'when', 'come', 'here', 'just', 'like',
        'long', 'make', 'many', 'over', 'such', 'take', 'than', 'them', 'well'
    ]);
    
    const words = content
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
        .slice(0, 15);
    
    // Add content-based tags
    words.forEach(word => {
        if (word.length > 2 && word.length < 20) {
            tags.add(word);
        }
    });
    
    // Add category-specific tags based on content analysis
    Object.entries(SEO_KEYWORDS).forEach(([category, keywords]) => {
        const hasKeyword = keywords.some(keyword => content.includes(keyword));
        if (hasKeyword) {
            tags.add(category);
            // Add related keywords
            keywords.slice(0, 3).forEach(keyword => {
                if (content.includes(keyword)) {
                    tags.add(keyword.replace('-', ''));
                }
            });
        }
    });
    
    // Add common YouTube tags based on content type
    if (content.includes('tutorial') || content.includes('how to')) {
        tags.add('tutorial');
        tags.add('howto');
        tags.add('guide');
        tags.add('learning');
    }
    
    if (content.includes('review')) {
        tags.add('review');
        tags.add('analysis');
        tags.add('opinion');
    }
    
    if (content.includes('tips') || content.includes('advice')) {
        tags.add('tips');
        tags.add('advice');
        tags.add('helpful');
    }
    
    if (content.includes('gaming') || content.includes('game')) {
        tags.add('gaming');
        tags.add('gameplay');
        tags.add('videogames');
    }
    
    // Add year for relevance
    tags.add(TITLE_PATTERNS.year().toString());
    
    // Convert to array and limit to 12 tags
    return Array.from(tags).slice(0, 12);
}

/**
 * Generate optimized title using heuristics
 * @param {string} title - Current title
 * @returns {string} Optimized title
 */
function generateFallbackTitle(title = '') {
    if (!title.trim()) {
        return 'Untitled Video - Please Add a Title';
    }
    
    const originalTitle = title.trim();
    const lowerTitle = originalTitle.toLowerCase();
    const currentYear = TITLE_PATTERNS.year();
    
    // If title is already well-optimized (good length, has year, etc.), return as-is
    if (originalTitle.length >= 40 && originalTitle.length <= 70 && originalTitle.includes(currentYear.toString())) {
        return originalTitle;
    }
    
    let optimizedTitle = originalTitle;
    
    // Add year if missing and title doesn't already have recent years
    if (!originalTitle.match(/\b(202[0-9]|201[0-9])\b/)) {
        optimizedTitle = `${originalTitle} (${currentYear})`;
    }
    
    // Enhance based on content type
    if (lowerTitle.includes('how to') || lowerTitle.includes('tutorial')) {
        if (!lowerTitle.includes('complete') && !lowerTitle.includes('guide')) {
            optimizedTitle = `Complete ${optimizedTitle} - Step by Step Guide`;
        }
    } else if (lowerTitle.includes('review')) {
        if (!lowerTitle.includes('honest') && !lowerTitle.includes('detailed')) {
            optimizedTitle = `Honest ${optimizedTitle} - Detailed Analysis`;
        }
    } else if (lowerTitle.includes('tips')) {
        if (!lowerTitle.includes('pro') && !lowerTitle.includes('best')) {
            optimizedTitle = `Pro ${optimizedTitle} That Actually Work`;
        }
    } else {
        // For general content, add engaging elements
        if (originalTitle.length < 40) {
            const enhancers = TITLE_PATTERNS.ultimate;
            const randomEnhancer = enhancers[Math.floor(Math.random() * enhancers.length)];
            optimizedTitle = `${randomEnhancer} ${optimizedTitle} Guide`;
        }
    }
    
    // Ensure title isn't too long
    if (optimizedTitle.length > 100) {
        optimizedTitle = optimizedTitle.substring(0, 97) + '...';
    }
    
    return optimizedTitle;
}

/**
 * Generate enhanced description using templates
 * @param {string} title - Video title
 * @param {string} description - Current description
 * @returns {string} Enhanced description
 */
function generateFallbackDescription(title = '', description = '') {
    const originalDesc = description.trim();
    const lowerTitle = title.toLowerCase();
    const lowerDesc = originalDesc.toLowerCase();
    
    // If description is already comprehensive (>200 chars with structure), enhance minimally
    if (originalDesc.length > 200 && originalDesc.includes('\n')) {
        return addEngagementElements(originalDesc);
    }
    
    let enhancedDescription = '';
    
    // Create engaging opening based on content type
    if (lowerTitle.includes('how to') || lowerTitle.includes('tutorial')) {
        enhancedDescription = `🎯 In this comprehensive tutorial, we'll walk you through ${title.toLowerCase()} step by step.\n\n`;
        enhancedDescription += originalDesc || `Whether you're a beginner or looking to improve your skills, this guide covers everything you need to know.`;
    } else if (lowerTitle.includes('review')) {
        enhancedDescription = `📝 In this detailed review, we take an honest look at ${title.toLowerCase()}.\n\n`;
        enhancedDescription += originalDesc || `We'll cover the pros, cons, and everything you need to know before making a decision.`;
    } else if (lowerTitle.includes('tips') || lowerTitle.includes('advice')) {
        enhancedDescription = `💡 These proven ${title.toLowerCase()} have helped countless people achieve better results.\n\n`;
        enhancedDescription += originalDesc || `Learn the strategies that actually work and start seeing improvements today.`;
    } else if (lowerTitle.includes('gaming') || lowerTitle.includes('gameplay')) {
        enhancedDescription = `🎮 Join us for this exciting ${title.toLowerCase()} experience!\n\n`;
        enhancedDescription += originalDesc || `Watch as we tackle challenges, discover strategies, and have fun along the way.`;
    } else {
        // Generic engaging opening
        enhancedDescription = `🔥 Welcome to our video about ${title.toLowerCase()}!\n\n`;
        enhancedDescription += originalDesc || `In this comprehensive guide, we explore everything you need to know about this topic.`;
    }
    
    // Add structure if the description is just a wall of text
    if (originalDesc.length > 100 && !originalDesc.includes('\n')) {
        const sentences = originalDesc.split('. ');
        if (sentences.length > 2) {
            enhancedDescription = sentences.slice(0, 2).join('. ') + '.\n\n' + sentences.slice(2).join('. ');
        }
    }
    
    // Add value propositions based on content type
    if (lowerTitle.includes('tutorial') || lowerTitle.includes('guide')) {
        enhancedDescription += `\n\n⭐ What you'll learn:\n• Step-by-step instructions\n• Common mistakes to avoid\n• Pro tips and best practices`;
    } else if (lowerTitle.includes('review')) {
        enhancedDescription += `\n\n⭐ In this review:\n• Detailed feature breakdown\n• Real-world testing results\n• Our honest recommendation`;
    }
    
    return addEngagementElements(enhancedDescription);
}

/**
 * Add engagement elements to description
 * @param {string} description - Description to enhance
 * @returns {string} Description with engagement elements
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

#tutorial #tips #guide #helpful`;
    
    return description + engagementSection;
}

/**
 * Generate content suggestions based on analysis
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @returns {Array} Array of suggestions
 */
function generateContentSuggestions(title = '', description = '') {
    const suggestions = [];
    const content = `${title} ${description}`.toLowerCase();
    
    // Title suggestions
    if (title.length < 30) {
        suggestions.push('Consider making your title longer (30-60 characters optimal) for better SEO');
    }
    if (title.length > 100) {
        suggestions.push('Your title might be too long - consider shortening it to under 100 characters');
    }
    if (!title.match(/\d/)) {
        suggestions.push('Consider adding numbers to your title (e.g., "5 Ways", "2024 Guide") for better engagement');
    }
    
    // Description suggestions
    if (description.length < 125) {
        suggestions.push('Add more details to your description (125+ characters recommended) for better searchability');
    }
    if (!description.includes('http') && !description.includes('link')) {
        suggestions.push('Consider adding relevant links to your description (social media, related content)');
    }
    if (!description.includes('#')) {
        suggestions.push('Add relevant hashtags to your description for better discoverability');
    }
    
    // Content type specific suggestions
    if (content.includes('tutorial') || content.includes('how to')) {
        suggestions.push('For tutorials: Consider adding timestamps for different sections');
        suggestions.push('Include a list of tools or materials needed in your description');
    }
    
    if (content.includes('review')) {
        suggestions.push('For reviews: Include both pros and cons for balanced perspective');
        suggestions.push('Add product links or affiliate disclosures if applicable');
    }
    
    // Engagement suggestions
    if (!content.includes('subscribe') && !content.includes('like')) {
        suggestions.push('Add a call-to-action asking viewers to like and subscribe');
    }
    
    return suggestions.slice(0, 5); // Limit to 5 most relevant suggestions
}

/**
 * Analyze content and provide SEO score
 * @param {string} title - Video title
 * @param {string} description - Video description
 * @param {string} tags - Video tags
 * @returns {Object} SEO analysis with scores
 */
function analyzeSEOScore(title = '', description = '', tags = '') {
    let titleScore = 0;
    let descriptionScore = 0;
    let tagsScore = 0;
    
    // Title scoring
    if (title.length >= 30 && title.length <= 70) titleScore += 30;
    else if (title.length >= 20 && title.length <= 80) titleScore += 20;
    else titleScore += 10;
    
    if (/\d/.test(title)) titleScore += 15; // Contains numbers
    if (/[!?]/.test(title)) titleScore += 10; // Has punctuation
    if (title.match(/\b(202[0-9]|how|best|top|guide|tutorial)\b/i)) titleScore += 15; // SEO keywords
    if (title.length > 0) titleScore += 10; // Basic points for having a title
    
    titleScore = Math.min(titleScore, 100);
    
    // Description scoring
    if (description.length >= 125) descriptionScore += 25;
    if (description.length >= 200) descriptionScore += 15;
    if (/https?:\/\//.test(description)) descriptionScore += 15; // Contains links
    if (/#\w+/.test(description)) descriptionScore += 15; // Contains hashtags
    if ((description.match(/\n/g) || []).length >= 2) descriptionScore += 15; // Multiple paragraphs
    if (description.toLowerCase().includes('subscribe') || description.toLowerCase().includes('like')) {
        descriptionScore += 10; // Call to action
    }
    if (description.length > 0) descriptionScore += 5; // Basic points
    
    descriptionScore = Math.min(descriptionScore, 100);
    
    // Tags scoring
    if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        if (tagArray.length >= 5 && tagArray.length <= 15) tagsScore += 40;
        else if (tagArray.length >= 3) tagsScore += 25;
        
        const avgLength = tagArray.reduce((sum, tag) => sum + tag.length, 0) / tagArray.length;
        if (avgLength >= 3 && avgLength <= 15) tagsScore += 30;
        
        // Mix of single and multi-word tags
        const singleWords = tagArray.filter(tag => !tag.includes(' ')).length;
        const multiWords = tagArray.length - singleWords;
        if (singleWords > 0 && multiWords > 0) tagsScore += 30;
    }
    
    tagsScore = Math.min(tagsScore, 100);
    
    // Overall score (weighted average)
    const overallScore = Math.round((titleScore * 0.4) + (descriptionScore * 0.35) + (tagsScore * 0.25));
    
    return {
        overallScore,
        titleScore,
        descriptionScore,
        tagsScore,
        suggestions: generateContentSuggestions(title, description)
    };
}

// Export functions for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    // Node.js environment
    module.exports = {
        generateFallbackTags,
        generateFallbackTitle,
        generateFallbackDescription,
        generateContentSuggestions,
        analyzeSEOScore
    };
} else if (typeof window !== 'undefined') {
    // Browser environment - attach to OpenStudio namespace
    if (typeof window.OpenStudio === 'undefined') {
        window.OpenStudio = {};
    }
    
    window.OpenStudio.FallbackHelper = {
        generateFallbackTags,
        generateFallbackTitle,
        generateFallbackDescription,
        generateContentSuggestions,
        analyzeSEOScore
    };
}
