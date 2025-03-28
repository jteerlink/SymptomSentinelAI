/**
 * Replit Index.js - The Most Standard Approach
 * Following Replit's exact recommendations for web hosting
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Basic middleware for all requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple home route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SymptomSentryAI</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>SymptomSentryAI</h1>
        <p>Welcome to SymptomSentryAI - Your AI-powered healthcare assistant</p>
        <p>Server is running successfully.</p>
        <p>Current time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});