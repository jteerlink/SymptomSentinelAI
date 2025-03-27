/**
 * Direct Server for SymptomSentryAI 
 * 
 * A simplified server that directly serves our application with built-in
 * error handling and logging for Replit deployment.
 */

const http = require('http');
const PORT = 5000;

// Define a simple HTML response
const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
  <title>SymptomSentryAI</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.5;
      color: #333;
    }
    h1 { color: #4a69bd; margin-bottom: 1rem; }
    .card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
      margin: 1rem 0;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .success { color: #2ecc71; font-weight: bold; }
    .info { color: #3498db; }
    .warning { color: #e67e22; }
    footer { 
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid #ddd;
      font-size: 0.9rem;
      color: #7f8c8d;
    }
  </style>
</head>
<body>
  <h1>SymptomSentryAI</h1>
  
  <div class="card">
    <p class="success">✅ Server is running</p>
    <p>This is a direct server implementation for the SymptomSentryAI application.</p>
    <p class="info">Server Time: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="card">
    <h2>Available Endpoints</h2>
    <ul>
      <li><strong>/</strong> - This welcome page</li>
      <li><strong>/health</strong> - Health check endpoint</li>
      <li><strong>/api</strong> - API base endpoint</li>
    </ul>
  </div>
  
  <footer>
    SymptomSentryAI - Healthcare AI Assistant &copy; 2025
  </footer>
</body>
</html>
`;

// Create a simple server
const server = http.createServer((req, res) => {
  // Log each request
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Basic routing
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlResponse);
  } 
  else if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      time: new Date().toISOString()
    }));
  }
  else if (req.url === '/api') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      message: 'SymptomSentryAI API', 
      status: 'operational'
    }));
  }
  else {
    // Catch-all for unknown routes
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlResponse);
  }
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Direct server running on http://0.0.0.0:${PORT}`);
  console.log('Server info:', server.address());
});

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
  
  // If port is in use, try to restart on a different port
  if (error.code === 'EADDRINUSE') {
    console.log('Port is already in use, trying a different port...');
    setTimeout(() => {
      server.close();
      server.listen(0, '0.0.0.0');
    }, 1000);
  }
});