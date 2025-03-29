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
    
    // We'll only create the debug button if we're in debug mode
    const isDebugMode = false; // Set to true only during development/testing
    
    if (isDebugMode) {
        // Create the debug button for testing logout (initially hidden)
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-logout-container';
        debugDiv.style.position = 'fixed';
        debugDiv.style.bottom = '20px';
        debugDiv.style.right = '20px';
        debugDiv.style.zIndex = '9999';
        debugDiv.style.display = 'none'; // Initially hidden
        debugDiv.innerHTML = `
            <button id="test-logout-btn" class="btn btn-sm btn-outline-danger">
                Test Logout
            </button>
        `;
        document.body.appendChild(debugDiv);
        
        // Add event listener for the logout test button
        document.getElementById('test-logout-btn').addEventListener('click', () => {
            console.log('[Debug] Testing logout function');
            window.SymptomSentryAuth.logout();
        });
    }
    
    // Handle auth state changes
    document.addEventListener('authStateChanged', (event) => {
        console.log('[App] Auth state changed:', event.detail.isAuthenticated ? 'Authenticated' : 'Not authenticated');
        
        // Use the proper function to update UI based on auth state
        if (event.detail.isAuthenticated && event.detail.user) {
            // Use updateProfileUI to update the UI for authenticated user
            if (window.SymptomSentryUtils && window.SymptomSentryUtils.updateProfileUI) {
                window.SymptomSentryUtils.updateProfileUI(
                    event.detail.user.email,
                    event.detail.user.name,
                    event.detail.user,
                    false // Don't show notification
                );
            }
            
            // All component updates are handled directly in the auth-state.js notifyStateChange function
            // for consistency across the application, using the standardized updateAuthState methods
        } else {
            // Handle not authenticated state
            resetUIForUnauthenticatedState();
            
            // All component updates are handled directly in the auth-state.js notifyStateChange function
            // for consistency across the application, using the standardized updateAuthState methods
        }
        
        // All component updates are handled directly in the auth-state.js notifyStateChange function
        // for consistency across the application, using the standardized updateAuthState methods
    });

