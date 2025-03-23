/**
 * Comprehensive Test Suite for SymptomSentryAI Backend
 * 
 * This test suite tests all backend functionality and API endpoints, including:
 * - Authentication (registration, login, token refresh)
 * - User Profile Management
 * - Image Analysis
 * - Subscription Management
 * - Error Handling
 */

// Set test environment
process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Import API routes
const apiRoutes = require('../routes/api');

// Create test app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', apiRoutes);

// Test user credentials
const TEST_USER = {
  email: `test-${uuidv4().substring(0, 8)}@example.com`,
  password: 'Password123!',
  name: 'Test User'
};

// Test data
let authToken = null;
let refreshToken = null;
let userId = null;
let analysisId = null;

// Helper function to read test image
function getTestImage(filename = 'test-throat-image.jpg') {
  try {
    const imagePath = path.join(__dirname, 'test-data', filename);
    if (fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      return imageBuffer.toString('base64');
    } else {
      console.warn(`Test image ${filename} not found, generating mock image data`);
      // Return a small valid base64 image if file doesn't exist
      return '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';
    }
  } catch (error) {
    console.error('Error reading test image:', error);
    return null;
  }
}

// Helper function for authenticated requests
async function authenticatedRequest(endpoint, method = 'GET', body = null) {
  const req = request(app)[method.toLowerCase()](endpoint);
  
  if (authToken) {
    req.set('Authorization', `Bearer ${authToken}`);
  }
  
  if (body) {
    req.send(body);
  }
  
  return req;
}

