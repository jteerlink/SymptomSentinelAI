import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;
const BACKEND_URL = 'http://localhost:5000';

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[Frontend] ${req.method} ${req.originalUrl}`);
  next();
});

// Configure body parsing for JSON and form data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Redirect /api/login to the backend directly without using proxy middleware
app.all('/api/*', (req, res) => {
  const backendPath = req.originalUrl;
  const fullBackendUrl = `${BACKEND_URL}${backendPath}`;
  
  console.log(`[Direct Proxy] ${req.method} ${req.originalUrl} → ${fullBackendUrl}`);
  
  // Create a new fetch request to the backend
  import('node-fetch').then(({ default: fetch }) => {
    const fetchOptions = {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
      }
    };
    
    // Add body for POST/PUT requests
    if (['POST', 'PUT'].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
      console.log(`[Direct Proxy] Request body keys: ${Object.keys(req.body).join(', ')}`);
    }
    
    // Forward the request to backend
    fetch(fullBackendUrl, fetchOptions)
      .then(backendRes => {
        // Copy status code
        res.status(backendRes.status);
        
        // Copy headers
        for (const [key, value] of backendRes.headers.entries()) {
          res.set(key, value);
        }
        
        console.log(`[Direct Proxy] Response from backend: ${backendRes.status}`);
        
        // Return response body
        return backendRes.text();
      })
      .then(bodyText => {
        res.send(bodyText);
      })
      .catch(error => {
        console.error(`[Direct Proxy] Error: ${error.message}`);
        res.status(502).json({
          error: 'Backend connection error',
          message: error.message,
          url: req.originalUrl
        });
      });
  }).catch(error => {
    console.error(`[Direct Proxy] Module error: ${error.message}`);
    res.status(500).json({
      error: 'Server error',
      message: 'Could not load required modules'
    });
  });
});

// Static file serving - after API routes to avoid conflicts
app.use(express.static(__dirname));

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
  console.log(`API requests will be forwarded to ${BACKEND_URL}`);
});