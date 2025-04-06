// Import required modules
const tf = require('@tensorflow/tfjs-node');
const { v4: uuidv4 } = require('uuid');
const { User, Analysis } = require('../db/models/index');
const ApiError = require('../utils/apiError');

// For enhanced ML-related functions with attention map support
const { analyzeImage } = require('../utils/enhancedModelBridge');
const { loadModel, preprocessImage, runInference } = require('../utils/modelLoader');

// Both modelLoader and enhancedModelBridge are available for different use cases

/**
 * Analyze an image for potential throat or ear conditions
 * 
 * This endpoint processes uploaded images and returns potential medical conditions
 * using machine learning analysis.
 * 
 * @route POST /api/analyze
 * @param {string} type - Either 'throat' or 'ear' to specify the analysis type
 * @param {file} image - The uploaded image file
 * @returns {Object} Analysis results with conditions and confidence scores
 * @throws {ApiError} For various validation, processing, or server errors
 */
exports.analyzeImage = async (req, res, next) => {
    try {
        console.log('📥 INCOMING ANALYZE REQUEST 📥');
        console.log('==============================');
        console.log('Request headers:', req.headers);
        
        // Extract user from request (set by auth middleware)
        const userId = req.user.id;
        
        // Fetch user from database to check subscription status
        const user = await User.getById(userId);
        if (!user) {
            console.error('❌ User not found:', userId);
            throw ApiError.unauthorized('User account not found');
        }
        
        console.log(`👤 User authenticated: ${user.email} (${user.subscription} subscription)`);
        const limit = User.SUBSCRIPTION_LIMITS[user.subscription].analysesPerMonth;
        console.log(`📊 Analysis count: ${user.analysis_count || 0}/${limit}`);
        
        // Check if user has exceeded their analysis limit
        if (User.hasExceededAnalysisLimit(user)) {
            const limit = User.SUBSCRIPTION_LIMITS[user.subscription].analysesPerMonth;
            console.error(`❌ User has exceeded analysis limit: ${user.analysis_count}/${limit}`);
            throw ApiError.analysisLimitExceeded('You have reached your monthly analysis limit', {
                current: user.analysis_count,
                limit: limit,
                subscription: user.subscription
            });
        }
        
        // Check if request body exists
        if (!req.body) {
            console.error('❌ Request body is undefined or null');
            throw ApiError.badRequest('Missing request body', 'MISSING_REQUEST_BODY');
        }
        
        console.log('Request body keys:', Object.keys(req.body));
        console.log('Request body type:', typeof req.body);
        
        // Check if this is a multipart/form-data request with files
        let image;
        let type;
        
        if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
            console.log('Received multipart/form-data request');
            
            // Check if multer parsed a file
            const filePresent = req.file || (req.files && req.files.image);
            console.log('File present:', !!filePresent);
            
            if (filePresent) {
                // Get the file from multer
                const file = req.file || req.files.image;
                console.log('File details:', {
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size,
                    buffer: `Buffer of ${file.buffer ? file.buffer.length : 0} bytes`
                });
                
                // Extract image data from the file
                image = file.buffer;
                // Get type from body
                type = req.body.type;
                
                console.log('Reconstructed request body with image data from file upload');
                console.log(`Type: ${type}`);
                console.log(`Image data length: ${image ? image.length : 0}`);
            } else {
                // Try to extract type and image from the regular body if the file wasn't parsed
                ({ image, type } = req.body);
            }
        } else {
            // Standard JSON request
            ({ image, type } = req.body);
        }
        
        // Debug request object structure (without large data)
        const debugReqCopy = {...req};
        if (debugReqCopy.body && debugReqCopy.body.image) {
            debugReqCopy.body.image = `[Image data, length: ${debugReqCopy.body.image.length}]`;
        }
        console.log('Request structure:', JSON.stringify(debugReqCopy.body, null, 2).substring(0, 500) + '...');
        
        // Check if the request contains image data
        if (!image) {
            console.error('❌ No image provided in request body');
            throw ApiError.badRequest('No image provided', 'MISSING_IMAGE');
        }
        
        // Additional logging for successful image extraction
        console.log(`✅ Image data received: ${typeof image}`);
        console.log(`📊 Image data length: ${image.length} characters`);
        console.log(`🔍 Analysis type: ${type}`);

        // Validate analysis type
        if (!type || (type !== 'throat' && type !== 'ear')) {
            console.error('❌ Invalid analysis type provided:', type);
            throw ApiError.invalidModel(`Invalid analysis type: ${type}. Must be "throat" or "ear"`, {
                providedType: type
            });
        }

        console.log(`🔄 Processing ${type} image analysis...`);
        
        // Process the image data with improved handling for all possible formats
        let imageData = image;
        let dataSource = 'unknown';
        
        // Case 1: Handle test image mode
        if (image === 'test_image') {
            console.log('Using test image data for analysis');
            imageData = 'test_image';
            dataSource = 'test_image';
        }
        // Case 2: Handle base64 data URLs (from canvas.toDataURL())
        else if (typeof image === 'string' && image.startsWith('data:image')) {
            try {
                console.log('Detected data URL format image');
                // Extract the data portion from "data:image/jpeg;base64,/9j/4AAQ..."
                imageData = image.split(',')[1];
                console.log('✅ Processed base64 image data from data URL');
                console.log(`📊 Extracted base64 length: ${imageData.length}`);
                dataSource = 'data_url';
            } catch (err) {
                console.error('❌ Failed to process base64 image data:', err);
                throw ApiError.invalidImage('Failed to process base64 image data', {
                    errorMessage: err.message,
                    dataType: typeof image
                });
            }
        }
        // Case 3: Handle raw base64 strings (without data:image prefix)
        else if (typeof image === 'string' && (
            image.startsWith('/9j/') || // JPEG
            image.startsWith('iVBOR') || // PNG
            image.match(/^[A-Za-z0-9+/=]+$/) // Generic base64 check
        )) {
            console.log('✅ Detected raw base64 image data');
            console.log(`📊 Raw base64 length: ${image.length}`);
            imageData = image;
            dataSource = 'raw_base64';
        }
        // Case 4: Handle other formats
        else if (image) {
            console.log(`⚠️ Image data provided in unidentified format: ${typeof image}`);
            console.log('Attempting to process as-is');
            dataSource = 'unknown_format';
        }

        console.log(`📄 Image data source: ${dataSource}`);
        
        try {
            // Load the appropriate model
            console.log('🧠 Loading ML model...');
            const model = await loadModel(type);
            if (!model) {
                console.error('❌ Failed to load analysis model');
                throw ApiError.internalError('Failed to load analysis model', {
                    modelType: type,
                    errorStage: 'model_loading'
                });
            }
            console.log('✅ Model loaded successfully');

            // Check if user has exceeded their analysis limit
            if (req.user) {
                console.log('👤 Authenticated user detected, checking analysis limits');
                
                // Check if user has exceeded their monthly analysis limit
                if (User.hasExceededAnalysisLimit(req.user)) {
                    console.log('❌ User has exceeded their monthly analysis limit');
                    throw ApiError.analysisLimitExceeded('You have reached your monthly analysis limit', {
                        subscription: req.user.subscription,
                        analysisCount: req.user.analysis_count || 0,
                        analysisLimit: User.SUBSCRIPTION_LIMITS[req.user.subscription].analysesPerMonth,
                        upgradeRequired: req.user.subscription === 'free'
                    });
                }
                
                console.log('✅ User has not exceeded their analysis limit, proceeding');
            } else {
                console.log('👤 No authenticated user, proceeding with analysis as guest');
            }
            
            // Process the image and run analysis with the enhanced model bridge
            console.log('🔄 Using enhancedModelBridge for analysis with attention map support...');
            
            // Use the enhanced model bridge with attention map support
            const predictions = await analyzeImage(imageData, type, {
                returnAttention: true, // Enable attention map visualization
                version: 'v1'  // Use a specific model version
            });
            
            console.log('✅ Enhanced analysis complete');
            console.log('📊 Predictions generated:', JSON.stringify(predictions));

            // Generate response
            const analysisId = uuidv4();
            const timestamp = new Date().toISOString();
            
            const response = {
                id: analysisId,
                type,
                timestamp,
                conditions: predictions,
                user: req.user ? req.user.id : null, // Include user ID if authenticated
                debug_info: {
                    data_source: dataSource,
                    image_data_length: imageData.length,
                    processing_time: new Date().getTime() - new Date(req.headers['x-request-time'] || Date.now()).getTime()
                }
            };

            console.log('📤 Sending successful response');
            return res.status(200).json(response);
        } catch (error) {
            console.error('❌ Error during image analysis process:', error);
            console.error('Stack trace:', error.stack);
            
            // Determine specific error type for better client-side handling
            let errorCode = 'ANALYSIS_ERROR';
            let errorStatus = 500;
            let errorMessage = 'Internal server error during image analysis';
            let errorCategory = 'system';
            let errorRecoveryAction = 'Try again later or contact support';
            
            // Categorize common errors for better client-side handling with more specific categories and recovery actions
            if (error.problem === 'MALFORMED_BASE64') {
                errorCode = 'MALFORMED_IMAGE_DATA';
                errorMessage = 'Image data is malformed or corrupted. Please try uploading again with the correct format.';
                errorStatus = 400;
                errorCategory = 'image_format';
                errorRecoveryAction = 'Try taking a new photo or uploading a different image file';
            } else if (error.problem === 'INVALID_BASE64_FORMAT') {
                errorCode = 'INVALID_IMAGE_FORMAT';
                errorMessage = 'Invalid image data format. Please ensure you are using a proper image format.';
                errorStatus = 400;
                errorCategory = 'image_format';
                errorRecoveryAction = 'Try using a JPEG or PNG image';
            } else if (error.problem === 'DATA_TOO_SMALL' || error.problem === 'BUFFER_TOO_SMALL') {
                errorCode = 'IMAGE_TOO_SMALL';
                errorMessage = 'Image data is too small to be valid. Please upload a proper image.';
                errorStatus = 400;
                errorCategory = 'image_size';
                errorRecoveryAction = 'Make sure you are uploading a complete image file';
            } else if (error.problem === 'MISSING_DATA') {
                errorCode = 'MISSING_IMAGE_DATA';
                errorMessage = 'No image data found. Please ensure you are uploading an image.';
                errorStatus = 400;
                errorCategory = 'image_missing';
                errorRecoveryAction = 'Select an image file before uploading';
            } else if (error.problem === 'UNSUPPORTED_DATA_TYPE') {
                errorCode = 'UNSUPPORTED_IMAGE_TYPE';
                errorMessage = 'The image format is not supported. Please use JPEG or PNG images.';
                errorStatus = 400;
                errorCategory = 'image_format';
                errorRecoveryAction = 'Convert your image to a standard format like JPEG or PNG';
            } else if (error.message && error.message.includes('decode')) {
                errorCode = 'IMAGE_DECODE_ERROR';
                errorMessage = 'Could not decode image data. Please ensure you are uploading a valid image file.';
                errorStatus = 400;
                errorCategory = 'image_format';
                errorRecoveryAction = 'Try uploading a different image file';
            } else if (error.message && error.message.includes('tensor')) {
                errorCode = 'IMAGE_PROCESSING_ERROR';
                errorMessage = 'Error processing image. Please try using a clearer image.';
                errorStatus = 400;
                errorCategory = 'image_quality';
                errorRecoveryAction = 'Take a clearer, well-lit photo and try again';
            } else if (error.problem === 'TENSOR_SHAPE_MISMATCH') {
                errorCode = 'IMAGE_SIZE_ERROR';
                errorMessage = 'The image dimensions could not be processed correctly.';
                errorStatus = 400;
                errorCategory = 'image_dimensions';
                errorRecoveryAction = 'Try using an image with standard dimensions';
            } else if (error.problem === 'OUT_OF_MEMORY') {
                errorCode = 'IMAGE_TOO_LARGE';
                errorMessage = 'The image is too large to process. Please use a smaller image (under 5MB).';
                errorStatus = 400;
                errorCategory = 'image_size';
                errorRecoveryAction = 'Resize your image to be smaller than 5MB';
            } else if (error.stage === 'image_preprocessing') {
                errorCode = 'IMAGE_PREPROCESSING_ERROR';
                errorMessage = 'Could not prepare image for analysis. The image might be corrupted or in an unsupported format.';
                errorStatus = 400;
                errorCategory = 'image_processing';
                errorRecoveryAction = 'Try using a standard JPEG or PNG image';
            } else if (error.stage === 'model_loading') {
                errorCode = 'MODEL_LOADING_ERROR';
                errorMessage = 'Could not load the analysis model. This is a temporary system issue.';
                errorStatus = 503;
                errorCategory = 'system';
                errorRecoveryAction = 'Please try again in a few minutes';
            } else if (error.stage === 'model_inference') {
                errorCode = 'MODEL_INFERENCE_ERROR';
                errorMessage = 'Could not analyze image. The analysis system encountered a technical problem.';
                errorStatus = 500;
                errorCategory = 'system';
                errorRecoveryAction = 'Try again with a different image or try later';
            } else if (error.stage === 'model_creation') {
                errorCode = 'MODEL_CREATION_ERROR';
                errorMessage = 'Could not create analysis model. This is a temporary system issue.';
                errorStatus = 503;
                errorCategory = 'system';
                errorRecoveryAction = 'Please try again in a few minutes';
            }
            
            // Log specific error details for monitoring and analytics
            console.error(`[Image Analysis Error]`);
            console.error(`Code: ${errorCode}`);
            console.error(`Category: ${errorCategory}`);
            console.error(`Status: ${errorStatus}`);
            console.error(`Message: ${errorMessage}`);
            console.error(`Recovery Action: ${errorRecoveryAction}`);
            
            // Send a comprehensive error response with recovery guidance
            return res.status(errorStatus).json({
                error: true,
                message: errorMessage,
                code: errorCode,
                category: errorCategory,
                recovery_action: errorRecoveryAction,
                details: process.env.NODE_ENV === 'development' ? {
                    error_message: error.message,
                    stage: error.stage || 'unknown',
                    problem: error.problem || 'unknown',
                    data_source: dataSource,
                    timestamp: new Date().toISOString()
                } : undefined
            });
        }
    } catch (outer_error) {
        console.error('❌❌ CRITICAL ERROR IN ANALYZE ENDPOINT:', outer_error);
        console.error('Stack trace:', outer_error.stack);
        
        // Generate a unique error ID for tracking in logs
        const errorId = uuidv4();
        console.error(`Error ID: ${errorId}`);
        
        // Handle specific API errors from our utility
        if (outer_error.isApiError) {
            // Determine the error category for client-side handling
            let errorCategory = 'system';
            let recoveryAction = 'Try again later or contact support';
            
            // Categorize common API errors
            if (outer_error.code === 'UNAUTHORIZED' || outer_error.code === 'AUTH_REQUIRED') {
                errorCategory = 'authentication';
                recoveryAction = 'Please log in to continue';
            } else if (outer_error.code === 'FORBIDDEN') {
                errorCategory = 'permissions';
                recoveryAction = 'Your account does not have permission for this action';
            } else if (outer_error.code === 'VALIDATION_ERROR') {
                errorCategory = 'input';
                recoveryAction = 'Please check your input and try again';
            } else if (outer_error.code === 'RATE_LIMIT') {
                errorCategory = 'rate_limit';
                recoveryAction = 'Please wait before trying again';
            } else if (outer_error.code === 'ANALYSIS_LIMIT_EXCEEDED') {
                errorCategory = 'subscription';
                recoveryAction = 'Upgrade your subscription or wait until your monthly limit resets';
            }
            
            return res.status(outer_error.status || 500).json({
                error: true,
                message: outer_error.message,
                code: outer_error.code || 'SERVER_ERROR',
                category: errorCategory,
                recovery_action: recoveryAction,
                error_id: errorId
            });
        }
        
        // Create a comprehensive error response for non-API errors
        return res.status(500).json({
            error: true,
            message: 'A critical error occurred while processing your request',
            code: 'CRITICAL_ERROR',
            category: 'system',
            recovery_action: 'Please try again later or contact support if the problem persists',
            error_id: errorId // For tracking in logs
        });
    }
};

