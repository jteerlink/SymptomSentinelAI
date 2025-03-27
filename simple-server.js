/**
 * Ultra-Simple HTTP Server for SymptomSentryAI
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Define port
const PORT = 5000;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} [REQUEST] ${req.method} ${req.url}`);
  
  // Parse URL
  let requestUrl = req.url;
  if (requestUrl === '/') {
    requestUrl = '/index.html';
  }
  
  // API routes
  if (requestUrl === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      serverInfo: {
        node: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    }));
  }
  
  if (requestUrl === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      name: 'SymptomSentryAI',
      version: '1.0.0',
      description: 'AI-powered healthcare application',
      endpoints: [
        { path: '/', method: 'GET', description: 'Main application page' },
        { path: '/api/health', method: 'GET', description: 'Health check endpoint' },
        { path: '/api/info', method: 'GET', description: 'Server information' }
      ]
    }));
  }
  
  // Determine file path
  let filePath = '';
  
  // Handle public directory files
  if (requestUrl.startsWith('/public/')) {
    filePath = path.join(__dirname, requestUrl);
  } else {
    filePath = path.join(__dirname, requestUrl);
  }
  
  // Get file extension
  const extname = path.extname(filePath);
  
  // Default content type
  let contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // Read file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // File not found - try serving index.html for SPA routes
        fs.readFile(path.join(__dirname, 'index.html'), (err, indexContent) => {
          if (err) {
            res.writeHead(404);
            res.end('404 Not Found');
            return;
          }
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexContent, 'utf-8');
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Success - return the file
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`⭐️ Simple HTTP Server running on port ${PORT}`);
  console.log(`📝 Server logs will appear here`);
});