/**
 * Comprehensive HTTP Server using built-in Node.js http module
 * No Express, no dependencies, just pure Node.js
 * Serves static files and API endpoints
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const PORT = process.env.PORT || 5000;

// Log system information for debugging
console.log('Starting server with the following configuration:');
console.log(`Node.js version: ${process.version}`);
console.log(`Platform: ${process.platform}`);
console.log(`Architecture: ${process.arch}`);
console.log(`Hostname: ${os.hostname()}`);
console.log(`Network interfaces: ${JSON.stringify(os.networkInterfaces())}`);
console.log(`Environment PORT: ${process.env.PORT}`);
console.log(`Using PORT: ${PORT}`);

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
  console.log(`Request received: ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
  
  // Log request headers for debugging
  console.log('Request headers:', JSON.stringify(req.headers));
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    res.statusCode = 204; // No content for OPTIONS
    return res.end();
  }
  
  // Parse the URL to get the pathname
  const urlPath = req.url === '/' ? '/index.html' : req.url;
  console.log(`Processing URL path: ${urlPath}`);
  
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
        { path: '/api/info', method: 'GET', description: 'Server information' },
        { path: '/api/debug', method: 'GET', description: 'Debugging information' }
      ]
    }));
  }
  // Debug endpoint to check server configuration
  else if (urlPath === '/api/debug') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    const debugInfo = {
      server: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: process.uptime(),
        hostname: os.hostname(),
        port: PORT,
        envPort: process.env.PORT
      },
      memory: process.memoryUsage(),
      network: os.networkInterfaces(),
      cwd: process.cwd(),
      files: {
        indexHtml: fs.existsSync(path.join(__dirname, 'index.html')),
        publicDir: fs.existsSync(path.join(__dirname, 'public')),
        publicCss: fs.existsSync(path.join(__dirname, 'public/css/style.css')),
        publicJs: fs.existsSync(path.join(__dirname, 'public/js/app.js'))
      },
      date: new Date().toISOString()
    };
    res.end(JSON.stringify(debugInfo, null, 2));
  }
  // Special endpoint for testing Replit webview connection
  else if (urlPath === '/replit-webview-check') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Replit Webview Check</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .success { color: green; }
            .box { border: 1px solid #ccc; padding: 15px; margin: 15px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>SymptomSentryAI Server</h1>
          <div class="box success">
            <h2>✅ Server is running correctly!</h2>
            <p>If you're seeing this page, your server is properly configured and accessible from the Replit webview.</p>
          </div>
          <div class="box">
            <h3>Server Information:</h3>
            <ul>
              <li>Time: ${new Date().toISOString()}</li>
              <li>Node.js: ${process.version}</li>
              <li>Server uptime: ${process.uptime().toFixed(2)} seconds</li>
            </ul>
          </div>
          <p><a href="/">Go to the main application</a></p>
          <script>
            console.log("Replit webview check successful at", new Date().toISOString());
          </script>
        </body>
      </html>
    `);
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

// Add error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
    process.exit(1);
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
  console.log('  - GET /api/debug     (Debugging information)');
  
  // Print a welcome message with instructions
  console.log('\nTo test the server:');
  console.log('1. Access http://localhost:5000/ from your browser');
  console.log('2. Use curl http://localhost:5000/api/health to check API status');
});