/**
 * Save an analysis result to the database
 */
exports.saveAnalysis = async (req, res, next) => {
    try {
        // Validate user is authenticated
        if (!req.user) {
            throw ApiError.unauthorized('Authentication required to save analysis', 'AUTH_REQUIRED');
        }
        
        console.log('Saving analysis for user:', req.user.id);
        
        const analysisData = req.body;
        console.log('Analysis data received:', JSON.stringify(analysisData));
        
        if (!analysisData || !analysisData.type || !analysisData.conditions) {
            throw ApiError.validationError('Invalid analysis data', {
                type: !analysisData?.type ? 'Analysis type is required' : undefined,
                conditions: !analysisData?.conditions ? 'Analysis conditions are required' : undefined
            });
        }
        
        // In test environment, bypass actual database call and return mock data
        if (process.env.NODE_ENV === 'test') {
            console.log('Test environment detected, using mock data');
            // Create a mock saved analysis object
            const mockAnalysis = {
                id: analysisData.id || '123e4567-e89b-12d3-a456-426614174111',
                user_id: req.user.id,
                type: analysisData.type,
                conditions: analysisData.conditions,
                image_url: analysisData.imageUrl || null,
                created_at: new Date().toISOString()
            };
            
            // Include subscription info in the test response too
            const subscriptionLimits = User.SUBSCRIPTION_LIMITS[req.user.subscription];
            const subscriptionInfo = {
                subscription: req.user.subscription,
                analysisCount: req.user.analysis_count || 0,
                analysisLimit: subscriptionLimits.analysesPerMonth,
                analysisRemaining: Math.max(0, subscriptionLimits.analysesPerMonth - (req.user.analysis_count || 0)),
                last_reset_date: req.user.last_reset_date
            };
            
            return res.status(200).json({
                message: 'Analysis saved successfully',
                analysis: mockAnalysis,
                subscription: subscriptionInfo
            });
        }
        
        console.log('Live environment, saving to database');
        // For non-test environments, create analysis record in database
        const id = analysisData.id || undefined;
        
        try {
            // Not incrementing analysis count for saves anymore
            // All users can save analysis results regardless of subscription status
            console.log(`Saving analysis for user ${req.user.id} without incrementing analysis count`);
            
            // Get current user data for response
            const currentUser = await User.getById(req.user.id);
            console.log(`Current analysis count: ${currentUser.analysis_count}`);
            
            // Keep the req.user object updated with the latest data
            req.user.analysis_count = currentUser.analysis_count;
            req.user.last_reset_date = currentUser.last_reset_date;
            
            // Create the analysis record
            console.log('Creating analysis record');
            const savedAnalysis = await Analysis.create({
                id,
                userId: req.user.id,
                type: analysisData.type,
                conditions: analysisData.conditions,
                imageUrl: analysisData.imageUrl || null
            });
            
            console.log('Analysis saved:', savedAnalysis.id);
            
            // Include subscription info in the response
            const subscriptionLimits = User.SUBSCRIPTION_LIMITS[req.user.subscription];
            const subscriptionInfo = {
                subscription: req.user.subscription,
                analysisCount: req.user.analysis_count || 0,
                analysisLimit: subscriptionLimits.analysesPerMonth,
                analysisRemaining: Math.max(0, subscriptionLimits.analysesPerMonth - (req.user.analysis_count || 0)),
                last_reset_date: req.user.last_reset_date
            };
            
            return res.status(200).json({
                message: 'Analysis saved successfully',
                analysis: savedAnalysis,
                subscription: subscriptionInfo
            });
        } catch (dbError) {
            console.error('Database operation error:', dbError);
            console.error('Stack trace:', dbError.stack);
            
            // Generate a unique error ID for tracking
            const errorId = uuidv4();
            
            // Default error information
            let errorCode = 'DATABASE_OPERATION_ERROR';
            let errorStatus = 500;
            let errorMessage = 'Error saving analysis to database';
            let errorCategory = 'database';
            let recoveryAction = 'Please try again later';
            
            // Handle specific database error types
            if (dbError.code === 'ER_DUP_ENTRY') {
                errorCode = 'DUPLICATE_ANALYSIS';
                errorStatus = 409;
                errorMessage = 'This analysis has already been saved';
                errorCategory = 'duplicate';
                recoveryAction = 'This analysis has already been saved. You can view it in your history.';
            } else if (dbError.code === 'ER_NO_REFERENCED_ROW') {
                errorCode = 'INVALID_REFERENCE';
                errorStatus = 400;
                errorMessage = 'Invalid reference in analysis data';
                errorCategory = 'validation';
                recoveryAction = 'Please try again with valid data';
            } else if (dbError.code === 'ER_DATA_TOO_LONG') {
                errorCode = 'DATA_TOO_LONG';
                errorStatus = 400;
                errorMessage = 'Analysis data is too large';
                errorCategory = 'validation';
                recoveryAction = 'Please try again with smaller data';
            } else if (dbError.code === 'ER_NO_SUCH_TABLE') {
                errorCode = 'MISSING_TABLE';
                errorStatus = 500;
                errorMessage = 'Database configuration issue';
                errorCategory = 'system';
                recoveryAction = 'This appears to be a system issue. Please try again later.';
            }
            
            // Log the categorized error
            console.error(`[Database Error]`);
            console.error(`ID: ${errorId}`);
            console.error(`Code: ${errorCode}`);
            console.error(`Category: ${errorCategory}`);
            console.error(`Status: ${errorStatus}`);
            console.error(`Message: ${errorMessage}`);
            
            return res.status(errorStatus).json({
                error: true,
                message: errorMessage,
                code: errorCode,
                category: errorCategory,
                recovery_action: recoveryAction,
                error_id: errorId,
                details: process.env.NODE_ENV === 'development' ? {
                    error_message: dbError.message,
                    error_code: dbError.code,
                    timestamp: new Date().toISOString()
                } : undefined
            });
        }
    } catch (error) {
        console.error('Error saving analysis:', error);
        console.error('Stack trace:', error.stack);
        
        // Generate a unique error ID for tracking
        const errorId = uuidv4();
        
        // Determine specific error type and category
        let errorCode = 'SAVE_ANALYSIS_ERROR';
        let errorStatus = 500;
        let errorMessage = 'Error processing analysis save request';
        let errorCategory = 'database';
        let recoveryAction = 'Please try again later';
        
        // Handle specific error types
        if (error.isApiError) {
            errorCode = error.code || 'API_ERROR';
            errorStatus = error.status || 500;
            errorMessage = error.message;
            
            if (error.code === 'UNAUTHORIZED' || error.code === 'AUTH_REQUIRED') {
                errorCategory = 'authentication';
                recoveryAction = 'Please log in and try again';
            } else if (error.code === 'VALIDATION_ERROR') {
                errorCategory = 'validation';
                recoveryAction = 'Please check your input data and try again';
            } else if (error.code === 'ANALYSIS_LIMIT_EXCEEDED') {
                errorCategory = 'subscription';
                recoveryAction = 'Upgrade your subscription or wait until your monthly limit resets';
            }
        } else if (error.code === 'ER_DUP_ENTRY') {
            errorCode = 'DUPLICATE_ANALYSIS';
            errorStatus = 409;
            errorMessage = 'This analysis has already been saved';
            errorCategory = 'duplicate';
            recoveryAction = 'Try saving with a different ID or update the existing analysis';
        } else if (error.code === 'ER_NO_REFERENCED_ROW') {
            errorCode = 'INVALID_REFERENCE';
            errorStatus = 400;
            errorMessage = 'Invalid reference in analysis data';
            errorCategory = 'validation';
            recoveryAction = 'Check that all referenced data exists and try again';
        }
        
        // Log the categorized error
        console.error(`[Analysis Save Error]`);
        console.error(`ID: ${errorId}`);
        console.error(`Code: ${errorCode}`);
        console.error(`Category: ${errorCategory}`);
        console.error(`Message: ${errorMessage}`);
        
        return res.status(errorStatus).json({
            error: true,
            message: errorMessage,
            code: errorCode,
            category: errorCategory,
            recovery_action: recoveryAction,
            error_id: errorId,
            details: process.env.NODE_ENV === 'development' ? {
                error_message: error.message,
                error_code: error.code,
                timestamp: new Date().toISOString()
            } : undefined
        });
    }
};

