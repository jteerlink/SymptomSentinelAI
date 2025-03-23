/**
 * Comprehensive Test Runner for SymptomSentryAI
 * 
 * This script runs all tests for the application:
 * 1. Backend API tests using Jest
 * 2. ML model tests using Python
 * 3. Frontend integration tests
 * 
 * Usage: node run-all-tests.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  // Test suite files
  backendTests: [
    './backend/tests/comprehensive-test-suite.js',
    './backend/tests/imageAnalysis.test.js',
    './backend/tests/imageUpload.test.js',
  ],
  mlTests: [
    './backend/ml/run_tests.py',
    './backend/ml/tests/test_medical_image_analyzer.py'
  ],
  frontendTests: [
    './frontend/tests/frontend-test-suite.js'
  ],
  
  // Ensure these directories exist
  createDirs: [
    './backend/tests/test-data',
    './frontend/tests/test-data',
    './backend/ml/tests/test_images'
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logHeader(message) {
  console.log('\n');
  log('='.repeat(80), colors.bright + colors.blue);
  log(message, colors.bright + colors.blue);
  log('='.repeat(80), colors.bright + colors.blue);
}

function executeCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    log(`Running: ${command}`, colors.yellow);
    
    const child = exec(command, {
      cwd: process.cwd(),
      ...options
    });
    
    let output = '';
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
      output += data;
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
      output += data;
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output });
      } else {
        resolve({ success: false, output, code });
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Ensure all necessary directories exist
function ensureDirectories() {
  config.createDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      log(`Creating directory: ${dir}`, colors.yellow);
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

// Run Jest tests for backend
async function runBackendTests() {
  logHeader('Running Backend Tests');
  
  let allPassed = true;
  
  for (const testFile of config.backendTests) {
    log(`\nRunning test file: ${testFile}`, colors.cyan);
    
    try {
      const result = await executeCommand(`npx jest ${testFile}`);
      
      if (!result.success) {
        allPassed = false;
        log(`Test failed: ${testFile}`, colors.red);
      }
    } catch (error) {
      allPassed = false;
      log(`Error running test: ${error.message}`, colors.red);
    }
  }
  
  return allPassed;
}

// Run Python tests for ML models
async function runMLTests() {
  logHeader('Running ML Model Tests');
  
  let allPassed = true;
  
  for (const testFile of config.mlTests) {
    log(`\nRunning test file: ${testFile}`, colors.cyan);
    
    try {
      let command;
      
      if (testFile.endsWith('.py')) {
        if (testFile.includes('test_medical_image_analyzer.py')) {
          command = `cd backend && python -m pytest ${path.relative('./backend', testFile)} -v`;
        } else {
          command = `python ${testFile}`;
        }
      } else {
        command = `python ${testFile}`;
      }
      
      const result = await executeCommand(command);
      
      if (!result.success) {
        allPassed = false;
        log(`Test failed: ${testFile}`, colors.red);
      }
    } catch (error) {
      allPassed = false;
      log(`Error running test: ${error.message}`, colors.red);
    }
  }
  
  return allPassed;
}

// Run frontend tests
async function runFrontendTests() {
  logHeader('Running Frontend Tests');
  
  let allPassed = true;
  
  for (const testFile of config.frontendTests) {
    log(`\nRunning test file: ${testFile}`, colors.cyan);
    
    try {
      const result = await executeCommand(`node ${testFile}`);
      
      if (!result.success) {
        allPassed = false;
        log(`Test failed: ${testFile}`, colors.red);
      }
    } catch (error) {
      allPassed = false;
      log(`Error running test: ${error.message}`, colors.red);
    }
  }
  
  return allPassed;
}

// Main function to run all tests
async function runAllTests() {
  log('Starting SymptomSentryAI Test Suite', colors.bright + colors.green);
  
  // Ensure all directories exist
  ensureDirectories();
  
  // Run tests
  const backendResult = await runBackendTests();
  const mlResult = await runMLTests();
  const frontendResult = await runFrontendTests();
  
  // Show summary
  logHeader('Test Results Summary');
  
  log(`Backend Tests: ${backendResult ? '✅ PASSED' : '❌ FAILED'}`, 
      backendResult ? colors.green : colors.red);
  
  log(`ML Model Tests: ${mlResult ? '✅ PASSED' : '❌ FAILED'}`, 
      mlResult ? colors.green : colors.red);
  
  log(`Frontend Tests: ${frontendResult ? '✅ PASSED' : '❌ FAILED'}`, 
      frontendResult ? colors.green : colors.red);
  
  const allPassed = backendResult && mlResult && frontendResult;
  
  log(`\nOverall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`, 
      allPassed ? colors.bright + colors.green : colors.bright + colors.red);
  
  return allPassed;
}

// Execute test suite if run directly
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      log(`Error running tests: ${error.message}`, colors.red);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  runBackendTests,
  runMLTests,
  runFrontendTests
};