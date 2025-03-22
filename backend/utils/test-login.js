/**
 * Login Test Utility
 * 
 * This script tests the login functionality with the test user we created.
 */

// Use native fetch in Node.js (available since Node.js 18)
const { User } = require('../db/models');

// Test user email and password
const testUser = {
    email: 'test-user@example.com',
    password: 'newpassword123'
};

async function registerTestUser() {
    try {
        // Check if user already exists
        const existingUser = await User.findByEmail(testUser.email);
        if (!existingUser) {
            console.log('Creating test user first...');
            await User.create(testUser);
            console.log('Test user created');
        } else {
            console.log('Using existing test user');
        }
    } catch (error) {
        console.error('Error setting up test user:', error);
        process.exit(1);
    }
}

async function testLogin() {
    try {
        console.log('Testing login with user:', testUser.email);
        
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });
        
        const responseBody = await response.json();
        
        console.log('Login response status:', response.status);
        console.log('Login response body:', JSON.stringify(responseBody, null, 2));
        
        if (response.ok) {
            console.log('✅ Login successful');
        } else {
            console.log('❌ Login failed');
        }
    } catch (error) {
        console.error('Error testing login:', error);
    }
}

async function testInvalidLogin() {
    try {
        console.log('\nTesting login with invalid credentials');
        
        const response = await fetch('http://localhost:5000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: testUser.email,
                password: 'wrongpassword'
            })
        });
        
        const responseBody = await response.json();
        
        console.log('Invalid login response status:', response.status);
        console.log('Invalid login response body:', JSON.stringify(responseBody, null, 2));
        
        if (response.status === 401) {
            console.log('✅ Invalid login correctly rejected');
        } else {
            console.log('❌ Invalid login test failed');
        }
    } catch (error) {
        console.error('Error testing invalid login:', error);
    }
}

async function runTests() {
    console.log('='.repeat(50));
    console.log('LOGIN TEST UTILITY');
    console.log('='.repeat(50));
    
    // Ensure test user exists
    await registerTestUser();
    
    // Test valid login
    await testLogin();
    
    // Test invalid login
    await testInvalidLogin();
    
    console.log('\nTests completed');
    process.exit(0);
}

runTests();