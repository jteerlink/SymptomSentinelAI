/**
 * Frontend API Proxy Test
 * 
 * This script tests the API proxy configuration by making a direct request to the frontend server
 * and checking if it correctly proxies to the backend.
 */

// For testing in Node.js
import fetch from 'node-fetch';

// Main test function
async function testApiProxy() {
  console.log();
  console.log('='.repeat(50));
  console.log('TESTING FRONTEND API PROXY');
  console.log('='.repeat(50));
  console.log();

  const FRONTEND_URL = 'http://localhost:8000';
  const BACKEND_URL = 'http://localhost:5000';
  
  // Test backends/apis directly first
  try {
    console.log('🔷 Testing backend directly');
    console.log(`📤 Sending GET to ${BACKEND_URL}/api/health`);
    
    const directResponse = await fetch(`${BACKEND_URL}/api/health`)
      .catch(err => {
        console.error('❌ Direct backend request failed:', err.message);
        return { status: 'error', ok: false };
      });
    
    if (directResponse.ok) {
      console.log(`📥 Direct backend response status: ${directResponse.status}`);
      console.log('✅ Backend is accessible directly');
    } else {
      console.log('❌ Backend is not accessible directly');
    }
  } catch (error) {
    console.error('❌ Error testing backend directly:', error.message);
  }
  
  // Test login endpoint
  try {
    console.log('\n🔷 Testing login endpoint through frontend proxy');
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
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const jsonData = await response.json();
      console.log('📥 Response JSON:', jsonData);
      
      if (jsonData.token) {
        console.log('✅ Login successful, received auth token');
      } else if (jsonData.error) {
        console.log(`❌ Login error: ${jsonData.message || 'Unknown error'}`);
      } else {
        console.log('❓ Unexpected response format');
      }
    } else {
      const text = await response.text();
      console.log('📥 Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      console.log('❌ Response is not JSON');
    }
  } catch (error) {
    console.error('❌ Error testing login endpoint:', error.message);
  }
  
  // Test health endpoint
  try {
    console.log('\n🔷 Testing health endpoint through frontend proxy');
    console.log(`📤 Sending GET to ${FRONTEND_URL}/api/health`);
    
    const response = await fetch(`${FRONTEND_URL}/api/health`);
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    
    if (response.headers.get('content-type')?.includes('application/json')) {
      const jsonData = await response.json();
      console.log('📥 Response JSON:', jsonData);
      
      if (jsonData.status === 'ok') {
        console.log('✅ Health check successful');
      } else {
        console.log('❌ Health check returned unexpected status');
      }
    } else {
      const text = await response.text();
      console.log('📥 Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      console.log('❌ Response is not JSON');
    }
  } catch (error) {
    console.error('❌ Error testing health endpoint:', error.message);
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