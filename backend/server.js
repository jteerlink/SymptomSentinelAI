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
app.use(cors({
  origin: '*', // Allow all origins for development
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configure body parser with increased limits for image handling
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the frontend directory with caching disabled for development
app.use(express.static(path.join(__dirname, '../frontend'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    // Disable caching to ensure fresh content during development
    res.set('Cache-Control', 'no-store');
  }
}));
console.log('Serving static files from:', path.join(__dirname, '../frontend'));

// API routes
app.use('/api', apiRoutes);

// Basic logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve the main index.html file for all other routes (SPA support)
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

// Start the server - ensure it's listening on 0.0.0.0 for proper Replit access
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`SymptomSentryAI server running on http://0.0.0.0:${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
});

// Improve server robustness with proper error handling
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
  }
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
