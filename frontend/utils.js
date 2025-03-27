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
 */
window.SymptomSentryUtils.updateProfileUI = function(email, name = null, user = null) {
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
    
    // Update the navigation menu Account link
    const accountNavLink = document.getElementById('account-nav-link');
    if (accountNavLink) {
        accountNavLink.textContent = 'Manage Account';
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
            
            // Calculate remaining analyses with safeguard against NaN
            const analysisRemaining = Math.max(0, analysisLimit - analysisCount);
            
            // Calculate the percentage with safeguards
            const percentageUsed = analysisLimit > 0 ? (analysisCount / analysisLimit) * 100 : 0;
            
            usageInfo.innerHTML = `
                <div class="progress" style="height: 10px;">
                    <div class="progress-bar bg-primary" role="progressbar" 
                        style="width: ${percentageUsed}%;" 
                        aria-valuenow="${analysisCount}" 
                        aria-valuemin="0" 
                        aria-valuemax="${analysisLimit}">
                    </div>
                </div>
                <small class="text-muted mt-1 d-block">
                    ${analysisRemaining} of ${analysisLimit} analyses remaining this month
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
                
                // Clear authentication tokens
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                
                // Reset UI to show not logged in state
                if (profileTitle) profileTitle.textContent = 'Guest User';
                if (profilePlan) profilePlan.innerHTML = '<em>Not signed in</em>';
                if (profileIcon) profileIcon.textContent = '?';
                if (profileIcon) profileIcon.classList.remove('premium-user');
                
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
    
    // Dispatch an event to notify other components about login
    const loginEvent = new CustomEvent('userLoggedIn', {
        detail: {
            email: email,
            name: name,
            user: user
        }
    });
    document.dispatchEvent(loginEvent);
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