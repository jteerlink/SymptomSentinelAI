/**
 * Ultra Minimal Server for Replit
 * Just the bare essentials for a working Express server
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Root endpoint
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>SymptomSentryAI Ultra Minimal</title></head>
      <body>
        <h1>Server is running!</h1>
        <p>This ultra minimal server is working.</p>
        <p>Time: ${new Date().toLocaleString()}</p>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Ultra minimal server running at http://0.0.0.0:${PORT}`);
});