/**
 * Shared utility functions for the frontend
 */

// Create a namespace for our utility functions
window.SymptomSentryUtils = window.SymptomSentryUtils || {};

/**
 * Update the profile UI after login/registration or profile changes
 * 
 * @param {string} email - User's email address
 * @param {string|null} name - User's display name (optional)
 * @param {Object|null} user - Complete user object (optional)
 * @param {boolean} showLoginNotification - Whether to show login notification (default: true)
 */
window.SymptomSentryUtils.updateProfileUI = function(email, name = null, user = null, showLoginNotification = true) {
    // If user is not provided, create a default user object
    if (!user) {
        user = {
            email: email,
            name: name,
            subscription: 'free',
            analysisCount: 0,
            analysisLimit: 2,
            analysisRemaining: 2,
            lastResetDate: new Date().toISOString()
        };
    }
    
    // Toggle visibility of profile and sign-in nav items
    const profileNavItem = document.getElementById('profile-nav-item');
    const signInNavItem = document.getElementById('sign-in-nav-item');
    
    if (email) {
        // User is logged in, show profile and hide sign-in
        if (profileNavItem) profileNavItem.style.display = 'block';
        if (signInNavItem) signInNavItem.style.display = 'none';
    } else {
        // User is logged out, hide profile and show sign-in
        if (profileNavItem) profileNavItem.style.display = 'none';
        if (signInNavItem) signInNavItem.style.display = 'block';
    }
    
    // Update the navigation menu Account link
    const accountNavLink = document.getElementById('account-nav-link');
    if (accountNavLink && email) {
        accountNavLink.textContent = 'My Account';
        // Make sure it navigates to the profile page when clicked
        accountNavLink.setAttribute('data-page', 'profile');
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
        const planDisplay = user.subscription === 'premium' ? 'Premium Plan' : 'Free Plan';
        profilePlan.innerHTML = `<strong>${planDisplay}</strong>`;
        
        if (user.subscription === 'free') {
            // For free users, show analysis count information
            const usageInfo = document.createElement('div');
            usageInfo.className = 'mt-2 usage-info';
            
            // Ensure the analysis count and limit are valid numbers with defaults
            const analysisCount = Number.isFinite(user.analysisCount) ? user.analysisCount : 0;
            const analysisLimit = Number.isFinite(user.analysisLimit) ? user.analysisLimit : 2;
            
            // Calculate remaining analyses (can be negative if exceeded)
            const analysisRemaining = analysisLimit - analysisCount;
            
            // Calculate the percentage with safeguards (max 100%)
            const percentageUsed = Math.min(100, analysisLimit > 0 ? (analysisCount / analysisLimit) * 100 : 0);
            
            // Determine the progress bar color based on usage
            const progressBarClass = analysisRemaining < 0 ? 'bg-danger' : 
                                    (analysisRemaining === 0 ? 'bg-warning' : 'bg-primary');
            
            let remainingText;
            if (analysisRemaining < 0) {
                // User has exceeded their limit
                remainingText = `You've exceeded your monthly limit by ${Math.abs(analysisRemaining)} analyses`;
            } else if (analysisRemaining === 0) {
                // User has exactly used their limit
                remainingText = 'You have no analyses remaining this month';
            } else {
                // User still has analyses remaining
                remainingText = `${analysisRemaining} of ${analysisLimit} analyses remaining this month`;
            }
            
            usageInfo.innerHTML = `
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar ${progressBarClass}" role="progressbar" 
                        style="width: ${percentageUsed}%;" 
                        aria-valuenow="${analysisCount}" 
                        aria-valuemin="0" 
                        aria-valuemax="${analysisLimit}">
                    </div>
                </div>
                <small class="text-muted mt-1 d-block">
                    ${remainingText}
                </small>
            `;
            
            // Remove any existing usage info
            const existingUsageInfo = profilePlan.querySelector('.usage-info');
            if (existingUsageInfo) {
                existingUsageInfo.remove();
            }
            
            profilePlan.appendChild(usageInfo);
        } else {
            // Premium users don't have a limit, so remove usage info if it exists
            const existingUsageInfo = profilePlan.querySelector('.usage-info');
            if (existingUsageInfo) {
                existingUsageInfo.remove();
            }
        }
    }
    
    if (profileIcon) {
        // Create initials for the profile icon
        const initials = name 
            ? name.split(' ').map(part => part[0]).join('').toUpperCase() 
            : email[0].toUpperCase();
        
        profileIcon.textContent = initials;
        
        // For premium users, add a special class
        if (user.subscription === 'premium') {
            profileIcon.classList.add('premium-user');
        } else {
            profileIcon.classList.remove('premium-user');
        }
    }
    
    if (signInButton) {
        // Change sign in button to sign out
        signInButton.textContent = 'Sign Out';
        signInButton.classList.remove('btn-outline-primary');
        signInButton.classList.add('btn-outline-danger');
        
        // Remove the old click handler and add the sign out handler
        signInButton.replaceWith(signInButton.cloneNode(true));
        
        // Get the new button and add event listener
        const newSignOutButton = document.querySelector('.btn.btn-outline-danger.mt-3');
        if (newSignOutButton) {
            newSignOutButton.addEventListener('click', () => {
                console.log('Sign Out button clicked');
                
                // Use the proper logout function that communicates with the server
                window.SymptomSentryUtils.logout();
                
                // The logout function will handle all necessary cleanup steps including:
                // 1. Server-side logout to clear cookies
                // 2. Clearing localStorage tokens
                // 3. Updating the UI
                // 4. Showing a notification
                // 5. Redirecting to the home page
                
                // Prevent the code below from executing as it's now handled by logout()
                return;
                
                // Reset the button back to Sign In / Register
                newSignOutButton.textContent = 'Sign In / Register';
                newSignOutButton.classList.remove('btn-outline-danger');
                newSignOutButton.classList.add('btn-outline-primary');
                newSignOutButton.replaceWith(newSignOutButton.cloneNode(true));
                
                // Re-add the sign in handler to the new button
                const reAddedButton = document.querySelector('.btn.btn-outline-primary.mt-3');
                if (reAddedButton) {
                    reAddedButton.addEventListener('click', () => {
                        console.log('Sign In button clicked');
                        // Use dynamic import to avoid circular dependencies
                        // Call handleRegistration using global namespace
                        if (window.SymptomSentryApp && typeof window.SymptomSentryApp.handleRegistration === 'function') {
                            window.SymptomSentryApp.handleRegistration();
                        } else {
                            // Use a window event as fallback
                            const loginEvent = new CustomEvent('openLoginModal');
                            window.dispatchEvent(loginEvent);
                        }
                    });
                }
                
                // Remove account info if it exists
                if (accountInfo) {
                    accountInfo.textContent = 'Sign in to access your account and analysis history.';
                }
                
                // Remove any other account-specific elements
                const profileSettings = document.querySelector('.profile-settings');
                if (profileSettings) {
                    profileSettings.style.display = 'none';
                }
                
                // Show a notification using the function from this file
                showNotification('You have been signed out', 'info');
                
                // Redirect to home page
                const homeNavLink = document.querySelector('[data-page="home"]');
                if (homeNavLink) {
                    homeNavLink.click();
                }
            });
        }
    }
    
    // Update account info paragraph with user data
    if (accountInfo) {
        // Format the registration date
        const registrationDate = user.created_at
            ? new Date(user.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
            : 'Unknown';
        
        accountInfo.innerHTML = `
            <strong>Email:</strong> ${email}<br>
            <strong>Member Since:</strong> ${registrationDate}<br>
            <strong>Subscription:</strong> ${user.subscription === 'premium' ? 'Premium' : 'Free'}
        `;
    }
    
    // Enable account settings if they exist
    const profileSettings = document.querySelector('.profile-settings');
    if (profileSettings) {
        profileSettings.style.display = 'block';
    }
    
    // Update any other UI elements that reflect login state
    document.querySelectorAll('.login-required').forEach(element => {
        element.classList.remove('disabled');
    });
    
    // Refresh Analysis History component if it exists
    if (window.SymptomSentryAnalysisHistory && window.SymptomSentryAnalysisHistory.loadAnalysisHistory) {
        const historyContainer = document.getElementById('analysis-history-component');
        if (historyContainer) {
            window.SymptomSentryAnalysisHistory.loadAnalysisHistory(historyContainer);
        }
    }
    
    // Dispatch an event to notify other components about login
    const loginEvent = new CustomEvent('userLoggedIn', {
        detail: {
            email: email,
            name: name,
            user: user
        }
    });
    document.dispatchEvent(loginEvent);
    
    // If showLoginNotification is true and user is not null, show a welcome notification
    if (showLoginNotification && email) {
        // Don't show notification here - it will be handled by the login/register functions
        // This prevents duplicate notifications
    }
}

/**
 * Show a notification to the user
 * 
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (info, success, warning, danger)
 */
window.SymptomSentryUtils.showNotification = function(message, type = 'info') {
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

/**
 * Helper function to format a name with proper case
 * Converts "john" to "John" or "JOHN" to "John"
 * 
 * @param {string} name - Name to format
 * @returns {string} Formatted name
 */
window.SymptomSentryUtils.formatNameProperCase = function(name) {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// Fix the showNotification reference in the sign out function
function showNotification(message, type) {
    window.SymptomSentryUtils.showNotification(message, type);
}

/**
 * Check if the user is authenticated
 * 
 * @returns {boolean} True if authenticated, false otherwise
 */
window.SymptomSentryUtils.isAuthenticated = function() {
    const token = localStorage.getItem('authToken');
    const tokenExpires = localStorage.getItem('tokenExpires');
    
    // First check for localStorage token
    if (token) {
        // Check if token is expired
        if (tokenExpires) {
            const now = new Date();
            const expiresAt = new Date(tokenExpires);
            
            if (now > expiresAt) {
                console.log('[Auth Helper] isAuthenticated check - Token expired in localStorage');
                // Don't return false yet - we'll check for cookies next
            } else {
                console.log('[Auth Helper] isAuthenticated check - Valid token exists in localStorage');
                return true;
            }
        } else {
            // No expiration info but we have a token, assume it's valid
            console.log('[Auth Helper] isAuthenticated check - Token exists in localStorage (no expiration info)');
            return true;
        }
    } else {
        console.log('[Auth Helper] isAuthenticated check - No token found in localStorage');
    }
    
    // If we reach here, we don't have a valid localStorage token
    // Let's validate authentication with the server using cookies
    // We'll do this asynchronously but return our best guess for now
    
    // Return false immediately, but initiate a validation check in the background
    // that will update our localStorage if cookies are valid
    setTimeout(() => {
        console.log('[Auth Helper] Performing cookie authentication check');
        fetch('/api/validate-token', {
            method: 'GET',
            credentials: 'include' // Important: include cookies
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            }
            throw new Error('Token validation failed');
        })
        .then(data => {
            if (data.valid && data.user) {
                console.log('[Auth Helper] Valid cookie authentication found');
                
                // Store the validated user information for future use
                if (data.accessToken) {
                    localStorage.setItem('authToken', data.accessToken);
                    
                    // Calculate and store new token expiration time (1 hour from now)
                    const expiresAt = new Date();
                    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now
                    localStorage.setItem('tokenExpires', expiresAt.toISOString());
                    console.log('[Auth Helper] Token expiration updated to:', expiresAt.toISOString());
                }
                
                // Update UI to reflect logged-in state - don't show notification
                window.SymptomSentryUtils.updateProfileUI(
                    data.user.email,
                    data.user.name,
                    data.user,
                    false
                );
                
                // Dispatch an event to notify the app that auth state has changed
                document.dispatchEvent(new CustomEvent('authStateChanged', {
                    detail: { isAuthenticated: true, user: data.user }
                }));
            }
        })
        .catch(error => {
            console.log('[Auth Helper] Cookie authentication check failed:', error.message);
        });
    }, 0);
    
    // For immediate response, return false if we have no localStorage token
    // The async check above will update the application state later if needed
    return false;
}

/**
 * Get the current authentication token
 * 
 * @returns {string|null} The auth token or null if not authenticated
 */
window.SymptomSentryUtils.getAuthToken = function() {
    // Check if we have a valid localStorage token
    const token = localStorage.getItem('authToken');
    const tokenExpires = localStorage.getItem('tokenExpires');
    
    if (token) {
        // Check if token is expired
        if (tokenExpires) {
            const now = new Date();
            const expiresAt = new Date(tokenExpires);
            
            if (now < expiresAt) {
                // Token exists and is valid
                console.log('[Auth Helper] getAuthToken - Using valid token from localStorage');
                return token;
            }
        } else {
            // No expiration data, assume token is valid
            console.log('[Auth Helper] getAuthToken - Using token from localStorage (no expiration info)');
            return token;
        }
    }
    
    // If we don't have a valid localStorage token, we'll rely on cookies
    // Return a special string indicating cookie auth should be used
    console.log('[Auth Helper] getAuthToken - No valid token in localStorage, using cookie auth');
    return 'use-cookies';
}

/**
 * Clear all authentication data and log user out
 */
window.SymptomSentryUtils.clearAuthData = function() {
    console.log('[Auth] Clearing all authentication data');
    
    // Clear tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpires');
    
    // Clear analysis data
    localStorage.removeItem('hasPerformedAnalysis');
    localStorage.removeItem('lastAnalysisId');
    localStorage.removeItem('lastAnalysisResults');
    
    // Clear any user profile data
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    
    // Clear session storage completely
    sessionStorage.clear();
    
    console.log('[Auth] Authentication data cleared successfully');
}

/**
 * Log the user out completely
 */
window.SymptomSentryUtils.logout = function() {
    console.log('[Logout] Logging out user');
    
    // Use the centralized auth state manager if available
    if (window.SymptomSentryAuth && window.SymptomSentryAuth.logout) {
        console.log('[Logout] Using centralized auth manager for logout');
        window.SymptomSentryAuth.logout();
        return;
    }
    
    // Fallback to legacy logout if auth state manager is not available
    console.warn('[Logout] Auth state manager not found, using legacy logout');
    
    // Make a server request to invalidate the session and clear cookies
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => {
        console.log('[Logout] Server logout response:', response.status);
    })
    .catch(error => {
        console.error('[Logout] Error during server logout:', error);
    })
    .finally(() => {
        // Clear all auth data
        this.clearAuthData();
        
        // Remove token expiration
        localStorage.removeItem('tokenExpires');
        
        // Update the UI
        this.updateProfileUI(null);
        this.showNotification('You have been logged out successfully', 'info');
        
        // Redirect to home page
        const navEvent = new CustomEvent('navigate', {
            detail: { pageId: 'home' }
        });
        document.dispatchEvent(navEvent);
    });
}