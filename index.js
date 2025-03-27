/**
 * Replit-Specific Server for SymptomSentryAI
 * 
 * This server is designed to work with Replit's specific hosting capabilities
 * using the standard Replit web-hosting conventions.
 */

const express = require('express');
const path = require('path');

// Create Express app
const app = express();
const PORT = 5000;  // Explicitly use port 5000 as required by Replit

// Set up logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// CORS configuration for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Set up JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the public directory with correct path
app.use('/public', express.static(path.join(__dirname, 'public')));

// Serve static files from root directory (for index.html)
app.use(express.static(__dirname));

// API routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    serverInfo: {
      node: process.version,
      platform: process.platform,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'SymptomSentryAI',
    version: '1.0.0',
    description: 'AI-powered healthcare application',
    endpoints: [
      { path: '/', method: 'GET', description: 'Main application page' },
      { path: '/api/health', method: 'GET', description: 'Health check endpoint' },
      { path: '/api/info', method: 'GET', description: 'Server information' }
    ]
  });
});

// Default route handler for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({
    error: 'Server error',
    message: err.message
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⭐️ SymptomSentryAI server running on port ${PORT}`);
  console.log(`📝 Server logs will appear here`);
  console.log(`🌐 Access the application at: https://[replit-subdomain].replit.app/`);
});