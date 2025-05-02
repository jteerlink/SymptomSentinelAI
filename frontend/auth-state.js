/**
 * AuthState - Centralized Authentication State Management for SymptomSentryAI
 * 
 * This module provides a single source of truth for authentication state throughout
 * the application, ensuring consistent behavior across all components.
 */

// Create namespace for auth state management
window.SymptomSentryAuth = window.SymptomSentryAuth || {};

// Private state variables
const _state = {
    isAuthenticated: false,
    user: null,
    token: null,
    refreshToken: null,
    tokenExpires: null,
    authStateListeners: []
};

// Initialize auth state from local storage or cookies
function initAuthState() {
    console.log('[AuthState] Initializing authentication state');
    
    // Check if we're using secure HTTP-only cookies
    const usingSecureCookies = localStorage.getItem('usingSecureCookies') === 'true';
    
    if (usingSecureCookies) {
        console.log('[AuthState] Secure cookie authentication detected');
        // Validate cookies against server
        validateTokenWithServer();
    } else {
        // Ensure no user is automatically signed in on app startup
        console.log('[AuthState] No auto-login: users will start in logged-out state');
    }
    
    // Check for the landing page sign-in button
    const landingSignInBtn = document.getElementById('landing-sign-in-btn');
    
    // Check if user has valid authentication (this doesn't auto-login, just checks existing state)
    if (window.SymptomSentryUtils && typeof window.SymptomSentryUtils.isAuthenticated === 'function') {
        const isLoggedIn = window.SymptomSentryUtils.isAuthenticated();
        
        // If logged in, hide the landing sign-in button
        if (isLoggedIn && landingSignInBtn) {
            landingSignInBtn.style.display = 'none';
            console.log('[AuthState] Landing sign-in button hidden for authenticated user');
        } else if (landingSignInBtn) {
            landingSignInBtn.style.display = 'block';
            console.log('[AuthState] Landing sign-in button shown for unauthenticated user');
        }
    }
    
    // Reset auth state to ensure clean state on page load
    clearAuthState();
    
    /* Auto-login functionality has been disabled per user request
    // Try to load tokens from localStorage
    const token = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const tokenExpires = localStorage.getItem('tokenExpires');
    
    if (token) {
        console.log('[AuthState] Found token in localStorage');
        
        // Check if token is expired
        if (tokenExpires) {
            const now = new Date();
            const expiresAt = new Date(tokenExpires);
            
            if (now > expiresAt) {
                console.log('[AuthState] Token in localStorage is expired');
                
                // Token is expired, try to refresh
                if (refreshToken) {
                    console.log('[AuthState] Found refresh token, will attempt to refresh');
                    refreshAccessToken(refreshToken, true);
                    return; // Will update state after refresh attempt
                } else {
                    console.log('[AuthState] No refresh token available, clearing state');
                    clearAuthState();
                }
            } else {
                // Token is valid, update state
                console.log('[AuthState] Valid token found, updating state');
                updateAuthState(true, null, token, refreshToken, tokenExpires);
                
                // Validate with server and update user info
                validateTokenWithServer();
            }
        } else {
            // No expiration, assume token is valid
            console.log('[AuthState] Token found (no expiration info), updating state');
            updateAuthState(true, null, token, refreshToken, null);
            
            // Validate with server and update user info
            validateTokenWithServer();
        }
    } else {
        console.log('[AuthState] No token in localStorage, checking cookie auth');
        // No token in localStorage, try cookie authentication
        validateTokenWithServer();
    }
    */
}

