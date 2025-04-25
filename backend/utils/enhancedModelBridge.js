/**
 * Enhanced Model Bridge
 * 
 * This module connects the Node.js backend to the enhanced Python ML system.
 * It provides access to the new capabilities such as model swapping, ensemble models,
 * and attention visualization.
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// We'll use the original modelLoader for some utility functions
const { getConditions } = require('./modelLoader');

// Cache for model registry
let modelRegistry = null;

/**
 * Run a Python script with arguments and return the result
 * 
 * @param {string} scriptName - Name of the Python script in the ml directory
 * @param {Array} args - Arguments to pass to the script
 * @returns {Promise<Object>} - Result from the Python script
 */
async function runPythonScript(scriptName, args = []) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(__dirname, '..', 'ml', scriptName);
        
        // Check if the script exists
        if (!fs.existsSync(scriptPath)) {
            return reject(new Error(`Python script not found: ${scriptPath}`));
        }
        
        if (process.env.NODE_ENV !== 'test') {
            console.log(`🐍 Running Python script: ${scriptPath}`);
            console.log(`🐍 Arguments: ${args.join(', ')}`);
        }
        
        // Use Python 3 explicitly
        const pythonProcess = spawn('python3', [scriptPath, ...args]);
        
        let result = '';
        let errorOutput = '';
        
        // Collect stdout
        pythonProcess.stdout.on('data', (data) => {
            result += data.toString();
        });
        
        // Collect stderr
        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            // Only log in non-test environments
            if (process.env.NODE_ENV !== 'test') {
                console.error(`🐍 Python stderr: ${data.toString()}`);
            }
        });
        
        // Handle process completion
        pythonProcess.on('close', (code) => {
            if (code !== 0) {
                if (process.env.NODE_ENV !== 'test') {
                    console.error(`🐍 Python script exited with code ${code}`);
                    console.error(`🐍 Error output: ${errorOutput}`);
                }
                return reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
            }
            
            try {
                // Clean up the output - find and extract JSON data
                // Sometimes Python scripts output log messages before the actual JSON
                const jsonMatch = result.match(/{[\s\S]*}/);
                if (jsonMatch) {
                    // Try to parse the JSON part
                    const jsonResult = JSON.parse(jsonMatch[0]);
                    if (process.env.NODE_ENV !== 'test') {
                        console.log(`🐍 Python script completed successfully`);
                    }
                    resolve(jsonResult);
                } else {
                    // No JSON found in the output
                    if (process.env.NODE_ENV !== 'test') {
                        console.log(`🐍 Python output does not contain valid JSON`);
                    }
                    resolve({ rawOutput: result });
                }
            } catch (err) {
                if (process.env.NODE_ENV !== 'test') {
                    console.log(`🐍 Python output is not JSON, returning raw output`);
                }
                // If not JSON, return the raw output
                resolve({ rawOutput: result });
            }
        });
        
        // Handle process error
        pythonProcess.on('error', (error) => {
            if (process.env.NODE_ENV !== 'test') {
                console.error(`🐍 Python process error: ${error.message}`);
            }
            reject(error);
        });
    });
}

/**
 * Save image data to a temporary file
 * 
 * @param {string|Buffer} imageData - Image data as string or buffer
 * @returns {Promise<string>} - Path to the temporary file
 */
async function saveTempImage(imageData) {
    return new Promise((resolve, reject) => {
        try {
            // Create a temporary directory if it doesn't exist
            const tempDir = path.join(__dirname, '..', 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            // Create a unique filename
            const tempFilePath = path.join(tempDir, `${uuidv4()}.jpg`);
            
            // Handle base64 image data
            if (typeof imageData === 'string' && imageData.startsWith('data:image')) {
                // Extract the base64 part
                const base64Data = imageData.split(',')[1];
                fs.writeFileSync(tempFilePath, Buffer.from(base64Data, 'base64'));
            } 
            // Handle raw base64 string
            else if (typeof imageData === 'string' && 
                    (imageData.startsWith('/9j/') || // JPEG
                     imageData.startsWith('iVBOR') || // PNG
                     imageData.match(/^[A-Za-z0-9+/=]+$/))) { // Generic base64
                fs.writeFileSync(tempFilePath, Buffer.from(imageData, 'base64'));
            }
            // Handle buffer
            else if (Buffer.isBuffer(imageData)) {
                fs.writeFileSync(tempFilePath, imageData);
            }
            // Handle test image
            else if (imageData === 'test_image') {
                // Create a test image with a colored rectangle
                const testImagePath = path.join(__dirname, '..', 'ml', 'test_image.jpg');
                if (fs.existsSync(testImagePath)) {
                    fs.copyFileSync(testImagePath, tempFilePath);
                } else {
                    // Create a simple test file if none exists
                    fs.writeFileSync(tempFilePath, 'TEST_IMAGE');
                }
            }
            else {
                return reject(new Error(`Unsupported image data type: ${typeof imageData}`));
            }
            
            if (process.env.NODE_ENV !== 'test') {
                console.log(`✅ Saved temporary image: ${tempFilePath}`);
            }
            resolve(tempFilePath);
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error(`❌ Error saving temporary image: ${error.message}`);
            }
            reject(error);
        }
    });
}

