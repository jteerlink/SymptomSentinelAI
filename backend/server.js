// Import required modules
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./routes/api');

// Create Express app
const app = express();
// Allow for custom port in different workflows to avoid conflicts
// BackendServer workflow should use 3000, App workflow can use 5000
const PORT = process.env.BACKEND_PORT || process.env.PORT || 3000;

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
// Increase limit and configure to handle large payloads for image data
app.use(bodyParser.json({ 
  limit: '50mb', 
  extended: true,
  parameterLimit: 100000 // Increased parameter limit for large requests
})); 
app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: '50mb',
  parameterLimit: 100000 // Increased parameter limit for large requests
}));

// 4a. Cookie parser middleware - needed for authentication cookies
app.use(cookieParser(process.env.COOKIE_SECRET || 'symptom-sentry-cookie-secret'));

// 4b. Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'symptom-sentry-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// 4c. CSRF Protection
const csrfProtection = csrf({ cookie: true });
// We'll apply this selectively to routes that need it

// 4d. Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs per IP
  message: {
    error: true,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

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
const multer = require('multer');
const { authenticate } = require('./middleware/auth'); // Import authentication middleware
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB size limit
    files: 1,  // Maximum 1 file 
    parts: 10  // Maximum 10 parts (fields + files)
  }
});

// Apply authentication middleware to the direct analyze endpoint
app.post('/analyze', authenticate, upload.single('image'), (req, res, next) => {
  console.log('Received request to /analyze - processing directly');
  console.log('Content-Type:', req.headers['content-type']);
  console.log('Request body keys:', Object.keys(req.body));
  
  // Check if request is multipart/form-data (from FormData)
  const isMultipart = req.headers['content-type'] && 
                     req.headers['content-type'].startsWith('multipart/form-data');
  
  if (isMultipart) {
    console.log('Received multipart/form-data request');
    console.log('File present:', !!req.file);
    
    if (req.file) {
      console.log('File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        buffer: `Buffer of ${req.file.buffer.length} bytes`
      });
      
      // Extract relevant data and reconstruct the request body
      req.body.image = req.file.buffer.toString('base64');
      req.body.type = req.body.type || 'throat'; // Use provided type or default to throat
      
      console.log('Reconstructed request body with image data from file upload');
      console.log('Type:', req.body.type);
      console.log('Image data length:', req.body.image.length);
    }
  } else {
    // Original JSON body handling
    console.log('Received JSON request');
    
    // Log image data properties if present
    if (req.body && req.body.image) {
      console.log('Image data present, type:', typeof req.body.image);
      console.log('Image data length:', req.body.image.length);
    } else {
      console.log('No image data in request body');
    }
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
  
  // Check if this is an ApiError instance
  if (err.isApiError) {
    // Use the status and response format from the ApiError
    return res.status(err.status).json(err.toResponse());
  }
  
  // Default error handling for non-ApiError errors
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
