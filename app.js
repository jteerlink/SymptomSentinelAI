/**
 * Simple entry point for SymptomSentryAI application
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Redirect to the backend server.js
console.log('Starting SymptomSentryAI application...');
console.log('Redirecting to backend/server.js');

// This is just a forwarding module to the real server
const backendServer = require('./backend/server.js');

// In case the backend doesn't start properly, provide a simple response
app.get('*', (req, res) => {
  res.send('SymptomSentryAI server is starting. Please refresh in a moment.');
});

// Only listen if the backend fails to start
if (!backendServer.listening) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Fallback server running at http://0.0.0.0:${PORT}`);
  });
}