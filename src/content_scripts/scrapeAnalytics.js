/**
 * OpenStudio Analytics Scraper
 * Extracts analytics data from YouTube Studio interface
 */

// Selectors for YouTube Studio analytics elements
const ANALYTICS_SELECTORS = {
    // Dashboard metrics
    dashboardMetrics: '.ytcp-analytics-summary-card',
    viewsCard: '[data-testid="views-card"]',
    watchTimeCard: '[data-testid="watch-time-card"]',
    subscribersCard: '[data-testid="subscribers-card"]',
    revenueCard: '[data-testid="revenue-card"]',
    
    // Video-specific metrics
    videoMetrics: '.ytcp-video-analytics-section',
    videoTitle: '.ytcp-video-title',
    videoViews: '.ytcp-video-analytics-views',
    videoLikes: '.ytcp-video-analytics-likes',
    videoCTR: '.ytcp-video-analytics-ctr',
    videoRetention: '.ytcp-video-analytics-retention',
    
    // Performance charts
    chartContainer: '.ytcp-analytics-chart-container',
    chartData: '.ytcp-analytics-chart-data',
    chartLegend: '.ytcp-analytics-chart-legend',
    
    // Analytics tables
    analyticsTable: '.ytcp-table',
    tableRows: '.ytcp-table-row',
    tableCells: '.ytcp-table-cell',
    
    // Time period selector
    timePeriod: '.ytcp-analytics-time-period-selector',
    timeOptions: '.ytcp-analytics-time-option'
};

// Metrics to track
const TRACKED_METRICS = {
    views: 'Views',
    watchTime: 'Watch time',
    subscribers: 'Subscribers',
    revenue: 'Revenue',
    ctr: 'Click-through rate',
    retention: 'Average view duration',
    impressions: 'Impressions',
    likes: 'Likes',
    comments: 'Comments',
    shares: 'Shares'
};

/**
 * Analytics Scraper class
 */
class AnalyticsScraper {
    constructor() {
        this.isMonitoring = false;
        this.observer = null;
        this.lastUpdate = null;
        this.scrapedData = {};
        this.retryCount = 0;
        this.maxRetries = 5;
    }

    /**
     * Start monitoring analytics page for data
     */
    startMonitoring() {
        if (this.isMonitoring) {
            return;
        }

        this.isMonitoring = true;
        
        // Initial scrape
        this.scrapeCurrentPage();
        
        // Set up mutation observer for dynamic content
        this.setupMutationObserver();
        
        // Periodic update
        this.setupPeriodicUpdate();
    }

