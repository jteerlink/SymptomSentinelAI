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
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('remember-me').checked;
        
        console.log('Login attempt:', { email, rememberMe });
        // TODO: Implement actual login logic with backend API
        
        // Update UI to reflect logged in state
        updateProfileUI(email);
        
        // Show success notification and close modal
        showNotification('Login successful!', 'success');
        authModal.hide();
    });
    
    document.getElementById('register-form').addEventListener('submit', (e) => {
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
        
        console.log('Registration attempt:', { firstName, lastName, email });
        // TODO: Implement actual registration logic with backend API
        
        // Automatically log the user in after successful registration
        updateProfileUI(email, `${firstName} ${lastName}`);
        
        // Show success notification and close modal
        showNotification('Account created successfully!', 'success');
        authModal.hide();
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
                showNotification('Account management features coming soon!', 'info');
            });
        }
        
        // Update the account information card with more detailed information
        if (accountInfoCard) {
            // Remove existing content
            while (accountInfoCard.firstChild) {
                accountInfoCard.removeChild(accountInfoCard.firstChild);
            }
            
            // Create and append new content
            const dateJoined = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            
            const infoHTML = `
                <h5 class="mb-3">Account Information</h5>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Member since:</strong> ${dateJoined}</p>
                <p><strong>Subscription:</strong> Basic Plan</p>
                <p><strong>Images analyzed:</strong> 0</p>
                <div class="d-grid gap-2 mt-4">
                    <button class="btn btn-outline-primary btn-sm">Edit Profile</button>
                    <button class="btn btn-outline-primary btn-sm">Change Password</button>
                    <button class="btn btn-outline-danger btn-sm">Sign Out</button>
                </div>
            `;
            
            accountInfoCard.innerHTML = infoHTML;
            
            // Add event listener for sign out button
            const signOutButton = accountInfoCard.querySelector('.btn.btn-outline-danger');
            if (signOutButton) {
                signOutButton.addEventListener('click', () => {
                    // Reset the profile UI
                    if (profileTitle) profileTitle.textContent = 'Guest User';
                    if (profilePlan) profilePlan.textContent = 'Free Plan';
                    if (signInButton) {
                        signInButton.textContent = 'Sign In / Register';
                        // Restore the original functionality
                        signInButton.addEventListener('click', handleRegistration);
                    }
                    
                    // Reset the navigation menu Account link
                    const accountNavLink = document.getElementById('account-nav-link');
                    if (accountNavLink) {
                        accountNavLink.textContent = 'Sign In / Register';
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

// Utility function to make API requests
export async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        // We've set up our proxy correctly, so we don't need to specify the backend URL directly
        // The setupProxy.js file already handles routing to the correct backend
        // This will work in all environments - local dev, Replit, etc.
        const backendUrl = '';
        
        const response = await fetch(`${backendUrl}/api/${endpoint}`, options);
        console.log(`API request to: ${backendUrl}/api/${endpoint}`);
        
        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}
