/**
 * User Model
 * 
 * Represents a user in the database with methods for CRUD operations
 */

const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { validatePassword, generateResetToken, calculateTokenExpiration } = require('../../utils/passwordValidator');

const SALT_ROUNDS = 10;

class User {
  // Subscription plan limits
  static SUBSCRIPTION_LIMITS = {
    free: {
      analysesPerMonth: 5,
      advancedFeatures: false,
      highResolutionDownload: false,
      detailedReports: false
    },
    premium: {
      analysesPerMonth: Infinity, // Unlimited analyses
      advancedFeatures: true,
      highResolutionDownload: true,
      detailedReports: true
    }
  };

  /**
   * Create a new user
   * 
   * @param {Object} userData User data
   * @returns {Promise<Object>} Created user object
   */
  static async create(userData) {
    const { email, password, name, subscription = 'free', email_verified = false } = userData;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Insert user into database
    const [user] = await db('users').insert({
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      subscription,
      email_verified,
      analysis_count: 0,
      last_reset_date: new Date()
    }).returning(['id', 'email', 'name', 'subscription', 'email_verified', 'analysis_count', 'last_reset_date', 'created_at']);
    
    return this.formatUser(user);
  }

  /**
   * Find a user by ID
   * 
   * @param {string} id User ID
   * @returns {Promise<Object|null>} User object or null if not found
   */
  static async findById(id) {
    try {
      const user = await db('users')
        .where({ id })
        .first();
      
      return user ? this.formatUser(user) : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  /**
   * Find a user by email
   * 
   * @param {string} email User email
   * @returns {Promise<Object|null>} User object or null if not found
   */
  static async findByEmail(email) {
    try {
      const user = await db('users')
        .where({ email })
        .first();
      
      return user ? this.formatUser(user) : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  /**
   * Update a user
   * 
   * @param {string} id User ID
   * @param {Object} updateData Update data
   * @returns {Promise<Object>} Updated user object
   */
  static async update(id, updateData) {
    // Make a copy of the update data to avoid modifying the original
    const updates = { ...updateData };
    
    // If password is being updated and it's not already hashed, hash it
    if (updates.password && !updates.password.startsWith('$2b$')) {
      console.log('Hashing password before update');
      updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
    }
    
    // Update updated_at timestamp
    updates.updated_at = db.fn.now();
    
    try {
      const [user] = await db('users')
        .where({ id })
        .update(updates)
        .returning(['id', 'email', 'name', 'subscription', 'email_verified', 'analysis_count', 'last_reset_date', 'created_at', 'updated_at', 'password']);
      
      // Check if update was successful
      if (!user) {
        console.error(`Failed to update user with ID: ${id}`);
        return null;
      }
      
      // Log password update for debugging
      if (updates.password) {
        console.log('✅ Password updated successfully');
      }
      
      return this.formatUser(user);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete a user
   * 
   * @param {string} id User ID
   * @returns {Promise<boolean>} True if user was deleted, false otherwise
   */
  static async delete(id) {
    const deleted = await db('users')
      .where({ id })
      .delete();
    
    return deleted > 0;
  }

  /**
   * Verify a user's password
   * 
   * @param {string} plainPassword Plain text password
   * @param {string} hashedPassword Hashed password
   * @returns {Promise<boolean>} True if password is valid, false otherwise
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    // Add validation to prevent errors with undefined/null values
    if (!plainPassword || !hashedPassword) {
      console.log('❌ Invalid password verification attempt - missing password or hash');
      return false;
    }
    
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      console.error('❌ Error during password verification:', error.message);
      return false;
    }
  }

  /**
   * Get all users
   * 
   * @returns {Promise<Array>} Array of user objects
   */
  static async getAll() {
    const users = await db('users')
      .select(['id', 'email', 'name', 'subscription', 'email_verified', 'analysis_count', 'last_reset_date', 'created_at', 'updated_at']);
    
    return users.map(user => this.formatUser(user));
  }

  /**
   * Increment analysis count for user
   * 
   * @param {string} id User ID
   * @returns {Promise<Object>} Updated user object
   */
  static async incrementAnalysisCount(id) {
    // Get current user data
    const user = await this.findById(id);
    if (!user) return null;

    // Check if we need to reset the counter (new month)
    const now = new Date();
    const lastReset = new Date(user.lastResetDate);
    
    let updateData = {};
    
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      // Reset counter for new month
      updateData = {
        analysis_count: 1, // Start at 1 for this new analysis
        last_reset_date: now
      };
    } else {
      // Increment existing counter
      updateData = {
        analysis_count: user.analysisCount + 1
      };
    }
    
    // Update the user
    return this.update(id, updateData);
  }

  /**
   * Check if user has exceeded their analysis limit
   * 
   * @param {Object} user User object
   * @returns {boolean} True if user has exceeded limit, false otherwise
   */
  static hasExceededAnalysisLimit(user) {
    // Reset counter if it's a new month
    const now = new Date();
    const lastReset = new Date(user.lastResetDate);
    
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      return false; // New month, so hasn't exceeded limit
    }
    
    const limits = this.SUBSCRIPTION_LIMITS[user.subscription] || this.SUBSCRIPTION_LIMITS.free;
    return user.analysisCount >= limits.analysesPerMonth;
  }

  /**
   * Create a password reset token for a user
   * 
   * @param {string} email User email
   * @returns {Promise<Object>} Object with reset token and expiration
   */
  static async createPasswordResetToken(email) {
    try {
      // Find the user by email
      const user = await this.findByEmail(email);
      if (!user) {
        return null;
      }
      
      // Generate a reset token and expiration
      const resetToken = generateResetToken();
      const resetExpires = calculateTokenExpiration();
      
      // Update the user with the reset token
      await db('users')
        .where({ id: user.id })
        .update({
          reset_token: resetToken,
          reset_token_expires: resetExpires,
          updated_at: db.fn.now()
        });
      
      return {
        email,
        resetToken,
        resetExpires
      };
    } catch (error) {
      console.error('Error creating password reset token:', error);
      return null;
    }
  }
  
  /**
   * Find a user by reset token
   * 
   * @param {string} token Reset token
   * @returns {Promise<Object|null>} User object or null if not found/expired
   */
  static async findByResetToken(token) {
    try {
      const user = await db('users')
        .where({ reset_token: token })
        .where('reset_token_expires', '>', new Date())
        .first();
      
      return user ? this.formatUser(user) : null;
    } catch (error) {
      console.error('Error finding user by reset token:', error);
      return null;
    }
  }
  
  /**
   * Reset a user's password using a valid reset token
   * 
   * @param {string} token Reset token
   * @param {string} newPassword New password
   * @returns {Promise<boolean>} True if password was reset successfully
   */
  static async resetPasswordWithToken(token, newPassword) {
    try {
      // Validate the new password
      const validationResult = validatePassword(newPassword);
      if (!validationResult.isValid) {
        console.error('Password validation failed:', validationResult.message);
        return {
          success: false,
          message: validationResult.message
        };
      }
      
      // Find the user by reset token
      const user = await this.findByResetToken(token);
      if (!user) {
        return {
          success: false,
          message: 'Invalid or expired reset token'
        };
      }
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      
      // Update the user with the new password and clear the reset token
      await db('users')
        .where({ id: user.id })
        .update({
          password: hashedPassword,
          reset_token: null,
          reset_token_expires: null,
          updated_at: db.fn.now()
        });
      
      return {
        success: true,
        message: 'Password reset successful'
      };
    } catch (error) {
      console.error('Error resetting password with token:', error);
      return {
        success: false,
        message: 'Server error while resetting password'
      };
    }
  }
  
  /**
   * Change a user's password with current password verification
   * 
   * @param {string} userId User ID
   * @param {string} currentPassword Current password
   * @param {string} newPassword New password
   * @returns {Promise<Object>} Result with success flag and message
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Find the user
      const user = await this.findById(userId);
      if (!user) {
        return {
          success: false,
          message: 'User not found'
        };
      }
      
      // Verify current password
      const isValid = await this.verifyPassword(currentPassword, user.password);
      if (!isValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }
      
      // Validate the new password
      const validationResult = validatePassword(newPassword);
      if (!validationResult.isValid) {
        return {
          success: false,
          message: validationResult.message
        };
      }
      
      // Update the password
      await this.update(userId, { password: newPassword });
      
      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Error changing password:', error);
      return {
        success: false,
        message: 'Server error while changing password'
      };
    }
  }

  /**
   * Format database user object to include methods and properties needed by the application
   * 
   * @param {Object} dbUser Database user object
   * @returns {Object} Formatted user object
   */
  static formatUser(dbUser) {
    if (!dbUser) return null;
    
    // Make sure we have the right property names (camelCase for the app)
    const user = {
      ...dbUser,
      // Make sure these properties exist with the right casing
      analysisCount: dbUser.analysis_count || 0,
      lastResetDate: dbUser.last_reset_date || new Date(),
      resetToken: dbUser.reset_token,
      resetTokenExpires: dbUser.reset_token_expires,
      // Ensure password is preserved if it exists
      password: dbUser.password
    };
    
    // Add methods to the user object
    user.hasExceededAnalysisLimit = function() {
      return User.hasExceededAnalysisLimit(this);
    };
    
    user.incrementAnalysisCount = async function() {
      const updated = await User.incrementAnalysisCount(this.id);
      if (updated) {
        this.analysisCount = updated.analysisCount;
        this.lastResetDate = updated.lastResetDate;
      }
      return this.analysisCount;
    };
    
    // Add subscription info to user object for easy access
    const subscriptionLimits = User.SUBSCRIPTION_LIMITS[user.subscription] || User.SUBSCRIPTION_LIMITS.free;
    user.analysisLimit = subscriptionLimits.analysesPerMonth;
    user.analysisRemaining = Math.max(0, subscriptionLimits.analysesPerMonth - user.analysisCount);
    
    return user;
  }
}

module.exports = User;