/**
 * Comprehensive HTTP Server using built-in Node.js http module
 * No Express, no dependencies, just pure Node.js
 * Serves static files and API endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = process.env.PORT || 5000;

// MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf'
};

// Function to serve static files
const serveStaticFile = (filePath, res) => {
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      console.log(`File not found: ${filePath}`);
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/html');
      return res.end(`
        <html>
          <head><title>404 Not Found</title></head>
          <body>
            <h1>404 Not Found</h1>
            <p>The requested file was not found: ${filePath}</p>
            <p><a href="/">Return to Home</a></p>
          </body>
        </html>
      `);
    }
    
    // Get the file extension
    const ext = path.extname(filePath);
    
    // Read and serve the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain');
        return res.end(`Server Error: ${err.message}`);
      }
      
      // Set the content type based on file extension
      res.statusCode = 200;
      res.setHeader('Content-Type', MIME_TYPES[ext] || 'text/plain');
      res.end(content);
    });
  });
};

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
  
  // Parse the URL to get the pathname
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  
  // Route handling
  if (urlPath === '/index.html') {
    // Serve index.html
    serveStaticFile(path.join(__dirname, 'index.html'), res);
  } 
  // API endpoint for health check
  else if (urlPath === '/api/health') {
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
  else if (urlPath === '/api/info') {
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
  // Handle static files
  else if (urlPath.startsWith('/public/')) {
    serveStaticFile(path.join(__dirname, urlPath), res);
  }
  // Handle all other routes as potential static files
  else {
    serveStaticFile(path.join(__dirname, urlPath), res);
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