const { nanoid } = require('nanoid');
const logger = require('../middleware/logger');

class UrlShortenerService {
    constructor() {
        // In-memory storage for this implementation
        this.urlStore = new Map();
        this.analytics = new Map();
        
        logger.info('URL Shortener Service initialized');
    }

    /**
     * Generate a unique short code
     */
    generateShortCode() {
        let shortCode;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            shortCode = nanoid(6); // Generate 6 character alphanumeric code
            attempts++;
            
            if (attempts > maxAttempts) {
                logger.error('Failed to generate unique short code after maximum attempts', {
                    attempts: maxAttempts
                });
                throw new Error('Unable to generate unique short code');
            }
        } while (this.urlStore.has(shortCode));

        logger.debug('Generated unique short code', { shortCode, attempts });
        return shortCode;
    }

    /**
     * Validate custom short code
     */
    validateCustomShortCode(shortCode) {
        // Check if alphanumeric and reasonable length (3-10 characters)
        const isValid = /^[a-zA-Z0-9]{3,10}$/.test(shortCode);
        const isUnique = !this.urlStore.has(shortCode);

        logger.debug('Custom short code validation', {
            shortCode,
            isValid,
            isUnique
        });

        return { isValid, isUnique };
    }

    /**
     * Create a shortened URL
     */
    createShortUrl(originalUrl, customShortCode = null, validityMinutes = 30) {
        logger.info('Creating short URL', {
            originalUrl,
            customShortCode,
            validityMinutes
        });

        let shortCode;

        if (customShortCode) {
            const validation = this.validateCustomShortCode(customShortCode);
            
            if (!validation.isValid) {
                logger.warn('Invalid custom short code provided', {
                    shortCode: customShortCode,
                    reason: 'Invalid format'
                });
                throw new Error('Custom short code must be alphanumeric and 3-10 characters long');
            }

            if (!validation.isUnique) {
                logger.warn('Custom short code already exists', {
                    shortCode: customShortCode
                });
                throw new Error('Custom short code already exists');
            }

            shortCode = customShortCode;
        } else {
            shortCode = this.generateShortCode();
        }

        const expiryTime = new Date(Date.now() + validityMinutes * 60 * 1000);
        
        const urlData = {
            originalUrl,
            shortCode,
            createdAt: new Date(),
            expiryTime,
            validityMinutes,
            accessCount: 0,
            isActive: true
        };

        this.urlStore.set(shortCode, urlData);
        
        // Initialize analytics
        this.analytics.set(shortCode, {
            totalClicks: 0,
            uniqueClicks: new Set(),
            clickHistory: [],
            createdAt: new Date()
        });

        logger.info('Short URL created successfully', {
            shortCode,
            originalUrl,
            expiryTime: expiryTime.toISOString()
        });

        return {
            shortCode,
            originalUrl,
            expiryTime: expiryTime.toISOString(),
            validityMinutes
        };
    }

    /**
     * Get original URL by short code
     */
    getOriginalUrl(shortCode) {
        logger.debug('Retrieving original URL', { shortCode });

        const urlData = this.urlStore.get(shortCode);

        if (!urlData) {
            logger.warn('Short code not found', { shortCode });
            return null;
        }

        if (!urlData.isActive) {
            logger.warn('Short code is inactive', { shortCode });
            return null;
        }

        if (new Date() > urlData.expiryTime) {
            logger.warn('Short code has expired', {
                shortCode,
                expiryTime: urlData.expiryTime
            });
            
            // Mark as inactive
            urlData.isActive = false;
            return null;
        }

        logger.info('Original URL retrieved successfully', {
            shortCode,
            originalUrl: urlData.originalUrl
        });

        return urlData;
    }

    /**
     * Track URL access for analytics
     */
    trackAccess(shortCode, clientIp, userAgent) {
        const analytics = this.analytics.get(shortCode);
        
        if (analytics) {
            analytics.totalClicks++;
            analytics.uniqueClicks.add(clientIp);
            analytics.clickHistory.push({
                timestamp: new Date(),
                clientIp,
                userAgent
            });

            // Update access count in URL data
            const urlData = this.urlStore.get(shortCode);
            if (urlData) {
                urlData.accessCount++;
            }

            logger.info('URL access tracked', {
                shortCode,
                totalClicks: analytics.totalClicks,
                uniqueClicks: analytics.uniqueClicks.size,
                clientIp
            });
        }
    }

    /**
     * Get analytics for a short code
     */
    getAnalytics(shortCode) {
        logger.debug('Retrieving analytics', { shortCode });

        const urlData = this.urlStore.get(shortCode);
        const analytics = this.analytics.get(shortCode);

        if (!urlData || !analytics) {
            logger.warn('Analytics not found for short code', { shortCode });
            return null;
        }

        const result = {
            shortCode,
            originalUrl: urlData.originalUrl,
            createdAt: urlData.createdAt.toISOString(),
            expiryTime: urlData.expiryTime.toISOString(),
            isActive: urlData.isActive && new Date() <= urlData.expiryTime,
            totalClicks: analytics.totalClicks,
            uniqueClicks: analytics.uniqueClicks.size,
            recentClicks: analytics.clickHistory.slice(-10) // Last 10 clicks
        };

        logger.info('Analytics retrieved successfully', {
            shortCode,
            totalClicks: result.totalClicks,
            uniqueClicks: result.uniqueClicks
        });

        return result;
    }

    /**
     * Get all active URLs (for admin purposes)
     */
    getAllUrls() {
        logger.debug('Retrieving all URLs');

        const activeUrls = [];
        const now = new Date();

        for (const [shortCode, urlData] of this.urlStore) {
            if (urlData.isActive && now <= urlData.expiryTime) {
                const analytics = this.analytics.get(shortCode);
                activeUrls.push({
                    shortCode,
                    shortLink: `http://localhost:5000/${shortCode}`,
                    originalUrl: urlData.originalUrl,
                    createdAt: urlData.createdAt.toISOString(),
                    expiresAt: urlData.expiryTime.toISOString(),
                    clickCount: analytics ? analytics.totalClicks : 0
                });
            }
        }

        logger.info('Retrieved all active URLs', { count: activeUrls.length });
        return activeUrls;
    }

    /**
     * Clean up expired URLs
     */
    cleanupExpiredUrls() {
        logger.info('Starting cleanup of expired URLs');
        
        const now = new Date();
        let cleanedCount = 0;

        for (const [shortCode, urlData] of this.urlStore) {
            if (now > urlData.expiryTime && urlData.isActive) {
                urlData.isActive = false;
                cleanedCount++;
                
                logger.debug('Marked URL as expired', {
                    shortCode,
                    expiryTime: urlData.expiryTime
                });
            }
        }

        logger.info('Cleanup completed', { expiredUrls: cleanedCount });
        return cleanedCount;
    }
}

module.exports = UrlShortenerService;
