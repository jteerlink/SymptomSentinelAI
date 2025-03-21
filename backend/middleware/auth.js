/**
 * Authentication Middleware
 * 
 * This middleware handles JWT authentication for protected routes
 */

const jwt = require('jsonwebtoken');
const { User } = require('../db/models');

// JWT secret key (would be in env variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'symptom-sentry-ai-secret-key';

/**
 * Authenticate JWT token middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: true,
        message: 'Authentication required. Please provide a valid token.'
      });
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        error: true,
        message: 'Authentication required. Please provide a valid token.'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        error: true,
        message: 'Invalid token. Please log in again.'
      });
    }
    
    // Find the user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        error: true,
        message: 'User not found. Please log in again.'
      });
    }
    
    // Attach user to request object
    req.user = user;
    
    // Move to the next middleware
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: true,
        message: 'Invalid token. Please log in again.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: true,
        message: 'Token expired. Please log in again.'
      });
    }
    
    return res.status(500).json({
      error: true,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Optional authentication middleware
 * Tries to authenticate but does not fail if no token is provided
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    
    // If no authorization header, continue without authentication
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    
    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // If no token, continue without authentication
    if (!token) {
      return next();
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !decoded.id) {
      return next();
    }
    
    // Find the user
    const user = await User.findById(decoded.id);
    
    if (user) {
      // Attach user to request object
      req.user = user;
    }
    
    // Move to the next middleware
    next();
  } catch (error) {
    // In case of any error, just continue without authentication
    console.error('Optional authentication error:', error);
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate
};