/**
 * Clean up temporary image file
 * 
 * @param {string} filePath - Path to the temporary file
 */
function cleanupTempFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            // Only log in non-test environments
            if (process.env.NODE_ENV !== 'test') {
                console.log(`🧹 Cleaned up temporary file: ${filePath}`);
            }
        }
    } catch (error) {
        // Only log errors in non-test environments
        if (process.env.NODE_ENV !== 'test') {
            console.error(`❌ Error cleaning up temporary file: ${error.message}`);
        }
    }
}

/**
 * Get available models from the registry
 * 
 * @returns {Promise<Object>} - Model registry data
 */
async function getModelRegistry() {
    if (modelRegistry) {
        return modelRegistry;
    }
    
    try {
        const result = await runPythonScript('get_model_registry.py');
        modelRegistry = result;
        return result;
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error(`❌ Error getting model registry: ${error.message}`);
        }
        // Return a default registry if the Python script fails
        return {
            throat: {
                default_version: 'v1',
                versions: {
                    v1: { architecture: 'resnet50' },
                    v2: { architecture: 'efficientnet' }
                }
            },
            ear: {
                default_version: 'v1',
                versions: {
                    v1: { architecture: 'resnet50' },
                    v2: { architecture: 'densenet' }
                }
            }
        };
    }
}

/**
 * Create a Python bridge script for model registry operations
 * 
 * @returns {Promise<boolean>} - True if successful
 */
async function createPythonBridgeScript() {
    const scriptPath = path.join(__dirname, '..', 'ml', 'get_model_registry.py');
    
    // Don't overwrite if it already exists
    if (fs.existsSync(scriptPath)) {
        return true;
    }
    
    const script = `#!/usr/bin/env python3
"""
Get Model Registry Script

This script retrieves the model registry information for the Node.js bridge.
"""
import os
import sys
import json

# Add parent directory to path for importing
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    # Import the enhanced model loader
    from enhanced_model_loader import ModelRegistry
    
    # Get the registry
    registry = ModelRegistry()
    
    # Output the registry as JSON
    print(json.dumps(registry._registry))
except Exception as e:
    # Handle import error or other errors
    print(json.dumps({
        "error": str(e),
        "throat": {
            "default_version": "v1",
            "versions": {
                "v1": {"architecture": "resnet50"},
                "v2": {"architecture": "efficientnet"}
            }
        },
        "ear": {
            "default_version": "v1",
            "versions": {
                "v1": {"architecture": "resnet50"},
                "v2": {"architecture": "densenet"}
            }
        }
    }))
`;
    
    try {
        fs.writeFileSync(scriptPath, script);
        fs.chmodSync(scriptPath, '755'); // Make executable
        if (process.env.NODE_ENV !== 'test') {
            console.log(`✅ Created Python bridge script: ${scriptPath}`);
        }
        return true;
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error(`❌ Error creating Python bridge script: ${error.message}`);
        }
        return false;
    }
}

/**
 * Create a Python image analysis script
 * 
 * @returns {Promise<boolean>} - True if successful
 */
