/**
 * Frontend API Proxy Test
 * 
 * This script tests the API proxy configuration by making a direct request to the frontend server
 * and checking if it correctly proxies to the backend.
 */

import fetch from 'node-fetch';

async function testApiProxy() {
  console.log('='.repeat(50));
  console.log('TESTING FRONTEND API PROXY');
  console.log('='.repeat(50));
  console.log();

  const FRONTEND_URL = 'http://localhost:8000';
  
  // Test login endpoint
  try {
    console.log('🔷 Testing login endpoint');
    const loginPayload = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    // Log the full URL we're sending to
    console.log(`📤 Sending POST to ${FRONTEND_URL}/api/login`);
    console.log(`📤 Request payload:`, JSON.stringify(loginPayload));
    
    const response = await fetch(`${FRONTEND_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginPayload)
    });
    
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    console.log('📥 Response headers:', response.headers.raw());
    
    const data = await response.text();
    console.log('📥 Response body:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ Successfully parsed JSON response');
      if (jsonData.token) {
        console.log('✅ Login successful, received auth token');
      } else {
        console.log('❌ No auth token in response');
      }
    } catch (e) {
      console.log('❌ Failed to parse response as JSON:', e.message);
    }
  } catch (error) {
    console.error('❌ Error testing login endpoint:', error);
  }
  
  // Test health endpoint
  try {
    console.log('\n🔷 Testing health endpoint');
    console.log(`📤 Sending GET to ${FRONTEND_URL}/api/health`);
    const response = await fetch(`${FRONTEND_URL}/api/health`);
    
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    
    const data = await response.text();
    console.log('📥 Response body:', data);
    
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ Successfully parsed JSON response');
      if (jsonData.status === 'ok') {
        console.log('✅ Health check successful');
      } else {
        console.log('❌ Health check failed');
      }
    } catch (e) {
      console.log('❌ Failed to parse response as JSON:', e.message);
    }
  } catch (error) {
    console.error('❌ Error testing health endpoint:', error);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('TEST COMPLETE');
  console.log('='.repeat(50));
}

// Run the test
testApiProxy().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});