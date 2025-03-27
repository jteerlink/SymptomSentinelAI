/**
 * Minimal server for testing
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set CORS headers for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// Log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint accessed');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Minimal Express Server</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          line-height: 1.6;
        }
        h1 { color: #2c3e50; }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #27ae60; font-weight: bold; }
        .warning { color: #e67e22; font-weight: bold; }
        code {
          background: #f1f1f1;
          padding: 2px 5px;
          border-radius: 3px;
          font-family: SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SymptomSentryAI Minimal Server</h1>
        <p class="success">✅ Server is up and running!</p>
        <p>This is a minimal server implementation using Express.</p>
        <p>Current time: ${new Date().toLocaleString()}</p>

        <h2>Available Endpoints:</h2>
        <ul>
          <li><code>/</code> - This page</li>
          <li><code>/api/health</code> - Health check endpoint</li>
          <li><code>/api/time</code> - Current server time</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Time endpoint
app.get('/api/time', (req, res) => {
  res.json({
    iso: new Date().toISOString(),
    unix: Date.now(),
    formatted: new Date().toLocaleString()
  });
});

// Handle 404s
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Not Found</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: system-ui, sans-serif;
          max-width: 650px;
          margin: 0 auto;
          padding: 20px;
          text-align: center;
        }
        h1 { color: #e74c3c; }
        .container {
          background-color: #f9f9f9;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .btn {
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #3498db;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404 - Not Found</h1>
        <p>The requested page ${req.path} could not be found.</p>
        <a href="/" class="btn">Go Home</a>
      </div>
    </body>
    </html>
  `);
});

// Handle errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Minimal server running at http://0.0.0.0:${port}`);
});