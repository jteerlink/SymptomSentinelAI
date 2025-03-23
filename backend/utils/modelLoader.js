/**
 * Model Loader Utility
 * 
 * This utility handles loading and caching ML models for image analysis
 */
const tf = require('@tensorflow/tfjs-node');

// Cached models
let throatModel = null;
let earModel = null;
let modelLoading = false;
const pendingModelRequests = {
    throat: [],
    ear: []
};

/**
 * Load a model for the specified type (throat or ear)
 * 
 * @param {string} type - Either 'throat' or 'ear'
 * @returns {Promise<tf.LayersModel>} The loaded TensorFlow.js model
 */
async function loadModel(type) {
    try {
        // Input validation
        if (type !== 'throat' && type !== 'ear') {
            throw new Error('Invalid model type');
        }
        
        // Return cached model if already loaded
        if (type === 'throat' && throatModel) {
            console.log('✅ Using cached throat model');
            return throatModel;
        } else if (type === 'ear' && earModel) {
            console.log('✅ Using cached ear model');
            return earModel;
        }
        
        // If a model is already loading, queue this request
        if (modelLoading) {
            console.log(`⏳ Model is already loading, queuing request for ${type} model`);
            return new Promise((resolve, reject) => {
                pendingModelRequests[type].push({ resolve, reject });
            });
        }
        
        // Set loading state to true
        modelLoading = true;
        const startTime = Date.now();
        
        try {
            console.log(`🔄 Loading ${type} analysis model...`);
            
            // In a real app, this would load an actual model from a file or URL
            // For the demo, we'll create a mock model with a simulated delay
            const model = await createMockModel();
            
            // Cache the model
            if (type === 'throat') {
                throatModel = model;
            } else {
                earModel = model;
            }
            
            console.log(`✅ ${type} model loaded successfully in ${Date.now() - startTime}ms`);
            
            // Resolve any pending requests for this model type
            if (pendingModelRequests[type].length > 0) {
                console.log(`Resolving ${pendingModelRequests[type].length} pending ${type} model requests`);
                pendingModelRequests[type].forEach(({ resolve }) => resolve(model));
                pendingModelRequests[type] = [];
            }
            
            return model;
        } catch (loadError) {
            console.error(`❌ Error loading ${type} model:`, loadError);
            
            // Reject any pending requests for this model type
            if (pendingModelRequests[type].length > 0) {
                console.log(`Rejecting ${pendingModelRequests[type].length} pending ${type} model requests due to error`);
                pendingModelRequests[type].forEach(({ reject }) => reject(loadError));
                pendingModelRequests[type] = [];
            }
            
            return null;
        } finally {
            // Always reset the loading state
            modelLoading = false;
        }
    } catch (error) {
        console.error('Error in loadModel function:', error);
        return null;
    }
}

/**
 * Create a mock TensorFlow.js model for demonstration purposes
 * 
 * @param {string} type - Model type ('throat' or 'ear')
 * @returns {Promise<tf.LayersModel>} A TensorFlow.js model
 */
