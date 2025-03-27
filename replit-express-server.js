/**
 * Replit Express Server 
 * 
 * This server is specifically configured for Replit environment
 * with all necessary configurations for proper preview pane integration.
 */

const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Static file serving
app.use(express.static(__dirname));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    serverInfo: {
      node: process.version,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  });
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'SymptomSentryAI Express Server',
    version: '1.0.0',
    time: new Date().toISOString(),
    endpoints: [
      { path: '/', method: 'GET', description: 'Static HTML page' },
      { path: '/api/health', method: 'GET', description: 'Health check endpoint' },
      { path: '/api/info', method: 'GET', description: 'Server information' }
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Replit Express Server running on http://0.0.0.0:${PORT}`);
  console.log(`Server is ready to accept connections`);
});