async function createImageAnalysisScript() {
    const scriptPath = path.join(__dirname, '..', 'ml', 'analyze_image.py');
    
    // Don't overwrite if it already exists
    if (fs.existsSync(scriptPath)) {
        return true;
    }
    
    const script = `#!/usr/bin/env python3
"""
Image Analysis Script

This script analyzes an image using the enhanced image analyzer.
"""
import os
import sys
import json
import argparse

# Add parent directory to path for importing
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Parse arguments
parser = argparse.ArgumentParser(description='Analyze a medical image')
parser.add_argument('image_path', type=str, help='Path to the image file')
parser.add_argument('--type', type=str, default='throat', help='Analysis type (throat or ear)')
parser.add_argument('--version', type=str, help='Model version to use')
parser.add_argument('--return-attention', action='store_true', help='Return attention map')
parser.add_argument('--binary', action='store_true', help='Use binary classification (normal/infected)')
args = parser.parse_args()

try:
    # Read the image file
    with open(args.image_path, 'rb') as f:
        image_data = f.read()
        
    # Choose which analyzer to use based on binary flag
    if args.binary:
        # Import the binary classifier
        from binary_classifier import analyze_image_binary
        
        # Analyze the image with binary classification
        if args.return_attention:
            results, attention_map = analyze_image_binary(
                image_data, 
                args.type, 
                version=args.version if args.version else None,
                return_attention=True
            )
            
            # Save attention map to a file near the original image
            from enhanced_image_analyzer import save_attention_map
            if attention_map is not None:
                attention_path = args.image_path + '.attention.png'
                save_attention_map(attention_map, attention_path)
                
                # Add attention map path to results
                for result in results:
                    result['attention_map'] = attention_path
        else:
            results = analyze_image_binary(
                image_data, 
                args.type, 
                version=args.version if args.version else None
            )
    else:
        # Import the enhanced image analyzer for multiclass classification
        from enhanced_image_analyzer import analyze_image, save_attention_map
        
        # Analyze the image with multiclass classification
        if args.return_attention:
            results, attention_map = analyze_image(
                image_data, 
                args.type, 
                version=args.version if args.version else None,
                return_attention=True
            )
            
            # Save attention map to a file near the original image
            if attention_map is not None:
                attention_path = args.image_path + '.attention.png'
                save_attention_map(attention_map, attention_path)
                
                # Add attention map path to results
                for result in results:
                    result['attention_map'] = attention_path
        else:
            results = analyze_image(
                image_data, 
                args.type, 
                version=args.version if args.version else None
            )
    
    # Output the results as JSON
    print(json.dumps({
        "results": results,
        "model_type": args.type,
        "model_version": args.version if args.version else "default",
        "classification_mode": "binary" if args.binary else "multiclass"
    }))
except Exception as e:
    # In case of error, return default values or error
    from medical_image_analyzer import THROAT_CONDITIONS, EAR_CONDITIONS
    conditions = THROAT_CONDITIONS if args.type == 'throat' else EAR_CONDITIONS
    
    # Output error and fallback results
    print(json.dumps({
        "error": str(e),
        "results": [
            {
                "id": conditions[0]["id"],
                "name": conditions[0]["name"],
                "confidence": 0.75,
                "error_note": "This is a fallback result due to an error"
            }
        ],
        "model_type": args.type,
        "model_version": "error_fallback",
        "classification_mode": "error_fallback"
    }))
`;
    
    try {
        fs.writeFileSync(scriptPath, script);
        fs.chmodSync(scriptPath, '755'); // Make executable
        if (process.env.NODE_ENV !== 'test') {
            console.log(`✅ Created image analysis script: ${scriptPath}`);
        }
        return true;
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error(`❌ Error creating image analysis script: ${error.message}`);
        }
        return false;
    }
}

/**
 * Load the ML model bridge
 * 
 * @returns {Promise<boolean>} - True if bridge is loaded successfully
 */
async function loadBridge() {
    try {
        // Create necessary Python bridge scripts
        await createPythonBridgeScript();
        await createImageAnalysisScript();
        
        // Get model registry to verify bridge works
        const registry = await getModelRegistry();
        // Only log in non-test environments
        if (process.env.NODE_ENV !== 'test') {
            console.log('✅ Enhanced ML model bridge loaded successfully');
        }
        return true;
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error(`❌ Error loading ML model bridge: ${error.message}`);
        }
        return false;
    }
}

/**
 * Analyze an image using the enhanced ML system
 * 
 * @param {string|Buffer} imageData - Image data as string or buffer
 * @param {string} type - Analysis type ('throat' or 'ear')
 * @param {Object} options - Options for analysis
 * @param {string} options.version - Specific model version to use
 * @param {boolean} options.returnAttention - Whether to return attention map
 * @param {boolean} options.useBinaryClassification - Whether to use binary classification (normal/infected)
 * @returns {Promise<Object>} - Analysis results
 */
