/**
 * Login Test Script
 * 
 * This script tests the login functionality directly by making API requests to the server.
 * It helps diagnose issues with the login flow.
 */

// Using import() dynamically for ESM modules
let fetch;
import('node-fetch').then(module => {
  fetch = module.default;
  runTests();
});

const { promisify } = require('util');
const sleep = promisify(setTimeout);

// Configuration
const API_BASE_URL = 'http://localhost:5000';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123',
  name: 'Test User'
};

// Function to register a test user
async function registerTestUser() {
  console.log('\n🔷 Registering test user...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_USER)
    });
    
    // Get raw text first
    const rawResponse = await response.text();
    console.log('📤 Raw Response:', rawResponse);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(rawResponse);
      console.log('✅ Parsed response data:', data);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Failed to parse response:', rawResponse);
      return null;
    }
    
    if (!response.ok) {
      if (data.message && data.message.includes('already exists')) {
        console.log('ℹ️ User already exists, proceeding to login test');
        return null;
      }
      console.error('❌ Registration failed:', data);
      return null;
    }
    
    console.log('✅ User registered successfully');
    return data.token;
  } catch (error) {
    console.error('❌ Error registering user:', error);
    return null;
  }
}

// Function to test login with the test user
async function testLogin() {
  console.log('\n🔷 Testing login...');
  try {
    console.log('📤 Sending request with:', {
      email: TEST_USER.email,
      password: '********'
    });
    
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password
      })
    });
    
    console.log('📤 Response status:', response.status, response.statusText);
    console.log('📤 Response headers:', Object.fromEntries([...response.headers.entries()]));
    
    // Get raw text first
    const rawResponse = await response.text();
    console.log('📤 Raw Response:', rawResponse);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(rawResponse);
      console.log('✅ Parsed response data:', {
        ...data,
        token: data.token ? '(Token present)' : '(No token)',
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          subscription: data.user.subscription
        } : '(No user data)'
      });
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Failed to parse response:', rawResponse);
      return false;
    }
    
    if (!response.ok) {
      console.error('❌ Login failed:', data);
      return false;
    }
    
    if (!data.token) {
      console.error('❌ Login response missing token');
      return false;
    }
    
    if (!data.user) {
      console.error('❌ Login response missing user data');
      return false;
    }
    
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Error testing login:', error);
    return false;
  }
}

// Function to test invalid login
async function testInvalidLogin() {
  console.log('\n🔷 Testing invalid login...');
  try {
    // Test with wrong password
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: 'wrong_password'
      })
    });
    
    // Get raw text first
    const rawResponse = await response.text();
    console.log('📤 Raw Response:', rawResponse);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(rawResponse);
      console.log('Parsed response data:', data);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      console.error('❌ Failed to parse response:', rawResponse);
      return false;
    }
    
    if (response.ok) {
      console.error('❌ Invalid login succeeded when it should have failed');
      return false;
    }
    
    console.log('✅ Invalid login correctly rejected');
    return true;
  } catch (error) {
    console.error('❌ Error testing invalid login:', error);
    return false;
  }
}

// Main function to run all tests
async function runTests() {
  console.log('='.repeat(50));
  console.log('🔍 LOGIN FUNCTIONALITY TEST');
  console.log('='.repeat(50));
  
  // Wait a bit for the server to start
  await sleep(1000);
  
  // Register a test user (or use existing one)
  await registerTestUser();
  
  // Test login
  const loginSuccess = await testLogin();
  
  // Test invalid login
  const invalidLoginSuccess = await testInvalidLogin();
  
  // Report results
  console.log('\n='.repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Login Test: ${loginSuccess ? 'PASSED' : 'FAILED'}`);
  console.log(`✅ Invalid Login Test: ${invalidLoginSuccess ? 'PASSED' : 'FAILED'}`);
  console.log('='.repeat(50));
  
  // Exit with appropriate code
  process.exit(loginSuccess && invalidLoginSuccess ? 0 : 1);
}

// The runTests function is now called after fetch is loaded in the import().then() callback
// So we don't need to call it here again