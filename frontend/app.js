// App.js - Main application script

// Define the app object in the global namespace to store component initialization functions
window.SymptomSentryApp = window.SymptomSentryApp || {};

// DOM Elements
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page');
const startAnalysisBtn = document.getElementById('start-analysis-btn');

// Initialize components when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('SymptomSentryAI Web App Initialized');
    
    // Listen for subscription updated events from Analysis.js
    document.addEventListener('subscriptionUpdated', (event) => {
        console.log('Subscription updated event received:', event.detail);
        
        // Get the logged in user's email
        const profileTitle = document.querySelector('.card-title.mt-3');
        if (profileTitle && profileTitle.textContent !== 'Guest User') {
            const email = profileTitle.textContent;
            
            // Call updateProfileUI with the subscription info
            window.SymptomSentryUtils.updateProfileUI(email, null, {
                email: email,
                subscription: event.detail.subscription,
                analysisCount: event.detail.analysisCount,
                analysisLimit: event.detail.analysisLimit,
                analysisRemaining: event.detail.analysisRemaining,
                lastResetDate: event.detail.lastResetDate
            });
        }
    });
    
    // --- FETCH INTERCEPTOR ---
    // Completely replace fetch globally to fix the issue with Replit domains
    const originalFetch = window.fetch;
    window.fetch = function(url, options = {}) {
        // Always capture the original URL for debugging
        const originalUrl = url;
        
        try {
            // CRITICAL: Detect and handle Replit URLs by forcing them to be relative
            // This is needed because even with our previous interceptor, the URL was still being
            // constructed incorrectly in some cases
            if (typeof url === 'string') {
                // Case 1: Full Replit URL with domain (most common issue)
                if (url.includes('replit.dev') || url.includes('replit.co')) {
                    const urlObj = new URL(url);
                    url = urlObj.pathname;
                    console.log(`[Fetch Interceptor] Converted Replit URL to relative path: ${url}`);
                } 
                // Case 2: URL has other absolute protocol
                else if (url.includes('://')) {
                    const urlObj = new URL(url);
                    url = urlObj.pathname;
                    console.log(`[Fetch Interceptor] Converted absolute URL to relative path: ${url}`);
                }
                // Case 3: If it's an API call, make sure it has the /api prefix
                else if (url.includes('/analyze') && !url.includes('/api/')) {
                    url = `/api${url}`;
                    console.log(`[Fetch Interceptor] Added /api prefix to URL: ${url}`);
                }
                
                // Final log of URL transformation if it happened
                if (url !== originalUrl) {
                    console.log(`[Fetch Interceptor] URL transformed: ${originalUrl} → ${url}`);
                }
            }
            
            // Add additional debugging headers
            const enhancedOptions = { ...options };
            if (!enhancedOptions.headers) {
                enhancedOptions.headers = {};
            }
            enhancedOptions.headers['X-Client-Source'] = 'frontend-interceptor';
            
            console.log(`[Fetch] Executing fetch to: ${url}`);
            return originalFetch(url, enhancedOptions);
        } catch (error) {
            console.error('[Fetch Interceptor] Error processing URL:', error);
            // Still try the original fetch as fallback
            return originalFetch(originalUrl, options);
        }
    };
    
    // Initialize components
    window.SymptomSentryComponents.initializeImageUpload(document.getElementById('image-upload-component'));
    window.SymptomSentryComponents.initializeAnalysis(document.getElementById('analysis-results-component'));
    window.SymptomSentryComponents.initializeEducation(document.getElementById('education-component'));
    window.SymptomSentryComponents.initializeSubscription(document.getElementById('subscription-component'));
    
    // Set up navigation
    setupNavigation();
    
    // Setup other event listeners
    setupEventListeners();
    
    // Check if user is already logged in
    checkAuthState();
    
    // Add event listener for opening login modal
    window.addEventListener('openLoginModal', () => {
        console.log('[Auth] openLoginModal event captured');
        window.SymptomSentryApp.handleRegistration();
    });
});

// Setup navigation between app pages
function setupNavigation() {
    // Handle navigation link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetPage = link.getAttribute('data-page');
            
            // Update active state for nav links
            navLinks.forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');
            
            // Show the target page, hide others
            showPage(targetPage);
        });
    });
    
    // Start Analysis button on home page
    if (startAnalysisBtn) {
        startAnalysisBtn.addEventListener('click', () => {
            // Update active state for nav links
            navLinks.forEach(navLink => {
                if (navLink.getAttribute('data-page') === 'analyze') {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            });
            
            // Show the analysis page
            showPage('analyze');
        });
    }
}

// Show a specific page and hide others
function showPage(pageId) {
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.add('active');
    }
}

