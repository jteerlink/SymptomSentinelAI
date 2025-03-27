/**
 * Simple Test Server for Replit
 * 
 * This is a minimal Express server that serves a test page
 * to verify if the Replit preview is working.
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from the root directory
app.use(express.static('.'));

// Test route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SymptomSentryAI Test Page</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .success {
            color: green;
            font-weight: bold;
          }
          .test-section {
            margin-bottom: 20px;
            padding: 15px;
            border: 1px solid #ddd;
            border-radius: 5px;
          }
          button {
            padding: 8px 16px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          #results {
            margin-top: 20px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            min-height: 100px;
          }
        </style>
      </head>
      <body>
        <h1>SymptomSentryAI Test Page</h1>
        <p class="success">✅ Server is running!</p>
        
        <div class="test-section">
          <h2>API Health Check</h2>
          <button onclick="testApiHealth()">Test API Health</button>
          <div id="api-health-result"></div>
        </div>
        
        <div class="test-section">
          <h2>Frontend Files</h2>
          <button onclick="checkFrontendFiles()">Check Frontend Files</button>
          <div id="frontend-files-result"></div>
        </div>
        
        <div class="test-section">
          <h2>Sample Analysis Test</h2>
          <button onclick="testSampleAnalysis()">Test Sample Analysis</button>
          <div id="sample-analysis-result"></div>
        </div>
        
        <h2>Test Results:</h2>
        <div id="results"></div>
        
        <script>
          function logResult(text, isSuccess = true) {
            const results = document.getElementById('results');
            const item = document.createElement('div');
            item.style.color = isSuccess ? 'green' : 'red';
            item.innerHTML = isSuccess ? '✅ ' + text : '❌ ' + text;
            results.appendChild(item);
          }
          
          async function testApiHealth() {
            try {
              const response = await fetch('/api/health');
              const data = await response.json();
              document.getElementById('api-health-result').innerHTML = 
                '<pre style="color: green;">' + JSON.stringify(data, null, 2) + '</pre>';
              logResult('API Health Check: ' + data.status);
            } catch (err) {
              document.getElementById('api-health-result').innerHTML = 
                '<pre style="color: red;">Error: ' + err.message + '</pre>';
              logResult('API Health Check failed: ' + err.message, false);
            }
          }
          
          async function checkFrontendFiles() {
            const files = [
              '/frontend/styles.css', 
              '/frontend/app.js',
              '/frontend/authManager.js'
            ];
            
            const result = document.getElementById('frontend-files-result');
            result.innerHTML = 'Checking files...<br>';
            
            for (const file of files) {
              try {
                const response = await fetch(file);
                if (response.ok) {
                  result.innerHTML += '<div style="color: green;">✅ ' + file + ' found</div>';
                  logResult(file + ' exists');
                } else {
                  result.innerHTML += '<div style="color: red;">❌ ' + file + ' error: ' + response.status + '</div>';
                  logResult(file + ' error: ' + response.status, false);
                }
              } catch (err) {
                result.innerHTML += '<div style="color: red;">❌ ' + file + ' error: ' + err.message + '</div>';
                logResult(file + ' error: ' + err.message, false);
              }
            }
          }
          
          async function testSampleAnalysis() {
            try {
              const response = await fetch('/api/sample-analysis');
              const data = await response.json();
              document.getElementById('sample-analysis-result').innerHTML = 
                '<pre style="color: green;">' + JSON.stringify(data, null, 2) + '</pre>';
              logResult('Sample Analysis API works');
            } catch (err) {
              document.getElementById('sample-analysis-result').innerHTML = 
                '<pre style="color: red;">Error: ' + err.message + '</pre>';
              logResult('Sample Analysis API failed: ' + err.message, false);
            }
          }
        </script>
      </body>
    </html>
  `);
});

// Start the server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('Test server running at http://0.0.0.0:' + PORT);
});

module.exports = server;