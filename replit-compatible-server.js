/**
 * Replit-compatible Express Server
 * Following Replit's documentation for web hosting
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Basic route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Replit Compatible Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .success { color: green; font-weight: bold; }
          .info { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Replit-Compatible Server</h1>
        <p class="success">If you can see this page, the server is properly connected to Replit's webview.</p>
        
        <div class="info">
          <p><strong>Server Information:</strong></p>
          <ul>
            <li>Request time: ${new Date().toISOString()}</li>
            <li>Node.js version: ${process.version}</li>
            <li>Path requested: ${req.path}</li>
            <li>Query parameters: ${JSON.stringify(req.query)}</li>
            <li>Your IP: ${req.ip}</li>
          </ul>
        </div>
        
        <p>Try these links:</p>
        <ul>
          <li><a href="/api/health">/api/health</a> - Health check endpoint</li>
          <li><a href="/api/echo?message=hello">/api/echo?message=hello</a> - Echo test</li>
        </ul>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// Echo endpoint
app.get('/api/echo', (req, res) => {
  res.json({
    echo: req.query.message || 'no message provided',
    timestamp: new Date()
  });
});

// Default 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>404 Not Found</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .error { color: red; }
        </style>
      </head>
      <body>
        <h1 class="error">404 Not Found</h1>
        <p>The requested resource was not found on this server.</p>
        <p>Requested URL: ${req.url}</p>
        <p><a href="/">Go back to home</a></p>
      </body>
    </html>
  `);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Server Error</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .error { color: red; }
          .error-details { background: #fff9f9; padding: 10px; border-left: 3px solid red; }
        </style>
      </head>
      <body>
        <h1 class="error">Server Error</h1>
        <p>The server encountered an unexpected error.</p>
        <p><a href="/">Go back to home</a></p>
        <div class="error-details">
          <p>Error details (for debugging):</p>
          <pre>${err.message}</pre>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server started on port ${port}`);
  console.log(`Try these URLs:`);
  console.log(`http://localhost:${port}/`);
  console.log(`http://localhost:${port}/api/health`);
  console.log(`http://localhost:${port}/api/echo?message=hello`);
});