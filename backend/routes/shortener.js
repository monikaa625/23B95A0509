const express = require('express');
const router = express.Router();
const db = require('../data/db');
const logger = require('../middleware/logger');
const { nanoid } = require('nanoid');

// Utility functions
const validateUrl = (url) => {
    try {
        new URL(url);
        return url.startsWith('http://') || url.startsWith('https://');
    } catch {
        return false;
    }
};

const validateShortcode = (shortcode) => {
    return /^[a-zA-Z0-9]{3,10}$/.test(shortcode);
};

const generateShortcode = () => {
    let shortcode;
    let attempts = 0;
    do {
        shortcode = nanoid(6);
        attempts++;
        if (attempts > 10) {
            throw new Error('Unable to generate unique shortcode');
        }
    } while (db.getUrl(shortcode));
    return shortcode;
};

// POST /shorturls - Create short URL
router.post('/shorturls', (req, res) => {
    try {
        logger.info('Creating short URL', {
            requestId: req.requestId,
            body: req.body
        });

        const { url, validity = 30, shortcode } = req.body;

        // Validate required URL
        if (!url) {
            logger.warn('Missing URL in request', { requestId: req.requestId });
            return res.status(400).json({
                success: false,
                error: 'URL is required'
            });
        }

        // Validate URL format
        if (!validateUrl(url)) {
            logger.warn('Invalid URL format', { requestId: req.requestId, url });
            return res.status(400).json({
                success: false,
                error: 'Invalid URL format. Must be a valid HTTP or HTTPS URL'
            });
        }

        // Validate validity
        if (!Number.isInteger(validity) || validity < 1 || validity > 525600) {
            logger.warn('Invalid validity period', { requestId: req.requestId, validity });
            return res.status(400).json({
                success: false,
                error: 'Validity must be an integer between 1 and 525600 minutes'
            });
        }

        // Handle shortcode
        let finalShortcode = shortcode;
        if (shortcode) {
            if (!validateShortcode(shortcode)) {
                logger.warn('Invalid shortcode format', { requestId: req.requestId, shortcode });
                return res.status(400).json({
                    success: false,
                    error: 'Shortcode must be 3-10 alphanumeric characters'
                });
            }
            
            if (db.getUrl(shortcode)) {
                logger.warn('Shortcode already exists', { requestId: req.requestId, shortcode });
                return res.status(409).json({
                    success: false,
                    error: 'Shortcode already exists'
                });
            }
        } else {
            finalShortcode = generateShortcode();
        }

        // Create short URL
        const result = db.addUrl(url, finalShortcode, validity);
        const shortLink = `http://localhost:5000/${finalShortcode}`;

        logger.info('Short URL created successfully', {
            requestId: req.requestId,
            shortcode: finalShortcode,
            originalUrl: url
        });

        res.status(201).json({
            shortLink,
            expiry: result.expiryDate.toISOString()
        });

    } catch (error) {
        logger.error('Error creating short URL', {
            requestId: req.requestId,
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to create short URL'
        });
    }
});

// GET /:shortcode - Redirect to original URL
router.get('/:shortcode', (req, res) => {
    try {
        const { shortcode } = req.params;
        
        logger.info('Accessing short URL', {
            requestId: req.requestId,
            shortcode,
            userAgent: req.get('User-Agent'),
            ip: req.ip
        });

        if (!validateShortcode(shortcode)) {
            logger.warn('Invalid shortcode format in redirect', { requestId: req.requestId, shortcode });
            return res.status(400).json({
                success: false,
                error: 'Invalid shortcode format'
            });
        }

        const urlData = db.getUrl(shortcode);

        if (!urlData) {
            logger.warn('Shortcode not found', { requestId: req.requestId, shortcode });
            return res.status(404).json({
                success: false,
                error: 'Short URL not found'
            });
        }

        // Check if expired
        if (new Date() >= urlData.expiryDate) {
            logger.warn('Short URL has expired', {
                requestId: req.requestId,
                shortcode,
                expiryDate: urlData.expiryDate
            });
            return res.status(410).json({
                success: false,
                error: 'Short URL has expired'
            });
        }

        // Track click
        db.incrementClickCount(shortcode);
        
        logger.info('Redirecting to original URL', {
            requestId: req.requestId,
            shortcode,
            originalUrl: urlData.originalUrl,
            clickCount: urlData.clickCount + 1
        });

        res.redirect(urlData.originalUrl);

    } catch (error) {
        logger.error('Error processing redirect', {
            requestId: req.requestId,
            shortcode: req.params.shortcode,
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to process redirect'
        });
    }
});

// GET /api/stats - Get all URL statistics
router.get('/api/stats', (req, res) => {
    try {
        logger.info('Fetching URL statistics', { requestId: req.requestId });

        const allUrls = db.getAllUrls();
        const stats = allUrls.map(url => ({
            shortLink: `http://localhost:5000/${url.shortcode}`,
            originalUrl: url.originalUrl,
            createdAt: url.createdAt.toISOString(),
            expiresAt: url.expiryDate.toISOString(),
            clickCount: url.clickCount,
            clickTimestamps: url.clickTimestamps.map(ts => ts.toISOString())
        }));

        logger.info('Statistics retrieved', {
            requestId: req.requestId,
            count: stats.length
        });

        res.json(stats);

    } catch (error) {
        logger.error('Error fetching statistics', {
            requestId: req.requestId,
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: 'Failed to fetch statistics'
        });
    }
});

// Health check endpoint
router.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;