// Update the auth state and notify listeners
function updateAuthState(isAuthenticated, user = null, token = null, refreshToken = null, tokenExpires = null) {
    console.log('[AuthState] Updating auth state:', 
        isAuthenticated ? 'Authenticated' : 'Not authenticated',
        user ? `User: ${user.email}` : 'No user');
    
    const previousState = { ..._state };
    
    // Update state
    _state.isAuthenticated = isAuthenticated;
    _state.user = user;
    _state.token = token;
    _state.refreshToken = refreshToken;
    _state.tokenExpires = tokenExpires;
    
    // With HTTP-only cookies, we don't need to store tokens in localStorage
    // We only store a marker so the app knows authentication has happened
    if (isAuthenticated) {
        // Store a flag that we're using cookies for authentication
        localStorage.setItem('usingSecureCookies', 'true');
        
        // For reference only in frontend - not used for actual auth
        if (tokenExpires) {
            localStorage.setItem('tokenExpiresAt', tokenExpires);
        }
    } 
    // Clear localStorage if not authenticated
    else if (!isAuthenticated) {
        localStorage.removeItem('usingSecureCookies');
        localStorage.removeItem('tokenExpiresAt');
        
        // Clear additional user data
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('hasPerformedAnalysis');
        localStorage.removeItem('lastAnalysisId');
        localStorage.removeItem('lastAnalysisResults');
    }
    
    // Notify listeners if state has changed
    if (previousState.isAuthenticated !== isAuthenticated || 
        JSON.stringify(previousState.user) !== JSON.stringify(user)) {
        notifyStateChange();
    }
}

// Clear auth state completely
function clearAuthState() {
    console.log('[AuthState] Clearing auth state');
    updateAuthState(false, null, null, null, null);
    
    // Clear session storage
    sessionStorage.clear();
}

// Validate token with server
function validateTokenWithServer() {
    console.log('[AuthState] Validating token with server');
    
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Add Authorization header if we have a token
    if (_state.token && _state.token !== 'use-cookies') {
        headers['Authorization'] = `Bearer ${_state.token}`;
    }
    
    fetch('/api/validate-token', {
        method: 'GET',
        headers: headers,
        credentials: 'include' // Include cookies
    })
    .then(async response => {
        if (response.ok) {
            try {
                const responseText = await response.text();
                console.log('[AuthState] Raw validation response:', responseText);
                
                // Add extra safety check in case the response is empty
                if (!responseText.trim()) {
                    console.error('[AuthState] Empty token validation response received');
                    throw new Error('Token validation failed: Empty response');
                }
                
                try {
                    return JSON.parse(responseText);
                } catch (jsonError) {
                    console.error('[AuthState] JSON parse error:', jsonError);
                    console.error('[AuthState] Raw response causing error:', responseText);
                    throw new Error('Token validation failed: Invalid JSON response format');
                }
            } catch (parseError) {
                console.error('[AuthState] Error parsing validation response:', parseError);
                throw new Error('Token validation failed: Invalid response format');
            }
        }
        throw new Error('Token validation failed');
    })
    .then(data => {
        if (data.valid && data.user) {
            console.log('[AuthState] Token validation successful, user authenticated');
            
            // Calculate token expiration if not provided
            let tokenExpires = _state.tokenExpires;
            if (data.accessToken && !tokenExpires) {
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour from now
                tokenExpires = expiresAt.toISOString();
            }
            
            // Check if we're using HTTP-only cookies
            const usingCookies = !data.accessToken && !_state.token;
            
            // Update auth state with user info and token
            // If we don't have a token in the response or state, it means we're using HTTP-only cookies
            updateAuthState(
                true,
                data.user,
                data.accessToken || _state.token || 'use-cookies',
                data.refreshToken || _state.refreshToken,
                tokenExpires
            );
            
            // Store a flag indicating we're using secure cookies if no token is returned
            if (usingCookies) {
                localStorage.setItem('usingSecureCookies', 'true');
                console.log('[AuthState] Using secure HTTP-only cookies for authentication');
            }
            
            // Update UI with user info
            if (window.SymptomSentryUtils && window.SymptomSentryUtils.updateProfileUI) {
                window.SymptomSentryUtils.updateProfileUI(
                    data.user.email,
                    data.user.name,
                    data.user,
                    false // Don't show notification
                );
            }
        } else {
            console.log('[AuthState] Token validation failed, user not authenticated');
            clearAuthState();
        }
    })
    .catch(error => {
        console.error('[AuthState] Token validation error:', error);
        clearAuthState();
        
        // Show a notification to the user if we were previously authenticated
        // This helps provide clear feedback about session expiration
        if (_state.isAuthenticated && window.SymptomSentryUtils && window.SymptomSentryUtils.showNotification) {
            window.SymptomSentryUtils.showNotification(
                'Your session has expired. Please log in again.',
                'warning'
            );
        }
    });
}

