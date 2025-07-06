/**
 * OpenStudio SEO Scorer Utility
 * Analyzes video metadata and provides SEO scoring and suggestions
 */

// SEO scoring weights and criteria
const SEO_WEIGHTS = {
    TITLE: 0.4,      // 40% weight
    DESCRIPTION: 0.35, // 35% weight
    TAGS: 0.25       // 25% weight
};

const SCORING_CRITERIA = {
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
};

// Common SEO keywords and phrases to look for
const SEO_KEYWORDS = {
    engagement: ['how to', 'tutorial', 'guide', 'tips', 'tricks', 'secrets', 'best', 'top'],
    temporal: ['2024', '2025', 'new', 'latest', 'updated', 'recent'],
    emotional: ['amazing', 'incredible', 'shocking', 'surprising', 'must see', 'unbelievable'],
    actionable: ['learn', 'discover', 'find out', 'reveal', 'show', 'explain', 'teach']
};

/**
 * Main SEO Scorer class
 */
class SEOScorer {
    /**
     * Analyze video metadata and return comprehensive SEO score
     * @param {Object} videoData - Video metadata
     * @param {string} videoData.title - Video title
     * @param {string} videoData.description - Video description
     * @param {string|Array} videoData.tags - Video tags
     * @returns {Object} SEO analysis results
     */
    static analyzeVideo(videoData) {
        const { title, description, tags } = videoData;
        
        // Parse tags if string
        const parsedTags = typeof tags === 'string' 
            ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
            : Array.isArray(tags) ? tags : [];

        // Score individual components
        const titleAnalysis = this.analyzeTitleSEO(title);
        const descriptionAnalysis = this.analyzeDescriptionSEO(description);
        const tagsAnalysis = this.analyzeTagsSEO(parsedTags);

        // Calculate overall SEO score
        const overallScore = Math.round(
            (titleAnalysis.score * SEO_WEIGHTS.TITLE) +
            (descriptionAnalysis.score * SEO_WEIGHTS.DESCRIPTION) +
            (tagsAnalysis.score * SEO_WEIGHTS.TAGS)
        );

        // Generate comprehensive suggestions
        const suggestions = this.generateSuggestions(
            titleAnalysis,
            descriptionAnalysis,
            tagsAnalysis
        );

        // Determine SEO grade
        const grade = this.calculateSEOGrade(overallScore);

        return {
            overallScore,
            grade,
            components: {
                title: titleAnalysis,
                description: descriptionAnalysis,
                tags: tagsAnalysis
            },
            suggestions,
            analysis: {
                strengths: this.identifyStrengths(titleAnalysis, descriptionAnalysis, tagsAnalysis),
                weaknesses: this.identifyWeaknesses(titleAnalysis, descriptionAnalysis, tagsAnalysis),
                priority: this.prioritizeSuggestions(suggestions)
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Analyze title SEO factors
     * @param {string} title - Video title
     * @returns {Object} Title analysis
     */
    static analyzeTitleSEO(title) {
        if (!title || typeof title !== 'string') {
            return {
                score: 0,
                length: 0,
                issues: ['Title is missing or invalid'],
                suggestions: ['Add a compelling title'],
                keywords: []
            };
        }

        const length = title.length;
        const words = title.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;

        let score = 0;
        const issues = [];
        const suggestions = [];
        const keywords = [];

        // Length scoring
        if (length < SCORING_CRITERIA.title.minLength) {
            issues.push('Title is too short');
            suggestions.push(`Add more descriptive words (current: ${length}, minimum: ${SCORING_CRITERIA.title.minLength})`);
            score += (length / SCORING_CRITERIA.title.minLength) * 30;
        } else if (length > SCORING_CRITERIA.title.maxLength) {
            issues.push('Title is too long and may be truncated');
            suggestions.push(`Shorten title to under ${SCORING_CRITERIA.title.maxLength} characters`);
            score += 25;
        } else {
            score += 35;
            if (length >= SCORING_CRITERIA.title.optimalLength - 10 && length <= SCORING_CRITERIA.title.optimalLength + 10) {
                score += 5; // Bonus for optimal length
            }
        }

        // Keyword analysis
        const foundKeywords = this.findSEOKeywords(title);
        keywords.push(...foundKeywords);
        
        if (foundKeywords.length > 0) {
            score += Math.min(foundKeywords.length * 10, 30);
        } else {
            suggestions.push('Consider adding engaging keywords like "how to", "best", or "guide"');
        }

        // Word count check
        if (wordCount < 4) {
            issues.push('Title has too few words');
            suggestions.push('Add more descriptive words to improve searchability');
        }

        // Capitalization check
        if (title === title.toUpperCase() || title === title.toLowerCase()) {
            issues.push('Improve title capitalization');
            suggestions.push('Use proper title case for better readability');
            score -= 5;
        } else {
            score += 5;
        }

        // Number/year inclusion
        if (/\b(20\d{2}|2024|2025)\b/.test(title)) {
            score += 5;
        } else {
            suggestions.push('Consider adding current year for relevancy');
        }

        // Question format bonus
        if (title.includes('?')) {
            score += 5;
        }

        return {
            score: Math.max(0, Math.min(100, score)),
            length,
            wordCount,
            keywords,
            issues,
            suggestions,
            analysis: {
                hasNumbers: /\d/.test(title),
                hasQuestion: title.includes('?'),
                hasEmotionalWords: this.hasEmotionalWords(title),
                hasActionWords: this.hasActionWords(title)
            }
        };
    }

    /**
     * Analyze description SEO factors
     * @param {string} description - Video description
     * @returns {Object} Description analysis
     */
    static analyzeDescriptionSEO(description) {
        if (!description || typeof description !== 'string') {
            return {
                score: 0,
                length: 0,
                issues: ['Description is missing'],
                suggestions: ['Add a detailed description'],
                keywords: []
            };
        }

        const length = description.length;
        const words = description.toLowerCase().split(/\s+/).filter(word => word.length > 0);
        const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const paragraphs = description.split(/\n\s*\n/).filter(p => p.trim().length > 0);

        let score = 0;
        const issues = [];
        const suggestions = [];
        const keywords = [];

        // Length scoring
        if (length < SCORING_CRITERIA.description.minLength) {
            issues.push('Description is too short');
            suggestions.push(`Expand description (current: ${length}, minimum: ${SCORING_CRITERIA.description.minLength})`);
            score += (length / SCORING_CRITERIA.description.minLength) * 25;
        } else if (length > SCORING_CRITERIA.description.maxLength) {
            issues.push('Description is extremely long');
            suggestions.push('Consider condensing key information');
            score += 20;
        } else {
            score += 30;
            if (length >= SCORING_CRITERIA.description.optimalLength) {
                score += 10;
            }
        }

        // Structure scoring
        if (paragraphs.length > 1) {
            score += 10;
        } else {
            suggestions.push('Break description into paragraphs for better readability');
        }

        if (sentences.length >= 3) {
            score += 10;
        } else {
            suggestions.push('Add more detailed sentences to improve context');
        }

        // Keyword analysis
        const foundKeywords = this.findSEOKeywords(description);
        keywords.push(...foundKeywords);
        
        if (foundKeywords.length > 0) {
            score += Math.min(foundKeywords.length * 5, 20);
        } else {
            suggestions.push('Include relevant keywords naturally in the description');
        }

        // Links and timestamps
        const hasLinks = /https?:\/\//.test(description);
        const hasTimestamps = /\d{1,2}:\d{2}/.test(description);
        
        if (hasLinks) {
            score += 5;
        } else {
            suggestions.push('Consider adding relevant links (social media, website)');
        }

        if (hasTimestamps) {
            score += 5;
        }

        // Call to action
        const hasCTA = /subscribe|like|comment|share|bell|notification/i.test(description);
        if (hasCTA) {
            score += 5;
        } else {
            suggestions.push('Add call-to-action phrases (subscribe, like, comment)');
        }

        // Hashtags
        const hashtags = description.match(/#\w+/g) || [];
        if (hashtags.length > 0 && hashtags.length <= 15) {
            score += 5;
        } else if (hashtags.length > 15) {
            suggestions.push('Reduce number of hashtags (maximum 15 recommended)');
        }

        return {
            score: Math.max(0, Math.min(100, score)),
            length,
            wordCount: words.length,
            sentences: sentences.length,
            paragraphs: paragraphs.length,
            keywords,
            hashtags,
            issues,
            suggestions,
            analysis: {
                hasLinks,
                hasTimestamps,
                hasCTA,
                hashtagCount: hashtags.length
            }
        };
    }

    /**
     * Analyze tags SEO factors
     * @param {Array} tags - Video tags
     * @returns {Object} Tags analysis
     */
    static analyzeTagsSEO(tags) {
        if (!Array.isArray(tags)) {
            return {
                score: 0,
                count: 0,
                issues: ['Tags are missing or invalid'],
                suggestions: ['Add relevant tags'],
                analysis: {}
            };
        }

        const count = tags.length;
        const uniqueTags = [...new Set(tags.map(tag => tag.toLowerCase()))];
        const totalLength = tags.join('').length;

        let score = 0;
        const issues = [];
        const suggestions = [];

        // Count scoring
        if (count < SCORING_CRITERIA.tags.minCount) {
            issues.push('Too few tags');
            suggestions.push(`Add more tags (current: ${count}, minimum: ${SCORING_CRITERIA.tags.minCount})`);
            score += (count / SCORING_CRITERIA.tags.minCount) * 40;
        } else if (count > SCORING_CRITERIA.tags.maxCount) {
            issues.push('Too many tags may dilute relevance');
            suggestions.push(`Reduce to ${SCORING_CRITERIA.tags.maxCount} most relevant tags`);
            score += 35;
        } else {
            score += 50;
            if (count >= SCORING_CRITERIA.tags.optimalCount - 2 && count <= SCORING_CRITERIA.tags.optimalCount + 2) {
                score += 10;
            }
        }

        // Diversity check
        if (uniqueTags.length < tags.length) {
            issues.push('Duplicate tags detected');
            suggestions.push('Remove duplicate tags');
            score -= 10;
        } else {
            score += 10;
        }

        // Tag length analysis
        const avgTagLength = totalLength / count;
        if (avgTagLength < 3) {
            suggestions.push('Use more descriptive tags');
            score -= 5;
        } else if (avgTagLength > 20) {
            suggestions.push('Consider shorter, more focused tags');
            score -= 5;
        } else {
            score += 10;
        }

        // Keyword relevance
        const keywordTags = tags.filter(tag => 
            this.findSEOKeywords(tag).length > 0
        );
        
        if (keywordTags.length > 0) {
            score += Math.min(keywordTags.length * 5, 20);
        } else {
            suggestions.push('Include tags with relevant keywords');
        }

        return {
            score: Math.max(0, Math.min(100, score)),
            count,
            uniqueCount: uniqueTags.length,
            averageLength: Math.round(avgTagLength),
            keywordTags: keywordTags.length,
            issues,
            suggestions,
            analysis: {
                hasDuplicates: uniqueTags.length < tags.length,
                hasKeywords: keywordTags.length > 0,
                distribution: this.analyzeTagDistribution(tags)
            }
        };
    }

    /**
     * Find SEO keywords in text
     * @param {string} text - Text to analyze
     * @returns {Array} Found keywords
     */
    static findSEOKeywords(text) {
        const lowerText = text.toLowerCase();
        const found = [];

        Object.values(SEO_KEYWORDS).forEach(categoryKeywords => {
            categoryKeywords.forEach(keyword => {
                if (lowerText.includes(keyword)) {
                    found.push(keyword);
                }
            });
        });

        return [...new Set(found)];
    }

    /**
     * Check if text has emotional words
     * @param {string} text - Text to check
     * @returns {boolean} Has emotional words
     */
    static hasEmotionalWords(text) {
        const emotionalWords = SEO_KEYWORDS.emotional;
        const lowerText = text.toLowerCase();
        return emotionalWords.some(word => lowerText.includes(word));
    }

    /**
     * Check if text has action words
     * @param {string} text - Text to check
     * @returns {boolean} Has action words
     */
    static hasActionWords(text) {
        const actionWords = SEO_KEYWORDS.actionable;
        const lowerText = text.toLowerCase();
        return actionWords.some(word => lowerText.includes(word));
    }

    /**
     * Generate comprehensive suggestions
     * @param {Object} titleAnalysis - Title analysis
     * @param {Object} descriptionAnalysis - Description analysis
     * @param {Object} tagsAnalysis - Tags analysis
     * @returns {Array} Suggestions array
     */
    static generateSuggestions(titleAnalysis, descriptionAnalysis, tagsAnalysis) {
        const suggestions = [];

        // Combine all suggestions
        suggestions.push(...titleAnalysis.suggestions);
        suggestions.push(...descriptionAnalysis.suggestions);
        suggestions.push(...tagsAnalysis.suggestions);

        // Add strategic suggestions
        if (titleAnalysis.score < 70 && descriptionAnalysis.score < 70) {
            suggestions.push('Focus on improving both title and description for maximum impact');
        }

        if (!titleAnalysis.analysis.hasNumbers && !titleAnalysis.analysis.hasQuestion) {
            suggestions.push('Consider using numbers or questions in title for better engagement');
        }

        return [...new Set(suggestions)]; // Remove duplicates
    }

    /**
     * Identify strengths in the analysis
     * @param {Object} titleAnalysis - Title analysis
     * @param {Object} descriptionAnalysis - Description analysis
     * @param {Object} tagsAnalysis - Tags analysis
     * @returns {Array} Strengths array
     */
    static identifyStrengths(titleAnalysis, descriptionAnalysis, tagsAnalysis) {
        const strengths = [];

        if (titleAnalysis.score >= 80) {
            strengths.push('Excellent title optimization');
        }
        if (descriptionAnalysis.score >= 80) {
            strengths.push('Well-optimized description');
        }
        if (tagsAnalysis.score >= 80) {
            strengths.push('Good tag selection');
        }
        if (titleAnalysis.keywords.length > 0) {
            strengths.push('Title includes SEO keywords');
        }
        if (descriptionAnalysis.analysis.hasCTA) {
            strengths.push('Description includes call-to-action');
        }

        return strengths;
    }

    /**
     * Identify weaknesses in the analysis
     * @param {Object} titleAnalysis - Title analysis
     * @param {Object} descriptionAnalysis - Description analysis
     * @param {Object} tagsAnalysis - Tags analysis
     * @returns {Array} Weaknesses array
     */
    static identifyWeaknesses(titleAnalysis, descriptionAnalysis, tagsAnalysis) {
        const weaknesses = [];

        if (titleAnalysis.score < 50) {
            weaknesses.push('Title needs significant improvement');
        }
        if (descriptionAnalysis.score < 50) {
            weaknesses.push('Description requires optimization');
        }
        if (tagsAnalysis.score < 50) {
            weaknesses.push('Tag strategy needs work');
        }

        return weaknesses;
    }

    /**
     * Prioritize suggestions by impact
     * @param {Array} suggestions - All suggestions
     * @returns {Array} Prioritized suggestions
     */
    static prioritizeSuggestions(suggestions) {
        const priorities = {
            high: [],
            medium: [],
            low: []
        };

        suggestions.forEach(suggestion => {
            const lower = suggestion.toLowerCase();
            
            if (lower.includes('title') || lower.includes('missing') || lower.includes('too short')) {
                priorities.high.push(suggestion);
            } else if (lower.includes('description') || lower.includes('tags')) {
                priorities.medium.push(suggestion);
            } else {
                priorities.low.push(suggestion);
            }
        });

        return priorities;
    }

    /**
     * Calculate SEO grade from score
     * @param {number} score - SEO score (0-100)
     * @returns {string} Letter grade
     */
    static calculateSEOGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'B-';
        if (score >= 60) return 'C+';
        if (score >= 55) return 'C';
        if (score >= 50) return 'C-';
        if (score >= 40) return 'D';
        return 'F';
    }

    /**
     * Analyze tag distribution
     * @param {Array} tags - Tags array
     * @returns {Object} Distribution analysis
     */
    static analyzeTagDistribution(tags) {
        const lengths = tags.map(tag => tag.length);
        const shortTags = tags.filter(tag => tag.length <= 5).length;
        const mediumTags = tags.filter(tag => tag.length > 5 && tag.length <= 15).length;
        const longTags = tags.filter(tag => tag.length > 15).length;

        return {
            short: shortTags,
            medium: mediumTags,
            long: longTags,
            averageLength: lengths.reduce((a, b) => a + b, 0) / lengths.length
        };
    }
}

export default SEOScorer;
