// Import required modules
const express = require('express');
const router = express.Router();
const imageAnalysisController = require('../controllers/imageAnalysisController');
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

// User Routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/user-profile', userController.getUserProfile);
router.put('/update-profile', userController.updateProfile);

// Error handling middleware
router.use((err, req, res, next) => {
    console.error('API route error:', err);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

module.exports = router;
