/**
 * Test Enhanced Model Bridge
 * 
 * This script tests the enhanced model bridge by:
 * 1. Retrieving the model registry
 * 2. Getting available models for throat and ear analysis
 * 3. Running sample analyses with attention maps
 */
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const enhancedModelBridge = require('./utils/enhancedModelBridge');

// ANSI color codes for prettier output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Helper for logging
function logStep(message) {
    console.log(`\n${colors.bright}${colors.blue}==>${colors.reset} ${message}`);
}

function logSuccess(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
}

function logWarning(message) {
    console.log(`${colors.yellow}!${colors.reset} ${message}`);
}

function logError(message) {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
}

// Test getting model registry
async function testGetModelRegistry() {
    logStep("Testing getModelRegistry()");
    try {
        const registry = await enhancedModelBridge.getModelRegistry();
        console.log("Model Registry:", JSON.stringify(registry, null, 2));
        
        if (registry && (registry.throat || registry.ear)) {
            logSuccess("Successfully retrieved model registry");
            return true;
        } else {
            logWarning("Registry structure is not as expected");
            return false;
        }
    } catch (error) {
        logError(`Error getting model registry: ${error.message}`);
        return false;
    }
}

// Test getting available models
async function testGetAvailableModels() {
    logStep("Testing getAvailableModels() for throat and ear");
    try {
        // Get throat models
        const throatModels = await enhancedModelBridge.getAvailableModels('throat');
        console.log("Throat Models:", JSON.stringify(throatModels, null, 2));
        
        // Get ear models
        const earModels = await enhancedModelBridge.getAvailableModels('ear');
        console.log("Ear Models:", JSON.stringify(earModels, null, 2));
        
        // Check if we got expected data
        if (throatModels.versions && earModels.versions) {
            logSuccess("Successfully retrieved available models");
            return true;
        } else {
            logWarning("Model data structure is not as expected");
            return false;
        }
    } catch (error) {
        logError(`Error getting available models: ${error.message}`);
        return false;
    }
}

// Test analyzing an image with attention
async function testImageAnalysis() {
    logStep("Testing analyzeImage() with test image");
    try {
        // Read actual test images from the test_data directory
        const throatImagePath = path.join(__dirname, 'ml', 'test_data', 'test_throat.jpg');
        const earImagePath = path.join(__dirname, 'ml', 'test_data', 'test_ear.jpg');
        
        let throatImageData, earImageData;
        
        try {
            // Read the throat test image
            throatImageData = fs.readFileSync(throatImagePath);
            console.log(`✅ Loaded throat test image: ${throatImagePath} (${throatImageData.length} bytes)`);
        } catch (err) {
            console.log(`❌ Could not load throat test image: ${err.message}`);
            // Fall back to test_image placeholder
            throatImageData = 'test_image';
        }
        
        try {
            // Read the ear test image
            earImageData = fs.readFileSync(earImagePath);
            console.log(`✅ Loaded ear test image: ${earImagePath} (${earImageData.length} bytes)`);
        } catch (err) {
            console.log(`❌ Could not load ear test image: ${err.message}`);
            // Fall back to test_image placeholder
            earImageData = 'test_image';
        }
        
        // Use throat test image with default version
        const throatResults = await enhancedModelBridge.analyzeImage(
            throatImageData, 
            'throat',
            { returnAttention: true, version: 'v1' }
        );
        console.log("Throat Analysis Results:", JSON.stringify(throatResults, null, 2));
        
        // Use ear test image with default version
        const earResults = await enhancedModelBridge.analyzeImage(
            earImageData, 
            'ear',
            { returnAttention: true, version: 'v1' }
        );
        console.log("Ear Analysis Results:", JSON.stringify(earResults, null, 2));
        
        // Check if we got expected results
        if (Array.isArray(throatResults) && Array.isArray(earResults)) {
            logSuccess("Successfully analyzed test images");
            return true;
        } else {
            logWarning("Analysis results structure is not as expected");
            return false;
        }
    } catch (error) {
        logError(`Error analyzing images: ${error.message}`);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log(`${colors.bright}${colors.magenta}==============================================`);
    console.log(`    Enhanced Model Bridge Test`);
    console.log(`==============================================${colors.reset}\n`);
    
    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Run tests
    let success = true;
    
    success = await testGetModelRegistry() && success;
    success = await testGetAvailableModels() && success;
    success = await testImageAnalysis() && success;
    
    // Print summary
    console.log(`\n${colors.bright}${colors.magenta}==============================================`);
    if (success) {
        console.log(`${colors.green}All tests passed!${colors.reset}`);
    } else {
        console.log(`${colors.yellow}Some tests had warnings or errors.${colors.reset}`);
    }
    console.log(`${colors.bright}${colors.magenta}==============================================${colors.reset}\n`);
    
    return success;
}

// Start the test
runTests().catch(error => {
    console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
    process.exit(1);
});