/**
 * SymptomSentryAI - Client-side application script
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize application
  initApp();
  
  // Set up periodic health checks
  setInterval(checkServerHealth, 30000);
});

/**
 * Initialize the application
 */
function initApp() {
  console.log('SymptomSentryAI Application Initialized');
  
  // Update current time
  updateTime();
  setInterval(updateTime, 1000);
  
  // Initial health check
  checkServerHealth();
  
  // Set up API test buttons
  setupApiTestButtons();
}

/**
 * Update the current time display
 */
function updateTime() {
  const timeElement = document.getElementById('current-time');
  if (timeElement) {
    timeElement.textContent = new Date().toLocaleString();
  }
}

/**
 * Check server health status
 */
function checkServerHealth() {
  const statusElement = document.getElementById('server-status');
  const uptimeElement = document.getElementById('server-uptime');
  
  if (!statusElement || !uptimeElement) return;
  
  statusElement.innerHTML = '<span class="loader"></span> Checking...';
  
  fetch('/api/health')
    .then(response => {
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Update status indicator
      statusElement.innerHTML = `
        <span class="status-indicator status-healthy"></span>
        <span>Server is running</span>
      `;
      
      // Update uptime
      if (data.serverInfo && data.serverInfo.uptime) {
        uptimeElement.textContent = formatUptime(data.serverInfo.uptime);
      }
    })
    .catch(error => {
      statusElement.innerHTML = `
        <span class="status-indicator status-error"></span>
        <span>Server connection failed: ${error.message}</span>
      `;
      uptimeElement.textContent = 'N/A';
    });
}

/**
 * Set up API test buttons
 */
function setupApiTestButtons() {
  // Get all elements with data-api-endpoint attribute
  const apiButtons = document.querySelectorAll('[data-api-endpoint]');
  
  apiButtons.forEach(button => {
    button.addEventListener('click', () => {
      const endpoint = button.getAttribute('data-api-endpoint');
      testApiEndpoint(endpoint);
    });
  });
}

/**
 * Test a specific API endpoint
 */
function testApiEndpoint(endpoint) {
  const responseElement = document.getElementById('api-response');
  if (!responseElement) return;
  
  responseElement.innerHTML = '<span class="loader"></span> Loading...';
  
  fetch(endpoint)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      responseElement.textContent = JSON.stringify(data, null, 2);
    })
    .catch(error => {
      responseElement.innerHTML = `<span style="color: var(--danger)">Error: ${error.message}</span>`;
    });
}

/**
 * Format uptime in a human-readable way
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`;
}