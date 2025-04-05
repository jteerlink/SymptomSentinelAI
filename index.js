/**
 * Main Entry Point for SymptomSentryAI Application
 * 
 * This file provides information about starting the application.
 * The servers are now managed by Replit workflows:
 * - Backend server: Use the 'Server' workflow
 * - Frontend server: Use the 'FrontendServer' workflow
 */

console.log('SymptomSentryAI Application Configuration');
console.log('----------------------------------------');
console.log('To run the application:');
console.log('1. Start the backend server using the "Server" workflow');
console.log('   - Command: cd backend && node server.js');
console.log('   - Port: 5000');
console.log('');
console.log('2. Start the frontend server using the "FrontendServer" workflow');
console.log('   - Command: cd frontend && NODE_ENV=development node --experimental-modules server.js');
console.log('   - Port: 8000');
console.log('');
console.log('3. Access the application at: http://localhost:8000');
console.log('');
console.log('Note: The servers have been separated to prevent port conflicts and resource issues.');
console.log('      This allows for better isolation of errors and more reliable operation.');

// Display server status
const { execSync } = require('child_process');
try {
  const backendStatus = execSync('lsof -i:5000 -t').toString().trim();
  console.log('Backend server (port 5000): ' + (backendStatus ? 'RUNNING' : 'NOT RUNNING'));
} catch (e) {
  console.log('Backend server (port 5000): NOT RUNNING');
}

try {
  const frontendStatus = execSync('lsof -i:8000 -t').toString().trim();
  console.log('Frontend server (port 8000): ' + (frontendStatus ? 'RUNNING' : 'NOT RUNNING'));
} catch (e) {
  console.log('Frontend server (port 8000): NOT RUNNING');
}