// Import required modules
const tf = require('@tensorflow/tfjs-node');
const { v4: uuidv4 } = require('uuid');
const Analysis = require('../models/Analysis');
const modelLoader = require('../utils/modelLoader');
const { sendAnalysisNotification } = require('../utils/smsNotifier');

// Initialize model cache
let throatModel = null;
let earModel = null;
let modelLoading = false;

/**
 * Analyze an image for potential throat or ear conditions
 */
exports.analyzeImage = async (req, res, next) => {
    try {
        const { image, type } = req.body;

        if (!image) {
            return res.status(400).json({
                error: true,
                message: 'No image provided'
            });
        }

        if (!type || (type !== 'throat' && type !== 'ear')) {
            return res.status(400).json({
                error: true,
                message: 'Invalid analysis type. Must be "throat" or "ear"'
            });
        }

        // Process the image data (remove data:image prefix if present)
        let imageData = image;
        if (image.startsWith('data:image')) {
            imageData = image.split(',')[1];
        }

        // Load the appropriate model
        const model = await loadModel(type);
        if (!model) {
            return res.status(500).json({
                error: true,
                message: 'Failed to load analysis model'
            });
        }

        // Process the image for model input
        const processedImage = await preprocessImage(imageData);

        // Run inference with the model
        const predictions = await runInference(model, processedImage, type);

        // Generate response
        const analysisId = uuidv4();
        const timestamp = new Date().toISOString();
        
        const response = {
            id: analysisId,
            type,
            timestamp,
            conditions: predictions,
            user: req.user ? req.user.id : null // Include user ID if authenticated
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Error analyzing image:', error);
        next(error);
    }
};

/**
 * Save an analysis result to the database
 */
exports.saveAnalysis = async (req, res, next) => {
    try {
        // In a real app, this would validate the user is authenticated
        // and save the analysis to their records
        
        const analysisData = req.body;
        const { phoneNumber, notifyBySms } = req.body;
        
        if (!analysisData || !analysisData.id || !analysisData.type || !analysisData.conditions) {
            return res.status(400).json({
                error: true,
                message: 'Invalid analysis data'
            });
        }
        
        // Mock saving to database
        const savedAnalysis = {
            ...analysisData,
            savedAt: new Date().toISOString()
        };
        
        // Send SMS notification if requested and phone number is provided
        let smsNotificationSent = false;
        if (notifyBySms && phoneNumber) {
            try {
                await sendAnalysisNotification(phoneNumber, analysisData);
                smsNotificationSent = true;
            } catch (smsError) {
                console.error('Failed to send SMS notification:', smsError);
                // Continue with the save operation even if SMS fails
            }
        }
        
        res.status(200).json({
            message: 'Analysis saved successfully',
            analysis: savedAnalysis,
            smsNotificationSent
        });
    } catch (error) {
        console.error('Error saving analysis:', error);
        next(error);
    }
};

/**
 * Get analysis history for a user
 */
exports.getAnalysisHistory = async (req, res, next) => {
    try {
        // In a real app, this would fetch from the database
        // Based on the authenticated user
        
        // Mock response
        const mockHistory = [
            {
                id: '123e4567-e89b-12d3-a456-426614174000',
                type: 'throat',
                timestamp: '2023-05-15T10:30:00Z',
                conditions: [
                    { name: 'Strep Throat', confidence: 0.82, description: 'Bacterial infection of the throat and tonsils' },
                    { name: 'Tonsillitis', confidence: 0.67, description: 'Inflammation of the tonsils' }
                ]
            },
            {
                id: '223e4567-e89b-12d3-a456-426614174001',
                type: 'ear',
                timestamp: '2023-05-10T14:15:00Z',
                conditions: [
                    { name: 'Otitis Media', confidence: 0.75, description: 'Middle ear infection' },
                    { name: 'Earwax Buildup', confidence: 0.45, description: 'Excessive cerumen in the ear canal' }
                ]
            }
        ];
        
        res.status(200).json({
            history: mockHistory
        });
    } catch (error) {
        console.error('Error fetching analysis history:', error);
        next(error);
    }
};

/**
 * Load the appropriate model for analysis
 */
async function loadModel(type) {
    try {
        if (type === 'throat') {
            if (!throatModel && !modelLoading) {
                modelLoading = true;
                console.log('Loading throat analysis model...');
                // In a real app, this would load an actual model
                // For the demo, we'll create a mock model
                throatModel = await createMockModel();
                modelLoading = false;
            }
            return throatModel;
        } else if (type === 'ear') {
            if (!earModel && !modelLoading) {
                modelLoading = true;
                console.log('Loading ear analysis model...');
                // In a real app, this would load an actual model
                // For the demo, we'll create a mock model
                earModel = await createMockModel();
                modelLoading = false;
            }
            return earModel;
        }
        throw new Error('Invalid model type');
    } catch (error) {
        console.error('Error loading model:', error);
        return null;
    }
}

/**
 * Create a mock TensorFlow.js model for demonstration
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
 * Preprocess the image for model input
 */
async function preprocessImage(imageData) {
    try {
        // In a real app, this would process the image for the specific model
        // For the demo, we'll return a mock tensor
        
        // Create a mock tensor with the right shape for a typical image model
        const mockTensor = tf.zeros([1, 224, 224, 3]);
        
        return mockTensor;
    } catch (error) {
        console.error('Error preprocessing image:', error);
        throw error;
    }
}

/**
 * Run inference with the model
 */
async function runInference(model, imageTensor, type) {
    try {
        // In a real app, this would run the actual model inference
        // For the demo, we'll return mock predictions based on the type
        
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
                    isPotentiallySerious: true
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
                    isPotentiallySerious: false
                }
            ];
        } else {
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
                    isPotentiallySerious: false
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
                    isPotentiallySerious: false
                }
            ];
        }
        
        // Return only the top 2 conditions as requested
        return conditions;
    } catch (error) {
        console.error('Error running inference:', error);
        throw error;
    }
}