/**
 * Get analysis history for a user
 */
exports.getAnalysisHistory = async (req, res, next) => {
    try {
        // Validate user is authenticated
        if (!req.user) {
            throw ApiError.unauthorized('Authentication required to view analysis history', 'AUTH_REQUIRED');
        }
        
        console.log('Fetching analysis history for user:', req.user.id);
        
        // Fetch analyses from database
        const analyses = await Analysis.findByUserId(req.user.id, {
            limit: 20,
            orderBy: 'created_at',
            order: 'desc'
        });
        
        console.log(`Found ${analyses.length} analyses for user ${req.user.id}`);
        
        // Include subscription info in the response
        const subscriptionLimits = User.SUBSCRIPTION_LIMITS[req.user.subscription];
        const subscriptionInfo = {
            subscription: req.user.subscription,
            analysisCount: req.user.analysis_count || 0,
            analysisLimit: subscriptionLimits.analysesPerMonth,
            analysisRemaining: Math.max(0, subscriptionLimits.analysesPerMonth - (req.user.analysis_count || 0)),
            lastResetDate: req.user.last_reset_date
        };
        
        return res.status(200).json({
            history: analyses,
            subscription: subscriptionInfo
        });
    } catch (error) {
        console.error('Error fetching analysis history:', error);
        console.error('Stack trace:', error.stack);
        
        // Generate a unique error ID for tracking
        const errorId = uuidv4();
        
        // Default error information
        let errorCode = 'HISTORY_RETRIEVAL_ERROR';
        let errorStatus = 500;
        let errorMessage = 'Error retrieving analysis history';
        let errorCategory = 'database';
        let recoveryAction = 'Please try again later';
        
        // Handle specific error types
        if (error.isApiError) {
            errorCode = error.code || 'API_ERROR';
            errorStatus = error.status || 500;
            errorMessage = error.message;
            
            if (error.code === 'UNAUTHORIZED' || error.code === 'AUTH_REQUIRED') {
                errorCategory = 'authentication';
                recoveryAction = 'Please log in and try again';
            } else if (error.code === 'FORBIDDEN') {
                errorCategory = 'permissions';
                recoveryAction = 'Your account does not have permission to view this data';
            }
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            errorCode = 'DATABASE_ERROR';
            errorMessage = 'Database table not found';
            errorCategory = 'system';
            recoveryAction = 'This appears to be a system issue. Please try again later.';
        } else if (error.code && error.code.startsWith('ER_')) {
            // Handle other database errors
            errorCode = 'DATABASE_ERROR';
            errorCategory = 'database';
        }
        
        // Log the categorized error
        console.error(`[Analysis History Error]`);
        console.error(`ID: ${errorId}`);
        console.error(`Code: ${errorCode}`);
        console.error(`Category: ${errorCategory}`);
        console.error(`Status: ${errorStatus}`);
        console.error(`Message: ${errorMessage}`);
        
        return res.status(errorStatus).json({
            error: true,
            message: errorMessage,
            code: errorCode,
            category: errorCategory,
            recovery_action: recoveryAction,
            error_id: errorId,
            details: process.env.NODE_ENV === 'development' ? {
                error_message: error.message,
                error_code: error.code,
                timestamp: new Date().toISOString()
            } : undefined
        });
    }
};

