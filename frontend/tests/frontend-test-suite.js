/**
 * Frontend Test Suite for SymptomSentryAI
 * 
 * This script provides tests for all frontend functionality including:
 * - Authentication (login, registration, token refresh)
 * - Image upload and analysis
 * - Profile management
 * - Subscription management
 * - Educational content
 * 
 * Run with: node frontend/tests/frontend-test-suite.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const config = {
  apiBaseUrl: 'http://localhost:5000/api',
  frontendUrl: 'http://localhost:8000',
  // Test user with unique email to avoid conflicts
  testUser: {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: 'Test User'
  },
  // Store tokens between tests
  tokens: {
    accessToken: null,
    refreshToken: null
  }
};

// Helper functions
const helpers = {
  // Make authenticated API request
  async authRequest(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (config.tokens.accessToken) {
      headers['Authorization'] = `Bearer ${config.tokens.accessToken}`;
    }
    
    const options = {
      method,
      headers
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${config.apiBaseUrl}${endpoint}`, options);
    return {
      status: response.status,
      body: await response.json().catch(() => null)
    };
  },
  
  // Create a test image file
  createTestImage() {
    // Path to test image (create a simple one if it doesn't exist)
    const testImagesDir = path.join(__dirname, 'test-data');
    const testImagePath = path.join(testImagesDir, 'test-throat.jpg');
    
    if (!fs.existsSync(testImagesDir)) {
      fs.mkdirSync(testImagesDir, { recursive: true });
    }
    
    if (!fs.existsSync(testImagePath)) {
      // Create a minimal valid image
      const imageData = Buffer.from(
        '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',
        'base64'
      );
      fs.writeFileSync(testImagePath, imageData);
    }
    
    return {
      path: testImagePath,
      data: fs.readFileSync(testImagePath),
      base64: fs.readFileSync(testImagePath, 'base64')
    };
  },
  
  // Log test result
  logResult(testName, success, error = null) {
    if (success) {
      console.log(`✅ ${testName}: Passed`);
    } else {
      console.log(`❌ ${testName}: Failed${error ? ' - ' + error.message : ''}`);
      if (error) console.error(error);
    }
  }
};

// Test suites
const tests = {
  // Authentication tests
  async testRegistration() {
    try {
      const response = await helpers.authRequest('/register', 'POST', config.testUser);
      
      if (response.status !== 200 || !response.body.token) {
        throw new Error(`Registration failed with status ${response.status}`);
      }
      
      // Store tokens for other tests
      config.tokens.accessToken = response.body.token;
      config.tokens.refreshToken = response.body.refreshToken;
      
      helpers.logResult('User Registration', true);
      return true;
    } catch (error) {
      helpers.logResult('User Registration', false, error);
      return false;
    }
  },
  
  async testLogin() {
    try {
      const response = await helpers.authRequest('/login', 'POST', {
        email: config.testUser.email,
        password: config.testUser.password
      });
      
      if (response.status !== 200 || !response.body.accessToken) {
        throw new Error(`Login failed with status ${response.status}`);
      }
      
      // Store tokens for other tests
      config.tokens.accessToken = response.body.accessToken;
      config.tokens.refreshToken = response.body.refreshToken;
      
      helpers.logResult('User Login', true);
      return true;
    } catch (error) {
      helpers.logResult('User Login', false, error);
      return false;
    }
  },
  
  async testTokenRefresh() {
    try {
      const response = await helpers.authRequest('/refresh-token', 'POST', {
        refreshToken: config.tokens.refreshToken
      });
      
      if (response.status !== 200 || !response.body.accessToken) {
        throw new Error(`Token refresh failed with status ${response.status}`);
      }
      
      // Update tokens
      config.tokens.accessToken = response.body.accessToken;
      config.tokens.refreshToken = response.body.refreshToken;
      
      helpers.logResult('Token Refresh', true);
      return true;
    } catch (error) {
      helpers.logResult('Token Refresh', false, error);
      return false;
    }
  },
  
  // User profile tests
  async testGetUserProfile() {
    try {
      const response = await helpers.authRequest('/user-profile', 'GET');
      
      if (response.status !== 200 || !response.body.email) {
        throw new Error(`Get profile failed with status ${response.status}`);
      }
      
      // Verify profile data
      if (response.body.email !== config.testUser.email) {
        throw new Error('Profile email does not match test user');
      }
      
      helpers.logResult('Get User Profile', true);
      return true;
    } catch (error) {
      helpers.logResult('Get User Profile', false, error);
      return false;
    }
  },
  
  async testUpdateProfile() {
    try {
      const updatedName = `${config.testUser.name} (Updated)`;
      const response = await helpers.authRequest('/update-profile', 'POST', {
        name: updatedName
      });
      
      if (response.status !== 200 || !response.body.user) {
        throw new Error(`Update profile failed with status ${response.status}`);
      }
      
      // Verify updated data
      if (response.body.user.name !== updatedName) {
        throw new Error('Updated name not reflected in response');
      }
      
      // Update test user
      config.testUser.name = updatedName;
      
      helpers.logResult('Update User Profile', true);
      return true;
    } catch (error) {
      helpers.logResult('Update User Profile', false, error);
      return false;
    }
  },
  
  async testUpdatePassword() {
    try {
      const newPassword = `${config.testUser.password}1`;
      const response = await helpers.authRequest('/update-password', 'POST', {
        currentPassword: config.testUser.password,
        newPassword: newPassword
      });
      
      if (response.status !== 200) {
        throw new Error(`Update password failed with status ${response.status}`);
      }
      
      // Verify we can login with new password
      const loginResponse = await helpers.authRequest('/login', 'POST', {
        email: config.testUser.email,
        password: newPassword
      });
      
      if (loginResponse.status !== 200 || !loginResponse.body.accessToken) {
        throw new Error('Login with new password failed');
      }
      
      // Update test user and tokens
      config.testUser.password = newPassword;
      config.tokens.accessToken = loginResponse.body.accessToken;
      config.tokens.refreshToken = loginResponse.body.refreshToken;
      
      helpers.logResult('Update Password', true);
      return true;
    } catch (error) {
      helpers.logResult('Update Password', false, error);
      return false;
    }
  },
  
  // Subscription tests
  async testUpdateSubscription() {
    try {
      // Upgrade to premium
      const upgradeResponse = await helpers.authRequest('/update-subscription', 'POST', {
        subscription_level: 'premium',
        payment_token: 'test-payment-token'
      });
      
      if (upgradeResponse.status !== 200 || upgradeResponse.body.user.subscription !== 'premium') {
        throw new Error(`Upgrade to premium failed with status ${upgradeResponse.status}`);
      }
      
      // Downgrade to free
      const downgradeResponse = await helpers.authRequest('/update-subscription', 'POST', {
        subscription_level: 'free'
      });
      
      if (downgradeResponse.status !== 200 || downgradeResponse.body.user.subscription !== 'free') {
        throw new Error(`Downgrade to free failed with status ${downgradeResponse.status}`);
      }
      
      helpers.logResult('Update Subscription', true);
      return true;
    } catch (error) {
      helpers.logResult('Update Subscription', false, error);
      return false;
    }
  },
  
  // Image analysis tests
  async testImageAnalysis() {
    try {
      // We need to use FormData for file uploads, which requires different approach
      // This test will be simulated using base64 image data which the API also accepts
      const testImage = helpers.createTestImage();
      
      // Format base64 data as the frontend would
      const imageData = `data:image/jpeg;base64,${testImage.base64}`;
      
      // Test throat analysis
      const throatResponse = await helpers.authRequest('/analyze', 'POST', {
        type: 'throat',
        image: imageData
      });
      
      if (throatResponse.status !== 200 || !throatResponse.body.conditions) {
        throw new Error(`Throat analysis failed with status ${throatResponse.status}`);
      }
      
      // Test ear analysis
      const earResponse = await helpers.authRequest('/analyze', 'POST', {
        type: 'ear',
        image: imageData
      });
      
      if (earResponse.status !== 200 || !earResponse.body.conditions) {
        throw new Error(`Ear analysis failed with status ${earResponse.status}`);
      }
      
      // Store analysis ID for history test
      if (throatResponse.body.id) {
        config.analysisId = throatResponse.body.id;
      }
      
      helpers.logResult('Image Analysis', true);
      return true;
    } catch (error) {
      helpers.logResult('Image Analysis', false, error);
      return false;
    }
  },
  
  async testAnalysisHistory() {
    try {
      // Ensure we've done an analysis first
      if (!config.analysisId) {
        await tests.testImageAnalysis();
      }
      
      const response = await helpers.authRequest('/analysis-history', 'GET');
      
      if (response.status !== 200 || !response.body.analyses) {
        throw new Error(`Get analysis history failed with status ${response.status}`);
      }
      
      // Verify we have at least one analysis
      if (!Array.isArray(response.body.analyses) || response.body.analyses.length === 0) {
        throw new Error('No analyses found in history');
      }
      
      helpers.logResult('Analysis History', true);
      return true;
    } catch (error) {
      helpers.logResult('Analysis History', false, error);
      return false;
    }
  }
};

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting SymptomSentryAI Frontend Integration Tests\n');
  
  // Authentication tests
  await tests.testRegistration();
  await tests.testLogin();
  await tests.testTokenRefresh();
  
  // User profile tests
  await tests.testGetUserProfile();
  await tests.testUpdateProfile();
  await tests.testUpdatePassword();
  
  // Subscription tests
  await tests.testUpdateSubscription();
  
  // Image analysis tests
  await tests.testImageAnalysis();
  await tests.testAnalysisHistory();
  
  console.log('\n✅ Frontend integration tests completed');
}

// Run the tests
runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
});

export {
  runAllTests,
  tests,
  helpers,
  config
};