async function createMockModel() {
    // Create a simple sequential model
    const model = tf.sequential();
    model.add(tf.layers.conv2d({
        inputShape: [224, 224, 3],
        filters: 16,
        kernelSize: 3,
        activation: 'relu'
    }));
    model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
    model.add(tf.layers.flatten());
    model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));
    
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
        console.log('➡️ BEGIN IMAGE PREPROCESSING');
        const startTime = Date.now();
        
        // Input validation and logging
        if (imageData === null || imageData === undefined) {
            throw new Error('Image data is null or undefined');
        }
        
        // Log image data info without printing the actual data
        if (typeof imageData === 'string') {
            console.log(`📊 Image data type: string, length: ${imageData.length}`);
            if (imageData === 'test_image') {
                console.log('🔍 Using test image data for development/testing');
            } else {
                console.log(`🔍 First 20 chars: ${imageData.substring(0, 20)}...`);
                console.log(`🔍 Last 20 chars: ...${imageData.substring(imageData.length - 20)}`);
            }
        } else if (Buffer.isBuffer(imageData)) {
            console.log(`📊 Image data type: Buffer, size: ${imageData.length} bytes`);
        } else {
            console.log(`📊 Image data type: ${typeof imageData}`);
        }
        
        // In a production app, this would include the following steps:
        // 1. Decode the image from base64 or buffer to raw pixel data
        // 2. Resize the image to the required input dimensions (224x224)
        // 3. Convert to RGB format if necessary
        // 4. Normalize pixel values (typically to [0,1] or [-1,1] range)
        // 5. Arrange the data in the format expected by the model
        
        console.log('⏳ Preparing image tensor...');
        
        // For this demo implementation, we'll create a mock tensor
        let imageTensor;
        
        // Create a mock tensor with the right shape for a typical image model
        imageTensor = tf.zeros([1, 224, 224, 3]);
        
        // Performance logging
        console.log(`✅ Image preprocessed in ${Date.now() - startTime}ms`);
        console.log(`✅ Created tensor with shape: ${imageTensor.shape}`);
        console.log('⬅️ END IMAGE PREPROCESSING');
        
        return imageTensor;
    } catch (error) {
        console.error('❌ ERROR IN IMAGE PREPROCESSING:', error);
        console.error('Stack trace:', error.stack);
        
        // Add detailed debugging info to the error
        error.stage = 'image_preprocessing';
        error.imageType = typeof imageData;
        if (typeof imageData === 'string') {
            error.imageLength = imageData.length;
        } else if (Buffer.isBuffer(imageData)) {
            error.imageSize = imageData.length;
        }
        
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
    const startTime = Date.now();
    console.log(`🔍 BEGIN MODEL INFERENCE (${type})`);
    
    try {
        // Validate inputs
        if (!model) {
            throw new Error('Model is null or undefined');
        }
        
        if (!imageTensor || !imageTensor.shape) {
            throw new Error('Invalid image tensor provided');
        }
        
        console.log(`📊 Input tensor shape: ${imageTensor.shape}`);
        
        // In a production app, this would execute the actual model:
        // 1. Run the model prediction: const predictions = await model.predict(imageTensor)
        // 2. Process the raw prediction output into structured results
        // 3. Apply any post-processing (thresholding, etc.)
        // 4. Map numerical outputs to condition labels and confidence scores
        
        // For this demo, we'll use pre-defined conditions based on the type
        let conditions;
        if (type === 'throat') {
            conditions = [
                {
                    id: 'strep_throat',
                    name: 'Strep Throat',
                    confidence: 0.78,
                    description: 'A bacterial infection that causes inflammation and pain in the throat.',
                    symptoms: [
                        'Throat pain that comes on quickly',
                        'Red and swollen tonsils',
                        'White patches on the tonsils',
                        'Tiny red spots on the roof of the mouth',
                        'Fever'
                    ],
                    isPotentiallySerious: true,
                    recommendConsultation: true,
                    treatmentInfo: 'Usually requires antibiotics if bacterial in origin.'
                },
                {
                    id: 'tonsillitis',
                    name: 'Tonsillitis',
                    confidence: 0.65,
                    description: 'Inflammation of the tonsils, typically caused by viral or bacterial infection.',
                    symptoms: [
                        'Red, swollen tonsils',
                        'White or yellow coating on tonsils',
                        'Sore throat',
                        'Painful swallowing',
                        'Fever'
                    ],
                    isPotentiallySerious: false,
                    recommendConsultation: true,
                    treatmentInfo: 'May require antibiotics if bacterial; otherwise symptom management.'
                }
            ];
        } else if (type === 'ear') {
            conditions = [
                {
                    id: 'otitis_media',
                    name: 'Otitis Media',
                    confidence: 0.82,
                    description: 'Middle ear infection that causes inflammation and fluid buildup.',
                    symptoms: [
                        'Ear pain',
                        'Fluid draining from ears',
                        'Hearing difficulties',
                        'Fever',
                        'Irritability in children'
                    ],
                    isPotentiallySerious: false,
                    recommendConsultation: true,
                    treatmentInfo: 'May require antibiotics or other prescription medication.'
                },
                {
                    id: 'earwax_buildup',
                    name: 'Earwax Buildup',
                    confidence: 0.54,
                    description: 'Excessive accumulation of cerumen (earwax) in the ear canal.',
                    symptoms: [
                        'Feeling of fullness in the ear',
                        'Partial hearing loss',
                        'Ringing in the ear (tinnitus)',
                        'Itching in the ear',
                        'Discharge from the ear'
                    ],
                    isPotentiallySerious: false,
                    recommendConsultation: false,
                    treatmentInfo: 'Can often be treated with over-the-counter earwax removal drops.'
                }
            ];
        } else {
            throw new Error(`Invalid analysis type: ${type}`);
        }
        
        // Log performance metrics
        const inferenceTime = Date.now() - startTime;
        console.log(`⏱️ Inference completed in ${inferenceTime}ms`);
        console.log(`📊 Identified ${conditions.length} potential conditions`);
        
        // Sort by confidence (highest first) if needed
        conditions.sort((a, b) => b.confidence - a.confidence);
        
        // Add metadata about the inference
        conditions.forEach((condition, index) => {
            console.log(`🔍 Condition ${index+1}: ${condition.name} (${(condition.confidence * 100).toFixed(1)}%)`);
        });
        
        console.log('✅ END MODEL INFERENCE');
        
        // Return the top conditions
        return conditions;
    } catch (error) {
        console.error('❌ ERROR IN MODEL INFERENCE:', error);
        console.error('Stack trace:', error.stack);
        
        // Add detailed debugging info to the error
        error.stage = 'model_inference';
        error.modelType = type;
        error.inferenceTime = Date.now() - startTime;
        
        if (imageTensor) {
            try {
                error.tensorShape = imageTensor.shape;
            } catch (e) {
                // Ignore errors when trying to access tensor properties
            }
        }
        
        throw error;
    } finally {
        // Clean up tensors to prevent memory leaks
        try {
            if (imageTensor && !imageTensor.isDisposed) {
                imageTensor.dispose();
            }
        } catch (e) {
            console.warn('Warning: Error disposing tensor:', e);
        }
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
            { id: 'strep_throat', name: 'Strep Throat' },
            { id: 'tonsillitis', name: 'Tonsillitis' },
            { id: 'pharyngitis', name: 'Pharyngitis' }
        ];
    } else if (type === 'ear') {
        return [
            { id: 'otitis_media', name: 'Otitis Media' },
            { id: 'earwax_buildup', name: 'Earwax Buildup' },
            { id: 'ear_infection', name: 'Ear Infection' }
        ];
    } else {
        return [];
    }
}

module.exports = {
    loadModel,
    preprocessImage,
    runInference,
    getConditions
};