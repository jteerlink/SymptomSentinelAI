import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import fs from 'fs';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://0.0.0.0:5001';

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[Frontend] ${req.method} ${req.originalUrl}`);
  next();
});

// Configure body parsing for JSON and form data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set up API routes proxy to the backend
app.all('/api/*', (req, res) => {
  const backendPath = req.originalUrl;
  const fullBackendUrl = `${BACKEND_URL}${backendPath}`;
  
  console.log(`[Direct Proxy] ${req.method} ${req.originalUrl} → ${fullBackendUrl}`);
  
  // Add connection timeout handling
  req.setTimeout(60000); // 60 second timeout for client requests
  
  // Check if this is a multipart/form-data request (for file uploads)
  const isMultipart = (req.headers['content-type'] || '').includes('multipart/form-data');
  
  if (isMultipart) {
    // For multipart/form-data, use http.request to forward the request as-is
    console.log(`[Direct Proxy] Handling multipart/form-data request`);
    
    // Parse backend URL
    const backendUrlObj = new URL(fullBackendUrl);
    
    // Set up request options
    const options = {
      hostname: backendUrlObj.hostname,
      port: backendUrlObj.port,
      path: backendUrlObj.pathname + backendUrlObj.search,
      method: req.method,
      headers: { ...req.headers }
    };
    
    // Fix host header to match backend
    options.headers.host = `${backendUrlObj.hostname}:${backendUrlObj.port}`;
    
    // Create request to backend
    const proxyReq = http.request(options, (proxyRes) => {
      // Copy status code and headers from backend response
      res.status(proxyRes.statusCode);
      Object.keys(proxyRes.headers).forEach(key => {
        res.set(key, proxyRes.headers[key]);
      });
      
      console.log(`[Direct Proxy] Response from backend: ${proxyRes.statusCode}`);
      
      // Pipe the backend response directly to client response
      proxyRes.pipe(res);
    });
    
    // Handle errors
    proxyReq.on('error', (error) => {
      console.error(`[Direct Proxy] Error: ${error.message}`);
      res.status(502).json({
        error: 'Backend connection error',
        message: error.message,
        url: req.originalUrl
      });
    });
    
    // Pipe the client request body directly to backend request
    req.pipe(proxyReq);
  } else {
    // For JSON and other data, use fetch as before
    import('node-fetch').then(({ default: fetch }) => {
      const fetchOptions = {
        method: req.method,
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/json',
          'Authorization': req.headers['authorization'] || ''
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
  }
});

// Block direct access to the old auth reset path
app.get('/fix-auth-modal.html', (req, res) => {
  // Redirect to the admin version 
  res.redirect('/admin/auth-reset.html');
});

// Static file serving - after API routes to avoid conflicts
app.use(express.static(__dirname));

// Admin routes handling
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/index.html'));
});

// Serve index.html for all other routes except admin paths
app.get('*', (req, res) => {
  // Check if this is an admin route
  if (req.path.startsWith('/admin/')) {
    const adminFile = path.join(__dirname, req.path);
    // Verify file exists
    if (fs.existsSync(adminFile)) {
      res.sendFile(adminFile);
    } else {
      res.sendFile(path.join(__dirname, 'admin/index.html'));
    }
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
  console.log(`API requests will be forwarded to ${BACKEND_URL}`);
});

// Set timeout for server to 2 minutes to handle image uploads
server.timeout = 120000;

// Improve server robustness with proper error handling
server.on('error', (err) => {
  console.error('Frontend server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
  }
});

// Handle process signals
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down frontend server gracefully');
  server.close(() => {
    console.log('Frontend server closed');
  });
});