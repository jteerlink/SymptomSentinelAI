// Import required modules
const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configure AWS SDK
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + uuidv4();
    const fileExt = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + fileExt);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Accept only jpeg and png images
  const allowedMimeTypes = ['image/jpeg', 'image/png'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Instead of throwing an error, set a custom property on request
    // We'll handle this in the controller
    req.fileValidationError = 'Invalid file format. Only JPEG and PNG are allowed.';
    cb(null, false);
  }
};

// Configure multer upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

/**
 * Upload a single image to S3
 * @param {Object} file - The file object from multer
 * @param {String} type - The type of analysis (throat, ear)
 * @returns {Promise<String>} - The S3 URL of the uploaded file
 */
const uploadToS3 = async (file, type) => {
  const fileContent = fs.readFileSync(file.path);
  
  // Define the folder structure in S3 bucket
  const folderPath = `uploads/${type}`;
  const key = `${folderPath}/${file.filename}`;
  
  // S3 upload parameters
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: fileContent,
    ContentType: file.mimetype,
    ACL: 'public-read' // Make the file publicly accessible
  };
  
  try {
    // Upload to S3
    const s3Response = await s3.upload(params).promise();
    
    // Delete local file after successful S3 upload
    fs.unlinkSync(file.path);
    
    return s3Response.Location; // Return the S3 URL
  } catch (error) {
    console.error('Error uploading to S3:', error);
    // Ensure local file cleanup even on S3 upload failure
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

/**
 * Handle image upload and store in S3
 * - Single file upload middleware is attached to this controller
 */
exports.uploadImage = [
  // Multer middleware for single file upload
  upload.single('image'),
  
  // Main controller function
  async (req, res, next) => {
    try {
      // Check for file validation error
      if (req.fileValidationError) {
        return res.status(400).json({
          success: false,
          error: req.fileValidationError
        });
      }
      
      // Check if file exists
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No image file provided'
        });
      }
      
      // Get type parameter (throat, ear)
      const { type } = req.body;
      
      if (!type || (type !== 'throat' && type !== 'ear')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid analysis type. Must be "throat" or "ear"'
        });
      }
      
      // Upload file to S3
      const s3Url = await uploadToS3(req.file, type);
      
      // Return success response with S3 URL
      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        imageUrl: s3Url,
        type: type,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'File size exceeds the 5MB limit'
          });
        }
        return res.status(400).json({
          success: false,
          error: `Upload error: ${error.message}`
        });
      }
      
      // Handle other errors
      console.error('Error in image upload:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error during image upload'
      });
    }
  }
];

/**
 * Handle multiple image uploads and store in S3
 * - Multiple files upload middleware is attached to this controller
 */
exports.uploadMultipleImages = [
  // Multer middleware for multiple file uploads (max 5)
  upload.array('images', 5),
  
  // Main controller function
  async (req, res, next) => {
    try {
      // Check for file validation error
      if (req.fileValidationError) {
        return res.status(400).json({
          success: false,
          error: req.fileValidationError
        });
      }
      
      // Check if files exist
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No image files provided'
        });
      }
      
      // Get type parameter (throat, ear)
      const { type } = req.body;
      
      if (!type || (type !== 'throat' && type !== 'ear')) {
        return res.status(400).json({
          success: false,
          error: 'Invalid analysis type. Must be "throat" or "ear"'
        });
      }
      
      // Upload files to S3
      const uploadPromises = req.files.map(file => uploadToS3(file, type));
      const s3Urls = await Promise.all(uploadPromises);
      
      // Return success response with S3 URLs
      res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        imageUrls: s3Urls,
        type: type,
        count: s3Urls.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      // Handle multer errors
      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'One or more files exceed the 5MB limit'
          });
        }
        return res.status(400).json({
          success: false,
          error: `Upload error: ${error.message}`
        });
      }
      
      // Handle other errors
      console.error('Error in multiple image upload:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Internal server error during image upload'
      });
    }
  }
];

/**
 * Get presigned URL for direct S3 upload from client
 * - This allows secure direct uploads without sending files through the server
 */
exports.getPresignedUrl = async (req, res, next) => {
  try {
    const { type, fileType } = req.body;
    
    // Validate parameters
    if (!type || (type !== 'throat' && type !== 'ear')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid analysis type. Must be "throat" or "ear"'
      });
    }
    
    if (!fileType || !['image/jpeg', 'image/png'].includes(fileType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file type. Must be JPEG or PNG'
      });
    }
    
    // Generate unique filename with appropriate extension
    const extension = fileType === 'image/jpeg' ? '.jpg' : '.png';
    const key = `uploads/${type}/${Date.now()}-${uuidv4()}${extension}`;
    
    // Generate presigned URL
    const presignedUrl = s3.getSignedUrl('putObject', {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      Expires: 300, // URL expires in 5 minutes
      ACL: 'public-read'
    });
    
    // Generate the public URL that will be available after upload
    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.amazonaws.com/${key}`;
    
    res.status(200).json({
      success: true,
      presignedUrl,
      publicUrl,
      key
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};

/**
 * Delete an image from S3
 */
exports.deleteImage = async (req, res, next) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'Image key is required'
      });
    }
    
    // S3 delete parameters
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key
    };
    
    // Delete from S3
    await s3.deleteObject(params).promise();
    
    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image from S3:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error during image deletion'
    });
  }
};