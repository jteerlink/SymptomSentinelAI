/**
 * Test Setup Script
 * 
 * This script prepares the testing environment by:
 * 1. Creating necessary test directories
 * 2. Generating test data files (images, etc.)
 * 3. Setting up mock database data
 * 
 * Run this script before running tests: node setup-tests.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  testDirs: [
    path.join(__dirname, 'test-data'),
    path.join(__dirname, '..', 'ml', 'tests', 'test_images'),
    path.join(__dirname, '..', '..', 'frontend', 'tests', 'test-data')
  ],
  testImages: {
    throat: {
      path: path.join(__dirname, 'test-data', 'test-throat-image.jpg'),
      size: 100 * 1024 // 100KB
    },
    ear: {
      path: path.join(__dirname, 'test-data', 'test-ear-image.jpg'),
      size: 100 * 1024 // 100KB
    },
    large: {
      path: path.join(__dirname, 'test-data', 'large-test-image.jpg'),
      size: 6 * 1024 * 1024 // 6MB (exceeds 5MB limit)
    }
  },
  testFiles: {
    nonImage: {
      path: path.join(__dirname, 'test-data', 'not-an-image.txt'),
      content: 'This is not an image file and should be rejected by the image validation.'
    }
  }
};

// Create necessary directories
function createDirectories() {
  console.log('Creating test directories...');
  
  config.testDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`  Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    } else {
      console.log(`  Directory already exists: ${dir}`);
    }
  });
  
  console.log('✅ Directory setup complete');
}

// Generate test image data
function createTestImages() {
  console.log('Creating test images...');
  
  // Throat test image (red-tinted)
  if (!fs.existsSync(config.testImages.throat.path)) {
    console.log(`  Creating throat test image: ${config.testImages.throat.path}`);
    
    const buffer = Buffer.alloc(config.testImages.throat.size, 0);
    
    // Add JPEG header
    buffer[0] = 0xFF; buffer[1] = 0xD8; buffer[2] = 0xFF; buffer[3] = 0xE0;
    
    // Add some reddish color data (very simplified)
    for (let i = 20; i < 1000 && i < buffer.length; i += 3) {
      buffer[i] = 0xFF; // Red
      buffer[i+1] = 0x70; // Green
      buffer[i+2] = 0x70; // Blue
    }
    
    fs.writeFileSync(config.testImages.throat.path, buffer);
  } else {
    console.log(`  Throat test image already exists`);
  }
  
  // Ear test image (yellowish-tinted)
  if (!fs.existsSync(config.testImages.ear.path)) {
    console.log(`  Creating ear test image: ${config.testImages.ear.path}`);
    
    const buffer = Buffer.alloc(config.testImages.ear.size, 0);
    
    // Add JPEG header
    buffer[0] = 0xFF; buffer[1] = 0xD8; buffer[2] = 0xFF; buffer[3] = 0xE0;
    
    // Add some yellowish color data (very simplified)
    for (let i = 20; i < 1000 && i < buffer.length; i += 3) {
      buffer[i] = 0xE0; // Red
      buffer[i+1] = 0xD0; // Green
      buffer[i+2] = 0x80; // Blue
    }
    
    fs.writeFileSync(config.testImages.ear.path, buffer);
  } else {
    console.log(`  Ear test image already exists`);
  }
  
  // Large test image
  if (!fs.existsSync(config.testImages.large.path)) {
    console.log(`  Creating large test image: ${config.testImages.large.path}`);
    
    const buffer = Buffer.alloc(config.testImages.large.size, 0);
    
    // Add JPEG header
    buffer[0] = 0xFF; buffer[1] = 0xD8; buffer[2] = 0xFF; buffer[3] = 0xE0;
    
    fs.writeFileSync(config.testImages.large.path, buffer);
  } else {
    console.log(`  Large test image already exists`);
  }
  
  console.log('✅ Test image creation complete');
}

// Create test non-image files
function createTestFiles() {
  console.log('Creating test files...');
  
  if (!fs.existsSync(config.testFiles.nonImage.path)) {
    console.log(`  Creating non-image test file: ${config.testFiles.nonImage.path}`);
    fs.writeFileSync(config.testFiles.nonImage.path, config.testFiles.nonImage.content);
  } else {
    console.log(`  Non-image test file already exists`);
  }
  
  console.log('✅ Test file creation complete');
}

// Copy test images to other test directories
function copyTestImagesToDirectories() {
  console.log('Copying test images to other test directories...');
  
  const sourceThroatImage = config.testImages.throat.path;
  const sourceEarImage = config.testImages.ear.path;
  
  // Copy to ML test directory
  const mlThroatPath = path.join(__dirname, '..', 'ml', 'tests', 'test_images', 'test-throat.jpg');
  const mlEarPath = path.join(__dirname, '..', 'ml', 'tests', 'test_images', 'test-ear.jpg');
  
  if (!fs.existsSync(mlThroatPath)) {
    console.log(`  Copying throat image to ML tests: ${mlThroatPath}`);
    fs.copyFileSync(sourceThroatImage, mlThroatPath);
  }
  
  if (!fs.existsSync(mlEarPath)) {
    console.log(`  Copying ear image to ML tests: ${mlEarPath}`);
    fs.copyFileSync(sourceEarImage, mlEarPath);
  }
  
  // Copy to frontend test directory
  const frontendThroatPath = path.join(__dirname, '..', '..', 'frontend', 'tests', 'test-data', 'test-throat.jpg');
  const frontendEarPath = path.join(__dirname, '..', '..', 'frontend', 'tests', 'test-data', 'test-ear.jpg');
  
  if (!fs.existsSync(frontendThroatPath)) {
    console.log(`  Copying throat image to frontend tests: ${frontendThroatPath}`);
    fs.copyFileSync(sourceThroatImage, frontendThroatPath);
  }
  
  if (!fs.existsSync(frontendEarPath)) {
    console.log(`  Copying ear image to frontend tests: ${frontendEarPath}`);
    fs.copyFileSync(sourceEarImage, frontendEarPath);
  }
  
  console.log('✅ Test image copying complete');
}

// Main function
function setupTestEnvironment() {
  console.log('🚀 Setting up test environment...\n');
  
  createDirectories();
  createTestImages();
  createTestFiles();
  copyTestImagesToDirectories();
  
  console.log('\n✅ Test environment setup complete!');
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupTestEnvironment();
}

module.exports = {
  setupTestEnvironment,
  config
};