async function analyzeImage(imageData, type, options = {}) {
    if (process.env.NODE_ENV !== 'test') {
        console.log(`🔍 Analyzing ${type} image with enhanced ML bridge`);
        console.log(`Options: ${JSON.stringify(options)}`);
    }
    
    // Initialize bridge if not done yet
    await loadBridge();
    
    let tempFilePath = null;
    
    try {
        // Save image to temporary file
        tempFilePath = await saveTempImage(imageData);
        
        // Build command arguments
        const args = [tempFilePath, '--type', type];
        
        if (options.version) {
            args.push('--version', options.version);
        }
        
        if (options.returnAttention) {
            args.push('--return-attention');
        }
        
        // Use binary classification if specified
        if (options.useBinaryClassification) {
            args.push('--binary');
        }
        
        // Run the Python analysis script
        const result = await runPythonScript('analyze_image.py', args);
        
        // Clean up the temporary file
        cleanupTempFile(tempFilePath);
        
        // Handle raw output case
        if (result.rawOutput) {
            if (process.env.NODE_ENV !== 'test') {
                console.error(`❌ Python returned non-JSON output: ${result.rawOutput}`);
            }
            
            // Try to extract JSON from raw output
            const jsonMatch = result.rawOutput.match(/{[\s\S]*}/);
            if (jsonMatch) {
                try {
                    const extractedJson = JSON.parse(jsonMatch[0]);
                    if (process.env.NODE_ENV !== 'test') {
                        console.log('✅ Successfully extracted JSON from raw output');
                    }
                    
                    // Continue with the extracted JSON if it has results
                    if (extractedJson.results && Array.isArray(extractedJson.results)) {
                        return extractedJson.results;
                    }
                } catch (e) {
                    if (process.env.NODE_ENV !== 'test') {
                        console.error(`❌ Failed to parse extracted JSON: ${e.message}`);
                    }
                }
            }
            
            throw new Error('Python analysis returned invalid format');
        }
        
        // Handle error case
        if (result.error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error(`❌ Python analysis error: ${result.error}`);
            }
            throw new Error(`Python analysis error: ${result.error}`);
        }
        
        // Ensure results field exists and is an array
        if (!result.results || !Array.isArray(result.results)) {
            if (process.env.NODE_ENV !== 'test') {
                console.error(`❌ Invalid results format:`, result);
            }
            throw new Error('Invalid results format from Python analysis');
        }
        
        // Only log in non-test environments
        if (process.env.NODE_ENV !== 'test') {
            console.log(`✅ Analysis complete with ${result.results.length} conditions`);
        }
        return result.results;
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error(`❌ Error in analyzeImage: ${error.message}`);
        }
        
        // Clean up the temporary file in case of error
        if (tempFilePath) {
            cleanupTempFile(tempFilePath);
        }
        
        // If Python bridge fails, fall back to a safer approach - get conditions from modelLoader
        if (process.env.NODE_ENV !== 'test') {
            console.log(`⚠️ Falling back to error-reporting due to analysis failure`);
        }
        
        // Get the appropriate conditions for this type
        let conditions;
        try {
            conditions = getConditions(type);
        } catch (conditionsError) {
            // If even getting conditions fails, return a minimal error result
            return [{
                id: 'analysis_error',
                name: 'Analysis Error',
                confidence: 0,
                description: 'The analysis system encountered an error. Please try again or contact support.',
                error: error.message,
                isPotentiallySerious: false,
                isError: true
            }];
        }
        
        // Return a result that clearly indicates an error occurred
        return [{
            id: 'analysis_error',
            name: 'Analysis Error',
            confidence: 0,
            description: 'The analysis system encountered an error. Please try again or contact support.',
            error: error.message,
            isPotentiallySerious: false,
            isError: true,
            // Include diagnostic information for troubleshooting
            diagnostic: {
                errorType: error.name,
                errorMessage: error.message,
                analysisType: type,
                options: options
            }
        }];
    }
}

/**
 * Get the list of available models for a given type
 * 
 * @param {string} type - Analysis type ('throat' or 'ear')
 * @returns {Promise<Object>} - List of available models
 */
async function getAvailableModels(type) {
    try {
        const registry = await getModelRegistry();
        
        if (registry[type]) {
            // Handle new registry format (with defaultVersion, versions, details)
            if (registry[type].defaultVersion) {
                return registry[type];
            }
            
            // Handle old registry format (with default_version, versions)
            if (registry[type].default_version) {
                return {
                    defaultVersion: registry[type].default_version,
                    versions: Object.keys(registry[type].versions),
                    details: registry[type].versions
                };
            }
        }
        
        throw new Error(`No models found for type: ${type}`);
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error(`❌ Error getting available models: ${error.message}`);
        }
        return {
            defaultVersion: 'v1',
            versions: ['v1', 'v2'],
            details: {
                v1: { architecture: 'resnet50' },
                v2: { architecture: type === 'throat' ? 'efficientnet' : 'densenet' }
            }
        };
    }
}

// Initialize the bridge when this module is loaded
loadBridge().catch(error => {
    if (process.env.NODE_ENV !== 'test') {
        console.error(`❌ Error initializing ML bridge: ${error.message}`);
    }
});

module.exports = {
    analyzeImage,
    getAvailableModels,
    getModelRegistry,
    getConditions  // Re-export from modelLoader
};