/**
 * Test User Registration Script
 * 
 * This script tests the user registration functionality by making direct API calls
 * to the registration endpoint and checking the responses.
 */

// Using built-in fetch API (available in Node.js v18+)

const BASE_URL = 'http://localhost:5000/api';

async function makeRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { 
      status: response.status, 
      data,
      success: response.ok
    };
  } catch (error) {
    console.error(`Error making request to ${endpoint}:`, error);
    return { success: false, error: error.message };
  }
}

async function testRegistration() {
  console.log('🧪 Testing user registration...');
  
  // Generate a unique email to avoid conflicts
  const timestamp = Date.now();
  const testUser = {
    email: `test-user-${timestamp}@example.com`,
    password: 'Test123!@#',
    name: 'Test User'
  };
  
  console.log(`📧 Using test email: ${testUser.email}`);
  
  try {
    // Step 1: Register the new user
    console.log('👤 Attempting to register new user...');
    const registerResult = await makeRequest('/register', 'POST', testUser);
    
    console.log('📋 Registration Response:', JSON.stringify(registerResult, null, 2));
    
    if (registerResult.success) {
      console.log('✅ Registration successful!');
      console.log('🔑 Auth token received:', !!registerResult.data.token);
      console.log('👤 User ID:', registerResult.data.user.id);
      console.log('📧 Email:', registerResult.data.user.email);
      console.log('🏷️ Subscription type:', registerResult.data.user.subscription);
      
      // Step 2: Try to login with the new credentials
      console.log('\n🔐 Testing login with new credentials...');
      const loginResult = await makeRequest('/login', 'POST', {
        email: testUser.email,
        password: testUser.password
      });
      
      console.log('📋 Login Response:', JSON.stringify(loginResult, null, 2));
      
      if (loginResult.success) {
        console.log('✅ Login successful!');
        console.log('🔑 Auth token received:', !!loginResult.data.token);
      } else {
        console.error('❌ Login failed even though registration was successful');
      }
    } else {
      console.error('❌ Registration failed:', registerResult.data.message || registerResult.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testRegistration().then(() => {
  console.log('\n🏁 Test completed');
}).catch(err => {
  console.error('❌ Uncaught error during test:', err);
});