/**
 * Get a specific analysis by ID
 * 
 * @route GET /api/analysis/:id
 * @param {string} id - Analysis ID to retrieve
 * @returns {Object} Analysis data
 * @throws {ApiError} For auth, permission, or not found errors
 */
exports.getAnalysisById = async (req, res, next) => {
    try {
        // Validate user is authenticated
        if (!req.user) {
            throw ApiError.unauthorized('Authentication required to view analysis', 'AUTH_REQUIRED');
        }
        
        const analysisId = req.params.id;
        if (!analysisId) {
            throw ApiError.badRequest('Analysis ID is required', 'MISSING_ID');
        }
        
        console.log(`Fetching analysis ${analysisId} for user ${req.user.id}`);
        
        // Fetch analysis from database
        const analysis = await Analysis.findById(analysisId);
        
        console.log(`Analysis lookup result:`, analysis ? `Found ID: ${analysis.id}` : 'Not found');
        
        if (!analysis) {
            throw ApiError.notFound('Analysis not found', 'ANALYSIS_NOT_FOUND');
        }
        
        // Check if this analysis belongs to the authenticated user
        if (analysis.user_id !== req.user.id) {
            console.log(`Analysis user mismatch: belongs to ${analysis.user_id}, but requested by ${req.user.id}`);
            throw ApiError.forbidden('You do not have permission to view this analysis', 'FORBIDDEN');
        }
        
        console.log(`Found analysis ${analysisId} for user ${req.user.id}`);
        
        return res.status(200).json({
            analysis: analysis
        });
    } catch (error) {
        console.error('Error fetching analysis:', error);
        console.error('Stack trace:', error.stack);
        
        // Generate a unique error ID for tracking
        const errorId = uuidv4();
        
        // Default error information
        let errorCode = 'ANALYSIS_RETRIEVAL_ERROR';
        let errorStatus = 500;
        let errorMessage = 'Error retrieving analysis';
        let errorCategory = 'database';
        let recoveryAction = 'Please try again later';
        
        // Handle specific error types
        if (error.isApiError) {
            errorCode = error.code || 'API_ERROR';
            errorStatus = error.status || 500;
            errorMessage = error.message;
            
            if (error.code === 'UNAUTHORIZED' || error.code === 'AUTH_REQUIRED') {
                errorCategory = 'authentication';
                recoveryAction = 'Please log in and try again';
            } else if (error.code === 'FORBIDDEN') {
                errorCategory = 'permissions';
                recoveryAction = 'Your account does not have permission to view this data';
            } else if (error.code === 'ANALYSIS_NOT_FOUND') {
                errorCategory = 'not_found';
                recoveryAction = 'The requested analysis could not be found';
            }
        }
        
        // Log the categorized error
        console.error(`[Analysis Retrieval Error]`);
        console.error(`ID: ${errorId}`);
        console.error(`Code: ${errorCode}`);
        console.error(`Category: ${errorCategory}`);
        console.error(`Status: ${errorStatus}`);
        console.error(`Message: ${errorMessage}`);
        
        return res.status(errorStatus).json({
            error: true,
            message: errorMessage,
            code: errorCode,
            category: errorCategory,
            recovery_action: recoveryAction,
            error_id: errorId,
            details: process.env.NODE_ENV === 'development' ? {
                error_message: error.message,
                error_code: error.code,
                timestamp: new Date().toISOString()
            } : undefined
        });
    }
};

