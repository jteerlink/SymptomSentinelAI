/**
 * This script creates test images for the test suite.
 * It generates minimal valid images for testing the API endpoints.
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Create test directory if it doesn't exist
const testDataDir = path.join(__dirname);
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Create a simple test image for throat
function createThroatTestImage() {
  const canvas = createCanvas(224, 224);
  const ctx = canvas.getContext('2d');
  
  // Fill with red/pink color (throat-like)
  ctx.fillStyle = '#ff9999';
  ctx.fillRect(0, 0, 224, 224);
  
  // Add some darker areas to simulate throat features
  ctx.fillStyle = '#cc6666';
  ctx.beginPath();
  ctx.arc(112, 112, 50, 0, Math.PI * 2);
  ctx.fill();
  
  // Add some white spots to simulate tonsils
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(82, 112, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(142, 112, 15, 0, Math.PI * 2);
  ctx.fill();
  
  // Save the image
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(path.join(testDataDir, 'test-throat-image.jpg'), buffer);
  console.log('Created test throat image');
}

// Create a simple test image for ear
function createEarTestImage() {
  const canvas = createCanvas(224, 224);
  const ctx = canvas.getContext('2d');
  
  // Fill with skin-like color
  ctx.fillStyle = '#f5d5c5';
  ctx.fillRect(0, 0, 224, 224);
  
  // Add circular ear canal
  ctx.fillStyle = '#994d00';
  ctx.beginPath();
  ctx.arc(112, 112, 60, 0, Math.PI * 2);
  ctx.fill();
  
  // Add darker inner ear canal
  ctx.fillStyle = '#552200';
  ctx.beginPath();
  ctx.arc(112, 112, 30, 0, Math.PI * 2);
  ctx.fill();
  
  // Save the image
  const buffer = canvas.toBuffer('image/jpeg');
  fs.writeFileSync(path.join(testDataDir, 'test-ear-image.jpg'), buffer);
  console.log('Created test ear image');
}

// Create a large test image (>5MB) for testing file size limits
function createLargeTestImage() {
  // Create a large canvas (4000x4000 should be over 5MB when saved as JPEG)
  const canvas = createCanvas(4000, 4000);
  const ctx = canvas.getContext('2d');
  
  // Fill with gradient to ensure file doesn't compress too well
  const gradient = ctx.createLinearGradient(0, 0, 4000, 4000);
  for (let i = 0; i < 10; i++) {
    gradient.addColorStop(i / 10, `hsl(${i * 36}, 100%, 50%)`);
  }
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4000, 4000);
  
  // Add some random circles to increase complexity and file size
  for (let i = 0; i < 100; i++) {
    ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 50%)`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * 4000,
      Math.random() * 4000,
      Math.random() * 200 + 50,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  
  // Save the image
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });
  fs.writeFileSync(path.join(testDataDir, 'large-test-image.jpg'), buffer);
  console.log('Created large test image');
}

// Create a non-image file for testing file type validation
function createNonImageFile() {
  const textContent = 'This is not an image file. This should be rejected by the API.';
  fs.writeFileSync(path.join(testDataDir, 'not-an-image.txt'), textContent);
  console.log('Created non-image test file');
}

// Create all test files
try {
  createThroatTestImage();
  createEarTestImage();
  createLargeTestImage();
  createNonImageFile();
  console.log('All test files created successfully');
} catch (error) {
  console.error('Error creating test files:', error);
}