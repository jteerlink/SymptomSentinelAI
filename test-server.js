/**
 * Absolutely minimal test server for Replit
 */

const http = require('http');

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Test Server</title>
      </head>
      <body>
        <h1>Test Server is Working!</h1>
        <p>This is a simple test to see if the server can be accessed via Replit's webview.</p>
        <p>Current time: ${new Date().toISOString()}</p>
      </body>
    </html>
  `);
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Test server running on port 5000');
});