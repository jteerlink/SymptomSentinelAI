/**
 * Simple Test for Analysis Endpoints
 * 
 * This script tests the analysis endpoints using direct HTTP requests
 * with a mocked authentication token.
 */

const http = require('http');

// Mock analysis ID to use for testing
const TEST_ANALYSIS_ID = '123e4567-e89b-12d3-a456-426614174000';

// Function to make a HTTP request
function makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                // Mock authorization token
                'Authorization': 'Bearer mock-token'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data ? JSON.parse(data) : null
                });
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.end();
    });
}

// Test get analysis by ID
async function testGetAnalysis() {
    console.log(`Testing GET /api/analysis/${TEST_ANALYSIS_ID}...`);
    
    try {
        const response = await makeRequest(`/api/analysis/${TEST_ANALYSIS_ID}`);
        console.log('Response status:', response.statusCode);
        console.log('Response body:', JSON.stringify(response.body, null, 2));
        
        if (response.statusCode === 200) {
            console.log('✅ GET analysis test PASSED');
            return true;
        } else {
            console.log('❌ GET analysis test FAILED');
            return false;
        }
    } catch (error) {
        console.error('Error during test:', error);
        return false;
    }
}

// Run the test
async function runTest() {
    try {
        await testGetAnalysis();
    } catch (error) {
        console.error('Test execution error:', error);
    }
}

console.log('Starting test...');
runTest();