// Refresh access token
function refreshAccessToken(refreshToken, isExpired = false) {
    console.log('[AuthState] Attempting to refresh access token');
    
    // First try the validation endpoint which should return a new token if cookies are valid
    const headers = {
        'Content-Type': 'application/json'
    };
    
    // Add Authorization header if we have a token (not just for refresh)
    if (_state.token && _state.token !== 'use-cookies') {
        headers['Authorization'] = `Bearer ${_state.token}`;
    }
    
    fetch('/api/validate-token', {
        method: 'GET',
        headers: headers,
        credentials: 'include' // Include cookies
    })
    .then(async response => {
        if (response.ok) {
            try {
                const responseText = await response.text();
                console.log('[AuthState] Raw refresh response:', responseText);
                
                // Add extra safety check in case the response is empty
                if (!responseText.trim()) {
                    console.error('[AuthState] Empty token refresh response received');
                    return false;
                }
                
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (jsonError) {
                    console.error('[AuthState] JSON parse error in refresh:', jsonError);
                    console.error('[AuthState] Raw response causing error:', responseText);
                    return false;
                }
                
                if (data.valid && data.accessToken) {
                    console.log('[AuthState] Token refreshed via validation endpoint');
                    
                    // Calculate new expiration (1 hour from now)
                    const newExpiresAt = new Date();
                    newExpiresAt.setHours(newExpiresAt.getHours() + 1);
                    
                    // Check if we're using HTTP-only cookies
                    const usingCookies = !data.accessToken;
                    
                    // Update auth state
                    updateAuthState(
                        true,
                        data.user,
                        data.accessToken || 'use-cookies',
                        data.refreshToken || _state.refreshToken,
                        newExpiresAt.toISOString()
                    );
                    
                    // Store a flag indicating we're using secure cookies if no token is returned
                    if (usingCookies) {
                        localStorage.setItem('usingSecureCookies', 'true');
                        console.log('[AuthState] Using secure HTTP-only cookies for authentication');
                    }
                    
                    return true; // Successfully refreshed
                }
                return false; // Validation succeeded but no new token
            } catch (parseError) {
                console.error('[AuthState] Error parsing refresh response:', parseError);
                return false;
            }
        }
        return false; // Validation failed
    })
    .then(isRefreshed => {
        if (!isRefreshed && refreshToken) {
            // Try explicit token refresh as fallback
            return fetch('/api/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refreshToken }),
                credentials: 'include'
            })
            .then(async response => {
                try {
                    const responseText = await response.text();
                    console.log('[AuthState] Raw refresh-token response:', responseText);
                    
                    // Add extra safety check in case the response is empty
                    if (!responseText.trim()) {
                        console.error('[AuthState] Empty token refresh-token response received');
                        throw new Error('Token refresh failed: Empty response');
                    }
                    
                    try {
                        return JSON.parse(responseText);
                    } catch (jsonError) {
                        console.error('[AuthState] JSON parse error in refresh-token:', jsonError);
                        console.error('[AuthState] Raw response causing error:', responseText);
                        throw new Error('Token refresh failed: Invalid JSON response format');
                    }
                } catch (parseError) {
                    console.error('[AuthState] Error parsing refresh-token response:', parseError);
                    throw new Error('Token refresh failed: Invalid response format');
                }
            })
            .then(data => {
                if (data.accessToken) {
                    console.log('[AuthState] Token refreshed successfully via refresh endpoint');
                    
                    // Calculate new expiration (1 hour from now)
                    const newExpiresAt = new Date();
                    newExpiresAt.setHours(newExpiresAt.getHours() + 1);
                    
                    // Check if we're using HTTP-only cookies
                    const usingCookies = !data.accessToken;
                    
                    // Update auth state
                    updateAuthState(
                        true,
                        data.user || _state.user,
                        data.accessToken || 'use-cookies',
                        data.refreshToken || _state.refreshToken,
                        newExpiresAt.toISOString()
                    );
                    
                    // Store a flag indicating we're using secure cookies if no token is returned
                    if (usingCookies) {
                        localStorage.setItem('usingSecureCookies', 'true');
                        console.log('[AuthState] Using secure HTTP-only cookies for authentication');
                    }
                    
                    return true;
                }
                throw new Error('Token refresh failed');
            });
        }
        return isRefreshed;
    })
    .catch(error => {
        console.error('[AuthState] Token refresh error:', error);
        
        if (isExpired) {
            console.log('[AuthState] Token was expired and refresh failed, clearing auth state');
            clearAuthState();
            
            // Notify user that they need to log in again
            if (window.SymptomSentryUtils && window.SymptomSentryUtils.showNotification) {
                window.SymptomSentryUtils.showNotification(
                    'Your session has expired. Please log in again.',
                    'warning'
                );
            }
        }
    });
}

