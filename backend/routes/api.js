// Import required modules
const express = require('express');
const multer = require('multer');
const router = express.Router();
const imageAnalysisController = require('../controllers/imageAnalysisController');
const imageUploadController = require('../controllers/imageUploadController');
const userController = require('../controllers/userController');
const { authenticate, optionalAuthenticate } = require('../middleware/auth');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
    }
});

// Health check route
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        message: 'SymptomSentryAI API is running',
        timestamp: new Date().toISOString()
    });
});

// Sample analysis results for verification
router.get('/sample-analysis', (req, res) => {
    // Return sample analysis results from both types (throat and ear)
    const sampleResults = {
        throat: {
            id: 'sample-throat-analysis',
            type: 'throat',
            timestamp: new Date().toISOString(),
            conditions: [
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
            ]
        },
        ear: {
            id: 'sample-ear-analysis',
            type: 'ear',
            timestamp: new Date().toISOString(),
            conditions: [
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
            ]
        }
    };
    
    // Return data
    res.status(200).json(sampleResults);
});

// Image Analysis Routes
router.post('/analyze', authenticate, upload.single('image'), imageAnalysisController.analyzeImage);
router.post('/save-analysis', authenticate, imageAnalysisController.saveAnalysis);
router.get('/analysis-history', authenticate, imageAnalysisController.getAnalysisHistory);

// Image Upload Routes
router.post('/upload', authenticate, upload.single('image'), imageUploadController.uploadImage);
router.post('/upload-multiple', authenticate, upload.array('images', 5), imageUploadController.uploadMultipleImages);
router.post('/presigned-upload', authenticate, imageUploadController.getPresignedUrl);
router.delete('/image', authenticate, imageUploadController.deleteImage);

// User Routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/user-profile', authenticate, userController.getUserProfile);
router.put('/update-profile', authenticate, userController.updateProfile);
router.put('/update-password', authenticate, userController.updatePassword);
router.get('/validate-token', authenticate, userController.validateToken);
router.post('/update-subscription', authenticate, userController.updateSubscription);

// Password Reset and Token Routes
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);
router.post('/refresh-token', userController.refreshToken);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('API route error:', err);
    
    // Default error structure
    const errorResponse = {
        error: true,
        success: false,
        message: err.message || 'Internal server error',
        code: 'SERVER_ERROR'
    };
    
    // Only include details in development mode
    if (process.env.NODE_ENV === 'development') {
        errorResponse.details = err.stack;
    }
    
    // Handle Multer errors (file upload)
    if (err.name === 'MulterError') {
        errorResponse.code = 'UPLOAD_ERROR';
        
        switch (err.code) {
            case 'LIMIT_FILE_SIZE':
                errorResponse.code = 'LIMIT_FILE_SIZE';
                errorResponse.message = 'File size exceeds the 5MB limit';
                return res.status(413).json(errorResponse);
                
            case 'LIMIT_UNEXPECTED_FILE':
                errorResponse.code = 'INVALID_FIELD_NAME';
                errorResponse.message = 'Unexpected field name in upload form';
                return res.status(400).json(errorResponse);
                
            case 'LIMIT_FILE_COUNT':
                errorResponse.code = 'TOO_MANY_FILES';
                errorResponse.message = 'Too many files uploaded at once';
                return res.status(400).json(errorResponse);
                
            case 'LIMIT_PART_COUNT':
                errorResponse.code = 'TOO_MANY_PARTS';
                errorResponse.message = 'Too many parts in multipart form';
                return res.status(400).json(errorResponse);
                
            default:
                errorResponse.message = `File upload error: ${err.message}`;
                return res.status(400).json(errorResponse);
        }
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
        errorResponse.code = 'VALIDATION_ERROR';
        errorResponse.validationErrors = err.errors;
        return res.status(400).json(errorResponse);
    }
    
    // Handle authentication errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        errorResponse.code = 'AUTHENTICATION_ERROR';
        errorResponse.message = 'Authentication failed: ' + (err.name === 'TokenExpiredError' ? 
            'Your session has expired' : 'Invalid token');
        return res.status(401).json(errorResponse);
    }
    
    // Handle database errors
    if (err.code === 'SQLITE_CONSTRAINT' || (err.name === 'Error' && err.message.includes('duplicate key'))) {
        errorResponse.code = 'DATABASE_CONSTRAINT';
        errorResponse.message = 'Database constraint violation';
        return res.status(409).json(errorResponse);
    }
    
    // Handle permission errors
    if (err.status === 403) {
        errorResponse.code = 'PERMISSION_DENIED';
        return res.status(403).json(errorResponse);
    }
    
    // Handle resource not found
    if (err.status === 404) {
        errorResponse.code = 'NOT_FOUND';
        return res.status(404).json(errorResponse);
    }
    
    // Handle subscription limit exceeded
    if (err.code === 'ANALYSIS_LIMIT_EXCEEDED') {
        errorResponse.code = 'ANALYSIS_LIMIT_EXCEEDED';
        errorResponse.message = 'You have reached your monthly analysis limit';
        return res.status(429).json(errorResponse);
    }
    
    // Handle general API errors
    if (err.isApiError) {
        return res.status(err.status || 500).json({
            ...errorResponse,
            code: err.code || errorResponse.code,
            message: err.message
        });
    }
    
    // Default server error
    res.status(err.status || 500).json(errorResponse);
});

module.exports = router;
