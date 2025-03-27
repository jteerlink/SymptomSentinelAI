/**
 * Auth Manager
 * 
 * Central authentication management system for SymptomSentryAI
 * Provides a single source of truth for authentication state across the application
 */

// Define a self-executing function to create a closure
(function() {
    // Create a class to manage authentication
    class AuthManager {
        constructor() {
            // Private state
            this._state = {
                isAuthenticated: false,
                user: null,
                token: null,
                tokenExpires: null,
                refreshToken: null
            };
            
            // Subscribers list (components that need auth state updates)
            this._subscribers = [];
            
            // Initialize state from storage and validate with server
            this.initializeFromStorage();
            
            // Set up event listeners for auth events
            this._setupEventListeners();
            
            console.log('[AuthManager] Initialized');
        }
        
        /**
         * Update authentication state and notify all components
         * 
         * @param {Object} newState - New state properties to update
         */
        updateAuthState(newState) {
            console.log('[AuthManager] Updating auth state', newState);
            
            // Update state with new values
            Object.assign(this._state, newState);
            
            // Store authentication data in localStorage if authenticated
            if (this._state.isAuthenticated && this._state.token) {
                localStorage.setItem('authToken', this._state.token);
                
                if (this._state.tokenExpires) {
                    localStorage.setItem('tokenExpires', this._state.tokenExpires);
                }
                
                if (this._state.refreshToken) {
                    localStorage.setItem('refreshToken', this._state.refreshToken);
                }
                
                if (this._state.user) {
                    localStorage.setItem('userProfile', JSON.stringify(this._state.user));
                    localStorage.setItem('userEmail', this._state.user.email);
                    
                    if (this._state.user.name) {
                        localStorage.setItem('userName', this._state.user.name);
                    }
                }
            }
            
            // Notify all subscribers
            this.notifyListeners();
        }
        
        /**
         * Check if user is authenticated
         * Returns immediately with current state
         * 
         * @returns {boolean} Authentication state
         */
        isAuthenticated() {
            return this._state.isAuthenticated;
        }
        
        /**
         * Get current user object
         * 
         * @returns {Object|null} User object or null if not authenticated
         */
        getUser() {
            return this._state.user;
        }
        
        /**
         * Get current authentication token
         * 
         * @returns {string|null} Auth token or null if not authenticated
         */
        getAuthToken() {
            return this._state.token;
        }
        
        /**
         * Subscribe to authentication state changes
         * 
         * @param {Function} callback - Function to call when auth state changes
         */
        subscribe(callback) {
            if (typeof callback === 'function' && !this._subscribers.includes(callback)) {
                this._subscribers.push(callback);
                // Immediately call with current state
                callback({
                    isAuthenticated: this._state.isAuthenticated,
                    user: this._state.user
                });
            }
        }
        
        /**
         * Unsubscribe from authentication state changes
         * 
         * @param {Function} callback - Function to remove from subscribers
         */
        unsubscribe(callback) {
            const index = this._subscribers.indexOf(callback);
            if (index !== -1) {
                this._subscribers.splice(index, 1);
            }
        }
        
        /**
         * Notify all listeners of auth state changes
         */
        notifyListeners() {
            console.log('[AuthManager] Notifying listeners, count:', this._subscribers.length);
            
            const authState = {
                isAuthenticated: this._state.isAuthenticated,
                user: this._state.user
            };
            
            // Notify each subscriber
            this._subscribers.forEach(callback => {
                try {
                    callback(authState);
                } catch (error) {
                    console.error('[AuthManager] Error in subscriber callback:', error);
                }
            });
            
            // Also dispatch a DOM event for non-subscribed components
            document.dispatchEvent(new CustomEvent('authStateChanged', {
                detail: authState
            }));
        }
        
        /**
         * Initialize auth state from storage and cookies
         */
        initializeFromStorage() {
            console.log('[AuthManager] Initializing from storage');
            
            // Check localStorage first
            const token = localStorage.getItem('authToken');
            const tokenExpires = localStorage.getItem('tokenExpires');
            const refreshToken = localStorage.getItem('refreshToken');
            
            // Get user profile if available
            let user = null;
            try {
                const userProfileStr = localStorage.getItem('userProfile');
                if (userProfileStr) {
                    user = JSON.parse(userProfileStr);
                } else {
                    // Try to reconstruct a minimal user from email and name
                    const email = localStorage.getItem('userEmail');
                    const name = localStorage.getItem('userName');
                    
                    if (email) {
                        user = { 
                            email, 
                            name: name || email.split('@')[0],
                            subscription: 'free'
                        };
                    }
                }
            } catch (error) {
                console.error('[AuthManager] Error parsing user profile:', error);
            }
            
            // Check if we have a valid token
            if (token) {
                // Check if token is expired
                let isExpired = false;
                
                if (tokenExpires) {
                    const now = new Date();
                    const expiresAt = new Date(tokenExpires);
                    isExpired = now > expiresAt;
                }
                
                if (!isExpired) {
                    // We have a valid token in localStorage
                    this.updateAuthState({
                        isAuthenticated: true,
                        token,
                        tokenExpires,
                        refreshToken,
                        user
                    });
                    
                    console.log('[AuthManager] Restored auth state from localStorage');
                } else {
                    console.log('[AuthManager] Token from localStorage is expired');
                    
                    // Token is expired, try refreshing if we have a refresh token
                    if (refreshToken) {
                        this.refreshToken();
                    } else {
                        // Validate with server to check for cookie authentication
                        this.validateWithServer();
                    }
                }
            } else {
                console.log('[AuthManager] No token in localStorage, checking with server');
                // No token in localStorage, validate with server to check cookies
                this.validateWithServer();
            }
        }
        
        /**
         * Validate authentication with server
         * This ensures the client state matches server state
         */
        validateWithServer() {
            console.log('[AuthManager] Validating authentication with server');
            
            fetch('/api/validate-token', {
                method: 'GET',
                credentials: 'include' // Include cookies
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Token validation failed');
            })
            .then(data => {
                if (data.valid && data.user) {
                    console.log('[AuthManager] Valid authentication confirmed by server');
                    
                    // Update the auth state with server data
                    this.updateAuthState({
                        isAuthenticated: true,
                        token: data.accessToken || this._state.token,
                        user: data.user,
                        tokenExpires: data.expiresAt ? new Date(data.expiresAt).toISOString() : null
                    });
                    
                    // Update profile UI using the utility function
                    if (window.SymptomSentryUtils && window.SymptomSentryUtils.updateProfileUI) {
                        window.SymptomSentryUtils.updateProfileUI(
                            data.user.email,
                            data.user.name,
                            data.user
                        );
                    }
                } else {
                    console.log('[AuthManager] Server reports no valid authentication');
                    // Server says we're not authenticated
                    this.clearAuth();
                }
            })
            .catch(error => {
                console.error('[AuthManager] Validation error:', error.message);
                // Error validating, assume not authenticated
                this.clearAuth();
            });
        }
        
        /**
         * Refresh access token using refresh token
         */
        refreshToken() {
            console.log('[AuthManager] Attempting token refresh');
            
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
                console.log('[AuthManager] No refresh token available');
                this.validateWithServer();
                return;
            }
            
            fetch('/api/refresh-token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refreshToken }),
                credentials: 'include'
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Token refresh failed');
            })
            .then(data => {
                if (data.accessToken) {
                    console.log('[AuthManager] Token refreshed successfully');
                    
                    // Update auth state with new token
                    this.updateAuthState({
                        isAuthenticated: true,
                        token: data.accessToken,
                        tokenExpires: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
                        refreshToken: data.refreshToken || refreshToken,
                        user: data.user || this._state.user
                    });
                } else {
                    console.log('[AuthManager] Token refresh did not return a new token');
                    this.clearAuth();
                }
            })
            .catch(error => {
                console.error('[AuthManager] Token refresh error:', error.message);
                // If refresh fails, clear auth and validate with server
                this.clearAuth();
                this.validateWithServer();
            });
        }
        
        /**
         * Clear authentication state
         * Removes tokens from storage and updates state
         */
        clearAuth() {
            console.log('[AuthManager] Clearing auth state');
            
            // Clear all auth data from localStorage
            if (window.SymptomSentryUtils && window.SymptomSentryUtils.clearAuthData) {
                window.SymptomSentryUtils.clearAuthData();
            } else {
                // Fallback if utils not available
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('tokenExpires');
                localStorage.removeItem('userProfile');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userName');
            }
            
            // Reset state
            this.updateAuthState({
                isAuthenticated: false,
                user: null,
                token: null,
                tokenExpires: null,
                refreshToken: null
            });
        }
        
        /**
         * Login helper
         * 
         * @param {string} email - User email
         * @param {string} password - User password
         * @returns {Promise} Promise resolving to login response
         */
        login(email, password) {
            console.log('[AuthManager] Attempting login for:', email);
            
            return fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include'
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                
                // Handle specific error codes
                if (response.status === 401) {
                    throw new Error('Invalid email or password');
                } else if (response.status === 429) {
                    throw new Error('Too many login attempts. Please try again later.');
                } else {
                    throw new Error('Login failed: ' + (response.statusText || 'Unknown error'));
                }
            })
            .then(data => {
                if (data.accessToken) {
                    console.log('[AuthManager] Login successful');
                    
                    // Calculate token expiration time (default 1h if not provided)
                    let tokenExpires = null;
                    if (data.expiresIn) {
                        // Convert expiresIn (seconds) to date
                        const expiresInMs = (typeof data.expiresIn === 'string')
                            ? parseInt(data.expiresIn) * 1000
                            : data.expiresIn * 1000;
                            
                        tokenExpires = new Date(Date.now() + expiresInMs).toISOString();
                    } else {
                        // Default 1 hour expiration
                        tokenExpires = new Date(Date.now() + 3600000).toISOString();
                    }
                    
                    // Update auth state with login data
                    this.updateAuthState({
                        isAuthenticated: true,
                        token: data.accessToken,
                        refreshToken: data.refreshToken,
                        tokenExpires,
                        user: data.user
                    });
                    
                    // Update UI
                    if (window.SymptomSentryUtils && window.SymptomSentryUtils.updateProfileUI) {
                        window.SymptomSentryUtils.updateProfileUI(
                            data.user.email,
                            data.user.name,
                            data.user
                        );
                    }
                    
                    // Show success notification
                    if (window.SymptomSentryUtils && window.SymptomSentryUtils.showNotification) {
                        window.SymptomSentryUtils.showNotification(
                            'Login successful. Welcome back!', 
                            'success'
                        );
                    }
                    
                    return data;
                } else {
                    throw new Error('Login response did not contain access token');
                }
            });
        }
        
        /**
         * Register new user
         * 
         * @param {Object} userData - User registration data
         * @returns {Promise} Promise resolving to registration response
         */
        register(userData) {
            console.log('[AuthManager] Attempting registration');
            
            return fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData),
                credentials: 'include'
            })
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                
                // Handle specific error codes
                if (response.status === 409) {
                    throw new Error('Email already registered');
                } else if (response.status === 400) {
                    return response.json().then(data => {
                        throw new Error(data.message || 'Invalid registration data');
                    });
                } else {
                    throw new Error('Registration failed: ' + (response.statusText || 'Unknown error'));
                }
            })
            .then(data => {
                if (data.accessToken) {
                    console.log('[AuthManager] Registration successful');
                    
                    // Calculate token expiration time (default 1h if not provided)
                    let tokenExpires = null;
                    if (data.expiresIn) {
                        const expiresInMs = (typeof data.expiresIn === 'string')
                            ? parseInt(data.expiresIn) * 1000
                            : data.expiresIn * 1000;
                            
                        tokenExpires = new Date(Date.now() + expiresInMs).toISOString();
                    } else {
                        // Default 1 hour expiration
                        tokenExpires = new Date(Date.now() + 3600000).toISOString();
                    }
                    
                    // Update auth state with registration data
                    this.updateAuthState({
                        isAuthenticated: true,
                        token: data.accessToken,
                        refreshToken: data.refreshToken,
                        tokenExpires,
                        user: data.user
                    });
                    
                    // Update UI
                    if (window.SymptomSentryUtils && window.SymptomSentryUtils.updateProfileUI) {
                        window.SymptomSentryUtils.updateProfileUI(
                            data.user.email,
                            data.user.name,
                            data.user
                        );
                    }
                    
                    // Show success notification
                    if (window.SymptomSentryUtils && window.SymptomSentryUtils.showNotification) {
                        window.SymptomSentryUtils.showNotification(
                            'Registration successful! Welcome to SymptomSentryAI.', 
                            'success'
                        );
                    }
                    
                    return data;
                } else {
                    throw new Error('Registration response did not contain access token');
                }
            });
        }
        
        /**
         * Logout user
         * 
         * @returns {Promise} Promise resolving when logout completes
         */
        logout() {
            console.log('[AuthManager] Logging out');
            
            return fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            })
            .then(response => {
                console.log('[AuthManager] Server logout response:', response.status);
            })
            .catch(error => {
                console.error('[AuthManager] Error during server logout:', error);
            })
            .finally(() => {
                // Clear auth state regardless of server response
                this.clearAuth();
                
                // Show notification and update UI
                if (window.SymptomSentryUtils) {
                    if (window.SymptomSentryUtils.showNotification) {
                        window.SymptomSentryUtils.showNotification('You have been logged out', 'info');
                    }
                    
                    if (window.SymptomSentryUtils.updateProfileUI) {
                        window.SymptomSentryUtils.updateProfileUI(null);
                    }
                }
                
                // Redirect to home page
                const homeNavLink = document.querySelector('[data-page="home"]');
                if (homeNavLink) {
                    homeNavLink.click();
                }
            });
        }
        
        /**
         * Set up event listeners for auth-related events
         * This bridges between old event system and new centralized auth
         */
        _setupEventListeners() {
            // Listen for login events from other parts of the app
            document.addEventListener('userLoggedIn', (event) => {
                const { email, name, user } = event.detail;
                
                if (!this._state.isAuthenticated && email) {
                    console.log('[AuthManager] Received login event, updating state');
                    
                    this.updateAuthState({
                        isAuthenticated: true,
                        user: user || {
                            email,
                            name: name || null
                        }
                    });
                }
            });
            
            // Listen for logout events
            document.addEventListener('userLoggedOut', () => {
                if (this._state.isAuthenticated) {
                    console.log('[AuthManager] Received logout event, clearing state');
                    this.clearAuth();
                }
            });
        }
    }
    
    // Create a singleton instance of the auth manager
    const authManager = new AuthManager();
    
    // Add to global namespace
    window.SymptomSentryAuth = authManager;
})();