// Setup additional event listeners
function setupEventListeners() {
    // Check if TensorFlow.js is loaded
    if (window.tf) {
        console.log('TensorFlow.js loaded successfully:', tf.version);
        
        // Warm up TensorFlow.js
        tf.ready().then(() => {
            console.log('TensorFlow.js is ready');
        });
    } else {
        console.error('TensorFlow.js failed to load');
    }
    
    // Handle window resize for responsive adjustments
    window.addEventListener('resize', () => {
        // Add any responsive layout adjustments here if needed
    });
    
    // Sign In / Register button handler
    const signInRegisterBtn = document.querySelector('.btn.btn-outline-primary.mt-3');
    if (signInRegisterBtn) {
        signInRegisterBtn.addEventListener('click', () => {
            console.log('Sign In / Register button clicked');
            window.SymptomSentryApp.handleRegistration();
        });
    }
}



// Handle account registration
window.SymptomSentryApp.handleRegistration = function() {
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('auth-modal-container');
    if (!modalContainer) {
        modalContainer = document.createElement('div');
        modalContainer.id = 'auth-modal-container';
        document.body.appendChild(modalContainer);
    }
    
    // Set up the modal content
    modalContainer.innerHTML = `
        <div class="modal fade auth-modal" id="authModal" tabindex="-1" aria-labelledby="authModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="authModalLabel">Sign In / Register</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <ul class="nav nav-tabs" id="authTabs" role="tablist">
                            <li class="nav-item" role="presentation">
                                <button class="nav-link active" id="login-tab" data-bs-toggle="tab" data-bs-target="#login" type="button" role="tab" aria-controls="login" aria-selected="true">Sign In</button>
                            </li>
                            <li class="nav-item" role="presentation">
                                <button class="nav-link" id="register-tab" data-bs-toggle="tab" data-bs-target="#register" type="button" role="tab" aria-controls="register" aria-selected="false">Register</button>
                            </li>
                        </ul>
                        <div class="tab-content" id="authTabsContent">
                            <div class="tab-pane fade show active" id="login" role="tabpanel" aria-labelledby="login-tab">
                                <form id="login-form" class="mt-3">
                                    <div class="mb-3">
                                        <label for="login-email" class="form-label">Email address</label>
                                        <input type="email" class="form-control" id="login-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="login-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="login-password" required>
                                    </div>
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="remember-me">
                                        <label class="form-check-label" for="remember-me">Remember me</label>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <a href="#" class="text-decoration-none small">Forgot password?</a>
                                        <button type="submit" class="btn btn-primary">Sign In</button>
                                    </div>
                                </form>
                            </div>
                            <div class="tab-pane fade" id="register" role="tabpanel" aria-labelledby="register-tab">
                                <form id="register-form" class="mt-3">
                                    <div class="row">
                                        <div class="col-md-6 mb-3">
                                            <label for="register-first-name" class="form-label">First Name</label>
                                            <input type="text" class="form-control" id="register-first-name" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="register-last-name" class="form-label">Last Name</label>
                                            <input type="text" class="form-control" id="register-last-name" required>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="register-email" class="form-label">Email address</label>
                                        <input type="email" class="form-control" id="register-email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="register-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="register-password" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="register-confirm-password" class="form-label">Confirm Password</label>
                                        <input type="password" class="form-control" id="register-confirm-password" required>
                                    </div>
                                    <div class="mb-3 form-check">
                                        <input type="checkbox" class="form-check-input" id="terms-checkbox" required>
                                        <label class="form-check-label" for="terms-checkbox">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></label>
                                    </div>
                                    <div class="text-end">
                                        <button type="submit" class="btn btn-primary">Register</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Get the Bootstrap modal instance
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    authModal.show();
    
    // Add event listeners for form submissions
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        console.log('Login form submitted for email:', email);
        
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Signing in...';
        
        try {
            // Create the payload
            const payload = JSON.stringify({ email, password });
            console.log('[Fetch] Executing fetch to: /api/login');
            console.log('[Fetch] Request payload:', { email, password: '********' });
            
            // Call login API
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: payload
            });
            
            console.log('[Fetch] Response status:', response.status, response.statusText);
            console.log('[Fetch] Response headers:', Object.fromEntries([...response.headers.entries()]));
            
            // Get the response text first to debug any parsing issues
            const responseText = await response.text();
            console.log('[Fetch] Raw response text:', responseText);
            
            // Try to parse the response as JSON
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('[Fetch] Parsed response data:', data);
            } catch (parseError) {
                console.error('[Fetch] JSON parse error:', parseError);
                console.error('[Fetch] Failed to parse response text:', responseText);
                throw new Error('Server response format error. Please try again.');
            }
            
            // Check if the response contains an error 
            if (!response.ok) {
                console.error('[Fetch] Error response:', data);
                throw new Error(data.message || 'Login failed');
            }
            
            // Validate the response structure
            if (!data.accessToken) {
                console.error('[Fetch] Missing access token in response:', data);
                throw new Error('Invalid server response: Missing authentication token');
            }
            
            if (!data.user) {
                console.error('[Fetch] Missing user data in response:', data);
                throw new Error('Invalid server response: Missing user data');
            }
            
            console.log('[Auth] Login successful, storing tokens and user data');
            
            // Store tokens in localStorage
            localStorage.setItem('authToken', data.accessToken);
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            
            if (rememberMe) {
                localStorage.setItem('userEmail', email);
            } else {
                localStorage.removeItem('userEmail');
            }
            
            // Update UI to reflect logged in state
            console.log('[UI] Updating profile with user data:', {
                email: data.user.email,
                name: data.user.name,
                subscription: data.user.subscription
            });
            
            window.SymptomSentryUtils.updateProfileUI(data.user.email, data.user.name, data.user);
            
            // Check if there were analysis results waiting to be saved
            const pendingResults = sessionStorage.getItem('pendingAnalysisResults');
            if (pendingResults) {
                try {
                    console.log('[Analysis] Saving pending analysis results');
                    // Attempt to save the pending results now that user is logged in
                    await window.SymptomSentryApp.apiRequest('/api/save-analysis', 'POST', JSON.parse(pendingResults));
                    window.SymptomSentryUtils.showNotification('Analysis results saved successfully!', 'success');
                    sessionStorage.removeItem('pendingAnalysisResults');
                } catch (saveError) {
                    console.error('[Analysis] Error saving pending analysis:', saveError);
                }
            }
            
            // Show success notification and close modal
            window.SymptomSentryUtils.showNotification('Login successful!', 'success');
            authModal.hide();
        } catch (error) {
            console.error('Login error:', error);
            window.SymptomSentryUtils.showNotification(error.message || 'Login failed. Please check your credentials.', 'danger');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
    
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const firstName = document.getElementById('register-first-name').value;
        const lastName = document.getElementById('register-last-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        // Simple validation
        if (password !== confirmPassword) {
            window.SymptomSentryUtils.showNotification('Passwords do not match!', 'danger');
            return;
        }
        
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Creating account...';
        
        try {
            // Format full name for the API
            const name = `${firstName} ${lastName}`.trim();
            
            // Call register API
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    password, 
                    name
                })
            });
            
            // Parse the response JSON data
            const data = await response.json();
            
            // Check if the response contains an error
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            
            // Store tokens in localStorage
            localStorage.setItem('authToken', data.accessToken);
            if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
            }
            
            // Automatically log the user in after successful registration
            window.SymptomSentryUtils.updateProfileUI(data.user.email, data.user.name, data.user);
            
            // Show success notification and close modal
            window.SymptomSentryUtils.showNotification('Account created successfully!', 'success');
            authModal.hide();
        } catch (error) {
            console.error('Registration error:', error);
            window.SymptomSentryUtils.showNotification(error.message || 'Registration failed. Please try again.', 'danger');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });

// showNotification function is now imported from utils.js

// formatNameProperCase function is now imported from utils.js

// Check if user is already authenticated and update UI accordingly
function checkAuthState() {
    const authToken = localStorage.getItem('authToken');
    
    if (authToken) {
        console.log('[Auth] Found existing auth token, verifying...');
        
        // Verify token and get user profile
        fetch('/api/user-profile', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Token invalid or expired');
            }
            return response.json();
        })
        .then(data => {
            console.log('[Auth] Token valid, user data:', data);
            if (data.user) {
                window.SymptomSentryUtils.updateProfileUI(data.user.email, data.user.name, data.user);
                window.SymptomSentryUtils.showNotification('Welcome back!', 'success');
            }
        })
        .catch(error => {
            console.error('[Auth] Token validation failed:', error);
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            localStorage.removeItem('refreshToken');
        });
    } else {
        console.log('[Auth] No existing auth token found');
    }
}

// API request utility function for making backend API calls
window.SymptomSentryApp.apiRequest = async function(endpoint, method = 'GET', data = null) {
    try {
        // Set up request options
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        // Add authentication token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Add body data for POST/PUT requests
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        // Fix endpoint to ensure it has the correct /api/ prefix
        // The backend expects paths with the /api/ prefix
        const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : 
                            endpoint.startsWith('api/') ? `/${endpoint}` : 
                            `/api/${endpoint}`;
        
        console.log(`API request to: ${apiEndpoint}`, token ? 'with authentication' : 'without authentication');
        
        // Make the request
        const response = await fetch(apiEndpoint, options);
        
        // Parse response data once
        const responseData = await response.json().catch(() => null);
        
        // Handle error responses
        if (!response.ok) {
            throw new Error(
                (responseData && responseData.message) || 
                `API request failed with status ${response.status}`
            );
        }
        
        return responseData;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
};

// Close the app initialization