describe('SymptomSentryAI API Comprehensive Test Suite', () => {
  
  // ===== AUTH TESTS =====
  describe('Authentication Flow', () => {
    
    test('should register a new user', async () => {
      const response = await request(app)
        .post('/api/register')
        .send(TEST_USER);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id');
      expect(response.body.user).toHaveProperty('email', TEST_USER.email);
      
      // Store tokens for subsequent tests
      authToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
      userId = response.body.user.id;
    });
    
    test('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: TEST_USER.email,
          password: TEST_USER.password
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      // Update tokens
      authToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });
    
    test('should reject login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          email: TEST_USER.email,
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
    });
    
    test('should refresh access token', async () => {
      const response = await request(app)
        .post('/api/refresh-token')
        .send({ refreshToken });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      // Update tokens
      authToken = response.body.accessToken;
      refreshToken = response.body.refreshToken;
    });
    
    test('should reject invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/refresh-token')
        .send({ refreshToken: 'invalid-token' });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
    });
  });
  
  // ===== USER PROFILE TESTS =====
  describe('User Profile Management', () => {
    
    test('should get user profile', async () => {
      const response = await authenticatedRequest('/api/user-profile', 'GET');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('email', TEST_USER.email);
      expect(response.body).toHaveProperty('name', TEST_USER.name);
    });
    
    test('should update user profile', async () => {
      const updatedName = 'Updated Test User';
      
      const response = await authenticatedRequest('/api/update-profile', 'PUT', {
        name: updatedName
      });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('name', updatedName);
      
      // Verify the change persisted
      const profileCheck = await authenticatedRequest('/api/user-profile', 'GET');
      expect(profileCheck.body).toHaveProperty('name', updatedName);
      
      // Update TEST_USER for future tests
      TEST_USER.name = updatedName;
    });
    
    test('should update password', async () => {
      const newPassword = 'NewPassword123!';
      
      const response = await authenticatedRequest('/api/update-password', 'PUT', {
        currentPassword: TEST_USER.password,
        newPassword: newPassword
      });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password updated successfully');
      
      // Verify we can login with the new password
      const loginCheck = await request(app)
        .post('/api/login')
        .send({
          email: TEST_USER.email,
          password: newPassword
        });
      
      expect(loginCheck.status).toBe(200);
      
      // Update TEST_USER for future tests
      TEST_USER.password = newPassword;
    });
    
    test('should reject weak password update', async () => {
      const weakPassword = 'weak';
      
      const response = await authenticatedRequest('/api/update-password', 'PUT', {
        currentPassword: TEST_USER.password,
        newPassword: weakPassword
      });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
    });
  });
  
  // ===== SUBSCRIPTION TESTS =====
  describe('Subscription Management', () => {
    
    test('should update subscription to premium', async () => {
      const response = await authenticatedRequest('/api/update-subscription', 'POST', {
        subscription_level: 'premium',
        payment_token: 'test-payment-token'
      });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('subscription', 'premium');
    });
    
    test('should downgrade subscription to free', async () => {
      const response = await authenticatedRequest('/api/update-subscription', 'POST', {
        subscription_level: 'free'
      });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('subscription', 'free');
    });
    
    test('should reject invalid subscription level', async () => {
      const response = await authenticatedRequest('/api/update-subscription', 'POST', {
        subscription_level: 'invalid-level'
      });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
    });
  });
  
  // ===== IMAGE ANALYSIS TESTS =====
  describe('Image Analysis', () => {
    
    test('should analyze throat image', async () => {
      const imageBase64 = getTestImage('test-throat-image.jpg');
      
      const response = await authenticatedRequest('/analyze', 'POST', {
        type: 'throat',
        image: `data:image/jpeg;base64,${imageBase64}`
      });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'throat');
      expect(response.body).toHaveProperty('conditions');
      expect(Array.isArray(response.body.conditions)).toBe(true);
      
      analysisId = response.body.id;
    });
    
    test('should analyze ear image', async () => {
      const imageBase64 = getTestImage('test-ear-image.jpg');
      
      const response = await authenticatedRequest('/analyze', 'POST', {
        type: 'ear',
        image: `data:image/jpeg;base64,${imageBase64}`
      });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'ear');
      expect(response.body).toHaveProperty('conditions');
      expect(Array.isArray(response.body.conditions)).toBe(true);
    });
    
    test('should reject analysis with invalid type', async () => {
      const imageBase64 = getTestImage();
      
      const response = await authenticatedRequest('/analyze', 'POST', {
        type: 'invalid',
        image: `data:image/jpeg;base64,${imageBase64}`
      });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toContain('Invalid analysis type');
    });
    
    test('should reject analysis without an image', async () => {
      const response = await authenticatedRequest('/analyze', 'POST', {
        type: 'throat'
      });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toContain('No image provided');
    });
    
    test('should save analysis result', async () => {
      // Skip if we don't have an analysis ID from previous test
      if (!analysisId) {
        console.warn('Skipping save analysis test because no analysis ID available');
        return;
      }
      
      const analysisData = {
        id: analysisId,
        type: 'throat',
        conditions: [
          {
            id: 'strep_throat',
            name: 'Strep Throat',
            confidence: 0.78,
            description: 'A bacterial infection that causes inflammation and pain in the throat.',
            symptoms: [
              'Throat pain',
              'Red and swollen tonsils'
            ],
            isPotentiallySerious: true
          }
        ]
      };
      
      const response = await authenticatedRequest('/api/save-analysis', 'POST', analysisData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Analysis saved successfully');
      expect(response.body).toHaveProperty('analysis');
      expect(response.body.analysis).toHaveProperty('id');
      expect(response.body.analysis).toHaveProperty('type', 'throat');
    });
    
    test('should get user analysis history', async () => {
      const response = await authenticatedRequest('/api/analysis-history', 'GET');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('history');
      expect(Array.isArray(response.body.history)).toBe(true);
      // We should have at least one analysis from previous tests
      expect(response.body.history.length).toBeGreaterThan(0);
    });
  });
  
  // ===== ERROR HANDLING TESTS =====
  describe('Error Handling', () => {
    
    test('should handle resource not found', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', true);
    });
    
    test('should handle server errors gracefully', async () => {
      // This test forces a server error by sending malformed data
      const response = await authenticatedRequest('/api/update-profile', 'PUT', {
        // Send an object where a string is expected
        name: { invalid: 'object' }
      });
      
      // Regardless of the specific error, we should get a 4xx or 5xx response
      // with a proper error structure
      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error', true);
    });
    
    test('should handle authentication errors', async () => {
      // Try to access a protected endpoint without authentication
      const response = await request(app)
        .get('/api/user-profile');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toContain('authentication');
    });
  });
});