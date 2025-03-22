/**
 * Image Analysis API Test
 * 
 * This script tests the image analysis functionality by sending the test image
 * through the frontend proxy to the backend analysis service.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import FormData from 'form-data';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Main test function
async function testImageAnalysis() {
  console.log();
  console.log('='.repeat(50));
  console.log('TESTING IMAGE ANALYSIS API');
  console.log('='.repeat(50));
  console.log();

  const FRONTEND_URL = 'http://localhost:8000';
  const testImagePath = path.join(__dirname, '..', 'attached_assets', 'IMG_3404.jpeg');

  // First, let's verify the image exists
  try {
    fs.accessSync(testImagePath);
    console.log(`✅ Test image found at: ${testImagePath}`);
    
    const stats = fs.statSync(testImagePath);
    console.log(`📊 Image size: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error(`❌ Test image not found: ${error.message}`);
    process.exit(1);
  }

  // Get a login token for authenticated requests
  let authToken;
  try {
    console.log('\n🔷 Getting authentication token');
    const loginResponse = await fetch(`${FRONTEND_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    const loginData = await loginResponse.json();
    
    if (loginResponse.ok && loginData.token) {
      authToken = loginData.token;
      console.log('✅ Successfully obtained authentication token');
    } else {
      console.error('❌ Failed to obtain authentication token:', loginData.message || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error during authentication:', error.message);
  }

  // Test image analysis with throat type
  try {
    console.log('\n🔷 Testing throat image analysis');
    
    // Create FormData for multipart file upload
    const formData = new FormData();
    formData.append('type', 'throat');
    formData.append('image', fs.createReadStream(testImagePath));
    
    console.log('📤 Sending image to analysis endpoint...');
    
    const response = await fetch(`${FRONTEND_URL}/api/analyze`, {
      method: 'POST',
      headers: authToken ? { 
        'Authorization': `Bearer ${authToken}`
      } : {},
      body: formData
    });
    
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    
    const contentType = response.headers.get('content-type');
    console.log(`📥 Response content-type: ${contentType}`);
    
    if (contentType && contentType.includes('application/json')) {
      const jsonData = await response.json();
      console.log('📥 Analysis results:', JSON.stringify(jsonData, null, 2));
      
      if (response.ok) {
        console.log('✅ Image analysis successful');
        
        // Display conditions found
        if (jsonData.conditions && jsonData.conditions.length > 0) {
          console.log('\n📋 Detected conditions:');
          jsonData.conditions.forEach((condition, index) => {
            console.log(`   ${index + 1}. ${condition.name}: ${(condition.confidence * 100).toFixed(1)}% confidence`);
          });
        }
      } else {
        console.log(`❌ Image analysis failed: ${jsonData.message || 'Unknown error'}`);
      }
    } else {
      const text = await response.text();
      console.log('📥 Response text:', text.substring(0, 200) + (text.length > 200 ? '...' : ''));
      console.log('❌ Response is not JSON');
    }
  } catch (error) {
    console.error('❌ Error during image analysis:', error.message);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('TEST COMPLETE');
  console.log('='.repeat(50));
}

// Run the test
testImageAnalysis().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});