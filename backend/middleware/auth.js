/**
 * Authentication Middleware
 * 
 * This middleware handles JWT authentication for protected routes
 * with token refresh capabilities
 */

const jwt = require('jsonwebtoken');
const { User } = require('../db/models/index');

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
    let refreshTokenValue;
    
    // 1. Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Found token in Authorization header');
    }
    
    // 2. If no token in header, check cookie
    if (!token && req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
      console.log('Found token in cookies');
    }
    
    // Get refresh token from cookies or request body
    if (req.cookies && req.cookies.refreshToken) {
      refreshTokenValue = req.cookies.refreshToken;
    } else if (req.body && req.body.refreshToken) {
      refreshTokenValue = req.body.refreshToken;
    }
    
    // If no token found anywhere, return authentication error
    if (!token) {
      console.log('No authentication token found in request');
      return res.status(401).json({
        error: true,
        message: 'Authentication required. Please provide a valid token.'
      });
    }
    
    try {
      // Try to verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (!decoded || !decoded.userId) {
        throw new Error('Invalid token format');
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
    } catch (tokenError) {
      console.log('Token verification error:', tokenError.name);
      
      // Handle token expiration with automatic refresh
      if (tokenError.name === 'TokenExpiredError' && refreshTokenValue) {
        console.log('Access token expired, attempting refresh');
        
        try {
          // Try to refresh the token
          const refreshResult = await refreshAccessToken(refreshTokenValue);
          
          if (refreshResult.success) {
            // Token refresh successful
            console.log('Token refresh successful');
            
            // Set new cookies
            res.cookie('authToken', refreshResult.accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 3600000, // 1 hour
              path: '/'
            });
            
            res.cookie('refreshToken', refreshResult.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
              path: '/'
            });
            
            // Decode the new token to get user info
            const newDecoded = jwt.verify(refreshResult.accessToken, JWT_SECRET);
            
            // Find the user with the new token
            const user = await User.getById(newDecoded.userId);
            
            if (!user) {
              return res.status(401).json({
                error: true,
                message: 'User not found after token refresh.'
              });
            }
            
            // Attach user to request object
            req.user = user;
            
            // Add the refreshed token to the response headers
            res.set('X-New-Access-Token', refreshResult.accessToken);
            
            // Continue to the next middleware
            return next();
          } else {
            // Refresh token is invalid or expired
            console.log('Token refresh failed:', refreshResult.message);
            return res.status(401).json({
              error: true,
              message: 'Authentication failed. Please log in again.',
              tokenError: refreshResult.message
            });
          }
        } catch (refreshError) {
          console.error('Error during token refresh:', refreshError);
          return res.status(401).json({
            error: true,
            message: 'Authentication failed. Please log in again.'
          });
        }
      } else {
        // Handle other token errors
        if (tokenError.name === 'JsonWebTokenError') {
          return res.status(401).json({
            error: true,
            message: 'Invalid token. Please log in again.'
          });
        } else if (tokenError.name === 'TokenExpiredError') {
          return res.status(401).json({
            error: true,
            message: 'Token expired. Please log in again.'
          });
        } else {
          console.error('Authentication error:', tokenError);
          return res.status(401).json({
            error: true,
            message: 'Authentication failed. Please log in again.'
          });
        }
      }
    }
  } catch (error) {
    console.error('Uncaught authentication error:', error);
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
    let refreshTokenValue;
    
    // 1. Try to get token from Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      console.log('Found token in Authorization header (optional auth)');
    }
    
    // 2. If no token in header, check cookie
    if (!token && req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
      console.log('Found token in cookies (optional auth)');
    }
    
    // Get refresh token from cookies or request body
    if (req.cookies && req.cookies.refreshToken) {
      refreshTokenValue = req.cookies.refreshToken;
    } else if (req.body && req.body.refreshToken) {
      refreshTokenValue = req.body.refreshToken;
    }
    
    // If no token found anywhere, continue without authentication
    if (!token) {
      console.log('No authentication token found in request (optional auth)');
      return next();
    }
    
    try {
      // Verify the token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      if (!decoded || !decoded.userId) {
        // Invalid token format, but this is optional auth so just continue
        return next();
      }
      
      // Find the user
      const user = await User.getById(decoded.userId);
      // Attach user to request object if found
      if (user) {
        req.user = user;
      }
      
      // Continue to next middleware
      next();
    } catch (tokenError) {
      console.log('Optional auth token verification error:', tokenError.name);
      
      // Handle token expiration with automatic refresh (for better UX)
      if (tokenError.name === 'TokenExpiredError' && refreshTokenValue) {
        console.log('Access token expired, attempting refresh (optional auth)');
        
        try {
          // Try to refresh the token
          const refreshResult = await refreshAccessToken(refreshTokenValue);
          
          if (refreshResult.success) {
            // Token refresh successful
            console.log('Token refresh successful (optional auth)');
            
            // Set new cookies
            res.cookie('authToken', refreshResult.accessToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 3600000, // 1 hour
              path: '/'
            });
            
            res.cookie('refreshToken', refreshResult.refreshToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
              path: '/'
            });
            
            // Decode the new token to get user info
            const newDecoded = jwt.verify(refreshResult.accessToken, JWT_SECRET);
            
            // Find the user with the new token
            try {
              const user = await User.getById(newDecoded.userId);
              if (user) {
                req.user = user;
              }
            } catch (findError) {
              console.log('User not found after token refresh (optional auth)');
            }
            
            // Add the refreshed token to the response headers
            res.set('X-New-Access-Token', refreshResult.accessToken);
          }
        } catch (refreshError) {
          // Refresh failed, but this is optional auth so just continue
          console.log('Token refresh failed in optional auth:', refreshError.message);
        }
      }
      
      // Continue to next middleware regardless of auth outcome
      next();
    }
  } catch (error) {
    // In case of any error, just continue without authentication
    console.error('Optional authentication uncaught error:', error);
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
  // Check for refresh token in body or cookies
  let refreshTokenValue = req.body.refreshToken;
  
  if (!refreshTokenValue && req.cookies && req.cookies.refreshToken) {
    refreshTokenValue = req.cookies.refreshToken;
  }
  
  if (!refreshTokenValue) {
    return res.status(400).json({
      error: true,
      message: 'Refresh token is required'
    });
  }
  
  try {
    const result = await refreshAccessToken(refreshTokenValue);
    
    if (!result.success) {
      return res.status(401).json({
        error: true,
        message: result.message
      });
    }
    
    // Set cookies for better cross-client compatibility
    res.cookie('authToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000, // 1 hour
      path: '/'
    });
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
    
    // Also send tokens in response body for frontend storage
    return res.json({
      error: false,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      tokenExpiration: JWT_EXPIRATION
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
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION
};