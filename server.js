/**
 * Replit-compatible Server for SymptomSentryAI
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [${req.method}] ${req.url}`);
  next();
});

// Enable JSON body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(__dirname, { index: false }));
app.use('/public', express.static('public'));

// API endpoints
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

// Send index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// Start server
app.listen(port, () => {
  console.log(`SymptomSentryAI server running at http://localhost:${port}`);
});