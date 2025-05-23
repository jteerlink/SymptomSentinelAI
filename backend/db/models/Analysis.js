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
    
    console.log(`[Analysis.create] Creating analysis for user: ${userId}, type: ${type}`);
    
    // Prepare conditions for storage
    let conditionsStr;
    if (conditions) {
      // Only stringify if it's not already a string
      conditionsStr = typeof conditions === 'string' ? conditions : JSON.stringify(conditions);
    }
    
    // Insert analysis into database
    const [analysis] = await db('analyses').insert({
      id: id || uuidv4(), // Use provided ID or generate a new one
      user_id: userId,
      type,
      conditions: conditionsStr,
      image_url: imageUrl
    }).returning(['id', 'user_id', 'type', 'conditions', 'image_url', 'created_at']);
    
    console.log(`[Analysis.create] Created analysis with ID: ${analysis.id}`);
    
    // Parse conditions back to JSON if it's a string
    if (analysis && analysis.conditions) {
      try {
        // Only parse if it's a string
        if (typeof analysis.conditions === 'string') {
          analysis.conditions = JSON.parse(analysis.conditions);
        }
      } catch (error) {
        console.error(`[Analysis.create] Error parsing conditions for analysis ${analysis.id}: ${error.message}`);
        // Keep the original data to prevent data loss
      }
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
    
    // Parse conditions back to JSON if it's a string
    if (analysis && analysis.conditions) {
      try {
        // Check if conditions is a string that needs parsing
        if (typeof analysis.conditions === 'string') {
          analysis.conditions = JSON.parse(analysis.conditions);
        }
        // Otherwise, it might already be an object (from a previous operation or test)
      } catch (error) {
        console.error(`[Analysis.findById] Error parsing conditions: ${error.message}`);
        // Keep the original data to prevent data loss
      }
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
    
    console.log(`[Analysis.findByUserId] Found ${analyses.length} analyses for user ${userId}`);
    
    // Parse conditions back to JSON for each analysis
    return analyses.map(analysis => {
      if (analysis.conditions) {
        try {
          // Check if conditions is a string that needs parsing
          if (typeof analysis.conditions === 'string') {
            analysis.conditions = JSON.parse(analysis.conditions);
          }
          // Otherwise, it might already be an object (from a previous operation or test)
        } catch (error) {
          console.error(`[Analysis.findByUserId] Error parsing conditions for analysis ${analysis.id}: ${error.message}`);
          // Keep the original data to prevent data loss
        }
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
    // If conditions is being updated, stringify it if it's not already a string
    if (updateData.conditions && typeof updateData.conditions !== 'string') {
      updateData.conditions = JSON.stringify(updateData.conditions);
    }
    
    // Update updated_at timestamp
    updateData.updated_at = db.fn.now();
    
    const [analysis] = await db('analyses')
      .where({ id })
      .update(updateData)
      .returning(['id', 'user_id', 'type', 'conditions', 'image_url', 'created_at', 'updated_at']);
    
    console.log(`[Analysis.update] Updated analysis: ${id}`);
    
    // Parse conditions back to JSON if it's a string
    if (analysis && analysis.conditions) {
      try {
        // Check if conditions is a string that needs parsing
        if (typeof analysis.conditions === 'string') {
          analysis.conditions = JSON.parse(analysis.conditions);
        }
        // Otherwise, it might already be an object (from a previous operation or test)
      } catch (error) {
        console.error(`[Analysis.update] Error parsing conditions for analysis ${analysis.id}: ${error.message}`);
        // Keep the original data to prevent data loss
      }
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
    console.log(`[Analysis.delete] Deleting analysis with ID: ${id}`);
    try {
      const deleted = await db('analyses')
        .where({ id })
        .delete();
      
      console.log(`[Analysis.delete] Delete result: ${deleted}`);
      return deleted > 0;
    } catch (error) {
      console.error(`[Analysis.delete] Error deleting analysis:`, error);
      throw error;
    }
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
    
    console.log(`[Analysis.getAll] Found ${analyses.length} total analyses`);
    
    // Parse conditions back to JSON for each analysis
    return analyses.map(analysis => {
      if (analysis.conditions) {
        try {
          // Check if conditions is a string that needs parsing
          if (typeof analysis.conditions === 'string') {
            analysis.conditions = JSON.parse(analysis.conditions);
          }
          // Otherwise, it might already be an object (from a previous operation or test)
        } catch (error) {
          console.error(`[Analysis.getAll] Error parsing conditions for analysis ${analysis.id}: ${error.message}`);
          // Keep the original data to prevent data loss
        }
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

  /**
   * Delete all analyses for a user
   * 
   * @param {string} userId User ID
   * @returns {Promise<Object>} Object with success flag and count of deleted records
   */
  static async deleteByUserId(userId) {
    console.log(`[Analysis.deleteByUserId] Deleting all analyses for user: ${userId}`);
    try {
      const count = await db('analyses')
        .where({ user_id: userId })
        .delete();
      
      console.log(`[Analysis.deleteByUserId] Deleted ${count} analyses`);
      return { success: true, count };
    } catch (error) {
      console.error(`[Analysis.deleteByUserId] Error deleting analyses:`, error);
      throw error;
    }
  }
}

module.exports = Analysis;