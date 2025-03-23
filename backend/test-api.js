/**
 * Simple test script to verify the backend API functionality.
 * Run with: node test-api.js
 */

// We'll use dynamic import for node-fetch because it's an ESM module
let fetch;
// This function makes sure we import node-fetch before using it
async function setupFetch() {
  if (!fetch) {
    const module = await import('node-fetch');
    fetch = module.default;
  }
  return fetch;
}

// Base URL of the backend API (local server)
const API_BASE_URL = 'http://localhost:5000/api';

// Test login to get auth token
async function testLogin() {
  console.log('\n----- Testing /api/login for auth token -----');
  try {
    // Make sure fetch is available
    fetch = await setupFetch();
    
    // Create login request
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test-user@example.com',
        password: 'Password123!@#'
      }),
    });
    
    // Check response status
    console.log(`Login response status: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('Login successful');
      return data.accessToken;
    } else {
      console.log('Login failed, using test token');
      // Return a test token for testing
      return 'test_token';
    }
  } catch (error) {
    console.error('Error logging in:', error);
    return 'test_token';
  }
}

// Test analyze endpoint with a simple image
async function testAnalyzeEndpoint(authToken) {
  console.log('\n----- Testing /api/analyze endpoint -----');
  try {
    // Make sure fetch is available
    fetch = await setupFetch();
    
    // Create sample request to analyze a throat image
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        type: 'throat',
        image: 'test_image', // Simple test string for testing
      }),
    });

    // Check response status
    console.log(`Response status: ${response.status} ${response.statusText}`);

    // Get response data
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error('Error testing analyze endpoint:', error);
    return null;
  }
}

// Test health check endpoint
async function testHealthEndpoint() {
  console.log('\n----- Testing /api/health endpoint -----');
  try {
    // Make sure fetch is available
    fetch = await setupFetch();
    
    // Make request to health endpoint
    const response = await fetch(`${API_BASE_URL}/health`);

    // Check response status
    console.log(`Response status: ${response.status} ${response.statusText}`);

    // Get response data
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error('Error testing health endpoint:', error);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log('====================================');
  console.log('  SymptomSentryAI API Test Script   ');
  console.log('====================================');
  console.log(`Testing API at: ${API_BASE_URL}`);
  
  // Initialize fetch before running tests
  fetch = await setupFetch();

  // Test health endpoint
  await testHealthEndpoint();
  
  // Get auth token by logging in
  const authToken = await testLogin();
  
  // Test analyze endpoint with auth token
  await testAnalyzeEndpoint(authToken);

  console.log('\n====================================');
  console.log('           Tests Complete           ');
  console.log('====================================');
}

// Execute tests
runTests().catch(console.error);