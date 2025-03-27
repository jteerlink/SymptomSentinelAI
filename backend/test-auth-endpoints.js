/**
 * Test Authentication Endpoints
 * 
 * This script tests all authentication and user-related endpoints to verify
 * they are working correctly and matching the iOS app's expectations.
 */

// Use CommonJS compatible import for node-fetch
const uuid = require('uuid');

// Use dynamic import for node-fetch (ESM module)
let fetch;
import('node-fetch').then(module => {
    fetch = module.default;
    // Start the tests after fetch is available
    runTests();
});

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_EMAIL = `test-user-${uuid.v4().substring(0, 8)}@example.com`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'Test User';

// Store session data
let authToken;
let userId;

// Helper functions
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    console.log(`Making ${method} request to ${url}`);
    
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        console.log(`Response status: ${response.status}`);
        console.log(`Response body:`, data);
        
        return { 
            status: response.status,
            data
        };
    } catch (error) {
        console.error(`Error making request to ${url}:`, error);
        throw error;
    }
}

// Test functions
async function testRegister() {
    console.log('\n===== Testing Register =====');
    
    const response = await makeRequest('/register', 'POST', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: TEST_NAME
    });
    
    if (response.status === 201 && response.data.accessToken) {
        console.log('✅ Register test passed');
        authToken = response.data.accessToken;
        userId = response.data.user.id;
        return true;
    } else {
        console.error('❌ Register test failed');
        return false;
    }
}

async function testLogin() {
    console.log('\n===== Testing Login =====');
    
    const response = await makeRequest('/login', 'POST', {
        email: TEST_EMAIL,
        password: TEST_PASSWORD
    });
    
    if (response.status === 200 && response.data.accessToken) {
        console.log('✅ Login test passed');
        authToken = response.data.accessToken;
        return true;
    } else {
        console.error('❌ Login test failed');
        return false;
    }
}

async function testTokenValidation() {
    console.log('\n===== Testing Token Validation =====');
    
    const response = await makeRequest('/validate-token', 'GET', null, authToken);
    
    if (response.status === 200 && response.data.valid) {
        console.log('✅ Token validation test passed');
        return true;
    } else {
        console.error('❌ Token validation test failed');
        return false;
    }
}

async function testGetUserProfile() {
    console.log('\n===== Testing Get User Profile =====');
    
    const response = await makeRequest('/user-profile', 'GET', null, authToken);
    
    if (response.status === 200 && response.data.user) {
        console.log('✅ Get user profile test passed');
        return true;
    } else {
        console.error('❌ Get user profile test failed');
        return false;
    }
}

async function testUpdateProfile() {
    console.log('\n===== Testing Update Profile =====');
    
    const newName = 'Updated Test User';
    
    const response = await makeRequest('/update-profile', 'PUT', {
        name: newName
    }, authToken);
    
    console.log(`Profile update response: ${JSON.stringify(response, null, 2)}`);
    
    if (response.status === 200 && response.data.user.name === newName) {
        console.log('✅ Update profile test passed');
        return true;
    } else {
        console.error('❌ Update profile test failed');
        return false;
    }
}

async function testUpdatePassword() {
    console.log('\n===== Testing Update Password =====');
    
    const newPassword = 'NewTestPass456!';
    
    const response = await makeRequest('/update-password', 'PUT', {
        currentPassword: TEST_PASSWORD,
        newPassword: newPassword
    }, authToken);
    
    if (response.status === 200) {
        console.log('✅ Update password test passed');
        
        // Verify new password works with login
        const loginResponse = await makeRequest('/login', 'POST', {
            email: TEST_EMAIL,
            password: newPassword
        });
        
        if (loginResponse.status === 200 && loginResponse.data.accessToken) {
            console.log('✅ Login with new password passed');
            authToken = loginResponse.data.accessToken;
            return true;
        } else {
            console.error('❌ Login with new password failed');
            return false;
        }
    } else {
        console.error('❌ Update password test failed');
        return false;
    }
}

async function testUpdateSubscription() {
    console.log('\n===== Testing Update Subscription =====');
    
    const response = await makeRequest('/update-subscription', 'POST', {
        subscription_level: 'premium',
        payment_token: 'test-payment-token'
    }, authToken);
    
    if (response.status === 200 && response.data.user.subscription === 'premium') {
        console.log('✅ Update subscription test passed');
        return true;
    } else {
        console.error('❌ Update subscription test failed');
        return false;
    }
}

// Run all tests
async function runTests() {
    try {
        console.log('🚀 Starting authentication endpoint tests...');
        
        // First, register a new user
        if (!await testRegister()) {
            throw new Error('Registration failed, cannot continue tests');
        }
        
        // Test other endpoints
        await testLogin();
        await testTokenValidation();
        await testGetUserProfile();
        await testUpdateProfile();
        await testUpdatePassword();
        await testUpdateSubscription();
        
        console.log('\n✅ All authentication endpoint tests completed successfully');
    } catch (error) {
        console.error('\n❌ Error running tests:', error);
    }
}

// runTests is now called inside the import callback