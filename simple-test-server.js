/**
 * Simple Test Server for Replit
 * 
 * This is a minimal Express server specifically configured for Replit environment.
 * It serves static HTML content to verify if the Replit preview is working.
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());

// Set CORS headers for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Root endpoint
app.get('/', (req, res) => {
  console.log('Root endpoint accessed');
  
  // Send a simple HTML page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SymptomSentryAI Test Page</title>
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
        <h1>SymptomSentryAI Test Page</h1>
        <p class="success">✅ Server is running successfully!</p>
        <p>This is a simple test page to verify that the Express server is operational.</p>
        <p class="info">Server Status: Online</p>
        <p class="info">Port: ${PORT}</p>
        <p class="info">Time: ${new Date().toLocaleString()}</p>
        <hr>
        <p>The following API endpoints are available:</p>
        <ul>
          <li><strong>/health</strong> - Health check endpoint</li>
          <li><strong>/api</strong> - API base endpoint</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString()
  });
});

// API endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'API is operational'
  });
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple test server running at http://0.0.0.0:${PORT}`);
  console.log('Server address:', server.address());
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});