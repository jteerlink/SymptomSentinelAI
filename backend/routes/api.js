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
