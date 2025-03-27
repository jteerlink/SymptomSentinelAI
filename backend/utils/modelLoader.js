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
    const startTime = Date.now();
    console.log(`🔄 BEGIN LOAD MODEL: ${type}`);
    
    try {
        // Enhanced input validation with detailed error reporting
        if (!type) {
            const error = new Error('Model type is null or undefined');
            error.problem = 'MISSING_MODEL_TYPE';
            console.error(`❌ ${error.message} (${error.problem})`);
            throw error;
        }
        
        if (type !== 'throat' && type !== 'ear') {
            const error = new Error(`Invalid model type: ${type}. Must be 'throat' or 'ear'`);
            error.problem = 'INVALID_MODEL_TYPE';
            error.providedType = type;
            error.validTypes = ['throat', 'ear'];
            console.error(`❌ ${error.message} (${error.problem})`);
            throw error;
        }
        
        // Return cached model if already loaded
        if (type === 'throat' && throatModel) {
            console.log(`✅ Using cached throat model (already loaded)`);
            return throatModel;
        } else if (type === 'ear' && earModel) {
            console.log(`✅ Using cached ear model (already loaded)`);
            return earModel;
        }
        
        // If a model is already loading, queue this request with timeout handling
        if (modelLoading) {
            console.log(`⏳ Model loading in progress, queueing request for ${type} model`);
            return new Promise((resolve, reject) => {
                // Add this request to the queue with a timeout
                const requestId = Date.now().toString();
                console.log(`Added request ${requestId} to queue for ${type} model`);
                
                // Set a timeout to prevent hanging promises
                const timeoutId = setTimeout(() => {
                    // Find and remove this specific request
                    const index = pendingModelRequests[type].findIndex(req => req.id === requestId);
                    if (index !== -1) {
                        pendingModelRequests[type].splice(index, 1);
                        const timeoutError = new Error(`Request for ${type} model timed out after 30 seconds`);
                        timeoutError.problem = 'MODEL_LOAD_TIMEOUT';
                        reject(timeoutError);
                    }
                }, 30000); // 30 second timeout
                
                pendingModelRequests[type].push({ 
                    resolve, 
                    reject,
                    id: requestId,
                    cancelTimeout: () => clearTimeout(timeoutId)
                });
            });
        }
        
        // Set loading state to true to prevent concurrent loads
        modelLoading = true;
        console.log(`Starting to load ${type} model (no cached version available)`);
        
        try {
            console.log(`📥 Loading ${type} analysis model...`);
            
            // Track model loading stages for better debugging
            let loadingStage = 'initialization';
            
            // In a real app, this would load an actual model from a file or URL
            // For the demo, we'll create a mock model
            loadingStage = 'mock_model_creation';
            const model = await createMockModel();
            
            loadingStage = 'caching';
            // Cache the model
            if (type === 'throat') {
                throatModel = model;
            } else {
                earModel = model;
            }
            
            const loadTime = Date.now() - startTime;
            console.log(`⏱️ ${type} model loaded successfully in ${loadTime}ms`);
            console.log(`Model input shape: ${model.inputs[0].shape}`);
            console.log(`Model output shape: ${model.outputs[0].shape}`);
            
            // Resolve any pending requests for this model type
            if (pendingModelRequests[type].length > 0) {
                console.log(`✅ Resolving ${pendingModelRequests[type].length} pending ${type} model requests`);
                pendingModelRequests[type].forEach(request => {
                    // Cancel the timeout for this request
                    if (request.cancelTimeout) {
                        request.cancelTimeout();
                    }
                    // Resolve the promise with the model
                    request.resolve(model);
                });
                pendingModelRequests[type] = [];
            }
            
            console.log(`✅ END LOAD MODEL: ${type} (Success)`);
            return model;
        } catch (loadError) {
            // Enhanced error handling with detailed diagnostics
            console.error(`❌ Error loading ${type} model:`, loadError);
            console.error('Stack trace:', loadError.stack);
            
            // Add detailed error context
            loadError.stage = 'model_loading';
            loadError.modelType = type;
            loadError.loadTime = Date.now() - startTime;
            
            if (!loadError.problem) {
                // Categorize common errors based on error message patterns
                if (loadError.message && loadError.message.includes('fetch')) {
                    loadError.problem = 'NETWORK_ERROR';
                } else if (loadError.message && loadError.message.includes('memory')) {
                    loadError.problem = 'OUT_OF_MEMORY';
                } else if (loadError.message && loadError.message.includes('format')) {
                    loadError.problem = 'MODEL_FORMAT_ERROR';
                } else {
                    loadError.problem = 'MODEL_LOAD_FAILED';
                }
            }
            
            console.error(`[Model Loading] ${loadError.message} (${loadError.problem})`);
            
            // Reject any pending requests with the detailed error
            if (pendingModelRequests[type].length > 0) {
                console.log(`Rejecting ${pendingModelRequests[type].length} pending ${type} model requests due to error`);
                pendingModelRequests[type].forEach(request => {
                    // Cancel the timeout for this request
                    if (request.cancelTimeout) {
                        request.cancelTimeout();
                    }
                    // Reject the promise with the error
                    request.reject(loadError);
                });
                pendingModelRequests[type] = [];
            }
            
            throw loadError;
        } finally {
            // Always reset the loading state
            modelLoading = false;
            console.log(`Model loading lock released for ${type}`);
        }
    } catch (error) {
        console.error('Unhandled error in loadModel function:', error);
        console.error('Stack trace:', error.stack);
        
        // Ensure the error is properly categorized
        if (!error.stage) {
            error.stage = 'model_loading_outer';
        }
        if (!error.problem) {
            error.problem = 'UNHANDLED_ERROR';
        }
        
        throw error;
    }
}

