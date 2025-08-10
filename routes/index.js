const express = require('express');
const router = express.Router();

// Home route
router.get('/', (req, res) => {
  res.render('index', {
    title: 'Explorador Web App',
    message: 'Welcome to Explorador - Your Web Application Foundation'
  });
});

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Explorador Web App'
  });
});

module.exports = router;