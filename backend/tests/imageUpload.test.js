/**
 * Image Upload API Tests
 * 
 * These tests verify the functionality of the image upload and processing API.
 */

// Set test environment
process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Mock the auth middleware
jest.mock('../middleware/auth', () => {
  return {
    // Mock the authenticate middleware to always provide a mock user
    authenticate: (req, res, next) => {
      req.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        subscription: 'premium',
        analysisCount: 3
      };
      next();
    },
    
    // Mock the optional authenticate middleware
    optionalAuthenticate: (req, res, next) => {
      req.user = {
        id: 'test-user-id',
        email: 'test@example.com',
        subscription: 'premium',
        analysisCount: 3
      };
      next();
    }
  };
});

// Mock S3 upload functionality
jest.mock('../services/s3Service', () => {
  return {
    uploadToS3: jest.fn().mockResolvedValue({
      Location: 'https://s3-bucket.example.com/test-image.jpg',
      Key: 'test-user-id/test-image.jpg'
    }),
    
    getPresignedUrl: jest.fn().mockImplementation((key, contentType) => {
      return {
        url: `https://s3-bucket.example.com/upload/${key}`,
        key
      };
    }),
    
    deleteFromS3: jest.fn().mockResolvedValue(true)
  };
});

const apiRoutes = require('../routes/api');

// Create test app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', apiRoutes);

// Helper to create a test image file
function createTestImage(size = 100 * 1024) { // 100KB by default
  const testDir = path.join(__dirname, 'test-data');
  
  // Create test directory if it doesn't exist
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
  
  const imagePath = path.join(testDir, 'test-image.jpg');
  
  // Create a file with the specified size
  const buffer = Buffer.alloc(size, 0);
  
  // Add JPEG magic bytes to make it look like a valid image
  buffer[0] = 0xFF;
  buffer[1] = 0xD8;
  buffer[2] = 0xFF;
  buffer[3] = 0xE0;
  
  fs.writeFileSync(imagePath, buffer);
  
  return imagePath;
}

// Create a large test file
function createLargeTestFile() {
  const testDir = path.join(__dirname, 'test-data');
  const filePath = path.join(testDir, 'large-test-file.jpg');
  
  // Create a 6MB file (larger than the 5MB limit)
  const buffer = Buffer.alloc(6 * 1024 * 1024, 0);
  
  // Add JPEG magic bytes
  buffer[0] = 0xFF;
  buffer[1] = 0xD8;
  
  fs.writeFileSync(filePath, buffer);
  
  return filePath;
}

// Create a non-image file
function createNonImageFile() {
  const testDir = path.join(__dirname, 'test-data');
  const filePath = path.join(testDir, 'not-an-image.txt');
  
  fs.writeFileSync(filePath, 'This is not an image file');
  
  return filePath;
}

describe('Image Upload API', () => {
  // Set up test files
  let testImagePath;
  let largeFilePath;
  let nonImagePath;
  
  beforeAll(() => {
    testImagePath = createTestImage();
    largeFilePath = createLargeTestFile();
    nonImagePath = createNonImageFile();
  });
  
  // Test valid image upload
  test('should upload a valid image successfully', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('type', 'throat')
      .attach('image', testImagePath);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('imageUrl');
    expect(response.body).toHaveProperty('imageKey');
  });
  
  // Test invalid type
  test('should reject uploads with invalid type', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('type', 'invalid')
      .attach('image', testImagePath);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body.message).toContain('Invalid type');
  });
  
  // Test missing image
  test('should reject requests without an image', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('type', 'throat');
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body.message).toContain('No image');
  });
  
  // Test large file
  test('should reject images larger than 5MB', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('type', 'throat')
      .attach('image', largeFilePath);
    
    expect(response.status).toBe(413);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body.message).toContain('too large');
  });
  
  // Test non-image file
  test('should reject non-image files', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('type', 'throat')
      .attach('image', nonImagePath);
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body.message).toContain('Invalid file type');
  });
  
  // Test presigned URL generation
  test('should generate a presigned URL for direct S3 upload', async () => {
    const response = await request(app)
      .post('/api/presigned-upload')
      .send({
        type: 'throat',
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('url');
    expect(response.body).toHaveProperty('key');
  });
  
  // Test presigned URL with invalid type
  test('should reject presigned URL requests with invalid type', async () => {
    const response = await request(app)
      .post('/api/presigned-upload')
      .send({
        type: 'invalid',
        filename: 'test-image.jpg',
        contentType: 'image/jpeg'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body.message).toContain('Invalid type');
  });
  
  // Test presigned URL with invalid file type
  test('should reject presigned URL requests with invalid file type', async () => {
    const response = await request(app)
      .post('/api/presigned-upload')
      .send({
        type: 'throat',
        filename: 'test-document.pdf',
        contentType: 'application/pdf'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', true);
    expect(response.body.message).toContain('Invalid file type');
  });
  
  // Test multiple image upload
  test('should upload multiple valid images successfully', async () => {
    const response = await request(app)
      .post('/api/upload-multiple')
      .field('type', 'throat')
      .attach('images', testImagePath)
      .attach('images', createTestImage(200 * 1024)); // Create a second test image
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('images');
    expect(response.body.images).toBeInstanceOf(Array);
    expect(response.body.images.length).toBe(2);
    expect(response.body.images[0]).toHaveProperty('imageUrl');
    expect(response.body.images[0]).toHaveProperty('imageKey');
  });
  
  // Test image deletion
  test('should delete an image from S3', async () => {
    const response = await request(app)
      .delete('/api/image')
      .send({
        imageKey: 'test-user-id/test-image.jpg'
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Image deleted successfully');
  });
  
  // Clean up test files
  afterAll(() => {
    try {
      fs.unlinkSync(testImagePath);
      fs.unlinkSync(largeFilePath);
      fs.unlinkSync(nonImagePath);
    } catch (error) {
      console.error('Error cleaning up test files:', error);
    }
  });
});