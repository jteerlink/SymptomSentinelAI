// Import required modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// === MIDDLEWARE SETUP - ORDER IS IMPORTANT ===

// 1. Basic request logging - for all requests
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url} from origin: ${req.headers.origin || 'unknown'}`);
  next();
});

// 2. CORS Configuration - must be before other middleware
app.use(cors({
  origin: true, // Reflect the request origin instead of '*' to work better with credentials
  credentials: true, // Allow cookies and credentials to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  preflightContinue: false
}));

// 3. Explicit OPTIONS handling for preflight requests
app.options('*', cors());

// 4. Body parser for JSON and URL-encoded data - critical for API requests
app.use(bodyParser.json({ limit: '50mb' })); 
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// 5. Request body logging for debugging API requests
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path.startsWith('/api/')) {
    if (req.body) {
      console.log(`Request body for ${req.method} ${req.path}:`, 
                  req.body.image ? 
                  {
                    ...req.body,
                    image: req.body.image ? `[Image data: ${typeof req.body.image} of length ${req.body.image.length}]` : undefined
                  } :
                  req.body
      );
    }
  }
  next();
});

// 6. API routes - define before static file serving to prioritize API requests
app.use('/api', apiRoutes);

// 6a. Add direct /analyze endpoint to catch requests that are missing the /api prefix
// This helps maintain backwards compatibility with any direct API calls
app.post('/analyze', (req, res, next) => {
  console.log('Received request to /analyze - processing directly');
  console.log('Request body keys:', Object.keys(req.body));
  console.log('Request body type:', typeof req.body);
  
  // Log image data properties if present
  if (req.body && req.body.image) {
    console.log('Image data present, type:', typeof req.body.image);
    console.log('Image data length:', req.body.image.length);
  } else {
    console.log('No image data in request body');
  }
  
  // Forward to the analyze controller directly instead of using apiRoutes
  const imageAnalysisController = require('./controllers/imageAnalysisController');
  imageAnalysisController.analyzeImage(req, res, next);
});

// 7. Static file serving - after API routes to avoid conflicts
app.use(express.static(path.join(__dirname, '../frontend'), {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    // Disable caching to ensure fresh content during development
    res.set('Cache-Control', 'no-store');
  }
}));
console.log('Serving static files from:', path.join(__dirname, '../frontend'));

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

// Set timeout for server to 2 minutes (120000ms) to handle large image processing
server.timeout = 120000; // Increase from default 2 minutes to avoid 504 Gateway Timeout errors

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
