/**
 * Main Entry Point for SymptomSentryAI Application
 * 
 * This file starts both the backend API server and the frontend server.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting SymptomSentryAI application...');

// Start the backend server
console.log('Starting backend server...');
const backendProcess = spawn('node', ['server.js'], {
  cwd: path.join(process.cwd(), 'backend'),
  env: { 
    ...process.env, 
    NODE_ENV: 'development',
    // Use different port (5000) for App workflow
    PORT: 5000,
    BACKEND_PORT: 5000
  },
  stdio: 'inherit'
});

backendProcess.on('error', (err) => {
  console.error('Backend server error:', err);
});

// Listen for the exit event
backendProcess.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`Backend server exited with code ${code} and signal ${signal}`);
  } else {
    console.log('Backend server stopped');
  }
});

// Start the frontend server after a short delay to ensure backend is up
setTimeout(() => {
  console.log('Starting frontend server...');
  // Use --experimental-modules flag for ES modules support
  const frontendProcess = spawn('node', ['--experimental-modules', 'server.js'], {
    cwd: path.join(process.cwd(), 'frontend'),
    env: { 
      ...process.env, 
      NODE_ENV: 'development',
      // Use port 8000 for frontend in App workflow
      PORT: 8000, 
      FRONTEND_PORT: 8000, 
      // Point to the backend running on port 5000 in App workflow
      BACKEND_URL: 'http://0.0.0.0:5000'
    },
    stdio: 'inherit'
  });

  frontendProcess.on('error', (err) => {
    console.error('Frontend server error:', err);
  });

  // Listen for the exit event
  frontendProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`Frontend server exited with code ${code} and signal ${signal}`);
    } else {
      console.log('Frontend server stopped');
    }
  });
}, 5000);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down servers gracefully...');
  backendProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down servers gracefully...');
  backendProcess.kill('SIGTERM');
  process.exit(0);
});