// Helper function to reset UI for unauthenticated state
function resetUIForUnauthenticatedState() {
    // Update the navigation menu Account link
    const accountNavLink = document.getElementById('account-nav-link');
    if (accountNavLink) {
        accountNavLink.textContent = 'Sign In / Register';
    }
    
    // Update the profile page
    const profileTitle = document.querySelector('.card-title.mt-3');
    const profilePlan = document.querySelector('.card-text.text-muted');
    const signInButton = document.querySelector('.btn.btn-outline-danger.mt-3');
    const accountInfo = document.querySelector('.card-body p');
    
    if (profileTitle) {
        profileTitle.textContent = 'Guest User';
    }
    
    if (profilePlan) {
        profilePlan.innerHTML = '<strong>Not Signed In</strong>';
        // Remove any usage info
        const existingUsageInfo = profilePlan.querySelector('.usage-info');
        if (existingUsageInfo) {
            existingUsageInfo.remove();
        }
    }
    
    if (signInButton) {
        // Reset sign in button
        signInButton.textContent = 'Sign In / Register';
        signInButton.classList.remove('btn-outline-danger');
        signInButton.classList.add('btn-outline-primary');
        
        // Remove and recreate to reset event listeners
        signInButton.replaceWith(signInButton.cloneNode(true));
        
        // Add event listener to the new button
        const newButton = document.querySelector('.btn.btn-outline-primary.mt-3');
        if (newButton) {
            newButton.addEventListener('click', () => {
                console.log('Sign In button clicked');
                window.SymptomSentryApp.handleRegistration();
            });
        }
    }
    
    // Update account info paragraph
    if (accountInfo) {
        accountInfo.textContent = 'Sign in to access your account and analysis history.';
    }
    
    // Hide any profile settings
    const profileSettings = document.querySelector('.profile-settings');
    if (profileSettings) {
        profileSettings.style.display = 'none';
    }
    
    // Disable any login-required elements
    document.querySelectorAll('.login-required').forEach(element => {
        element.classList.add('disabled');
    });
    
    // All component updates are handled directly in the auth-state.js notifyStateChange function
    // for consistency across the application, using the standardized updateAuthState methods
}
    
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
        
        // Ensure credentials are included by default if not explicitly set
        if (!options.credentials) {
            options.credentials = 'include';
        }
        
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
    
    // Initialize Analysis History component
    if (window.SymptomSentryAnalysisHistory && window.SymptomSentryAnalysisHistory.init) {
        window.SymptomSentryAnalysisHistory.init(document.getElementById('analysis-history-component'));
    }
    
    // Set up navigation
    setupNavigation();
    
    // Setup other event listeners
    setupEventListeners();
    
    // Make app logo link to analyze page
    const appLogoLink = document.getElementById('app-logo-link');
    if (appLogoLink) {
        appLogoLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state for nav links
            navLinks.forEach(navLink => {
                if (navLink.getAttribute('data-page') === 'analyze') {
                    navLink.classList.add('active');
                } else {
                    navLink.classList.remove('active');
                }
            });
            
            // Show the analyze page
            showPage('analyze');
        });
    }
    
    // We're disabling automatic sign-in on app startup
    // This ensures users start from a clean, logged-out state
    console.log('[Auth] Automatic sign-in disabled - users will start in logged-out state');
    
    // Setup automatic token refresh timer (will only refresh if user manually logs in later)
    setupTokenRefreshTimer();
    
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
    
    // Show/hide debug logout button based on the active page
    const debugLogoutContainer = document.getElementById('debug-logout-container');
    if (debugLogoutContainer) {
        // Only show on profile page
        if (pageId === 'profile') {
            debugLogoutContainer.style.display = 'block';
        } else {
            debugLogoutContainer.style.display = 'none';
        }
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
    console.log('[Auth] handleRegistration called');
    
    // First remove any existing modals to prevent duplication
    const existingModal = document.getElementById('authModal');
    if (existingModal) {
        console.log('[Auth] Removing existing modal');
        existingModal.remove();
    }
    
    // Create modal container if it doesn't exist
    let modalContainer = document.getElementById('auth-modal-container');
    if (!modalContainer) {
        console.log('[Auth] Creating new modal container');
        modalContainer = document.createElement('div');
        modalContainer.id = 'auth-modal-container';
        modalContainer.style.zIndex = '11000'; // High z-index
        document.body.appendChild(modalContainer);
    } else {
        // Clear existing modal container content
        modalContainer.innerHTML = '';
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
                                        <input type="email" class="form-control" id="login-email" autocomplete="email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="login-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="login-password" autocomplete="current-password" required>
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
                                            <input type="text" class="form-control" id="register-first-name" autocomplete="given-name" required>
                                        </div>
                                        <div class="col-md-6 mb-3">
                                            <label for="register-last-name" class="form-label">Last Name</label>
                                            <input type="text" class="form-control" id="register-last-name" autocomplete="family-name" required>
                                        </div>
                                    </div>
                                    <div class="mb-3">
                                        <label for="register-email" class="form-label">Email address</label>
                                        <input type="email" class="form-control" id="register-email" autocomplete="email" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="register-password" class="form-label">Password</label>
                                        <input type="password" class="form-control" id="register-password" autocomplete="new-password" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="register-confirm-password" class="form-label">Confirm Password</label>
                                        <input type="password" class="form-control" id="register-confirm-password" autocomplete="new-password" required>
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
    
    console.log('[Auth] Modal HTML created, initializing Bootstrap modal');
    
    // Give the DOM a moment to update before initializing the modal
    setTimeout(() => {
        // Get the new modal element
        const authModalElement = document.getElementById('authModal');
        
        if (authModalElement) {
            // Get the Bootstrap modal instance
            try {
                const authModal = new bootstrap.Modal(authModalElement);
                authModal.show();
                console.log('[Auth] Modal displayed successfully');
                
                // Attach form event listeners after modal is shown
                setupAuthFormListeners(authModal);
            } catch (error) {
                console.error('[Auth] Error showing modal:', error);
            }
        } else {
            console.error('[Auth] Modal element not found after creation');
        }
    }, 100);
    
    // Helper function to set up form event listeners
    function setupAuthFormListeners(authModal) {
        console.log('[Auth] Setting up form event listeners');
    
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
            // Use the centralized auth state manager for login if available
            if (window.SymptomSentryAuth && window.SymptomSentryAuth.login) {
                console.log('[Auth] Using centralized auth manager for login');
                await window.SymptomSentryAuth.login(email, password);
                
                // The auth state manager handles notifications and UI updates
                // Just close the modal
                authModal.hide();
            } else {
                // Fallback to legacy login if auth state manager is not available
                console.warn('[Auth] Auth state manager not found, using legacy login');
                
                // Legacy login code
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: 'include' // Include cookies in the request
                });
                
                const responseText = await response.text();
                let data;
                
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    throw new Error('Server response format error. Please try again.');
                }
                
                if (!response.ok) {
                    throw new Error(data.message || 'Login failed');
                }
                
                // Validate the response structure
                if (!data.accessToken && data.token) {
                    data.accessToken = data.token;
                }
                
                if (!data.accessToken || !data.user) {
                    throw new Error('Invalid server response: Missing authentication data');
                }
                
                // Store the tokens and user information
                localStorage.setItem('authToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken || '');
                
                // Calculate token expiration time (1 hour from now)
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 1);
                localStorage.setItem('tokenExpires', expiresAt.toISOString());
                
                // Set the user's profile information - don't show notification from here
                window.SymptomSentryUtils.updateProfileUI(data.user.email, data.user.name, data.user, false);
                
                // Close the modal
                authModal.hide();
                
                // Show success message
                window.SymptomSentryUtils.showNotification('Login successful! Welcome back.', 'success');
            }
        } catch (error) {
            console.error('[Auth] Login error:', error);
            window.SymptomSentryUtils.showNotification(`Login failed: ${error.message}`, 'danger');
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
        const name = `${firstName} ${lastName}`;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        
        console.log('[Registration] Started registration process');
        console.log('[Registration] Form data collected:');
        console.log('- Email:', email);
        console.log('- Name:', name);
        console.log('- Password length:', password.length);
        
        // Validate input data
        console.log('[Registration] Validating form inputs...');
        
        // Check if passwords match
        if (password !== confirmPassword) {
            console.log('[Registration] ❌ Validation failed: Passwords do not match');
            window.SymptomSentryUtils.showNotification('Passwords do not match', 'danger');
            return;
        }
        
        // Check if all fields are filled
        if (!firstName || !lastName || !email || !password) {
            console.log('[Registration] ❌ Validation failed: Missing required fields');
            window.SymptomSentryUtils.showNotification('Please fill in all required fields', 'danger');
            return;
        }

        // Validate email format (simple validation)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.log('[Registration] ❌ Validation failed: Invalid email format');
            window.SymptomSentryUtils.showNotification('Please enter a valid email address', 'danger');
            return;
        }
        
        console.log('[Registration] ✅ Form validation passed');
        console.log('[Registration] Register form submitted for email:', email);
        
        // Show loading state
        const submitButton = e.target.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registering...';
        
        try {
            // Use the centralized auth state manager for registration if available
            if (window.SymptomSentryAuth && window.SymptomSentryAuth.register) {
                console.log('[Registration] Using centralized auth manager for registration');
                
                try {
                    await window.SymptomSentryAuth.register(name, email, password);
                    
                    // The auth state manager handles notifications and UI updates
                    // Just close the modal
                    authModal.hide();
                } catch (error) {
                    console.error('[Registration] Registration failed with error:', error);
                    
                    // Categorize the error for better user feedback
                    let errorMessage;
                    if (error.message.includes('already exists') || error.message.includes('already in use')) {
                        errorMessage = 'An account with this email already exists. Please use a different email or try signing in.';
                    } else if (error.message.includes('password')) {
                        errorMessage = `Password issue: ${error.message}`;
                    } else if (error.message.includes('format')) {
                        errorMessage = `Format error: ${error.message}`;
                    } else {
                        errorMessage = error.message || 'Registration failed, please try again';
                    }
                    
                    // Show error message to user
                    window.SymptomSentryUtils.showNotification(`Registration failed: ${errorMessage}`, 'danger');
                }
            } else {
                // Fallback to legacy registration if auth state manager is not available
                console.warn('[Registration] Auth state manager not found, using legacy registration');
                
                // Call register API
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, password }),
                    credentials: 'include' // Include cookies in the request
                });
                
                // Get the response text and parse as JSON
                const responseText = await response.text();
                let data;
                
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    throw new Error('Server response format error. Please try again.');
                }
                
                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed');
                }
                
                // Verify response contains the expected data
                if (!data.user) {
                    throw new Error('Invalid server response: Missing user data');
                }
                
                // Handle token key variations
                if (!data.accessToken && data.token) {
                    data.accessToken = data.token;
                }
                
                if (!data.accessToken) {
                    throw new Error('Invalid server response: Missing authentication token');
                }
                
                // Store the tokens
                localStorage.setItem('authToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken || '');
                
                // Calculate token expiration time (1 hour from now)
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 1);
                localStorage.setItem('tokenExpires', expiresAt.toISOString());
                
                // Set the user's profile information - don't show notification from here
                window.SymptomSentryUtils.updateProfileUI(data.user.email, data.user.name, data.user, false);
                
                // Close the modal
                authModal.hide();
                
                // Show success message
                window.SymptomSentryUtils.showNotification('Registration successful! Welcome to SymptomSentryAI.', 'success');
            }
        } catch (error) {
            console.error('[Registration] Registration failed with error:', error);
            
            // Categorize the error for better user feedback
            let errorMessage;
            if (error.message.includes('already exists') || error.message.includes('already in use')) {
                errorMessage = 'An account with this email already exists. Please use a different email or try signing in.';
            } else if (error.message.includes('password')) {
                errorMessage = `Password issue: ${error.message}`;
            } else if (error.message.includes('format')) {
                errorMessage = `Format error: ${error.message}`;
            } else {
                errorMessage = error.message || 'Registration failed, please try again';
            }
            
            // Show error message to user
            window.SymptomSentryUtils.showNotification(`Registration failed: ${errorMessage}`, 'danger');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
    } // Close setupAuthFormListeners function
}

