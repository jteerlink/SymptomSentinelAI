/**
 * Test script for AuthManager functionality
 * 
 * This script tests the AuthManager's login, registration, and validation capabilities
 * directly, without requiring the web interface.
 */

// Import necessary modules
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    console.log(`Making ${method} request to ${endpoint}`);
    if (body) console.log('Request body:', JSON.stringify(body, null, 2));

    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, options);
    console.log(`Response status: ${response.status}`);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { status: response.status, data };
    } else {
      const text = await response.text();
      return { status: response.status, text };
    }
  } catch (error) {
    console.error(`API request error: ${error.message}`);
    return { status: 500, error: error.message };
  }
}

async function registerTestUser() {
  const userData = {
    name: `Test User ${Math.floor(Math.random() * 1000)}`,
    email: `test${Math.floor(Math.random() * 10000)}@example.com`,
    password: 'Password123!'
  };

  console.log('Registering test user:', userData.email);
  const result = await makeRequest('/api/register', 'POST', userData);
  
  if (result.status === 201 || result.status === 200) {
    console.log('✅ Registration successful');
    return result.data;
  } else {
    console.error('❌ Registration failed:', result.data?.message || 'Unknown error');
    return null;
  }
}

async function loginTestUser(credentials) {
  console.log('Logging in test user:', credentials.email);
  const result = await makeRequest('/api/login', 'POST', credentials);
  
  if (result.status === 200) {
    console.log('✅ Login successful');
    return result.data;
  } else {
    console.error('❌ Login failed:', result.data?.message || 'Unknown error');
    return null;
  }
}

async function validateToken(token) {
  console.log('Validating token...');
  const result = await makeRequest('/api/validate-token', 'GET', null, token);
  
  if (result.status === 200) {
    console.log('✅ Token is valid');
    return result.data;
  } else {
    console.error('❌ Token validation failed:', result.data?.message || 'Unknown error');
    return null;
  }
}

async function runTests() {
  console.log('=== Testing AuthManager Functionality ===');
  
  // Register a test user
  const registerData = await registerTestUser();
  if (!registerData) {
    console.error('Cannot continue tests without successful registration');
    return;
  }
  
  // Extract token and user data
  const { token, accessToken, user } = registerData;
  const authToken = token || accessToken;
  
  console.log('User data:', JSON.stringify(user, null, 2));
  console.log('Auth token received:', authToken ? `${authToken.substring(0, 10)}...` : 'None');
  
  // Verify the token is valid
  if (authToken) {
    const validationResult = await validateToken(authToken);
    if (validationResult) {
      console.log('Validation result:', JSON.stringify(validationResult, null, 2));
    }
  }
  
  // Test login with the same credentials
  const loginData = await loginTestUser({
    email: user.email,
    password: 'Password123!'
  });
  
  if (loginData) {
    console.log('Login successful with token:', 
      loginData.token || loginData.accessToken 
        ? `${(loginData.token || loginData.accessToken).substring(0, 10)}...` 
        : 'None'
    );
  }
  
  console.log('=== Tests Completed ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
});