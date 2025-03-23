/**
 * AWS S3 Service
 * 
 * This service provides functionality for uploading and retrieving images from AWS S3
 */

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS SDK
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Create S3 service object
const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME || 'symptom-sentry-uploads';

/**
 * Upload a file to S3
 * 
 * @param {Buffer} fileData - The file data as a Buffer
 * @param {string} userId - User ID (used to organize files by user)
 * @param {string} contentType - MIME type of the file
 * @returns {Promise<Object>} S3 upload result
 */
const uploadToS3 = async (fileData, userId, contentType) => {
  const key = `${userId}/${uuidv4()}.jpg`;
  
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: fileData,
    ContentType: contentType || 'image/jpeg',
    ACL: 'private'
  };
  
  try {
    const result = await s3.upload(params).promise();
    return result;
  } catch (error) {
    console.error('S3 upload error:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
};

/**
 * Generate a pre-signed URL for direct upload to S3
 * 
 * @param {string} key - The S3 object key
 * @param {string} contentType - MIME type of the file
 * @returns {Object} Object containing the presigned URL and key
 */
const getPresignedUrl = (key, contentType) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    Expires: 60 * 5 // URL expires in 5 minutes
  };
  
  try {
    const url = s3.getSignedUrl('putObject', params);
    return { url, key };
  } catch (error) {
    console.error('Presigned URL error:', error);
    throw new Error(`Failed to generate presigned URL: ${error.message}`);
  }
};

/**
 * Get a temporary URL to view an image
 * 
 * @param {string} key - The S3 object key
 * @returns {string} Temporary URL to view the image
 */
const getImageUrl = (key) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: 60 * 60 // URL expires in 1 hour
  };
  
  try {
    return s3.getSignedUrl('getObject', params);
  } catch (error) {
    console.error('Get image URL error:', error);
    throw new Error(`Failed to generate image URL: ${error.message}`);
  }
};

/**
 * Delete an object from S3
 * 
 * @param {string} key - The S3 object key to delete
 * @returns {Promise<boolean>} True if deletion was successful
 */
const deleteFromS3 = async (key) => {
  const params = {
    Bucket: bucketName,
    Key: key
  };
  
  try {
    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw new Error(`Failed to delete from S3: ${error.message}`);
  }
};

module.exports = {
  uploadToS3,
  getPresignedUrl,
  getImageUrl,
  deleteFromS3
};