// Check if the user has a valid authentication token
function checkAuthState() {
    console.log('[Auth] Checking auth state...');
    
    // Use helper function to check if authenticated
    const isAuthenticated = window.SymptomSentryUtils.isAuthenticated();
    const authToken = isAuthenticated ? window.SymptomSentryUtils.getAuthToken() : null;
    const refreshToken = localStorage.getItem('refreshToken');
    const tokenExpires = localStorage.getItem('tokenExpires');
    
    if (authToken && tokenExpires) {
        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(tokenExpires);
        
        if (now > expiresAt) {
            console.log('[Auth] Token expired, attempting to refresh');
            
            // If we have a refresh token, try to get a new access token
            if (refreshToken) {
                // Attempt token refresh
                fetch('/api/refresh-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ refreshToken }),
                    credentials: 'include' // Include cookies in request
                })
                .then(response => response.json())
                .then(data => {
                    if (data.accessToken) {
                        console.log('[Auth] Token refreshed successfully');
                        
                        // Update stored tokens
                        localStorage.setItem('authToken', data.accessToken);
                        
                        // Calculate new expiration (1 hour from now)
                        const newExpiresAt = new Date();
                        newExpiresAt.setHours(newExpiresAt.getHours() + 1);
                        localStorage.setItem('tokenExpires', newExpiresAt.toISOString());
                        
                        // Get and update user profile
                        window.SymptomSentryApp.getUserProfile();
                    } else {
                        console.log('[Auth] Token refresh failed, clearing auth data');
                        // Clear auth data and show as logged out
                        localStorage.removeItem('authToken');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('tokenExpires');
                        
                        // Update UI to show logged out state
                        window.SymptomSentryUtils.updateProfileUI(null, null, null);
                    }
                })
                .catch(error => {
                    console.error('[Auth] Token refresh error:', error);
                    // Clear auth data and show as logged out
                    localStorage.removeItem('authToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('tokenExpires');
                    
                    // Update UI to show logged out state
                    window.SymptomSentryUtils.updateProfileUI(null, null, null);
                });
            } else {
                console.log('[Auth] No refresh token found, clearing auth data');
                // No refresh token, clear auth data
                localStorage.removeItem('authToken');
                localStorage.removeItem('tokenExpires');
                
                // Update UI to show logged out state
                window.SymptomSentryUtils.updateProfileUI(null, null, null);
            }
        } else {
            console.log('[Auth] Token valid, fetching user profile');
            // Token is still valid, fetch user profile
            window.SymptomSentryApp.getUserProfile();
        }
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
            },
            credentials: 'include' // Include cookies in request
        };
        
        // Add authentication token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
            console.log('[API Request] Using authentication token');
        } else {
            console.log('[API Request] No authentication token available');
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

// Get user profile from the API
window.SymptomSentryApp.getUserProfile = function() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('[Auth] No token found, cannot get user profile');
        return;
    }
    
    window.SymptomSentryApp.apiRequest('user-profile')
        .then(data => {
            console.log('[Auth] User profile data:', data);
            // Update profile UI with user data - don't show notification
            window.SymptomSentryUtils.updateProfileUI(data.email, data.name, data, false);
        })
        .catch(error => {
            console.error('[Auth] Error fetching user profile:', error);
            // If we get a 401 error, token is invalid
            if (error.message && error.message.includes('401')) {
                // Clear auth data
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('tokenExpires');
                
                // Update UI to show logged out state
                window.SymptomSentryUtils.updateProfileUI(null, null, null);
            }
        });
};

