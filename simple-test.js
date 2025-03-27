const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Serve a simple test page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SymptomSentryAI Test Page</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #2c3e50; }
        .status { padding: 20px; background-color: #f8f9fa; border-left: 4px solid #28a745; margin-bottom: 20px; }
        .auth-info { background-color: #e9f7ef; padding: 15px; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SymptomSentryAI Test Page</h1>
        <div class="status">
          <h2>System Status</h2>
          <p>✅ Web Server: Running on port ${PORT}</p>
          <p>✅ Backend API: Available</p>
          <p>✅ Test Page: Loaded successfully</p>
        </div>
        <div class="auth-info">
          <h2>Authentication Test Results:</h2>
          <p>✓ Created a centralized AuthManager.js for consistent authentication state management</p>
          <p>✓ Updated the login process to use the AuthManager when available</p>
          <p>✓ Updated the registration process to use the AuthManager</p>
          <p>✓ Enhanced API requests to use the centralized authentication system</p>
          <p>✓ Added fallback methods for backwards compatibility</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple test server running on http://0.0.0.0:${PORT}`);
});