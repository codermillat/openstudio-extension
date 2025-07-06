/**
 * OpenStudio YouTube API Helper
 * Handles authentication and API calls to YouTube Data API
 */

// YouTube API configuration
const YOUTUBE_API_CONFIG = {
    baseUrl: 'https://www.googleapis.com/youtube/v3',
    scopes: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.upload'
    ],
    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
    dailyQuotaLimit: 10000
};

// API endpoints
const ENDPOINTS = {
    channels: '/channels',
    videos: '/videos',
    search: '/search',
    analytics: '/analytics/v2/reports',
    videoCategories: '/videoCategories',
    playlists: '/playlists',
    playlistItems: '/playlistItems'
};

/**
 * YouTube API Helper class
 */
class YouTubeAPIHelper {
    constructor() {
        this.apiKey = null;
        this.isAuthenticated = false;
        this.authToken = null;
        this.rateLimitRemaining = YOUTUBE_API_CONFIG.dailyQuotaLimit;
    }

    /**
     * Initialize YouTube API with key
     * @param {string} apiKey - YouTube Data API key
     * @returns {Promise<boolean>} Success status
     */
    async initialize(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Valid API key is required');
        }

        this.apiKey = apiKey;
        
        try {
            // Test API key with a simple request
            const testResponse = await this.makeRequest(ENDPOINTS.videoCategories, {
                part: 'snippet',
                regionCode: 'US'
            });

            if (testResponse && testResponse.items) {
                return true;
            } else {
                throw new Error('API key validation failed');
            }
        } catch (error) {
            console.error('YouTube API initialization failed:', error);
            this.apiKey = null;
            throw error;
        }
    }

    /**
     * Authenticate user with OAuth 2.0
     * @returns {Promise<boolean>} Authentication status
     */
    async authenticate() {
        try {
            // Use Chrome Identity API for OAuth
            const authResult = await new Promise((resolve, reject) => {
                chrome.identity.getAuthToken({
                    interactive: true,
                    scopes: YOUTUBE_API_CONFIG.scopes
                }, (token) => {
                    if (chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve(token);
                    }
                });
            });

            this.authToken = authResult;
            this.isAuthenticated = true;
            return true;
        } catch (error) {
            console.error('YouTube API authentication failed:', error);
            this.isAuthenticated = false;
            throw error;
        }
    }

    /**
     * Get channel information
     * @param {string} channelId - Channel ID (optional, uses authenticated user if not provided)
     * @returns {Promise<Object>} Channel data
     */
    async getChannelInfo(channelId = null) {
        const params = {
            part: 'snippet,statistics,brandingSettings,contentDetails',
            ...(channelId ? { id: channelId } : { mine: true })
        };

        const response = await this.makeAuthenticatedRequest(ENDPOINTS.channels, params);
        return response.items ? response.items[0] : null;
    }

    /**
     * Get video information
     * @param {string} videoId - Video ID
     * @returns {Promise<Object>} Video data
     */
    async getVideoInfo(videoId) {
        if (!videoId) {
            throw new Error('Video ID is required');
        }

        const params = {
            part: 'snippet,statistics,contentDetails,status',
            id: videoId
        };

        const response = await this.makeRequest(ENDPOINTS.videos, params);
        return response.items ? response.items[0] : null;
    }

    /**
     * Get multiple videos information
     * @param {Array<string>} videoIds - Array of video IDs
     * @returns {Promise<Array>} Array of video data
     */
    async getVideosInfo(videoIds) {
        if (!Array.isArray(videoIds) || videoIds.length === 0) {
            throw new Error('Video IDs array is required');
        }

        // YouTube API allows up to 50 IDs per request
        const chunks = this.chunkArray(videoIds, 50);
        const allVideos = [];

        for (const chunk of chunks) {
            const params = {
                part: 'snippet,statistics,contentDetails,status',
                id: chunk.join(',')
            };

            const response = await this.makeRequest(ENDPOINTS.videos, params);
            if (response.items) {
                allVideos.push(...response.items);
            }
        }

        return allVideos;
    }

    /**
     * Search for videos
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Object>} Search results
     */
    async searchVideos(query, options = {}) {
        const params = {
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: options.maxResults || 25,
            order: options.order || 'relevance',
            publishedAfter: options.publishedAfter,
            publishedBefore: options.publishedBefore,
            videoDuration: options.duration,
            videoDefinition: options.definition,
            ...options
        };

        return await this.makeRequest(ENDPOINTS.search, params);
    }

    /**
     * Get channel videos
     * @param {string} channelId - Channel ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Channel videos
     */
    async getChannelVideos(channelId, options = {}) {
        // First get channel uploads playlist
        const channelInfo = await this.getChannelInfo(channelId);
        if (!channelInfo || !channelInfo.contentDetails.relatedPlaylists.uploads) {
            throw new Error('Could not find uploads playlist for channel');
        }

        const uploadsPlaylistId = channelInfo.contentDetails.relatedPlaylists.uploads;
        
        // Get playlist items
        const params = {
            part: 'snippet,contentDetails',
            playlistId: uploadsPlaylistId,
            maxResults: options.maxResults || 50,
            pageToken: options.pageToken
        };

        const playlistResponse = await this.makeRequest(ENDPOINTS.playlistItems, params);
        
        if (!playlistResponse.items || playlistResponse.items.length === 0) {
            return { videos: [], nextPageToken: null };
        }

        // Get detailed video information
        const videoIds = playlistResponse.items.map(item => item.contentDetails.videoId);
        const videos = await this.getVideosInfo(videoIds);

        return {
            videos,
            nextPageToken: playlistResponse.nextPageToken,
            totalResults: playlistResponse.pageInfo.totalResults
        };
    }

    /**
     * Get trending videos
     * @param {string} regionCode - Region code (e.g., 'US', 'GB')
     * @param {string} categoryId - Category ID (optional)
     * @returns {Promise<Array>} Trending videos
     */
    async getTrendingVideos(regionCode = 'US', categoryId = null) {
        const params = {
            part: 'snippet,statistics,contentDetails',
            chart: 'mostPopular',
            regionCode,
            maxResults: 50,
            ...(categoryId && { videoCategoryId: categoryId })
        };

        const response = await this.makeRequest(ENDPOINTS.videos, params);
        return response.items || [];
    }

    /**
     * Get video analytics (requires authentication)
     * @param {string} videoId - Video ID
     * @param {string} startDate - Start date (YYYY-MM-DD)
     * @param {string} endDate - End date (YYYY-MM-DD)
     * @returns {Promise<Object>} Analytics data
     */
    async getVideoAnalytics(videoId, startDate, endDate) {
        if (!this.isAuthenticated) {
            throw new Error('Authentication required for analytics');
        }

        const params = {
            ids: 'channel==MINE',
            'start-date': startDate,
            'end-date': endDate,
            metrics: 'views,estimatedMinutesWatched,averageViewDuration,likes,dislikes,comments,shares,subscribersGained',
            dimensions: 'video',
            filters: `video==${videoId}`,
            sort: '-views'
        };

        return await this.makeAuthenticatedRequest(ENDPOINTS.analytics, params);
    }

    /**
     * Get video comments
     * @param {string} videoId - Video ID
     * @param {Object} options - Options
     * @returns {Promise<Object>} Comments data
     */
    async getVideoComments(videoId, options = {}) {
        const params = {
            part: 'snippet,replies',
            videoId,
            maxResults: options.maxResults || 20,
            order: options.order || 'relevance',
            pageToken: options.pageToken
        };

        return await this.makeRequest('/commentThreads', params);
    }

    /**
     * Extract video ID from YouTube URL
     * @param {string} url - YouTube URL
     * @returns {string|null} Video ID
     */
    static extractVideoId(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        // Various YouTube URL formats
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
            /youtube\.com\/watch\?.*v=([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Extract channel ID from YouTube URL
     * @param {string} url - YouTube URL
     * @returns {string|null} Channel ID
     */
    static extractChannelId(url) {
        if (!url || typeof url !== 'string') {
            return null;
        }

        const patterns = [
            /youtube\.com\/channel\/([^\/\n?#]+)/,
            /youtube\.com\/c\/([^\/\n?#]+)/,
            /youtube\.com\/user\/([^\/\n?#]+)/,
            /youtube\.com\/@([^\/\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Make authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} API response
     */
    async makeAuthenticatedRequest(endpoint, params) {
        if (!this.isAuthenticated || !this.authToken) {
            throw new Error('Authentication required');
        }

        const url = new URL(`${YOUTUBE_API_CONFIG.baseUrl}${endpoint}`);
        Object.keys(params).forEach(key => {
            url.searchParams.append(key, params[key]);
        });

        const response = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${this.authToken}`,
                'Accept': 'application/json'
            }
        });

        return await this.handleResponse(response);
    }

    /**
     * Make API request with API key
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Request parameters
     * @returns {Promise<Object>} API response
     */
    async makeRequest(endpoint, params) {
        if (!this.apiKey) {
            throw new Error('API key not initialized');
        }

        const url = new URL(`${YOUTUBE_API_CONFIG.baseUrl}${endpoint}`);
        url.searchParams.append('key', this.apiKey);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        const response = await fetch(url.toString(), {
            headers: {
                'Accept': 'application/json'
            }
        });

        return await this.handleResponse(response);
    }

    /**
     * Handle API response
     * @param {Response} response - Fetch response
     * @returns {Promise<Object>} Parsed response
     */
    async handleResponse(response) {
        // Update rate limit info if available
        if (response.headers.has('X-RateLimit-Remaining')) {
            this.rateLimitRemaining = parseInt(response.headers.get('X-RateLimit-Remaining'));
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData.error?.message || `API request failed: ${response.status}`);
            error.status = response.status;
            error.code = errorData.error?.code;
            
            // Handle specific error cases
            if (response.status === 403) {
                if (errorData.error?.message?.includes('quota')) {
                    error.message = 'YouTube API quota exceeded. Please try again tomorrow.';
                } else {
                    error.message = 'YouTube API access forbidden. Check your API key permissions.';
                }
            } else if (response.status === 401) {
                error.message = 'YouTube API authentication failed. Please re-authenticate.';
                this.isAuthenticated = false;
                this.authToken = null;
            }
            
            throw error;
        }

        return await response.json();
    }

    /**
     * Check rate limit status
     * @returns {Object} Rate limit info
     */
    getRateLimitStatus() {
        return {
            remaining: this.rateLimitRemaining,
            isNearLimit: this.rateLimitRemaining < 1000,
            isExceeded: this.rateLimitRemaining <= 0
        };
    }

    /**
     * Chunk array into smaller arrays
     * @param {Array} array - Array to chunk
     * @param {number} size - Chunk size
     * @returns {Array} Array of chunks
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    /**
     * Clear authentication
     */
    clearAuth() {
        this.isAuthenticated = false;
        this.authToken = null;
        
        // Clear Chrome identity token
        if (chrome.identity && chrome.identity.removeCachedAuthToken) {
            chrome.identity.removeCachedAuthToken({ token: this.authToken });
        }
    }
}

export default YouTubeAPIHelper;