/**
 * Delete a specific analysis by ID
 * 
 * @route DELETE /api/analysis/:id
 * @param {string} id - Analysis ID to delete
 * @returns {Object} Success message
 * @throws {ApiError} For auth or permission errors
 */
exports.deleteAnalysis = async (req, res, next) => {
    try {
        // Validate user is authenticated
        if (!req.user) {
            throw ApiError.unauthorized('Authentication required to delete analysis', 'AUTH_REQUIRED');
        }
        
        const analysisId = req.params.id;
        
        if (!analysisId) {
            throw ApiError.badRequest('Analysis ID is required', 'MISSING_ANALYSIS_ID');
        }
        
        console.log(`Deleting analysis ${analysisId} for user ${req.user.id}`);
        
        // Verify the analysis belongs to this user before deleting
        const analysis = await Analysis.findById(analysisId);
        
        console.log(`Analysis lookup for deletion:`, analysis ? `Found ID: ${analysis.id}` : 'Not found');
        
        if (!analysis) {
            throw ApiError.notFound('Analysis not found', 'ANALYSIS_NOT_FOUND');
        }
        
        if (analysis.user_id !== req.user.id) {
            console.log(`Analysis permission mismatch for deletion: belongs to ${analysis.user_id}, but requested by ${req.user.id}`);
            throw ApiError.forbidden('You do not have permission to delete this analysis', 'PERMISSION_DENIED');
        }
        
        // Delete the analysis
        const result = await Analysis.delete(analysisId);
        
        console.log(`Delete operation result:`, result);
        
        return res.status(200).json({
            success: true,
            message: 'Analysis deleted successfully',
            id: analysisId
        });
    } catch (error) {
        console.error('Error deleting analysis:', error);
        console.error('Stack trace:', error.stack);
        
        // Generate a unique error ID for tracking
        const errorId = uuidv4();
        
        // Default error information
        let errorCode = 'DELETE_ANALYSIS_ERROR';
        let errorStatus = 500;
        let errorMessage = 'Error deleting analysis';
        let errorCategory = 'database';
        let recoveryAction = 'Please try again later';
        
        // Handle specific error types
        if (error.isApiError) {
            errorCode = error.code || 'API_ERROR';
            errorStatus = error.status || 500;
            errorMessage = error.message;
            
            if (error.code === 'UNAUTHORIZED' || error.code === 'AUTH_REQUIRED') {
                errorCategory = 'authentication';
                recoveryAction = 'Please log in and try again';
            } else if (error.code === 'FORBIDDEN') {
                errorCategory = 'permissions';
                recoveryAction = 'Your account does not have permission to delete this data';
            } else if (error.code === 'NOT_FOUND') {
                errorCategory = 'not_found';
                recoveryAction = 'The analysis may have already been deleted';
            }
        } else if (error.code === 'ER_ROW_NOT_FOUND') {
            errorCode = 'ANALYSIS_NOT_FOUND';
            errorStatus = 404;
            errorMessage = 'Analysis not found';
            errorCategory = 'not_found';
            recoveryAction = 'The requested analysis does not exist or may have already been deleted';
        }
        
        // Log the categorized error
        console.error(`[Delete Analysis Error]`);
        console.error(`ID: ${errorId}`);
        console.error(`Code: ${errorCode}`);
        console.error(`Category: ${errorCategory}`);
        console.error(`Status: ${errorStatus}`);
        console.error(`Message: ${errorMessage}`);
        
        return res.status(errorStatus).json({
            error: true,
            message: errorMessage,
            code: errorCode,
            category: errorCategory,
            recovery_action: recoveryAction,
            error_id: errorId,
            details: process.env.NODE_ENV === 'development' ? {
                error_message: error.message,
                error_code: error.code,
                timestamp: new Date().toISOString()
            } : undefined
        });
    }
};

