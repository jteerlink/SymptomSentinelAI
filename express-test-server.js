/**
 * Express Test Server for Replit
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Basic route
app.get('/', (req, res) => {
  console.log('Request received on / from', req.ip);
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Express Test Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .success { color: green; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>Express Test Server is Working!</h1>
        <p class="success">If you can see this, the server is properly connected to Replit's webview.</p>
        <p>Current time: ${new Date().toISOString()}</p>
        <hr>
        <p>Server information:</p>
        <ul>
          <li>Node.js version: ${process.version}</li>
          <li>Express route: ${req.path}</li>
          <li>Client IP: ${req.ip}</li>
          <li>Headers: ${JSON.stringify(req.headers)}</li>
        </ul>
      </body>
    </html>
  `);
});

// API endpoint
app.get('/api/health', (req, res) => {
  console.log('Request received on /api/health from', req.ip);
  res.json({ status: 'ok', message: 'Server is healthy' });
});

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Express test server running on port ${port}`);
  console.log(`Try accessing:`);
  console.log(`- http://localhost:${port}/`);
  console.log(`- http://localhost:${port}/api/health`);
});