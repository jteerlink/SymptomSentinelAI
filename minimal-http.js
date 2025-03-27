/**
 * Comprehensive HTTP Server using built-in Node.js http module
 * No Express, no dependencies, just pure Node.js
 * Serves static files and API endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 5000;

// Create server
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204; // No content for OPTIONS
    return res.end();
  }
  
  // Route handling
  if (req.url === '/' || req.url === '/index.html') {
    // Serve index.html
    fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        return res.end(`Server Error: ${err.message}`);
      }
      
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end(content);
    });
  } 
  // API endpoint for health check
  else if (req.url === '/api/health') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      serverInfo: {
        node: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime()
      }
    }));
  }
  // API endpoint for server info
  else if (req.url === '/api/info') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      name: 'SymptomSentryAI HTTP Server',
      version: '1.0.0',
      time: new Date().toISOString(),
      endpoints: [
        { path: '/', method: 'GET', description: 'Static HTML page' },
        { path: '/api/health', method: 'GET', description: 'Health check endpoint' },
        { path: '/api/info', method: 'GET', description: 'Server information' }
      ]
    }));
  }
  // Handle 404 for any other route
  else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <html>
        <head><title>404 Not Found</title></head>
        <body>
          <h1>404 Not Found</h1>
          <p>The requested resource was not found: ${req.url}</p>
          <p><a href="/">Return to Home</a></p>
        </body>
      </html>
    `);
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log('Server is ready to accept connections');
  console.log('Available endpoints:');
  console.log('  - GET /              (Static HTML page)');
  console.log('  - GET /api/health    (Health check endpoint)');
  console.log('  - GET /api/info      (Server information)');
});