/**
 * Minimal Express Server for Replit
 */

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;

// Serve static files
app.use(express.static(__dirname));

// Basic health API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});