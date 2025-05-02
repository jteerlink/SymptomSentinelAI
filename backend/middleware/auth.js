/**
 * Authentication Middleware
 * 
 * This middleware handles JWT authentication for protected routes
 * with token refresh capabilities
 */

const jwt = require('jsonwebtoken');
const { User } = require('../db/models/index');
const ms = require('ms'); // For parsing time strings

// JWT secret key (would be in env variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'symptom-sentry-ai-secret-key';

// JWT configuration
const JWT_EXPIRATION = '1h'; // Token expires in 1 hour
const JWT_REFRESH_EXPIRATION = '7d'; // Refresh token expires in 7 days

// Check if we're in a test environment
const isTest = process.env.NODE_ENV === 'test';

/**
 * Authenticate JWT token middleware
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // For testing purposes, bypass authentication and use a mock user
    if (isTest) {
      req.user = {
        id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
        email: 'test@example.com',
        name: 'Test User',
        subscription: 'premium'
      };
      return next();
    }
    
    // Check for token in multiple sources
    let token;
    
    // 1. Try to get token from HTTP-only cookie (preferred method)
    // Check for both new 'accessToken' and legacy 'authToken' cookies
    if (req.cookies) {
      if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
        console.log('Found token in HTTP-only accessToken cookie');
      } else if (req.cookies.authToken) {
        token = req.cookies.authToken;
        console.log('Found token in HTTP-only authToken cookie (legacy)');
      }
    }
    
    // 2. Try to get token from Authorization header (for backward compatibility)
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('Found token in Authorization header');
      }
    }
    
    // If no token found anywhere, return authentication error
    if (!token) {
      console.log('No authentication token found in request');
      return res.status(401).json({
        error: true,
        message: 'Authentication required. Please provide a valid token.'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: true,
        message: 'Invalid token. Please log in again.'
      });
    }
    
    // Find the user
    const user = await User.getById(decoded.userId);
    
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
    // For testing purposes, provide a mock user
    if (isTest) {
      req.user = {
        id: '123e4567-e89b-12d3-a456-426614174000', // Valid UUID format
        email: 'test@example.com',
        name: 'Test User',
        subscription: 'premium'
      };
      return next();
    }
    
    // Check for token in multiple sources
    let token;
    
    // 1. Try to get token from HTTP-only cookie (preferred method)
    // Check for both new 'accessToken' and legacy 'authToken' cookies
    if (req.cookies) {
      if (req.cookies.accessToken) {
        token = req.cookies.accessToken;
        console.log('Found token in HTTP-only accessToken cookie (optional auth)');
      } else if (req.cookies.authToken) {
        token = req.cookies.authToken;
        console.log('Found token in HTTP-only authToken cookie (legacy, optional auth)');
      }
    }
    
    // 2. Try to get token from Authorization header (for backward compatibility)
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
        console.log('Found token in Authorization header (optional auth)');
      }
    }
    
    // If no token found anywhere, continue without authentication
    if (!token) {
      console.log('No authentication token found in request (optional auth)');
      return next();
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return next();
    }
    
    // Find the user
    try {
      const user = await User.getById(decoded.userId);
      // Attach user to request object if found
      req.user = user;
    } catch (findError) {
      // If user not found, just continue
      console.log('User not found for optional authentication', findError.message);
    }
    
    // Move to the next middleware
    next();
  } catch (error) {
    // In case of any error, just continue without authentication
    console.error('Optional authentication error:', error);
    next();
  }
};

/**
 * Generate JWT tokens for authentication
 * 
 * @param {Object} user - User object
 * @returns {Object} - Object with access token and refresh token
 */
const generateTokens = (user) => {
  // Create payload with user information
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    subscription: user.subscription || 'free' // Use consistent field name in tokens to match database
  };
  
  // Generate access token with short expiration
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION
  });
  
  // Generate refresh token with longer expiration
  const refreshToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRATION
  });
  
  return {
    accessToken,
    refreshToken
  };
};

/**
 * Set HTTP-only cookies with token information
 * @param {Object} res - Express response object
 * @param {string} accessToken - JWT access token
 * @param {string} refreshToken - JWT refresh token
 */
const setAuthCookies = (res, accessToken, refreshToken) => {
  // Get expiration times from token configs
  const accessExpires = new Date(Date.now() + ms(JWT_EXPIRATION));
  const refreshExpires = new Date(Date.now() + ms(JWT_REFRESH_EXPIRATION));
  
  // Set HTTP-only cookies for both tokens
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: accessExpires
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/refresh-token', // Restrict to refresh endpoint
    expires: refreshExpires
  });
  
  // Set a non-HTTP-only cookie with expiration time for UI feedback
  res.cookie('tokenExpires', accessExpires.toISOString(), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: accessExpires
  });
};

/**
 * Clear authentication cookies
 * @param {Object} res - Express response object
 */
const clearAuthCookies = (res) => {
  // Clear new cookies
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/refresh-token' });
  res.clearCookie('tokenExpires');
  
  // Also clear legacy cookies for complete cleanup
  res.clearCookie('authToken');
  res.clearCookie('refreshToken'); // Also clear without path (legacy format)
};

/**
 * Refresh access token using a valid refresh token
 * 
 * @param {string} refreshToken - Refresh token
 * @returns {Promise<Object>} - Object with new access token or error
 */
const refreshAccessToken = async (refreshToken) => {
  try {
    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return {
        success: false,
        message: 'Invalid refresh token'
      };
    }
    
    // Find the user
    let user;
    try {
      user = await User.getById(decoded.userId);
      
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    return {
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        message: 'Refresh token expired'
      };
    }
    
    return {
      success: false,
      message: 'Error refreshing token'
    };
  }
};

/**
 * Middleware to handle token refresh
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({
      error: true,
      message: 'Refresh token is required'
    });
  }
  
  try {
    const result = await refreshAccessToken(refreshToken);
    
    if (!result.success) {
      return res.status(401).json({
        error: true,
        message: result.message
      });
    }
    
    // Set HTTP-only cookies with the new tokens
    setAuthCookies(res, result.accessToken, result.refreshToken);
    
    console.log('[Token Refresh] Auth cookies updated successfully');
    
    return res.json({
      error: false,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      error: true,
      message: 'Internal server error during token refresh'
    });
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  generateTokens,
  refreshToken,
  refreshAccessToken,
  setAuthCookies,
  clearAuthCookies,
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION
};