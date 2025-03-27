/**
 * Basic HTTP Server for Replit
 * Using Node.js built-in http module for maximum compatibility
 */

const http = require('http');
const PORT = process.env.PORT || 5000;

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  
  // Handle OPTIONS method for CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Route handling
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SymptomSentryAI Basic Test</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            line-height: 1.6;
            color: #333;
          }
          h1 {
            color: #0066cc;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .success {
            color: green;
            font-weight: bold;
          }
          .info {
            color: #0066cc;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>SymptomSentryAI Basic Test</h1>
          <p class="success">✅ Basic HTTP Server is running successfully!</p>
          <p>This is a simple test page using Node's built-in HTTP module.</p>
          <p class="info">Server Status: Online</p>
          <p class="info">Port: ${PORT}</p>
          <p class="info">Time: ${new Date().toLocaleString()}</p>
          <hr>
          <p>The following endpoints are available:</p>
          <ul>
            <li><strong>/health</strong> - Health check endpoint</li>
            <li><strong>/api</strong> - API base endpoint</li>
          </ul>
        </div>
      </body>
      </html>
    `);
  } 
  else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Basic HTTP server is running',
      time: new Date().toISOString(),
      port: PORT
    }));
  }
  else if (req.url === '/api') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'API is operational',
      status: 'success',
      endpoints: [
        { path: '/health', method: 'GET', description: 'Server health check' },
        { path: '/api', method: 'GET', description: 'API status check' }
      ]
    }));
  }
  else {
    // 404 for any other routes
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Basic HTTP server running on http://0.0.0.0:${PORT}`);
  console.log(`Server address:`, server.address());
});