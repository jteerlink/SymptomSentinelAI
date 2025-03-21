/**
 * Educational Content Model
 * 
 * Represents educational content in the database with methods for CRUD operations
 */

const db = require('../db');
const { v4: uuidv4 } = require('uuid');

class EducationalContent {
  /**
   * Create a new educational content record
   * 
   * @param {Object} contentData Content data
   * @returns {Promise<Object>} Created content object
   */
  static async create(contentData) {
    const { title, content, category, imageUrl = null, premiumOnly = false, tags = [] } = contentData;
    
    // Insert content into database
    const [educationalContent] = await db('educational_content').insert({
      id: uuidv4(),
      title,
      content,
      category,
      image_url: imageUrl,
      premium_only: premiumOnly,
      tags: JSON.stringify(tags)
    }).returning(['id', 'title', 'content', 'category', 'image_url', 'premium_only', 'tags', 'created_at']);
    
    // Parse tags back to JSON
    if (educationalContent && educationalContent.tags) {
      educationalContent.tags = JSON.parse(educationalContent.tags);
    }
    
    return educationalContent;
  }

  /**
   * Find educational content by ID
   * 
   * @param {string} id Content ID
   * @returns {Promise<Object|null>} Content object or null if not found
   */
  static async findById(id) {
    const content = await db('educational_content')
      .where({ id })
      .first();
    
    // Parse tags back to JSON
    if (content && content.tags) {
      content.tags = JSON.parse(content.tags);
    }
    
    return content || null;
  }

  /**
   * Find educational content by category
   * 
   * @param {string} category Content category
   * @param {Object} options Query options (limit, offset, orderBy)
   * @returns {Promise<Array>} Array of content objects
   */
  static async findByCategory(category, options = {}) {
    const { limit = 10, offset = 0, orderBy = 'created_at', order = 'desc' } = options;
    
    const contents = await db('educational_content')
      .where({ category })
      .orderBy(orderBy, order)
      .limit(limit)
      .offset(offset);
    
    // Parse tags back to JSON for each content
    return contents.map(content => {
      if (content.tags) {
        content.tags = JSON.parse(content.tags);
      }
      return content;
    });
  }

  /**
   * Search educational content
   * 
   * @param {string} searchTerm Search term
   * @param {Object} options Query options (limit, offset, orderBy)
   * @returns {Promise<Array>} Array of content objects
   */
  static async search(searchTerm, options = {}) {
    const { limit = 10, offset = 0, orderBy = 'created_at', order = 'desc' } = options;
    
    const contents = await db('educational_content')
      .whereRaw('LOWER(title) LIKE ?', [`%${searchTerm.toLowerCase()}%`])
      .orWhereRaw('LOWER(content) LIKE ?', [`%${searchTerm.toLowerCase()}%`])
      .orderBy(orderBy, order)
      .limit(limit)
      .offset(offset);
    
    // Parse tags back to JSON for each content
    return contents.map(content => {
      if (content.tags) {
        content.tags = JSON.parse(content.tags);
      }
      return content;
    });
  }

  /**
   * Update educational content
   * 
   * @param {string} id Content ID
   * @param {Object} updateData Update data
   * @returns {Promise<Object>} Updated content object
   */
  static async update(id, updateData) {
    // If tags is being updated, stringify it
    if (updateData.tags) {
      updateData.tags = JSON.stringify(updateData.tags);
    }
    
    // Update updated_at timestamp
    updateData.updated_at = db.fn.now();
    
    const [content] = await db('educational_content')
      .where({ id })
      .update(updateData)
      .returning(['id', 'title', 'content', 'category', 'image_url', 'premium_only', 'tags', 'created_at', 'updated_at']);
    
    // Parse tags back to JSON
    if (content && content.tags) {
      content.tags = JSON.parse(content.tags);
    }
    
    return content;
  }

  /**
   * Delete educational content
   * 
   * @param {string} id Content ID
   * @returns {Promise<boolean>} True if content was deleted, false otherwise
   */
  static async delete(id) {
    const deleted = await db('educational_content')
      .where({ id })
      .delete();
    
    return deleted > 0;
  }

  /**
   * Get all educational content
   * 
   * @param {Object} options Query options (limit, offset, orderBy)
   * @returns {Promise<Array>} Array of content objects
   */
  static async getAll(options = {}) {
    const { limit = 50, offset = 0, orderBy = 'created_at', order = 'desc', premiumFilter } = options;
    
    let query = db('educational_content');
    
    // Add premium filter if specified
    if (premiumFilter !== undefined) {
      query = query.where('premium_only', premiumFilter);
    }
    
    const contents = await query
      .orderBy(orderBy, order)
      .limit(limit)
      .offset(offset);
    
    // Parse tags back to JSON for each content
    return contents.map(content => {
      if (content.tags) {
        content.tags = JSON.parse(content.tags);
      }
      return content;
    });
  }
}

module.exports = EducationalContent;