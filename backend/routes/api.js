// Import required modules
const express = require('express');
const router = express.Router();
const imageAnalysisController = require('../controllers/imageAnalysisController');
const imageUploadController = require('../controllers/imageUploadController');
const userController = require('../controllers/userController');

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
router.post('/analyze', imageAnalysisController.analyzeImage);
router.post('/save-analysis', imageAnalysisController.saveAnalysis);
router.get('/analysis-history', imageAnalysisController.getAnalysisHistory);

// Image Upload Routes
router.post('/upload', imageUploadController.uploadImage);
router.post('/upload-multiple', imageUploadController.uploadMultipleImages);
router.post('/get-presigned-url', imageUploadController.getPresignedUrl);
router.delete('/images/:key(*)', imageUploadController.deleteImage);

// User Routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/user-profile', userController.getUserProfile);
router.put('/update-profile', userController.updateProfile);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('API route error:', err);
    
    // Handle Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size exceeds the 5MB limit'
            });
        }
        return res.status(400).json({
            success: false,
            error: `Upload error: ${err.message}`
        });
    }
    
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = router;
