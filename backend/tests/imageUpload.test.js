// Set test environment
process.env.NODE_ENV = 'test';

const request = require('supertest');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const express = require('express');
const bodyParser = require('body-parser');

// Mock the database models for testing
jest.mock('../db/models/Analysis', () => ({
  create: jest.fn().mockResolvedValue({
    id: '123e4567-e89b-12d3-a456-426614174111',
    type: 'throat',
    conditions: [
      {
        id: 'strep_throat',
        name: 'Strep Throat',
        confidence: 0.78,
      }
    ],
    created_at: new Date().toISOString()
  })
}));

const apiRoutes = require('../routes/api');

// Mock AWS S3 SDK
jest.mock('aws-sdk', () => {
  const mockS3Instance = {
    upload: jest.fn().mockReturnThis(),
    promise: jest.fn().mockResolvedValue({
      Location: 'https://example-bucket.s3.amazonaws.com/test-image.jpg'
    }),
    getSignedUrl: jest.fn().mockReturnValue('https://example-bucket.s3.amazonaws.com/presigned-url'),
    deleteObject: jest.fn().mockReturnThis()
  };
  
  return {
    S3: jest.fn(() => mockS3Instance)
  };
});

// Create a test app instance instead of using the running server
const app = express();
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use('/api', apiRoutes);

describe('Image Upload API', () => {
  // Test image paths
  const validImagePath = path.join(__dirname, 'test-files/valid-image.jpg');
  const largeImagePath = path.join(__dirname, 'test-files/large-image.jpg');
  const invalidFormatPath = path.join(__dirname, 'test-files/invalid-format.txt');
  
  // Create test files directory and sample files before tests
  beforeAll(() => {
    // Create test-files directory if it doesn't exist
    const testFilesDir = path.join(__dirname, 'test-files');
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
    
    // Create a valid sample image (small JPEG)
    if (!fs.existsSync(validImagePath)) {
      // Create a simple 1x1 pixel JPEG
      const buffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
        0xff, 0xff, 0xff, 0xff, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00,
        0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x37,
        0xff, 0xd9
      ]);
      fs.writeFileSync(validImagePath, buffer);
    }
    
    // Create a large sample image (> 5MB)
    if (!fs.existsSync(largeImagePath)) {
      // Create a file just over 5MB
      const buffer = Buffer.alloc(5 * 1024 * 1024 + 100, 0);
      fs.writeFileSync(largeImagePath, buffer);
    }
    
    // Create an invalid format file
    if (!fs.existsSync(invalidFormatPath)) {
      fs.writeFileSync(invalidFormatPath, 'This is not an image file');
    }
  });
  
  // Clean up test files after tests
  afterAll(() => {
    // Remove test files
    if (fs.existsSync(validImagePath)) {
      fs.unlinkSync(validImagePath);
    }
    if (fs.existsSync(largeImagePath)) {
      fs.unlinkSync(largeImagePath);
    }
    if (fs.existsSync(invalidFormatPath)) {
      fs.unlinkSync(invalidFormatPath);
    }
    
    // Remove test directory if it's empty
    const testFilesDir = path.join(__dirname, 'test-files');
    if (fs.existsSync(testFilesDir) && fs.readdirSync(testFilesDir).length === 0) {
      fs.rmdirSync(testFilesDir);
    }
  });
  
  // Test successful image upload
  test('should upload a valid image successfully', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('type', 'throat')
      .attach('image', validImagePath);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.imageUrl).toBeDefined();
    expect(response.body.type).toBe('throat');
  });
  
  // Test image type validation
  test('should reject uploads with invalid type', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('type', 'invalid-type')
      .attach('image', validImagePath);
    
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Invalid analysis type');
  });
  
  // Test missing image validation
  test('should reject requests without an image', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('type', 'throat');
    
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('No image');
  });
  
  // Test file size validation
  test('should reject images larger than 5MB', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('type', 'throat')
      .attach('image', largeImagePath);
    
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('size');
  });
  
  // Test file format validation
  test('should reject non-image files', async () => {
    const response = await request(app)
      .post('/api/upload')
      .field('type', 'throat')
      .attach('image', invalidFormatPath);
    
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('format');
  });
  
  // Test presigned URL generation
  test('should generate a presigned URL for direct S3 upload', async () => {
    const response = await request(app)
      .post('/api/get-presigned-url')
      .send({
        type: 'throat',
        fileType: 'image/jpeg'
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.presignedUrl).toBeDefined();
    expect(response.body.publicUrl).toBeDefined();
  });
  
  // Test presigned URL validation
  test('should reject presigned URL requests with invalid type', async () => {
    const response = await request(app)
      .post('/api/get-presigned-url')
      .send({
        type: 'invalid-type',
        fileType: 'image/jpeg'
      });
    
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Invalid analysis type');
  });
  
  // Test presigned URL file type validation
  test('should reject presigned URL requests with invalid file type', async () => {
    const response = await request(app)
      .post('/api/get-presigned-url')
      .send({
        type: 'throat',
        fileType: 'application/pdf'
      });
    
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Invalid file type');
  });
  
  // Test successful multiple image upload
  test('should upload multiple valid images successfully', async () => {
    const response = await request(app)
      .post('/api/upload-multiple')
      .field('type', 'throat')
      .attach('images', validImagePath)
      .attach('images', validImagePath);
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.imageUrls).toBeInstanceOf(Array);
    expect(response.body.imageUrls.length).toBe(2);
    expect(response.body.type).toBe('throat');
  });
  
  // Test delete image
  test('should delete an image from S3', async () => {
    const response = await request(app)
      .delete('/api/images/uploads/throat/test-image.jpg');
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('deleted successfully');
  });
});