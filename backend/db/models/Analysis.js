/**
 * Analysis Model
 * 
 * Represents a medical image analysis in the database with methods for CRUD operations
 */

const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class Analysis {
  /**
   * Create a new analysis record
   * 
   * @param {Object} analysisData Analysis data
   * @returns {Promise<Object>} Created analysis object
   */
  static async create(analysisData) {
    const { id, userId, type, conditions, imageUrl } = analysisData;
    
    // Insert analysis into database
    const [analysis] = await db('analyses').insert({
      id: id || uuidv4(), // Use provided ID or generate a new one
      user_id: userId,
      type,
      conditions: JSON.stringify(conditions),
      image_url: imageUrl
    }).returning(['id', 'user_id', 'type', 'conditions', 'image_url', 'created_at']);
    
    // Parse conditions back to JSON
    if (analysis && analysis.conditions) {
      analysis.conditions = JSON.parse(analysis.conditions);
    }
    
    return analysis;
  }

  /**
   * Find an analysis by ID
   * 
   * @param {string} id Analysis ID
   * @returns {Promise<Object|null>} Analysis object or null if not found
   */
  static async findById(id) {
    const analysis = await db('analyses')
      .where({ id })
      .first();
    
    // Parse conditions back to JSON
    if (analysis && analysis.conditions) {
      analysis.conditions = JSON.parse(analysis.conditions);
    }
    
    return analysis || null;
  }

  /**
   * Find analyses by user ID
   * 
   * @param {string} userId User ID
   * @param {Object} options Query options (limit, offset, orderBy)
   * @returns {Promise<Array>} Array of analysis objects
   */
  static async findByUserId(userId, options = {}) {
    const { limit = 10, offset = 0, orderBy = 'created_at', order = 'desc' } = options;
    
    const analyses = await db('analyses')
      .where({ user_id: userId })
      .orderBy(orderBy, order)
      .limit(limit)
      .offset(offset);
    
    // Parse conditions back to JSON for each analysis
    return analyses.map(analysis => {
      if (analysis.conditions) {
        analysis.conditions = JSON.parse(analysis.conditions);
      }
      return analysis;
    });
  }

  /**
   * Update an analysis
   * 
   * @param {string} id Analysis ID
   * @param {Object} updateData Update data
   * @returns {Promise<Object>} Updated analysis object
   */
  static async update(id, updateData) {
    // If conditions is being updated, stringify it
    if (updateData.conditions) {
      updateData.conditions = JSON.stringify(updateData.conditions);
    }
    
    // Update updated_at timestamp
    updateData.updated_at = db.fn.now();
    
    const [analysis] = await db('analyses')
      .where({ id })
      .update(updateData)
      .returning(['id', 'user_id', 'type', 'conditions', 'image_url', 'created_at', 'updated_at']);
    
    // Parse conditions back to JSON
    if (analysis && analysis.conditions) {
      analysis.conditions = JSON.parse(analysis.conditions);
    }
    
    return analysis;
  }

  /**
   * Delete an analysis
   * 
   * @param {string} id Analysis ID
   * @returns {Promise<boolean>} True if analysis was deleted, false otherwise
   */
  static async delete(id) {
    const deleted = await db('analyses')
      .where({ id })
      .delete();
    
    return deleted > 0;
  }

  /**
   * Get all analyses
   * 
   * @param {Object} options Query options (limit, offset, orderBy)
   * @returns {Promise<Array>} Array of analysis objects
   */
  static async getAll(options = {}) {
    const { limit = 50, offset = 0, orderBy = 'created_at', order = 'desc' } = options;
    
    const analyses = await db('analyses')
      .orderBy(orderBy, order)
      .limit(limit)
      .offset(offset);
    
    // Parse conditions back to JSON for each analysis
    return analyses.map(analysis => {
      if (analysis.conditions) {
        analysis.conditions = JSON.parse(analysis.conditions);
      }
      return analysis;
    });
  }

  /**
   * Get analysis count by type
   * 
   * @returns {Promise<Object>} Object with counts by type
   */
  static async getCountByType() {
    const counts = await db('analyses')
      .select('type')
      .count('id as count')
      .groupBy('type');
    
    // Convert to object with type as key
    return counts.reduce((acc, curr) => {
      acc[curr.type] = parseInt(curr.count);
      return acc;
    }, {});
  }
}

module.exports = Analysis;