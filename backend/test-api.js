/**
 * Simple test script to verify the backend API functionality.
 * Run with: node test-api.js
 */

// Import fetch for making HTTP requests
const fetch = require('node-fetch');

// Base URL of the backend API (local server)
const API_BASE_URL = 'http://localhost:5000/api';

// Test analyze endpoint with a simple image
async function testAnalyzeEndpoint() {
  console.log('\n----- Testing /api/analyze endpoint -----');
  try {
    // Create sample request to analyze a throat image
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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

  // Test health endpoint
  await testHealthEndpoint();

  // Test analyze endpoint
  await testAnalyzeEndpoint();

  console.log('\n====================================');
  console.log('           Tests Complete           ');
  console.log('====================================');
}

// Execute tests
runTests().catch(console.error);