const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import routes
const indexRoutes = require('./webapp/routes/index');

// Create Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'webapp/public')));

// View engine setup (using basic HTML for simplicity)
app.set('views', path.join(__dirname, 'webapp/views'));
app.set('view engine', 'html');

// Custom HTML template engine
app.engine('html', (filePath, options, callback) => {
  const fs = require('fs');
  fs.readFile(filePath, (err, content) => {
    if (err) return callback(err);
    
    // Simple template replacement
    let rendered = content.toString();
    if (options.title) {
      rendered = rendered.replace(/{{title}}/g, options.title);
    }
    if (options.content) {
      rendered = rendered.replace(/{{content}}/g, options.content);
    }
    if (options.user) {
      rendered = rendered.replace(/{{user}}/g, JSON.stringify(options.user));
    }
    
    return callback(null, rendered);
  });
});

// Routes
app.use('/', indexRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Explorador Web App is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404.html', { title: '404 - Page Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error.html', { 
    title: '500 - Server Error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Explorador Web App running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;