/**
 * Reset Authentication Script
 * 
 * This script forcibly logs out any existing user and clears all authentication data.
 * It also handles the login modal ID mismatch issue by ensuring only the authModal is used.
 */

// Function to clear all authentication data
function forceLogout() {
    console.log('[ResetAuth] Force logout initiated');
    
    // Clear all localStorage items related to authentication
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpires');
    localStorage.removeItem('hasPerformedAnalysis');
    localStorage.removeItem('lastAnalysisId');
    localStorage.removeItem('lastAnalysisResults');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    
    // Clear session storage completely
    sessionStorage.clear();
    
    // Clear cookies by overwriting them with expired ones
    document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
    document.cookie = 'refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;';
    
    // Make a logout request to server
    fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
    }).catch(error => console.error('[ResetAuth] Logout error:', error));
    
    console.log('[ResetAuth] All authentication data cleared');
    
    // Return to home page and refresh only
    // Do not redirect to auth-reset page
    if (window.location.pathname !== '/admin/auth-reset.html') {
        window.location.href = '/';
    }
}

// Function to verify and fix the login modal
function fixLoginModal() {
    console.log('[ResetAuth] Checking for modal ID issues');
    
    // First, check if loginModal exists (we don't want it to exist)
    const oldLoginModal = document.getElementById('loginModal');
    if (oldLoginModal) {
        console.log('[ResetAuth] Found obsolete loginModal, removing it');
        oldLoginModal.parentNode.removeChild(oldLoginModal);
    }
    
    // Now check if authModal exists
    const authModal = document.getElementById('authModal');
    if (!authModal) {
        console.log('[ResetAuth] Auth modal not found, manually creating one');
        
        // Create container if needed
        let container = document.getElementById('auth-modal-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'auth-modal-container';
            document.body.appendChild(container);
        }
        
        // Add the modal HTML
        container.innerHTML = `
            <div class="modal fade" id="authModal" tabindex="-1" aria-labelledby="authModalLabel" aria-hidden="true">
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
        
        console.log('[ResetAuth] Auth modal created successfully');
    } else {
        console.log('[ResetAuth] Auth modal already exists and is correctly configured');
    }
}

// Execute the fix functions
console.log('[ResetAuth] Starting authentication reset process');
forceLogout();
fixLoginModal();
console.log('[ResetAuth] Authentication reset complete');