/**
 * Ultra-basic Express Server for Replit
 * Just HTML serving with minimal configuration
 */

const express = require('express');
const app = express();
const port = 5000;

// Serve static files from current directory
app.use('/', express.static('./'));

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});