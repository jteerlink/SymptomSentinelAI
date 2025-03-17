/**
 * Model Loader Utility
 * 
 * This utility handles loading and caching ML models for image analysis
 */
const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const fs = require('fs');

// Model cache to avoid reloading models
const modelCache = {
    throat: null,
    ear: null
};

// Loading status to prevent concurrent loading attempts
const loadingStatus = {
    throat: false,
    ear: false
};

/**
 * Load a model for the specified type (throat or ear)
 * 
 * @param {string} type - Either 'throat' or 'ear'
 * @returns {Promise<tf.LayersModel>} The loaded TensorFlow.js model
 */
async function loadModel(type) {
    if (!['throat', 'ear'].includes(type)) {
        throw new Error(`Invalid model type: ${type}. Must be 'throat' or 'ear'.`);
    }

    // If model is already loaded, return it from cache
    if (modelCache[type]) {
        console.log(`Using cached ${type} model`);
        return modelCache[type];
    }

    // If model is already being loaded, wait for it
    if (loadingStatus[type]) {
        console.log(`${type} model is already loading, waiting...`);
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (modelCache[type]) {
                    clearInterval(checkInterval);
                    resolve(modelCache[type]);
                }
            }, 100);
        });
    }

    try {
        // Set loading status
        loadingStatus[type] = true;
        console.log(`Loading ${type} model...`);

        // In a real application, we would load from a saved model path
        // For this demo, we'll create a simple mock model
        const model = await createMockModel(type);
        
        // Cache the model
        modelCache[type] = model;
        loadingStatus[type] = false;
        
        console.log(`${type} model loaded successfully`);
        return model;
    } catch (error) {
        loadingStatus[type] = false;
        console.error(`Error loading ${type} model:`, error);
        throw error;
    }
}

/**
 * Create a mock TensorFlow.js model for demonstration purposes
 * 
 * @param {string} type - Model type ('throat' or 'ear')
 * @returns {Promise<tf.LayersModel>} A TensorFlow.js model
 */
async function createMockModel(type) {
    // Create a simple sequential model that would work for image classification
    const model = tf.sequential();
    
    // Add convolutional layers for feature extraction
    model.add(tf.layers.conv2d({
        inputShape: [224, 224, 3], // Standard image size
        filters: 32,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
    }));
    
    model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
    
    model.add(tf.layers.conv2d({
        filters: 64,
        kernelSize: 3,
        activation: 'relu',
        padding: 'same'
    }));
    
    model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
    
    // Flatten the 2D tensor to 1D for the dense layers
    model.add(tf.layers.flatten());
    
    // Add fully connected layers
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }));
    model.add(tf.layers.dropout({ rate: 0.5 }));
    
    // Output layer - number of classes depends on the model type
    const numClasses = type === 'throat' ? 5 : 5; // Adjust based on your conditions
    model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));
    
    // Compile the model
    model.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    
    return model;
}

/**
 * Preprocess an image for model input
 * 
 * @param {Buffer|string} imageData - Image data as Buffer or base64 string
 * @returns {tf.Tensor} A tensor ready for model input
 */
async function preprocessImage(imageData) {
    try {
        let imageTensor;
        
        // Handle base64 string
        if (typeof imageData === 'string') {
            // Remove data URL prefix if present
            const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            
            // Decode image
            imageTensor = tf.node.decodeImage(buffer, 3);
        } else {
            // Handle buffer directly
            imageTensor = tf.node.decodeImage(imageData, 3);
        }
        
        // Resize to expected dimensions
        const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
        
        // Normalize pixel values to [0,1]
        const normalized = resized.div(tf.scalar(255));
        
        // Add batch dimension
        const batched = normalized.expandDims(0);
        
        // Clean up tensors
        imageTensor.dispose();
        resized.dispose();
        
        return batched;
    } catch (error) {
        console.error('Error preprocessing image:', error);
        throw error;
    }
}

/**
 * Run inference on an image using the specified model
 * 
 * @param {tf.LayersModel} model - The TensorFlow.js model
 * @param {tf.Tensor} imageTensor - The preprocessed image tensor
 * @param {string} type - The model type ('throat' or 'ear')
 * @returns {Array} Array of condition objects with confidence scores
 */
async function runInference(model, imageTensor, type) {
    try {
        // Run prediction
        const predictions = await model.predict(imageTensor);
        
        // Convert to array
        const scores = await predictions.data();
        
        // Get condition labels based on type
        const conditions = getConditions(type);
        
        // Map scores to conditions
        const results = conditions.map((condition, index) => ({
            name: condition.name,
            confidence: scores[index],
            description: condition.description
        }));
        
        // Sort by confidence (descending)
        results.sort((a, b) => b.confidence - a.confidence);
        
        // Clean up tensors
        predictions.dispose();
        imageTensor.dispose();
        
        return results;
    } catch (error) {
        console.error('Error running inference:', error);
        throw error;
    }
}

/**
 * Get condition definitions based on type
 * 
 * @param {string} type - The model type ('throat' or 'ear')
 * @returns {Array} Array of condition objects
 */
function getConditions(type) {
    if (type === 'throat') {
        return [
            { 
                name: 'Strep Throat', 
                description: 'A bacterial infection that causes inflammation and pain in the throat.' 
            },
            { 
                name: 'Tonsillitis', 
                description: 'Inflammation of the tonsils, typically caused by viral or bacterial infection.' 
            },
            { 
                name: 'Laryngitis', 
                description: 'Inflammation of the voice box (larynx) that causes voice changes and sore throat.' 
            },
            { 
                name: 'Pharyngitis', 
                description: 'Inflammation of the pharynx resulting in a sore throat.' 
            },
            { 
                name: 'Healthy', 
                description: 'No significant abnormalities detected.' 
            }
        ];
    } else if (type === 'ear') {
        return [
            { 
                name: 'Otitis Media', 
                description: 'Middle ear infection that causes inflammation and fluid buildup.' 
            },
            { 
                name: 'Earwax Buildup', 
                description: 'Excessive accumulation of cerumen (earwax) in the ear canal.' 
            },
            { 
                name: 'Otitis Externa', 
                description: 'Infection of the ear canal, often referred to as swimmer\'s ear.' 
            },
            { 
                name: 'Eustachian Tube Dysfunction', 
                description: 'Blocked or dysfunctional eustachian tubes that connect the middle ear to the back of the throat.' 
            },
            { 
                name: 'Healthy', 
                description: 'No significant abnormalities detected.' 
            }
        ];
    }
    
    return [];
}

module.exports = {
    loadModel,
    preprocessImage,
    runInference
};
