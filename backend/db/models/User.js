/**
 * User Model
 * 
 * Represents a user in the database with methods for CRUD operations
 */

const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

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
    const user = await db('users')
      .where({ id })
      .first();
    
    return user ? this.formatUser(user) : null;
  }

  /**
   * Find a user by email
   * 
   * @param {string} email User email
   * @returns {Promise<Object|null>} User object or null if not found
   */
  static async findByEmail(email) {
    const user = await db('users')
      .where({ email })
      .first();
    
    return user ? this.formatUser(user) : null;
  }

  /**
   * Update a user
   * 
   * @param {string} id User ID
   * @param {Object} updateData Update data
   * @returns {Promise<Object>} Updated user object
   */
  static async update(id, updateData) {
    // If password is being updated, hash it
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
    }
    
    // Update updated_at timestamp
    updateData.updated_at = db.fn.now();
    
    const [user] = await db('users')
      .where({ id })
      .update(updateData)
      .returning(['id', 'email', 'name', 'subscription', 'email_verified', 'analysis_count', 'last_reset_date', 'created_at', 'updated_at']);
    
    return this.formatUser(user);
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
      lastResetDate: dbUser.last_reset_date || new Date()
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