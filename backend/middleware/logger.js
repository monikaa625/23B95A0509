const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, metadata = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level: level.toUpperCase(),
            message,
            ...metadata
        };
        return JSON.stringify(logEntry) + '\n';
    }

    writeToFile(filename, content) {
        const filePath = path.join(this.logDir, filename);
        fs.appendFileSync(filePath, content);
    }

    info(message, metadata = {}) {
        const logContent = this.formatMessage('INFO', message, metadata);
        this.writeToFile('app.log', logContent);
    }

    error(message, metadata = {}) {
        const logContent = this.formatMessage('ERROR', message, metadata);
        this.writeToFile('error.log', logContent);
        this.writeToFile('app.log', logContent);
    }

    warn(message, metadata = {}) {
        const logContent = this.formatMessage('WARN', message, metadata);
        this.writeToFile('app.log', logContent);
    }

    debug(message, metadata = {}) {
        const logContent = this.formatMessage('DEBUG', message, metadata);
        this.writeToFile('debug.log', logContent);
    }

    // HTTP Request logging middleware
    requestLogger() {
        return (req, res, next) => {
            const startTime = Date.now();
            const requestId = this.generateRequestId();
            
            req.requestId = requestId;
            
            this.info('HTTP Request Started', {
                requestId,
                method: req.method,
                url: req.url,
                userAgent: req.get('User-Agent'),
                ip: req.ip,
                timestamp: new Date().toISOString()
            });

            // Log request body for POST/PUT requests
            if (req.method === 'POST' || req.method === 'PUT') {
                this.debug('Request Body', {
                    requestId,
                    body: req.body
                });
            }

            // Override res.json to log response
            const originalJson = res.json;
            const logger = this;
            res.json = function(obj) {
                const responseTime = Date.now() - startTime;
                
                logger.info('HTTP Request Completed', {
                    requestId,
                    method: req.method,
                    url: req.url,
                    statusCode: res.statusCode,
                    responseTime: `${responseTime}ms`,
                    timestamp: new Date().toISOString()
                });

                if (res.statusCode >= 400) {
                    logger.error('HTTP Error Response', {
                        requestId,
                        statusCode: res.statusCode,
                        response: obj
                    });
                }

                return originalJson.call(this, obj);
            };

            next();
        };
    }

    generateRequestId() {
        return Math.random().toString(36).substr(2, 9);
    }
}

// Create singleton instance
const logger = new Logger();

module.exports = logger;