    /**
     * Stop monitoring analytics
     */
    stopMonitoring() {
        this.isMonitoring = false;
        
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Scrape analytics data from current page
     */
    async scrapeCurrentPage() {
        try {
            const url = window.location.href;
            const pageType = this.detectAnalyticsPageType(url);
            
            
            let data = {};
            
            switch (pageType) {
                case 'dashboard':
                    data = await this.scrapeDashboardMetrics();
                    break;
                case 'video':
                    data = await this.scrapeVideoAnalytics();
                    break;
                case 'channel':
                    data = await this.scrapeChannelAnalytics();
                    break;
                case 'content':
                    data = await this.scrapeContentAnalytics();
                    break;
                default:
                    return;
            }
            
            if (Object.keys(data).length > 0) {
                this.scrapedData = {
                    ...this.scrapedData,
                    [pageType]: data,
                    lastUpdate: new Date().toISOString(),
                    url: url
                };
                
                // Store in extension storage
                await this.storeAnalyticsData(this.scrapedData);
                
                // Notify other parts of extension
                this.notifyDataUpdate(data, pageType);
                
                this.retryCount = 0;
            } else {
                this.handleScrapeFailure();
            }
        } catch (error) {
            console.error('Analytics scraping error:', error);
            this.handleScrapeFailure();
        }
    }

    /**
     * Detect analytics page type from URL
     */
    detectAnalyticsPageType(url) {
        if (url.includes('/analytics/channel')) return 'channel';
        if (url.includes('/analytics/video')) return 'video';
        if (url.includes('/analytics/content')) return 'content';
        if (url.includes('/analytics')) return 'dashboard';
        return 'unknown';
    }

    /**
     * Scrape dashboard overview metrics
     */
    async scrapeDashboardMetrics() {
        const metrics = {};
        
        try {
            // Wait for metrics to load
            await this.waitForElement(ANALYTICS_SELECTORS.dashboardMetrics);
            
            // Extract summary cards
            const summaryCards = document.querySelectorAll(ANALYTICS_SELECTORS.dashboardMetrics);
            
            summaryCards.forEach(card => {
                const metric = this.extractMetricFromCard(card);
                if (metric.name && metric.value) {
                    metrics[metric.name] = metric;
                }
            });
            
            // Extract additional dashboard data
            metrics.timePeriod = this.getCurrentTimePeriod();
            metrics.chartData = this.extractChartData();
            
            return metrics;
        } catch (error) {
            console.error('Dashboard scraping failed:', error);
            return {};
        }
    }

    /**
     * Scrape individual video analytics
     */
    async scrapeVideoAnalytics() {
        const analytics = {};
        
        try {
            // Extract video identifier
            const videoId = this.extractVideoIdFromUrl();
            if (!videoId) {
                throw new Error('Could not extract video ID');
            }
            
            analytics.videoId = videoId;
            analytics.videoTitle = this.extractVideoTitle();
            
            // Wait for analytics to load
            await this.waitForElement(ANALYTICS_SELECTORS.videoMetrics);
            
            // Extract key metrics
            analytics.views = this.extractMetricValue('views');
            analytics.watchTime = this.extractMetricValue('watchTime');
            analytics.ctr = this.extractMetricValue('ctr');
            analytics.retention = this.extractMetricValue('retention');
            analytics.likes = this.extractMetricValue('likes');
            analytics.comments = this.extractMetricValue('comments');
            
            // Extract performance over time
            analytics.performanceData = this.extractPerformanceChart();
            
            // Extract audience data
            analytics.audienceData = this.extractAudienceMetrics();
            
            return analytics;
        } catch (error) {
            console.error('Video analytics scraping failed:', error);
            return {};
        }
    }

    /**
     * Scrape channel-level analytics
     */
    async scrapeChannelAnalytics() {
        const analytics = {};
        
        try {
            await this.waitForElement(ANALYTICS_SELECTORS.dashboardMetrics);
            
            // Channel overview metrics
            analytics.overview = this.extractChannelOverview();
            
            // Top videos data
            analytics.topVideos = this.extractTopVideosData();
            
            // Subscriber growth
            analytics.subscriberGrowth = this.extractSubscriberGrowth();
            
            // Revenue data (if available)
            analytics.revenue = this.extractRevenueData();
            
            return analytics;
        } catch (error) {
            console.error('Channel analytics scraping failed:', error);
            return {};
        }
    }

    /**
     * Scrape content performance analytics
     */
    async scrapeContentAnalytics() {
        const analytics = {};
        
        try {
            await this.waitForElement(ANALYTICS_SELECTORS.analyticsTable);
            
            // Extract content table data
            analytics.contentTable = this.extractContentTable();
            
            // Extract sorting and filtering info
            analytics.filters = this.extractActiveFilters();
            
            return analytics;
        } catch (error) {
            console.error('Content analytics scraping failed:', error);
            return {};
        }
    }

    /**
     * Extract metric from summary card
     */
    extractMetricFromCard(card) {
        try {
            const titleElement = card.querySelector('.ytcp-analytics-summary-card-title');
            const valueElement = card.querySelector('.ytcp-analytics-summary-card-value');
            const changeElement = card.querySelector('.ytcp-analytics-summary-card-change');
            
            const title = titleElement ? titleElement.textContent.trim() : '';
            const value = valueElement ? valueElement.textContent.trim() : '';
            const change = changeElement ? changeElement.textContent.trim() : '';
            
            return {
                name: this.normalizeMetricName(title),
                value: this.parseMetricValue(value),
                rawValue: value,
                change: change,
                changePercent: this.extractPercentageChange(change)
            };
        } catch (error) {
            console.error('Error extracting metric from card:', error);
            return {};
        }
    }

    /**
     * Extract metric value by type
     */
    extractMetricValue(metricType) {
        const selectors = {
            views: '.ytcp-analytics-views-value',
            watchTime: '.ytcp-analytics-watch-time-value',
            ctr: '.ytcp-analytics-ctr-value',
            retention: '.ytcp-analytics-retention-value',
            likes: '.ytcp-analytics-likes-value',
            comments: '.ytcp-analytics-comments-value'
        };
        
        const selector = selectors[metricType];
        if (!selector) return null;
        
        const element = document.querySelector(selector);
        return element ? this.parseMetricValue(element.textContent) : null;
    }

    /**
     * Extract chart data from analytics charts
     */
    extractChartData() {
        const charts = document.querySelectorAll(ANALYTICS_SELECTORS.chartContainer);
        const chartData = [];
        
        charts.forEach((chart, index) => {
            try {
                const title = chart.querySelector('.ytcp-analytics-chart-title')?.textContent || `Chart ${index + 1}`;
                const dataPoints = this.extractChartDataPoints(chart);
                
                chartData.push({
                    title,
                    dataPoints,
                    type: this.detectChartType(chart)
                });
            } catch (error) {
                console.error('Error extracting chart data:', error);
            }
        });
        
        return chartData;
    }

    /**
     * Extract data points from a chart
     */
    extractChartDataPoints(chartElement) {
        const dataPoints = [];
        
        // Try to extract from data attributes or visible elements
        const points = chartElement.querySelectorAll('[data-point], .chart-point, .data-point');
        
        points.forEach(point => {
            const value = point.getAttribute('data-value') || point.textContent;
            const label = point.getAttribute('data-label') || point.getAttribute('aria-label');
            
            if (value) {
                dataPoints.push({
                    value: this.parseMetricValue(value),
                    label: label || '',
                    rawValue: value
                });
            }
        });
        
        return dataPoints;
    }

    /**
     * Extract content table data
     */
    extractContentTable() {
        const table = document.querySelector(ANALYTICS_SELECTORS.analyticsTable);
        if (!table) return [];
        
        const rows = table.querySelectorAll(ANALYTICS_SELECTORS.tableRows);
        const tableData = [];
        
        rows.forEach(row => {
            const cells = row.querySelectorAll(ANALYTICS_SELECTORS.tableCells);
            const rowData = {};
            
            cells.forEach((cell, index) => {
                const headerElement = table.querySelector(`th:nth-child(${index + 1})`);
                const header = headerElement ? headerElement.textContent.trim() : `column_${index}`;
                rowData[this.normalizeColumnName(header)] = cell.textContent.trim();
            });
            
            if (Object.keys(rowData).length > 0) {
                tableData.push(rowData);
            }
        });
        
        return tableData;
    }

    /**
     * Extract video ID from current URL
     */
    extractVideoIdFromUrl() {
        const match = window.location.href.match(/\/video\/([^\/\?]+)/);
        return match ? match[1] : null;
    }

    /**
     * Extract video title
     */
    extractVideoTitle() {
        const titleElement = document.querySelector(ANALYTICS_SELECTORS.videoTitle);
        return titleElement ? titleElement.textContent.trim() : '';
    }

    /**
     * Get current time period selection
     */
    getCurrentTimePeriod() {
        const periodElement = document.querySelector(ANALYTICS_SELECTORS.timePeriod);
        return periodElement ? periodElement.textContent.trim() : 'Last 28 days';
    }

    /**
     * Parse metric value to number
     */
    parseMetricValue(value) {
        if (!value || typeof value !== 'string') return 0;
        
        // Remove currency symbols, commas, and other formatting
        const cleaned = value.replace(/[$,\s%]/g, '');
        
        // Handle K, M, B suffixes
        if (cleaned.includes('K')) {
            return parseFloat(cleaned.replace('K', '')) * 1000;
        }
        if (cleaned.includes('M')) {
            return parseFloat(cleaned.replace('M', '')) * 1000000;
        }
        if (cleaned.includes('B')) {
            return parseFloat(cleaned.replace('B', '')) * 1000000000;
        }
        
        return parseFloat(cleaned) || 0;
    }

    /**
     * Normalize metric names for consistency
     */
    normalizeMetricName(name) {
        const normalizations = {
            'Views': 'views',
            'Watch time (hours)': 'watchTime',
            'Subscribers': 'subscribers',
            'Revenue': 'revenue',
            'Click-through rate': 'ctr',
            'Average view duration': 'retention'
        };
        
        return normalizations[name] || name.toLowerCase().replace(/\s+/g, '_');
    }

    /**
     * Normalize column names
     */
    normalizeColumnName(name) {
        return name.toLowerCase()
                  .replace(/\s+/g, '_')
                  .replace(/[^\w_]/g, '')
                  .substring(0, 50);
    }

    /**
     * Extract percentage change from text
     */
    extractPercentageChange(changeText) {
        if (!changeText) return 0;
        
        const match = changeText.match(/([\+\-]?\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
    }

    /**
     * Setup mutation observer for dynamic content
     */
    setupMutationObserver() {
        this.observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Check if analytics content was added
                    const hasAnalyticsContent = Array.from(mutation.addedNodes).some(node => {
                        return node.nodeType === Node.ELEMENT_NODE && 
                               (node.classList?.contains('ytcp-analytics') || 
                                node.querySelector?.('.ytcp-analytics'));
                    });
                    
                    if (hasAnalyticsContent) {
                        shouldUpdate = true;
                    }
                }
            });
            
            if (shouldUpdate) {
                setTimeout(() => this.scrapeCurrentPage(), 1000);
            }
        });
        
        this.observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Setup periodic updates
     */
    setupPeriodicUpdate() {
        // Update every 30 seconds while monitoring
        this.updateInterval = setInterval(() => {
            if (this.isMonitoring) {
                this.scrapeCurrentPage();
            }
        }, 30000);
    }

    /**
     * Wait for element to appear
     */
    waitForElement(selector, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }
            
            const observer = new MutationObserver(() => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
            
            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    /**
     * Store analytics data in extension storage
     */
    async storeAnalyticsData(data) {
        try {
            await chrome.runtime.sendMessage({
                action: 'cacheData',
                key: 'analytics_scraped',
                data: data
            });
        } catch (error) {
            console.error('Failed to store analytics data:', error);
        }
    }

    /**
     * Notify other parts of extension about data update
     */
    notifyDataUpdate(data, pageType) {
        // Send message to background script
        chrome.runtime.sendMessage({
            action: 'analyticsDataUpdate',
            data: data,
            pageType: pageType,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle scraping failures
     */
    handleScrapeFailure() {
        this.retryCount++;
        
        if (this.retryCount < this.maxRetries) {
            setTimeout(() => this.scrapeCurrentPage(), 5000);
        } else {
            console.error('Max retries reached, stopping analytics monitoring');
            this.stopMonitoring();
        }
    }

    /**
     * Get current scraped data
     */
    getScrapedData() {
        return this.scrapedData;
    }

    /**
     * Clear scraped data
     */
    clearData() {
        this.scrapedData = {};
    }
}

// Export for use in content scripts
export default AnalyticsScraper;
