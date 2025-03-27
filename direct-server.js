/**
 * Direct Server for SymptomSentryAI 
 * 
 * A simplified server that directly serves our application with built-in
 * error handling and logging for Replit deployment.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());

// Configure body parser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Cookie parser for authentication
app.use(cookieParser());

// Static file serving
app.use(express.static(path.join(__dirname, 'frontend'), {
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store');
  }
}));
console.log('Serving frontend from:', path.join(__dirname, 'frontend'));

// API routes
app.use('/api', require('./backend/routes/api'));

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: 'SymptomSentryAI Direct Server',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Fallback route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  // ApiError handling
  if (err.isApiError) {
    return res.status(err.status).json(err.toResponse());
  }
  
  // Default error response
  res.status(500).json({
    error: true,
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`SymptomSentryAI direct server running on http://0.0.0.0:${PORT}`);
});

// Improve error handling
server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
    process.exit(1);
  }
});

// Process-level error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit in development to allow for recovery
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});