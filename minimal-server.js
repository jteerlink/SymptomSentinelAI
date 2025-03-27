/**
 * Minimal server for testing
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Root path
app.get('/', (req, res) => {
  res.send('Hello from SymptomSentryAI! The server is running.');
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log('Minimal server running on port ' + PORT);
});