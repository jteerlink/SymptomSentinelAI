/**
 * Test Script for GET Analysis Endpoint
 * 
 * This script tests the GET /api/analysis/:id endpoint
 * which retrieves details for a specific analysis.
 */

// Using dynamic import for node-fetch (ESM module)
let fetch;
import('node-fetch').then(module => {
    fetch = module.default;
    // Run tests after fetch is loaded
    runTests();
});

const crypto = require('crypto');

// Test configuration
const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
    email: 'test@example.com',
    password: 'Password123' // Default test user password in the mock system
};

// Functions for testing
async function makeRequest(endpoint, method = 'GET', body = null, token = null) {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const options = {
        method,
        headers
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    return fetch(`${BASE_URL}${endpoint}`, options);
}

async function login() {
    console.log('Logging in as test user...');
    
    try {
        const response = await makeRequest('/login', 'POST', TEST_USER);
        
        if (!response.ok) {
            throw new Error(`Login failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Login successful');
        
        return data.token;
    } catch (error) {
        console.error('Login failed:', error);
        return null;
    }
}

async function createTestAnalysis(token) {
    console.log('Creating test analysis...');
    
    // Generate a random analysis ID
    const analysisId = crypto.randomUUID();
    
    // Create a test analysis
    const testAnalysis = {
        id: analysisId,
        type: 'throat',
        conditions: [
            {
                id: 'strep_throat',
                name: 'Strep Throat',
                confidence: 0.78,
                description: 'A bacterial infection that causes inflammation and pain in the throat.',
                symptoms: ['Throat pain', 'Red and swollen tonsils'],
                isPotentiallySerious: true
            }
        ]
    };
    
    try {
        const response = await makeRequest('/save-analysis', 'POST', testAnalysis, token);
        
        if (!response.ok) {
            throw new Error(`Create analysis failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Test analysis created successfully');
        
        return analysisId;
    } catch (error) {
        console.error('Create analysis failed:', error);
        return null;
    }
}

async function testGetAnalysis(analysisId, token) {
    console.log(`Testing GET /api/analysis/${analysisId}...`);
    
    try {
        const response = await makeRequest(`/analysis/${analysisId}`, 'GET', null, token);
        
        if (!response.ok) {
            throw new Error(`GET analysis failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('GET analysis response:', data);
        
        // Verify the response has the expected structure
        if (!data.analysis) {
            console.error('ERROR: Response is missing analysis object');
            return false;
        }
        
        if (data.analysis.id !== analysisId) {
            console.error(`ERROR: Expected analysis ID ${analysisId}, got ${data.analysis.id}`);
            return false;
        }
        
        console.log('GET analysis test PASSED ✅');
        return true;
    } catch (error) {
        console.error('GET analysis test FAILED ❌:', error);
        return false;
    }
}

async function testGetNonexistentAnalysis(token) {
    const fakeId = crypto.randomUUID();
    console.log(`Testing GET /api/analysis/${fakeId} (nonexistent ID)...`);
    
    try {
        const response = await makeRequest(`/analysis/${fakeId}`, 'GET', null, token);
        
        // Should get a 404 Not Found
        if (response.status === 404) {
            console.log('GET nonexistent analysis test PASSED ✅ (404 response)');
            return true;
        } else {
            console.error(`ERROR: Expected status 404, got ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('GET nonexistent analysis test FAILED ❌:', error);
        return false;
    }
}

async function testUnauthenticatedAccess(analysisId) {
    console.log(`Testing GET /api/analysis/${analysisId} without authentication...`);
    
    try {
        const response = await makeRequest(`/analysis/${analysisId}`, 'GET');
        
        // Should get a 401 Unauthorized
        if (response.status === 401) {
            console.log('Unauthenticated access test PASSED ✅ (401 response)');
            return true;
        } else {
            console.error(`ERROR: Expected status 401, got ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('Unauthenticated access test FAILED ❌:', error);
        return false;
    }
}

async function cleanUp(analysisId, token) {
    console.log('Cleaning up...');
    
    try {
        const response = await makeRequest(`/analysis/${analysisId}`, 'DELETE', null, token);
        
        if (response.ok) {
            console.log('Test analysis deleted successfully');
        } else {
            console.error(`Delete analysis failed with status: ${response.status}`);
        }
    } catch (error) {
        console.error('Delete analysis failed:', error);
    }
}

async function runTests() {
    // Login
    const token = await login();
    if (!token) {
        console.error('Cannot run tests without authentication');
        return;
    }
    
    // Create a test analysis
    const analysisId = await createTestAnalysis(token);
    if (!analysisId) {
        console.error('Cannot run tests without a test analysis');
        return;
    }
    
    // Run the tests
    let passed = 0;
    let failed = 0;
    
    // Test getting a specific analysis
    if (await testGetAnalysis(analysisId, token)) {
        passed++;
    } else {
        failed++;
    }
    
    // Test getting a nonexistent analysis
    if (await testGetNonexistentAnalysis(token)) {
        passed++;
    } else {
        failed++;
    }
    
    // Test unauthenticated access
    if (await testUnauthenticatedAccess(analysisId)) {
        passed++;
    } else {
        failed++;
    }
    
    // Print test results
    console.log('\nTest Results:');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);
    
    // Clean up
    await cleanUp(analysisId, token);
}

// Main function is called after fetch is loaded in the dynamic import at the top
console.log('Starting GET Analysis Endpoint Tests...');