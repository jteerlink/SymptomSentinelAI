/**
 * Combined Application Launcher for SymptomSentryAI
 * 
 * This script starts both the backend server and the frontend server in the correct order:
 * 1. First, it starts the backend server on port 5000
 * 2. Then, it starts the frontend server on port 5000 which proxies API requests to the backend
 * 
 * This is ideal for testing and deployment where proper coordination between
 * frontend and backend services is required.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const BACKEND_PORT = process.env.BACKEND_PORT || 5001; // Use internal port for backend
const COMBINED_PORT = process.env.PORT || 5000; // Use standard port for combined app

console.log('Starting SymptomSentryAI application...');
console.log('================================================================================');

// Store child processes
const processes = [];

// Start backend server first
console.log('Starting backend server...');
const backendProcess = spawn('node', ['server.js'], {
  cwd: path.join(process.cwd(), 'backend'),
  stdio: 'inherit', // Inherit stdio to see logs in the console
  env: {
    ...process.env,
    PORT: BACKEND_PORT
  }
});

console.log(`Backend server process started with PID: ${backendProcess.pid}`);
processes.push(backendProcess);

// Wait for backend to start before launching frontend
setTimeout(() => {
  // Start frontend server
  console.log('Starting frontend server...');
  const frontendProcess = spawn('node', ['server.js'], {
    cwd: path.join(process.cwd(), 'frontend'),
    stdio: 'inherit', // Inherit stdio to see logs in the console
    env: {
      ...process.env,
      PORT: COMBINED_PORT,
      BACKEND_URL: `http://0.0.0.0:${BACKEND_PORT}`
    }
  });

  console.log(`Frontend server process started with PID: ${frontendProcess.pid}`);
  processes.push(frontendProcess);

  // Handle frontend process exit
  frontendProcess.on('exit', (code, signal) => {
    console.error(`Frontend server process exited with code ${code} and signal ${signal}`);
    if (code !== 0) {
      process.exit(1); // Exit this process too if frontend crashes with error
    }
  });
}, 2000); // Wait 2 seconds for backend to initialize

// Handle backend process exit
backendProcess.on('exit', (code, signal) => {
  console.error(`Backend server process exited with code ${code} and signal ${signal}`);
  process.exit(1); // Exit this process too if backend crashes
});

// Handle process signals for graceful shutdown
process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down all processes...');
  processes.forEach(proc => {
    if (!proc.killed) {
      proc.kill('SIGINT');
    }
  });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down all processes...');
  processes.forEach(proc => {
    if (!proc.killed) {
      proc.kill('SIGTERM');
    }
  });
});

// Display application URLs
console.log('Application started successfully.');
console.log(`SymptomSentryAI is running at: http://0.0.0.0:${COMBINED_PORT}`);
console.log('Press Ctrl+C to stop all services.');