const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  console.log('Setting up API proxy to backend server at http://localhost:5000');
  
  // Create proxy middleware with enhanced configuration for large payloads
  const apiProxy = createProxyMiddleware({
    target: 'http://localhost:5000',
    changeOrigin: true,
    // Log all requests going through the proxy (for debugging)
    logLevel: 'debug',
    // Handle websocket connections if needed
    ws: true,
    // Add custom headers to help debug
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader('X-Proxy-Source', 'frontend-server');
      
      // Log basic request information
      console.log(`Proxying ${req.method} request to: ${req.url}`);
      
      // If it's a POST request with a body, log the size
      if (req.method === 'POST' && req.body) {
        if (req.body.image) {
          console.log(`Request includes image data of length: ${typeof req.body.image === 'string' ? req.body.image.length : 'unknown'}`);
        }
      }
    },
    // Handle proxy response errors
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.writeHead(500, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({
        error: 'Proxy error connecting to backend',
        message: err.message
      }));
    }
  });
  
  // Apply the proxy to all API routes
  app.use('/api', apiProxy);
  
  console.log('Proxy middleware configured successfully');
};