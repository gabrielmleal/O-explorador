/**
 * Authentication Middleware
 * Basic structure for future authentication implementation
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token (to be implemented in Task 2)
 */
const verifyToken = (req, res, next) => {
  // Placeholder for JWT verification logic
  // Will be implemented in Task 2: User Authentication System
  next();
};

/**
 * Middleware to check if user is authenticated (to be implemented in Task 2)
 */
const requireAuth = (req, res, next) => {
  // Placeholder for authentication check
  // Will be implemented in Task 2: User Authentication System
  next();
};

/**
 * Middleware for request logging
 */
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - ${userAgent}`);
  next();
};

module.exports = {
  verifyToken,
  requireAuth,
  requestLogger
};