// Setup periodic token refresh to avoid expiration issues
function setupTokenRefreshTimer() {
    console.log('[Auth] Setting up token refresh timer');
    
    // Check token every minute
    setInterval(() => {
        const authToken = localStorage.getItem('authToken');
        const tokenExpires = localStorage.getItem('tokenExpires');
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!authToken || !tokenExpires) {
            return; // No token to refresh
        }
        
        const now = new Date();
        const expiresAt = new Date(tokenExpires);
        
        // If token is already expired, attempt to refresh
        if (now > expiresAt) {
            console.log('[Auth] Token expired, attempting refresh');
            refreshAuthToken(refreshToken, true);
            return;
        }
        
        // If token expires in less than 10 minutes, proactively refresh
        const tenMinutesFromNow = new Date(now.getTime() + (10 * 60 * 1000));
        if (expiresAt < tenMinutesFromNow) {
            console.log('[Auth] Token expires in less than 10 minutes, refreshing proactively');
            refreshAuthToken(refreshToken, false);
        }
    }, 60000); // Check every minute
}

// Helper function to refresh the authentication token
function refreshAuthToken(refreshToken, isExpired) {
    if (!refreshToken) {
        console.log('[Auth] No refresh token available');
        if (isExpired) {
            handleFailedTokenRefresh();
        }
        return;
    }
    
    // First try the token validation endpoint which will return a new token
    fetch('/api/validate-token', {
        method: 'GET',
        credentials: 'include' // Include cookies
    })
    .then(response => {
        if (response.ok) {
            return response.json().then(data => {
                if (data.valid && data.accessToken) {
                    console.log('[Auth] Token refreshed via validation endpoint');
                    updateStoredTokens(data.accessToken);
                    return true; // Successfully refreshed
                }
                return false; // Validation succeeded but no new token
            });
        }
        return false; // Validation failed
    })
    .then(isRefreshed => {
        if (!isRefreshed) {
            // Try explicit token refresh as fallback
            return fetch('/api/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.accessToken) {
                    console.log('[Auth] Token refreshed successfully via refresh endpoint');
                    updateStoredTokens(data.accessToken, data.refreshToken);
                    return true;
                }
                throw new Error('Token refresh failed');
            });
        }
        return isRefreshed;
    })
    .catch(error => {
        console.error('[Auth] Token refresh error:', error);
        if (isExpired) {
            handleFailedTokenRefresh();
        }
    });
}

