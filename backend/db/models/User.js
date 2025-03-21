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
      email_verified
    }).returning(['id', 'email', 'name', 'subscription', 'email_verified', 'created_at']);
    
    return user;
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
    
    return user || null;
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
    
    return user || null;
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
      .returning(['id', 'email', 'name', 'subscription', 'email_verified', 'created_at', 'updated_at']);
    
    return user;
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
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get all users
   * 
   * @returns {Promise<Array>} Array of user objects
   */
  static async getAll() {
    const users = await db('users')
      .select(['id', 'email', 'name', 'subscription', 'email_verified', 'created_at', 'updated_at']);
    
    return users;
  }
}

module.exports = User;