const express = require('express');
const path = require('path');
const router = express.Router();

// Home route
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../views', 'index.html'));
});

// API health check
router.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Explorador Web Application API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        uptime: process.uptime()
    });
});

// API status endpoint
router.get('/api/status', (req, res) => {
    res.json({
        server: 'Explorador Web Application',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        features: {
            mvc_structure: true,
            session_management: true,
            static_files: true,
            error_handling: true,
            user_authentication: false, // Will be enabled in task 2
            profile_management: false,  // Will be enabled in task 3
            dashboard: false           // Will be enabled in task 4
        }
    });
});

module.exports = router;