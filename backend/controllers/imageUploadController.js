/**
 * Image Upload Controller
 * 
 * This controller handles all image upload, storage, and management operations
 */

const ApiError = require('../utils/apiError');
const multer = require('multer');
const path = require('path');
const s3Service = require('../services/s3Service');
const { v4: uuidv4 } = require('uuid');

// Valid image types
const VALID_TYPES = ['throat', 'ear'];
const VALID_MIME_TYPES = ['image/jpeg', 'image/png'];
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

/**
 * Handle image upload
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const uploadImage = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    
    // Check if type is valid
    const { type } = req.body;
    if (!type || !VALID_TYPES.includes(type)) {
      throw ApiError.badRequest('Invalid type. Must be "throat" or "ear"', 'INVALID_TYPE');
    }
    
    // Check if file was uploaded
    if (!req.file) {
      throw ApiError.badRequest('No image provided', 'MISSING_IMAGE');
    }
    
    // Check file size
    if (req.file.size > 5 * 1024 * 1024) { // 5MB
      throw ApiError.badRequest('Image file too large - exceeds the 5MB limit', 'FILE_TOO_LARGE', 413);
    }
    
    // Check file type
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    if (!VALID_EXTENSIONS.includes(fileExtension) || !VALID_MIME_TYPES.includes(req.file.mimetype)) {
      throw ApiError.badRequest('Invalid file type. Only JPEG and PNG are allowed', 'INVALID_FILE_TYPE');
    }
    
    // Upload to S3
    const result = await s3Service.uploadToS3(
      req.file.buffer,
      req.user.id,
      req.file.mimetype
    );
    
    // Return the result
    res.status(200).json({
      imageUrl: result.Location,
      imageKey: result.Key,
      success: true
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Upload multiple images
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const uploadMultipleImages = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    
    // Check if type is valid
    const { type } = req.body;
    if (!type || !VALID_TYPES.includes(type)) {
      throw ApiError.badRequest('Invalid type. Must be "throat" or "ear"', 'INVALID_TYPE');
    }
    
    // Check if files were uploaded
    if (!req.files || !req.files.length) {
      throw ApiError.badRequest('No images provided', 'MISSING_IMAGES');
    }
    
    // Process each file
    const uploadPromises = req.files.map(async (file) => {
      // Check file size
      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw ApiError.badRequest(`Image file too large - ${file.originalname} exceeds the 5MB limit`, 'FILE_TOO_LARGE', 413);
      }
      
      // Check file type
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (!VALID_EXTENSIONS.includes(fileExtension) || !VALID_MIME_TYPES.includes(file.mimetype)) {
        throw ApiError.badRequest(`Invalid file type for ${file.originalname}. Only JPEG and PNG are allowed`, 'INVALID_FILE_TYPE');
      }
      
      // Upload to S3
      const result = await s3Service.uploadToS3(
        file.buffer,
        req.user.id,
        file.mimetype
      );
      
      return {
        imageUrl: result.Location,
        imageKey: result.Key,
        originalName: file.originalname
      };
    });
    
    // Execute all uploads
    const uploadResults = await Promise.all(uploadPromises);
    
    // Return the results
    res.status(200).json({
      images: uploadResults,
      success: true
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a presigned URL for direct S3 upload
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getPresignedUrl = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    
    // Get parameters from request
    const { type, filename, contentType } = req.body;
    
    // Validate parameters
    if (!type || !VALID_TYPES.includes(type)) {
      throw ApiError.badRequest('Invalid type. Must be "throat" or "ear"', 'INVALID_TYPE');
    }
    
    if (!filename) {
      throw ApiError.badRequest('Filename is required', 'MISSING_FILENAME');
    }
    
    if (!contentType || !VALID_MIME_TYPES.includes(contentType)) {
      throw ApiError.badRequest('Invalid file type. Content type must be image/jpeg or image/png', 'INVALID_CONTENT_TYPE');
    }
    
    // Generate a unique key for the file
    const fileExtension = path.extname(filename).toLowerCase();
    if (!VALID_EXTENSIONS.includes(fileExtension)) {
      throw ApiError.badRequest('Invalid file type. Only JPEG and PNG are allowed', 'INVALID_FILE_TYPE');
    }
    
    // Generate the key
    const key = `${req.user.id}/${uuidv4()}${fileExtension}`;
    
    // Get the presigned URL
    const presignedData = s3Service.getPresignedUrl(key, contentType);
    
    // Return the URL and key
    res.status(200).json({
      url: presignedData.url,
      key: presignedData.key,
      success: true
    });
    
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an image from S3
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteImage = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }
    
    // Get the image key from request body
    const { imageKey } = req.body;
    
    if (!imageKey) {
      throw ApiError.badRequest('Image key is required', 'MISSING_KEY');
    }
    
    // Make sure the key belongs to the user
    if (!imageKey.startsWith(req.user.id + '/')) {
      throw ApiError.forbidden('You do not have permission to delete this image');
    }
    
    // Delete the image
    await s3Service.deleteFromS3(imageKey);
    
    // Return success
    res.status(200).json({
      message: 'Image deleted successfully',
      success: true
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  getPresignedUrl,
  deleteImage
};