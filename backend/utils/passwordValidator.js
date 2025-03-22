/**
 * Password Validation Utility
 * 
 * This utility provides functions for validating password strength and security.
 */

/**
 * Validate password meets minimum requirements
 * 
 * @param {string} password The password to validate
 * @returns {Object} Validation result with isValid flag and message if invalid
 */
function validatePassword(password) {
  if (!password) {
    return {
      isValid: false,
      message: 'Password is required'
    };
  }

  // Minimum 8 characters
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters long'
    };
  }

  // At least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter'
    };
  }

  // At least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one lowercase letter'
    };
  }

  // At least one number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number'
    };
  }

  // At least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character'
    };
  }

  return {
    isValid: true
  };
}

/**
 * Generate a secure password reset token
 * 
 * @returns {string} A random token for password reset
 */
function generateResetToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

/**
 * Calculate password expiration (24 hours from now)
 * 
 * @returns {Date} Expiration date
 */
function calculateTokenExpiration() {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);
  return expiration;
}

module.exports = {
  validatePassword,
  generateResetToken,
  calculateTokenExpiration
};