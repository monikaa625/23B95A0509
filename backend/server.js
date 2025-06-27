const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger');
const shortenerRoutes = require('./routes/shortener');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors());

// Use custom logging middleware
app.use(logger.requestLogger());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/', shortenerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        requestId: req.requestId,
        error: err.message,
        stack: err.stack
    });
    
    res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
    });
});

app.listen(PORT, () => {
    logger.info('Server started', { port: PORT });
});