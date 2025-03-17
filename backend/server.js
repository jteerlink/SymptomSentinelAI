// Import required modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware setup
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for image upload
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));
console.log('Serving static files from:', path.join(__dirname, '../frontend'));

// API routes
app.use('/api', apiRoutes);

// Serve the main index.html file for all other routes
app.get('*', (req, res) => {
    console.log('Received request for:', req.url);
    const indexPath = path.join(__dirname, '../frontend/index.html');
    console.log('Sending file:', indexPath);
    res.sendFile(indexPath);
});

// Handle errors
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: true,
        message: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`SymptomSentryAI server running on http://0.0.0.0:${PORT}`);
    console.log('Environment:', process.env.NODE_ENV || 'development');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1); // Exit with failure code
});

module.exports = app; // Export for testing
