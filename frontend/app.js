// Import components
import { initializeImageUpload } from './components/ImageUpload.js';
import { initializeAnalysis } from './components/Analysis.js';
import { initializeEducation } from './components/Education.js';
import { initializeSubscription } from './components/Subscription.js';

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
            updateProfileUI(email, null, {
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
    initializeImageUpload(document.getElementById('image-upload-component'));
    initializeAnalysis(document.getElementById('analysis-results-component'));
    initializeEducation(document.getElementById('education-component'));
    initializeSubscription(document.getElementById('subscription-component'));
    
    // Set up navigation
    setupNavigation();
    
    // Setup other event listeners
    setupEventListeners();
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
            handleRegistration();
        });
    }
}



// Handle account registration
function handleRegistration() {
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
            if (!data.token) {
                console.error('[Fetch] Missing token in response:', data);
                throw new Error('Invalid server response: Missing authentication token');
            }
            
            if (!data.user) {
                console.error('[Fetch] Missing user data in response:', data);
                throw new Error('Invalid server response: Missing user data');
            }
            
            console.log('[Auth] Login successful, storing token and user data');
            
            // Store token in localStorage
            localStorage.setItem('authToken', data.token);
            
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
            
            updateProfileUI(data.user.email, data.user.name, data.user);
            
            // Check if there were analysis results waiting to be saved
            const pendingResults = sessionStorage.getItem('pendingAnalysisResults');
            if (pendingResults) {
                try {
                    console.log('[Analysis] Saving pending analysis results');
                    // Attempt to save the pending results now that user is logged in
                    const { apiRequest } = await import('./app.js');
                    await apiRequest('/api/save-analysis', 'POST', JSON.parse(pendingResults));
                    showNotification('Analysis results saved successfully!', 'success');
                    sessionStorage.removeItem('pendingAnalysisResults');
                } catch (saveError) {
                    console.error('[Analysis] Error saving pending analysis:', saveError);
                }
            }
            
            // Show success notification and close modal
            showNotification('Login successful!', 'success');
            authModal.hide();
        } catch (error) {
            console.error('Login error:', error);
            showNotification(error.message || 'Login failed. Please check your credentials.', 'danger');
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
            showNotification('Passwords do not match!', 'danger');
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
            
            // Store token in localStorage
            localStorage.setItem('authToken', data.token);
            
            // Automatically log the user in after successful registration
            updateProfileUI(data.user.email, data.user.name, data.user);
            
            // Show success notification and close modal
            showNotification('Account created successfully!', 'success');
            authModal.hide();
        } catch (error) {
            console.error('Registration error:', error);
            showNotification(error.message || 'Registration failed. Please try again.', 'danger');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonText;
        }
    });
    
    // Helper function to update profile UI after login/registration
    function updateProfileUI(email, name = null, user = null) {
        // If user is not provided, create a default user object
        if (!user) {
            user = {
                email: email,
                name: name,
                subscription: 'free',
                analysisCount: 0,
                analysisLimit: 5,
                analysisRemaining: 5,
                lastResetDate: new Date().toISOString()
            };
        }
        // Update the navigation menu Account link
        const accountNavLink = document.getElementById('account-nav-link');
        if (accountNavLink) {
            accountNavLink.textContent = 'Manage Account';
        }
        
        // Update the profile page to show logged in state
        const profileIcon = document.querySelector('.profile-icon');
        const profileTitle = document.querySelector('.card-title.mt-3');
        const profilePlan = document.querySelector('.card-text.text-muted');
        const signInButton = document.querySelector('.btn.btn-outline-primary.mt-3');
        const accountInfo = document.querySelector('.card-body p');
        const accountInfoCard = document.querySelector('.card-body');
        
        if (profileTitle) {
            profileTitle.textContent = name || email.split('@')[0];
        }
        
        if (profilePlan) {
            // Determine plan display name (capitalize first letter)
            const planName = user?.subscription ? 
                user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1) : 
                'Free';
            
            profilePlan.textContent = `${planName} Plan`;
            
            // If user has subscription data and is on free plan, add analysis count details
            if (user?.subscription === 'free' && user.analysisCount !== undefined) {
                const analysisLimit = user.analysisLimit || 5;
                const analysisRemaining = user.analysisRemaining !== undefined ? 
                    user.analysisRemaining : 
                    (analysisLimit - user.analysisCount);
                
                // Add analysis count info
                profilePlan.textContent += ` • ${analysisRemaining} of ${analysisLimit} analyses remaining`;
                
                // If running low on analyses, add upgrade prompt
                if (analysisRemaining <= 2) {
                    const upgradePrompt = document.createElement('div');
                    upgradePrompt.className = 'alert alert-warning mt-2 mb-0';
                    upgradePrompt.innerHTML = `
                        <i class="fas fa-exclamation-circle"></i> 
                        <strong>${analysisRemaining === 0 ? 'You\'ve reached your monthly limit!' : 'Running low on analyses!'}</strong>
                        <p class="mb-1">Upgrade to Premium for unlimited analyses.</p>
                        <button class="btn btn-sm btn-warning upgrade-btn mt-1">
                            <i class="fas fa-arrow-circle-up"></i> Upgrade to Premium
                        </button>
                    `;
                    
                    // Add after the plan text
                    profilePlan.parentNode.insertBefore(upgradePrompt, profilePlan.nextSibling);
                    
                    // Add event listener to upgrade button
                    const upgradeBtn = upgradePrompt.querySelector('.upgrade-btn');
                    if (upgradeBtn) {
                        upgradeBtn.addEventListener('click', () => {
                            showPage('subscription');
                        });
                    }
                }
            }
        }
        
        if (signInButton) {
            signInButton.textContent = 'Manage Account';
            // Change the functionality of the button to manage account
            signInButton.removeEventListener('click', handleRegistration);
            signInButton.addEventListener('click', () => {
                showPage('profile-page');
            });
        }
        
        // Update the account information card with more detailed information
        if (accountInfoCard) {
            // Remove existing content
            while (accountInfoCard.firstChild) {
                accountInfoCard.removeChild(accountInfoCard.firstChild);
            }
            
            // Extract first name for display (with proper case)
            let firstName = '';
            let lastName = '';
            
            if (user.name) {
                const nameParts = user.name.trim().split(/\s+/);
                if (nameParts.length >= 1) {
                    // Format with proper case (first letter uppercase, rest lowercase)
                    firstName = formatNameProperCase(nameParts[0]);
                }
                if (nameParts.length >= 2) {
                    lastName = nameParts.slice(1).join(' ');
                }
            } else if (email) {
                // If no name, use the part before @ in email
                firstName = email.split('@')[0];
                // Format with proper case
                firstName = formatNameProperCase(firstName);
            }
            
            // Format subscription plan name (capitalize first letter)
            const planName = user?.subscription ? 
                user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1) : 
                'Free';
            
            // Use the specific first name or formatted email username
            const displayName = firstName || email.split('@')[0];
            
            // Create and append new content
            const dateJoined = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            const infoHTML = `
                <h5 class="mb-3">Account Information</h5>
                <p><strong>Name:</strong> <span id="display-name">${displayName}</span> <span id="display-last-name">${lastName}</span></p>
                <p><strong>Email:</strong> <span id="display-email">${email}</span></p>
                <p><strong>Member since:</strong> ${dateJoined}</p>
                <p><strong>Subscription:</strong> ${planName} Plan</p>
                <p><strong>Images analyzed:</strong> ${user.analysisCount || 0}</p>
                
                <!-- Edit Profile Form - Hidden by default -->
                <div id="edit-profile-form" class="mt-3 mb-3 border p-3 rounded bg-light" style="display: none;">
                    <h6 class="mb-3">Edit Profile Information</h6>
                    <div class="mb-3">
                        <label for="edit-first-name" class="form-label">First Name</label>
                        <input type="text" class="form-control form-control-sm" id="edit-first-name" value="${firstName}">
                    </div>
                    <div class="mb-3">
                        <label for="edit-last-name" class="form-label">Last Name</label>
                        <input type="text" class="form-control form-control-sm" id="edit-last-name" value="${lastName}">
                    </div>
                    <div class="mb-3">
                        <label for="edit-email" class="form-label">Email</label>
                        <input type="email" class="form-control form-control-sm" id="edit-email" value="${email}">
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button id="cancel-edit-profile" class="btn btn-outline-secondary btn-sm">Cancel</button>
                        <button id="save-profile" class="btn btn-primary btn-sm">Save Changes</button>
                    </div>
                </div>
                
                <!-- Change Password Form - Hidden by default -->
                <div id="change-password-form" class="mt-3 mb-3 border p-3 rounded bg-light" style="display: none;">
                    <h6 class="mb-3">Change Password</h6>
                    <div class="mb-3">
                        <label for="current-password" class="form-label">Current Password</label>
                        <input type="password" class="form-control form-control-sm" id="current-password">
                    </div>
                    <div class="mb-3">
                        <label for="new-password" class="form-label">New Password</label>
                        <input type="password" class="form-control form-control-sm" id="new-password">
                    </div>
                    <div class="mb-3">
                        <label for="confirm-new-password" class="form-label">Confirm New Password</label>
                        <input type="password" class="form-control form-control-sm" id="confirm-new-password">
                    </div>
                    <div class="d-flex justify-content-end gap-2">
                        <button id="cancel-change-password" class="btn btn-outline-secondary btn-sm">Cancel</button>
                        <button id="save-password" class="btn btn-primary btn-sm">Update Password</button>
                    </div>
                </div>
                
                <div class="d-grid gap-2 mt-4">
                    <button id="edit-profile-btn" class="btn btn-outline-primary btn-sm">Edit Profile</button>
                    <button id="change-password-btn" class="btn btn-outline-primary btn-sm">Change Password</button>
                    <button id="sign-out-btn" class="btn btn-outline-danger btn-sm">Sign Out</button>
                </div>
            `;
            
            accountInfoCard.innerHTML = infoHTML;
            
            // Add event listeners for the account management buttons
            
            // Edit Profile Button
            const editProfileBtn = accountInfoCard.querySelector('#edit-profile-btn');
            const editProfileForm = accountInfoCard.querySelector('#edit-profile-form');
            const cancelEditProfileBtn = accountInfoCard.querySelector('#cancel-edit-profile');
            const saveProfileBtn = accountInfoCard.querySelector('#save-profile');
            
            if (editProfileBtn && editProfileForm) {
                editProfileBtn.addEventListener('click', () => {
                    editProfileForm.style.display = 'block';
                    if (document.getElementById('change-password-form')) {
                        document.getElementById('change-password-form').style.display = 'none';
                    }
                });
            }
            
            if (cancelEditProfileBtn) {
                cancelEditProfileBtn.addEventListener('click', () => {
                    editProfileForm.style.display = 'none';
                });
            }
            
            if (saveProfileBtn) {
                saveProfileBtn.addEventListener('click', async () => {
                    const newFirstName = document.getElementById('edit-first-name').value;
                    const newLastName = document.getElementById('edit-last-name').value;
                    const newEmail = document.getElementById('edit-email').value;
                    
                    try {
                        // Combine first and last name to match backend expectations
                        const name = `${newFirstName} ${newLastName}`.trim();
                        
                        // Make API request to update user profile
                        const response = await apiRequest('/api/update-profile', 'PUT', {
                            name: name,
                            email: newEmail
                        });
                        
                        // Update UI
                        document.getElementById('display-name').textContent = formatNameProperCase(newFirstName);
                        document.getElementById('display-last-name').textContent = newLastName;
                        document.getElementById('display-email').textContent = newEmail;
                        
                        if (profileTitle) {
                            profileTitle.textContent = `${formatNameProperCase(newFirstName)} ${newLastName}`.trim();
                        }
                        
                        // Hide form
                        editProfileForm.style.display = 'none';
                        
                        showNotification('Profile updated successfully', 'success');
                    } catch (error) {
                        showNotification('Failed to update profile: ' + (error.message || 'Unknown error'), 'danger');
                    }
                });
            }
            
            // Change Password Button
            const changePasswordBtn = accountInfoCard.querySelector('#change-password-btn');
            const changePasswordForm = accountInfoCard.querySelector('#change-password-form');
            const cancelChangePasswordBtn = accountInfoCard.querySelector('#cancel-change-password');
            const savePasswordBtn = accountInfoCard.querySelector('#save-password');
            
            if (changePasswordBtn && changePasswordForm) {
                changePasswordBtn.addEventListener('click', () => {
                    changePasswordForm.style.display = 'block';
                    if (document.getElementById('edit-profile-form')) {
                        document.getElementById('edit-profile-form').style.display = 'none';
                    }
                });
            }
            
            if (cancelChangePasswordBtn) {
                cancelChangePasswordBtn.addEventListener('click', () => {
                    changePasswordForm.style.display = 'none';
                });
            }
            
            if (savePasswordBtn) {
                savePasswordBtn.addEventListener('click', async () => {
                    const currentPassword = document.getElementById('current-password').value;
                    const newPassword = document.getElementById('new-password').value;
                    const confirmNewPassword = document.getElementById('confirm-new-password').value;
                    
                    // Validate passwords
                    if (!currentPassword || !newPassword || !confirmNewPassword) {
                        showNotification('All password fields are required', 'warning');
                        return;
                    }
                    
                    if (newPassword !== confirmNewPassword) {
                        showNotification('New passwords do not match', 'warning');
                        return;
                    }
                    
                    try {
                        // Make API request to update password
                        const response = await apiRequest('/api/update-password', 'PUT', {
                            currentPassword,
                            newPassword
                        });
                        
                        // Reset form fields
                        document.getElementById('current-password').value = '';
                        document.getElementById('new-password').value = '';
                        document.getElementById('confirm-new-password').value = '';
                        
                        // Hide form
                        changePasswordForm.style.display = 'none';
                        
                        showNotification('Password updated successfully', 'success');
                    } catch (error) {
                        showNotification('Failed to update password: ' + (error.message || 'Unknown error'), 'danger');
                    }
                });
            }
            
            // Sign Out Button
            const signOutButton = accountInfoCard.querySelector('#sign-out-btn');
            if (signOutButton) {
                signOutButton.addEventListener('click', () => {
                    // Clear authentication token from localStorage
                    localStorage.removeItem('authToken');
                    
                    // Reset the profile UI
                    if (profileTitle) profileTitle.textContent = 'Guest User';
                    if (profilePlan) profilePlan.textContent = 'Free Plan';
                    if (signInButton) {
                        signInButton.textContent = 'Sign In / Register';
                        // Restore the original functionality
                        signInButton.addEventListener('click', handleRegistration);
                    }
                    
                    // Reset the navigation menu Account link
                    const navLink = document.getElementById('account-nav-link');
                    if (navLink) {
                        navLink.textContent = 'Sign In / Register';
                    }
                    
                    // Reset account info
                    accountInfoCard.innerHTML = `
                        <p>Sign in to view your account information and analysis history.</p>
                        <div class="alert alert-info">
                            <i class="fas fa-lock"></i> All your data is encrypted and securely stored in compliance with HIPAA and GDPR regulations.
                        </div>
                    `;
                    
                    showNotification('You have been signed out successfully.', 'success');
                });
            }
        }
    }
}

// Show a notification to the user
function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '20px';
        notificationContainer.style.right = '20px';
        notificationContainer.style.zIndex = '9999';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show`;
    notification.role = 'alert';
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Helper function to format a name with proper case
// Converts "john" to "John" or "JOHN" to "John"
function formatNameProperCase(name) {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Utility function to make API requests
export async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
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
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        // We've set up our proxy correctly, so we don't need to specify the backend URL directly
        // The setupProxy.js file already handles routing to the correct backend
        // This will work in all environments - local dev, Replit, etc.
        const backendUrl = '';
        
        // Fix endpoint to ensure it has the correct /api/ prefix
        // The backend expects paths with the /api/ prefix
        const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : 
                            endpoint.startsWith('api/') ? `/${endpoint}` : 
                            `/api/${endpoint}`;
        
        console.log(`API request to: ${apiEndpoint}`, token ? 'with authentication' : 'without authentication');
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
}