/**
 * Create a mock TensorFlow.js model for demonstration purposes
 * 
 * @param {string} type - Model type ('throat' or 'ear')
 * @returns {Promise<tf.LayersModel>} A TensorFlow.js model
 */
async function createMockModel() {
    console.log('Creating mock TensorFlow.js model for demonstration');
    
    try {
        // Create a simple sequential model
        const model = tf.sequential();
        
        // Add first convolutional layer - this handles the initial image input
        console.log('Adding convolutional input layer with shape [224, 224, 3]');
        model.add(tf.layers.conv2d({
            inputShape: [224, 224, 3],
            filters: 16,
            kernelSize: 3,
            activation: 'relu'
        }));
        
        // Add pooling to reduce dimensionality
        console.log('Adding maxPooling2d layer');
        model.add(tf.layers.maxPooling2d({ poolSize: 2, strides: 2 }));
        
        // Flatten the 2D representation to 1D for the dense layers
        console.log('Adding flatten layer');
        model.add(tf.layers.flatten());
        
        // Output layer with 10 units (for 10 potential medical conditions)
        console.log('Adding dense output layer with 10 units and softmax activation');
        model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));
        
        // Compile the model with appropriate loss function for classification
        console.log('Compiling model with categorical cross-entropy loss');
        model.compile({
            optimizer: 'adam',
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });
        
        console.log('Mock model successfully created and compiled');
        console.log(`Model input shape: ${model.inputs[0].shape}`);
        console.log(`Model output shape: ${model.outputs[0].shape}`);
        
        return model;
    } catch (error) {
        console.error('❌ ERROR CREATING MOCK MODEL:', error);
        console.error('Stack trace:', error.stack);
        
        // Add detailed error information
        error.stage = 'model_creation';
        
        // Check for specific TensorFlow.js errors and provide more context
        if (error.message && error.message.includes('dtype')) {
            error.problem = 'INVALID_DTYPE';
        } else if (error.message && error.message.includes('shape')) {
            error.problem = 'INVALID_SHAPE';
        } else if (error.message && error.message.includes('incompatible')) {
            error.problem = 'INCOMPATIBLE_LAYERS';
        } else {
            error.problem = 'MODEL_CREATION_FAILED';
        }
        
        console.error(`[Model Creation] ${error.message} (${error.problem})`);
        throw error;
    }
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
        
        // Add context-specific information for better debugging
        if (typeof imageData === 'string') {
            error.imageLength = imageData.length;
            error.imageStartsWith = imageData.substring(0, 20);
            
            // If this is a base64 string that seems malformed, provide more specific info
            if (imageData.includes('base64') && !imageData.includes('data:image')) {
                error.message = 'Malformed base64 image data: Missing proper data:image/* prefix';
                error.problem = 'MALFORMED_BASE64';
            } else if (imageData.includes('base64') && imageData.split(',').length < 2) {
                error.message = 'Invalid base64 image format: Could not extract data portion';
                error.problem = 'INVALID_BASE64_FORMAT';
            } else if (imageData.length < 100) {
                error.message = 'Image data too small to be valid';
                error.problem = 'DATA_TOO_SMALL';
            }
        } else if (Buffer.isBuffer(imageData)) {
            error.imageSize = imageData.length;
            // Provide specific error message for empty or very small buffers
            if (imageData.length < 100) {
                error.message = 'Image buffer too small to be valid';
                error.problem = 'BUFFER_TOO_SMALL';
            }
        } else if (imageData === null || imageData === undefined) {
            error.message = 'Image data is null or undefined';
            error.problem = 'MISSING_DATA';
        } else {
            error.message = `Unsupported image data type: ${typeof imageData}`;
            error.problem = 'UNSUPPORTED_DATA_TYPE';
        }
        
        console.error(`[Image Processing] ${error.message || 'Image preprocessing failed'} (${error.problem || 'unknown issue'})`);
        
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
        
        // Add context-specific information to enhance troubleshooting
        if (!model) {
            error.message = 'Model is null or undefined';
            error.problem = 'MISSING_MODEL';
        } else if (!imageTensor) {
            error.message = 'Image tensor is null or undefined';
            error.problem = 'MISSING_TENSOR';
        } else if (imageTensor && typeof imageTensor.shape === 'undefined') {
            error.message = 'Image tensor has invalid shape';
            error.problem = 'INVALID_TENSOR_SHAPE';
        }
        
        // Add tensor shape if possible for debugging
        if (imageTensor) {
            try {
                error.tensorShape = imageTensor.shape;
                // Additional tensor diagnostics
                error.tensorRank = imageTensor.rank;
                error.tensorDType = imageTensor.dtype;
            } catch (e) {
                error.tensorInfoError = e.message;
                // Ignore errors when trying to access tensor properties
            }
        }
        
        // For model-specific errors
        if (error.message && error.message.includes('shape')) {
            error.problem = 'TENSOR_SHAPE_MISMATCH';
        } else if (error.message && error.message.includes('memory')) {
            error.problem = 'OUT_OF_MEMORY';
        }
        
        console.error(`[Model Inference] ${error.message || 'Inference failed'} (${error.problem || 'unknown issue'})`);
        
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