// Setup periodic token refresh
function setupTokenRefresh() {
    console.log('[AuthState] Setting up periodic token refresh');
    
    // Check token every minute
    setInterval(() => {
        // Only attempt refresh if we're authenticated
        if (!_state.isAuthenticated || !_state.tokenExpires) {
            return;
        }
        
        const now = new Date();
        const expiresAt = new Date(_state.tokenExpires);
        
        // If token is already expired, attempt to refresh
        if (now > expiresAt) {
            console.log('[AuthState] Token expired, attempting refresh');
            refreshAccessToken(_state.refreshToken, true);
            return;
        }
        
        // If token expires in less than 10 minutes, proactively refresh
        const tenMinutesFromNow = new Date(now.getTime() + (10 * 60 * 1000));
        if (expiresAt < tenMinutesFromNow) {
            console.log('[AuthState] Token expires in less than 10 minutes, refreshing proactively');
            refreshAccessToken(_state.refreshToken, false);
        }
    }, 60000); // Check every minute
}

// Notify all state change listeners
function notifyStateChange() {
    console.log('[AuthState] Notifying state change listeners');
    
    // Handle landing sign-in button visibility directly
    const landingSignInBtn = document.getElementById('landing-sign-in-btn');
    if (landingSignInBtn) {
        if (_state.isAuthenticated) {
            landingSignInBtn.style.display = 'none';
            console.log('[AuthState] Landing sign-in button hidden for authenticated user');
        } else {
            landingSignInBtn.style.display = 'block';
            console.log('[AuthState] Landing sign-in button shown for unauthenticated user');
        }
    }
    
    // Create an event with the current state
    const authEvent = new CustomEvent('authStateChanged', {
        detail: {
            isAuthenticated: _state.isAuthenticated,
            user: _state.user
        }
    });
    
    // Dispatch event to document for global listeners
    document.dispatchEvent(authEvent);
    
    // Call any registered listener functions
    _state.authStateListeners.forEach(listener => {
        try {
            listener(_state.isAuthenticated, _state.user);
        } catch (error) {
            console.error('[AuthState] Error in auth state listener:', error);
        }
    });
    
    // Update component states directly using the standardized updateAuthState method
    // Analysis component
    if (window.SymptomSentryComponents && 
        window.SymptomSentryComponents.Analysis && 
        typeof window.SymptomSentryComponents.Analysis.updateAuthState === 'function') {
        try {
            console.log('[AuthState] Updating Analysis component');
            window.SymptomSentryComponents.Analysis.updateAuthState(_state.isAuthenticated);
        } catch (error) {
            console.error('[AuthState] Error updating Analysis component:', error);
        }
    }
    
    // ImageUpload component
    if (window.SymptomSentryComponents && 
        window.SymptomSentryComponents.ImageUpload && 
        typeof window.SymptomSentryComponents.ImageUpload.updateAuthState === 'function') {
        try {
            console.log('[AuthState] Updating ImageUpload component');
            window.SymptomSentryComponents.ImageUpload.updateAuthState(_state.isAuthenticated);
        } catch (error) {
            console.error('[AuthState] Error updating ImageUpload component:', error);
        }
    }
    
    // AnalysisHistory component
    if (window.SymptomSentryComponents && 
        window.SymptomSentryComponents.AnalysisHistory && 
        typeof window.SymptomSentryComponents.AnalysisHistory.updateAuthState === 'function') {
        try {
            console.log('[AuthState] Updating AnalysisHistory component');
            window.SymptomSentryComponents.AnalysisHistory.updateAuthState(_state.isAuthenticated);
        } catch (error) {
            console.error('[AuthState] Error updating AnalysisHistory component:', error);
        }
    }
}