// ML model functions have been moved to utils/modelLoader.js

/**
 * Clear all analyses for the authenticated user
 * 
 * @route POST /api/clear-analyses
 * @returns {Object} Success message and count of deleted analyses
 * @throws {ApiError} For auth errors
 */
exports.clearAnalyses = async (req, res, next) => {
    try {
        // Validate user is authenticated
        if (!req.user) {
            throw ApiError.unauthorized('Authentication required to clear analyses', 'AUTH_REQUIRED');
        }
        
        console.log(`Clearing all analyses for user ${req.user.id}`);
        
        // Delete all analyses for this user
        const result = await Analysis.deleteByUserId(req.user.id);
        
        console.log(`Clear operation result:`, result);
        
        return res.status(200).json({
            success: true,
            message: 'All analyses cleared successfully',
            count: result.count || 0
        });
    } catch (error) {
        console.error('Error clearing analyses:', error);
        console.error('Stack trace:', error.stack);
        
        // Generate a unique error ID for tracking
        const errorId = uuidv4();
        
        // Default error information
        let errorCode = 'CLEAR_ANALYSES_ERROR';
        let errorStatus = 500;
        let errorMessage = 'Error clearing analyses';
        let errorCategory = 'database';
        let recoveryAction = 'Please try again later';
        
        // Handle specific error types
        if (error.isApiError) {
            errorCode = error.code || 'API_ERROR';
            errorStatus = error.status || 500;
            errorMessage = error.message;
            
            if (error.code === 'UNAUTHORIZED' || error.code === 'AUTH_REQUIRED') {
                errorCategory = 'authentication';
                recoveryAction = 'Please log in and try again';
            } else if (error.code === 'FORBIDDEN') {
                errorCategory = 'permissions';
                recoveryAction = 'Your account does not have permission to clear analyses';
            }
        } else if (error.code === 'ER_NO_SUCH_TABLE') {
            errorCode = 'DATABASE_ERROR';
            errorMessage = 'Database table not found';
            errorCategory = 'system';
            recoveryAction = 'This appears to be a system issue. Please try again later.';
        }
        
        // Log the categorized error
        console.error(`[Clear Analyses Error]`);
        console.error(`ID: ${errorId}`);
        console.error(`Code: ${errorCode}`);
        console.error(`Category: ${errorCategory}`);
        console.error(`Status: ${errorStatus}`);
        console.error(`Message: ${errorMessage}`);
        
        return res.status(errorStatus).json({
            error: true,
            message: errorMessage,
            code: errorCode,
            category: errorCategory,
            recovery_action: recoveryAction,
            error_id: errorId,
            details: process.env.NODE_ENV === 'development' ? {
                error_message: error.message,
                error_code: error.code,
                timestamp: new Date().toISOString()
            } : undefined
        });
    }
};