// Update the stored tokens in localStorage
function updateStoredTokens(accessToken, refreshToken = null) {
    localStorage.setItem('authToken', accessToken);
    
    // Calculate new expiration (1 hour from now)
    const newExpiresAt = new Date();
    newExpiresAt.setHours(newExpiresAt.getHours() + 1);
    localStorage.setItem('tokenExpires', newExpiresAt.toISOString());
    
    // Update refresh token if provided
    if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
    }
    
    // Get and update user profile
    if (window.SymptomSentryApp.getUserProfile) {
        window.SymptomSentryApp.getUserProfile();
    }
}

// Handle failed token refresh by clearing auth data
function handleFailedTokenRefresh() {
    console.log('[Auth] Token refresh failed completely, clearing auth data');
    
    // Clear auth data to force re-login
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpires');
    
    // Notify the user that they need to log in again
    window.SymptomSentryUtils.showNotification('Your session has expired. Please log in again.', 'warning');
    
    // Update UI to reflect logged out state - don't show notification
    window.SymptomSentryUtils.updateProfileUI(null, null, null, false);
    
    // Dispatch an event to notify the app of the auth state change
    document.dispatchEvent(new CustomEvent('authStateChanged', {
        detail: { isAuthenticated: false }
    }));
}

// Make sure the init function is defined properly
window.SymptomSentryApp.init = function() {
    console.log('[App] Initializing SymptomSentryAI application');
    
    // Initialize the auth state manager first
    if (window.SymptomSentryAuth && window.SymptomSentryAuth.init) {
        console.log('[App] Initializing auth state manager');
        window.SymptomSentryAuth.init();
    } else {
        console.warn('[App] Auth state manager not found, falling back to legacy auth');
        checkAuthState();
        setupTokenRefreshTimer();
    }
    
    setupNavigation();
    setupEventListeners();
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    console.log('SymptomSentryAI Web App Initialized');
    window.SymptomSentryApp.init();
});