// Public API methods
window.SymptomSentryAuth.init = function() {
    console.log('[AuthState] Initializing auth state module');
    initAuthState();
    setupTokenRefresh();
};

// Check if user is authenticated
window.SymptomSentryAuth.isAuthenticated = function() {
    return _state.isAuthenticated;
};

// Get current user
window.SymptomSentryAuth.getUser = function() {
    return _state.user;
};

// Get authentication token
window.SymptomSentryAuth.getToken = function() {
    // If we're using HTTP-only cookies, we don't need to return the actual token
    // because the cookies will be sent automatically with requests
    if (_state.token === 'use-cookies' || localStorage.getItem('usingSecureCookies') === 'true') {
        console.log('[AuthState] Using HTTP-only cookies for authentication, no token needed');
        return null;
    }
    return _state.token;
};

// Log in user with credentials
window.SymptomSentryAuth.login = async function(email, password) {
    console.log('[AuthState] Attempting login for email:', email);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include' // Include cookies in the request
        });
        
        if (!response.ok) {
            let errorData;
            try {
                const errorText = await response.text();
                errorData = JSON.parse(errorText);
            } catch (parseError) {
                console.error('[AuthState] Error parsing error response:', parseError);
                throw new Error('Login failed: Server error');
            }
            throw new Error(errorData.message || 'Login failed');
        }
        
        let data;
        try {
            const responseText = await response.text();
            console.log('[AuthState] Raw login response:', responseText);
            // Add extra safety check in case the response is empty or not valid JSON
            if (!responseText.trim()) {
                console.error('[AuthState] Empty login response received');
                throw new Error('Login failed: Empty server response');
            }
            try {
                data = JSON.parse(responseText);
            } catch (jsonError) {
                console.error('[AuthState] JSON parse error:', jsonError);
                console.error('[AuthState] Raw response causing error:', responseText);
                throw new Error('Login failed: Invalid JSON response format');
            }
        } catch (parseError) {
            console.error('[AuthState] Error parsing login response:', parseError);
            throw new Error('Login failed: Invalid server response format');
        }
        
        // Check for valid user information
        if (!data.user) {
            throw new Error('Invalid server response - no user data');
        }
        
        // Check if we're using HTTP-only cookies instead of tokens
        const usingSecureCookies = !data.accessToken;
        
        // Calculate token expiration (1 hour from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        // Update auth state with cookie support
        updateAuthState(
            true,
            data.user,
            data.accessToken || 'use-cookies', // Use special token value for cookie auth
            data.refreshToken || null,
            expiresAt.toISOString()
        );
        
        // Store a flag indicating we're using secure cookies if no token is returned
        if (usingSecureCookies) {
            localStorage.setItem('usingSecureCookies', 'true');
            console.log('[AuthState] Using secure HTTP-only cookies for authentication during login');
        }
        
        // Update UI
        if (window.SymptomSentryUtils && window.SymptomSentryUtils.updateProfileUI) {
            window.SymptomSentryUtils.updateProfileUI(
                data.user.email,
                data.user.name,
                data.user,
                false // Don't show notification from here
            );
        }
        
        // Show success notification
        if (window.SymptomSentryUtils && window.SymptomSentryUtils.showNotification) {
            window.SymptomSentryUtils.showNotification(
                'Login successful! Welcome back.',
                'success'
            );
        }
        
        return data.user;
    } catch (error) {
        console.error('[AuthState] Login error:', error);
        throw error;
    }
};

