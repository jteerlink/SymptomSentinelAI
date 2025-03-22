import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8000;

// Add a request logging middleware
app.use((req, res, next) => {
  console.log(`[Frontend Server] ${req.method} ${req.originalUrl}`);
  next();
});

// Configure body parsing for JSON and form data
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving
app.use(express.static(__dirname));

// API proxy middleware for /api routes 
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  // DO NOT rewrite the path - critical for the proxy to work correctly
  pathRewrite: null,
  // Increase timeouts for image uploads
  proxyTimeout: 120000,
  // Log proxy activity
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`[Proxy] Forwarding ${req.method} ${req.originalUrl} → http://localhost:5000${req.url}`);
    
    // If there's a body, log it (but truncate large data)
    if (req.body && Object.keys(req.body).length > 0) {
      const safeBody = { ...req.body };
      // Don't log full image data
      if (safeBody.image) safeBody.image = `[Image data: ${safeBody.image.length} chars]`;
      console.log(`[Proxy] Request body keys: ${Object.keys(safeBody).join(', ')}`);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`[Proxy] Response from backend: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
  },
  onError: (err, req, res) => {
    console.error(`[Proxy] Error: ${err.message} for ${req.method} ${req.originalUrl}`);
    if (!res.headersSent) {
      res.status(502).json({ 
        error: 'Backend connection error', 
        message: err.message,
        url: req.originalUrl 
      });
    }
  }
}));

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend server running on http://0.0.0.0:${PORT}`);
  console.log(`API requests will be proxied to http://localhost:5000`);
});