// Register a new user
window.SymptomSentryAuth.register = async function(name, email, password) {
    console.log('[AuthState] Attempting registration for email:', email);
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password }),
            credentials: 'include' // Include cookies in the request
        });
        
        // Get the response text first
        const responseText = await response.text();
        let data;
        
        // Add extra safety check in case the response is empty or not valid JSON
        if (!responseText.trim()) {
            console.error('[AuthState] Empty registration response received');
            throw new Error('Registration failed: Empty server response');
        }
        
        try {
            // Parse the JSON response text
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[AuthState] Failed to parse server response:', parseError);
            console.error('[AuthState] Raw response causing error:', responseText);
            throw new Error('Registration failed: Invalid JSON response format');
        }
        
        // Check if the response was not OK (HTTP error)
        if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
        }
        
        // Check for valid user information
        if (!data.user) {
            throw new Error('Invalid server response - no user data');
        }
        
        // Check if we're using HTTP-only cookies instead of tokens
        const usingSecureCookies = !data.accessToken;
        
        // Calculate token expiration (1 hour from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);
        
        // Update auth state with cookie support
        updateAuthState(
            true,
            data.user,
            data.accessToken || 'use-cookies', // Use special token value for cookie auth
            data.refreshToken || null,
            expiresAt.toISOString()
        );
        
        // Store a flag indicating we're using secure cookies if no token is returned
        if (usingSecureCookies) {
            localStorage.setItem('usingSecureCookies', 'true');
            console.log('[AuthState] Using secure HTTP-only cookies for authentication during registration');
        }
        
        // Update UI
        if (window.SymptomSentryUtils && window.SymptomSentryUtils.updateProfileUI) {
            window.SymptomSentryUtils.updateProfileUI(
                data.user.email,
                data.user.name,
                data.user,
                false // Don't show notification from here
            );
        }
        
        // Show success notification
        if (window.SymptomSentryUtils && window.SymptomSentryUtils.showNotification) {
            window.SymptomSentryUtils.showNotification(
                'Registration successful! Welcome to SymptomSentryAI.',
                'success'
            );
        }
        
        return data.user;
    } catch (error) {
        console.error('[AuthState] Registration error:', error);
        
        // Don't display error here, let the calling function handle the error display
        // This prevents duplicate error notifications
        throw error;
    }
};

// Log out user
window.SymptomSentryAuth.logout = function() {
    console.log('[AuthState] Logging out user');
    
    // Make a server request to invalidate the session and clear cookies
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
    })
    .then(response => {
        console.log('[AuthState] Server logout response:', response.status);
    })
    .catch(error => {
        console.error('[AuthState] Error during server logout:', error);
    })
    .finally(() => {
        // Clear auth state
        clearAuthState();
        
        // Update UI
        if (window.SymptomSentryUtils && window.SymptomSentryUtils.updateProfileUI) {
            window.SymptomSentryUtils.updateProfileUI(
                null, null, null, false
            );
        }
        
        // Show notification
        if (window.SymptomSentryUtils && window.SymptomSentryUtils.showNotification) {
            window.SymptomSentryUtils.showNotification(
                'You have been logged out successfully',
                'info'
            );
        }
        
        // Redirect to home page
        const navEvent = new CustomEvent('navigate', {
            detail: { pageId: 'home' }
        });
        document.dispatchEvent(navEvent);
    });
};

// Refresh auth token (publicly accessible for forced refresh)
window.SymptomSentryAuth.refreshToken = function() {
    console.log('[AuthState] Manual token refresh requested');
    if (_state.refreshToken) {
        refreshAccessToken(_state.refreshToken);
    } else {
        console.log('[AuthState] No refresh token available for manual refresh');
    }
};

// Add a listener for auth state changes
window.SymptomSentryAuth.addStateListener = function(listener) {
    if (typeof listener === 'function') {
        _state.authStateListeners.push(listener);
    }
};

// Remove a state change listener
window.SymptomSentryAuth.removeStateListener = function(listener) {
    const index = _state.authStateListeners.indexOf(listener);
    if (index !== -1) {
        _state.authStateListeners.splice(index, 1);
    }
};

// Return all public methods for direct use in modules
window.SymptomSentryAuth.exports = {
    init: window.SymptomSentryAuth.init,
    isAuthenticated: window.SymptomSentryAuth.isAuthenticated,
    getUser: window.SymptomSentryAuth.getUser,
    getToken: window.SymptomSentryAuth.getToken,
    login: window.SymptomSentryAuth.login,
    register: window.SymptomSentryAuth.register,
    logout: window.SymptomSentryAuth.logout,
    refreshToken: window.SymptomSentryAuth.refreshToken,
    addStateListener: window.SymptomSentryAuth.addStateListener,
    removeStateListener: window.SymptomSentryAuth.removeStateListener
};

// Initialize immediately if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('[AuthState] Document already loaded, initializing immediately');
    window.SymptomSentryAuth.init();
} else {
    // Otherwise initialize when document is loaded
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[AuthState] Document loaded, initializing');
        window.SymptomSentryAuth.init();
    });
}