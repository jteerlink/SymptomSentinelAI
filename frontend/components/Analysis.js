// This component handles displaying the analysis results

// Initialize the components namespace if it doesn't exist
window.SymptomSentryComponents = window.SymptomSentryComponents || {};

// Add the analysis component to the components namespace
window.SymptomSentryComponents.initializeAnalysis = function(container) {
    if (!container) return;
    
    // Render the initial analysis UI (empty state)
    renderInitialAnalysisUI(container);
    
    // Listen for the imageAnalyzed event
    document.addEventListener('imageAnalyzed', (event) => {
        const results = event.detail;
        renderAnalysisResults(container, results);
    });
}

function renderInitialAnalysisUI(container) {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // User is not logged in, show login prompt
        container.innerHTML = `
            <div class="auth-required-message text-center p-5">
                <div class="mb-4">
                    <i class="fas fa-lock fa-4x text-muted"></i>
                </div>
                <h3>Authentication Required</h3>
                <p class="text-muted mb-4">You must be logged in to view and perform analyses.</p>
                <div class="d-grid gap-2 col-md-6 mx-auto">
                    <button class="btn btn-primary login-prompt-btn">
                        <i class="fas fa-sign-in-alt"></i> Sign In
                    </button>
                    <button class="btn btn-outline-secondary register-prompt-btn">
                        <i class="fas fa-user-plus"></i> Create Account
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners for login/register buttons
        const loginBtn = container.querySelector('.login-prompt-btn');
        const registerBtn = container.querySelector('.register-prompt-btn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                // Attempt to open login modal
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    const modal = new bootstrap.Modal(loginModal);
                    modal.show();
                    
                    // Switch to login tab if needed
                    const loginTab = document.querySelector('a[href="#login-tab"]');
                    if (loginTab) loginTab.click();
                } else {
                    // Fallback - try to navigate to a login page
                    navigateToPage('profile');
                }
            });
        }
        
        if (registerBtn) {
            registerBtn.addEventListener('click', () => {
                // Attempt to open registration modal
                const loginModal = document.getElementById('loginModal');
                if (loginModal) {
                    const modal = new bootstrap.Modal(loginModal);
                    modal.show();
                    
                    // Switch to register tab if needed
                    const registerTab = document.querySelector('a[href="#register-tab"]');
                    if (registerTab) registerTab.click();
                } else {
                    // Fallback - try to navigate to a register page
                    navigateToPage('profile');
                }
            });
        }
        
        return;
    }
    
    // User is authenticated, show empty container until an analysis result is available
    container.innerHTML = `<div class="analysis-results"></div>`;
}

function renderAnalysisResults(container, results) {
    // Check if results exist and have the expected properties
    if (!results || !results.conditions || !Array.isArray(results.conditions)) {
        showError(container, 'Invalid analysis results received');
        return;
    }
    
    // Set flag that an analysis has been performed so we can show the "No Analysis Yet"
    // message on subsequent visits if needed
    localStorage.setItem('hasPerformedAnalysis', 'true');
    
    // Sort conditions by confidence score (highest first)
    const sortedConditions = [...results.conditions].sort((a, b) => b.confidence - a.confidence);
    
    // Check if we have subscription info in the results
    // This happens when saving analysis results
    if (results.subscription) {
        console.log('Analysis includes subscription info:', results.subscription);
        
        // Create a custom event to update the profile UI with subscription info
        const subscriptionEvent = new CustomEvent('subscriptionUpdated', {
            detail: results.subscription
        });
        document.dispatchEvent(subscriptionEvent);
        
        // Show a notification if user is running low on analyses
        const analysisRemaining = results.subscription.analysisRemaining;
        const analysisLimit = results.subscription.analysisLimit;
        
        if (results.subscription.subscription === 'free' && analysisRemaining <= 2) {
            if (analysisRemaining === 0) {
                showNotification(
                    container, 
                    'You\'ve reached your monthly analysis limit! Upgrade to Premium for unlimited analyses.', 
                    'warning'
                );
            } else {
                showNotification(
                    container,
                    `You have ${analysisRemaining} of ${analysisLimit} analyses remaining this month. Consider upgrading to Premium for unlimited analyses.`,
                    'info'
                );
            }
        }
    }
    
    // Create the results HTML
    const resultsHTML = `
        <div class="analysis-results">
            <div class="analysis-header mb-4">
                <h3>Analysis Results</h3>
                <p class="text-muted">
                    ${results.type === 'throat' ? 'Throat' : 'Ear'} analysis completed 
                    <span class="fw-bold">${new Date().toLocaleString()}</span>
                </p>
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> 
                    <strong>Disclaimer:</strong> These results are generated by AI and should not replace professional medical advice.
                    Always consult with a healthcare provider for proper diagnosis and treatment.
                </div>
            </div>
            
            <div class="conditions-container">
                <h4>Potential Conditions</h4>
                <p class="text-muted mb-4">The following conditions were identified with their confidence scores:</p>
                
                ${sortedConditions.length > 0 
                    ? sortedConditions.map((condition, index) => renderConditionCard(condition, index)).join('')
                    : `<div class="alert alert-warning staggered-item">No potential conditions identified. This could mean the image is clear of visible issues or the image quality wasn't sufficient for analysis.</div>`
                }
            </div>
            
            <div class="mt-4">
                <h4>What's Next?</h4>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 staggered-item">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-book-medical"></i> Learn More
                                </h5>
                                <p class="card-text">Explore our educational resources to understand more about these conditions.</p>
                                <button class="btn btn-outline-primary show-education-btn">
                                    View Resources
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 staggered-item">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <i class="fas fa-user-md"></i> Professional Advice
                                </h5>
                                <p class="card-text">For a definitive diagnosis, consult with a healthcare provider.</p>
                                <button class="btn btn-outline-primary" disabled>
                                    Find Providers (Coming Soon)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="text-center mt-4">
                <button class="btn btn-primary new-analysis-btn">
                    <i class="fas fa-redo"></i> Start New Analysis
                </button>
                <button class="btn btn-outline-secondary save-results-btn">
                    <i class="fas fa-save"></i> Save Results
                </button>

                <div class="login-prompt mt-2" id="login-prompt" style="display: none;">
                    <small class="text-muted">
                        <i class="fas fa-lock"></i> 
                        <a href="#" class="login-prompt-link">Sign in or create an account</a> 
                        to save your analysis results
                    </small>
                </div>
            </div>
        </div>
    `;
    
    // Update the container with the results
    container.innerHTML = resultsHTML;
    
    // Animate the staggered items
    setTimeout(() => {
        const staggeredItems = container.querySelectorAll('.staggered-item');
        staggeredItems.forEach((item, index) => {
            setTimeout(() => {
                item.classList.add('show');
                
                // Animate the confidence bars after each item appears
                const confidenceBar = item.querySelector('.confidence-value');
                if (confidenceBar && confidenceBar.style.width === '0%') {
                    setTimeout(() => {
                        // Get the target percentage from the badge
                        const badge = item.querySelector('.badge');
                        let percentage = 0;
                        
                        if (badge) {
                            const percentText = badge.textContent.match(/(\d+)%/);
                            if (percentText && percentText[1]) {
                                percentage = percentText[1];
                            }
                        }
                        
                        confidenceBar.style.transition = 'width 1s ease-out';
                        confidenceBar.style.width = `${percentage}%`;
                    }, 200);
                }
            }, index * 150);
        });
    }, 300);
    
    // Add event listeners to the new buttons
    const newAnalysisBtn = container.querySelector('.new-analysis-btn');
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', () => {
            // Reset the analysis and go back to the upload view
            resetAnalysis();
        });
    }
    
    const showEducationBtn = container.querySelector('.show-education-btn');
    if (showEducationBtn) {
        showEducationBtn.addEventListener('click', () => {
            // Navigate to the education page
            navigateToPage('education');
        });
    }
    

    
    // Check authentication status
    const authToken = localStorage.getItem('authToken');
    const loginPrompt = container.querySelector('#login-prompt');
    const saveResultsBtn = container.querySelector('.save-results-btn');
    
    if (!authToken) {
        // Not authenticated, disable save button and show login prompt
        if (saveResultsBtn) {
            saveResultsBtn.disabled = true;
        }
        if (loginPrompt) {
            loginPrompt.style.display = 'block';
        }
    } else {
        // Authenticated, enable button and hide login prompt
        if (saveResultsBtn) {
            saveResultsBtn.disabled = false;
        }
        if (loginPrompt) {
            loginPrompt.style.display = 'none';
        }
    }
    
    if (saveResultsBtn) {
        saveResultsBtn.addEventListener('click', async () => {
            try {
                // Check if user is authenticated
                const authToken = localStorage.getItem('authToken');
                if (!authToken) {
                    // Show the login prompt
                    loginPrompt.style.display = 'block';
                    showNotification(container, 'Please sign in to save your results', 'warning');
                    return;
                }
                
                // Show saving state
                saveResultsBtn.disabled = true;
                saveResultsBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
                
                // Use the global namespace for api requests
                const apiRequest = window.SymptomSentryApp.apiRequest;
                
                // Call the API to save the results using our utility function
                const responseData = await apiRequest('/api/save-analysis', 'POST', results);
                
                // Display success message
                showNotification(container, 'Results saved successfully!', 'success');
                
                // Check if subscription info was returned
                if (responseData.subscription) {
                    const { subscription, analysisCount, analysisLimit, analysisRemaining } = responseData.subscription;
                    
                    // Display subscription info if user is on free plan and getting close to limit
                    if (subscription === 'free' && analysisRemaining <= 2) {
                        const remainingMessage = analysisRemaining === 0 
                            ? 'You have reached your monthly analysis limit.'
                            : `You have ${analysisRemaining} analysis ${analysisRemaining === 1 ? 'credit' : 'credits'} remaining this month.`;
                            
                        // Show subscription alert
                        const subscriptionAlert = document.createElement('div');
                        subscriptionAlert.className = 'alert alert-warning mt-3';
                        subscriptionAlert.innerHTML = `
                            <strong><i class="fas fa-exclamation-circle"></i> ${remainingMessage}</strong>
                            <p class="mb-1">Upgrade to Premium for unlimited analyses and advanced features.</p>
                            <button class="btn btn-sm btn-warning upgrade-btn mt-2">
                                <i class="fas fa-arrow-circle-up"></i> Upgrade to Premium
                            </button>
                        `;
                        
                        // Insert before the buttons
                        const buttonContainer = saveResultsBtn.parentElement;
                        buttonContainer.parentElement.insertBefore(subscriptionAlert, buttonContainer);
                        
                        // Add click event to upgrade button
                        const upgradeBtn = subscriptionAlert.querySelector('.upgrade-btn');
                        if (upgradeBtn) {
                            upgradeBtn.addEventListener('click', () => {
                                navigateToPage('subscription');
                            });
                        }
                    }
                }
            } catch (error) {
                console.error('Error saving results:', error);
                showNotification(container, 'Failed to save results: ' + error.message, 'danger');
            } finally {
                // Reset button state
                saveResultsBtn.disabled = false;
                saveResultsBtn.innerHTML = '<i class="fas fa-save"></i> Save Results';
            }
        });
    }
    
    // Add event listener to the login prompt link
    const loginPromptLink = container.querySelector('.login-prompt-link');
    if (loginPromptLink) {
        loginPromptLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Show the login/registration modal
            const loginModal = document.getElementById('loginModal');
            if (loginModal) {
                // Create Bootstrap modal instance if it exists
                const modal = new bootstrap.Modal(loginModal);
                modal.show();
                
                // Store current analysis results to save after login
                sessionStorage.setItem('pendingAnalysisResults', JSON.stringify(results));
            } else {
                // Fallback if modal doesn't exist
                navigateToPage('profile');
                showNotification(container, 'Please sign in to save your results', 'info');
            }
        });
    }
}

function renderConditionCard(condition, index = 0) {
    // Determine confidence level styling
    let confidenceLevel = 'Low';
    let confidenceColor = 'var(--warning-color)';
    
    if (condition.confidence >= 0.7) {
        confidenceLevel = 'High';
        confidenceColor = 'var(--danger-color)';
    } else if (condition.confidence >= 0.4) {
        confidenceLevel = 'Medium';
        confidenceColor = 'var(--warning-color)';
    }
    
    // Format confidence as percentage
    const confidencePercentage = Math.round(condition.confidence * 100);
    
    // Add high confidence indicator with heartbeat animation if needed
    let indicatorHtml = '';
    let warningHtml = '';
    
    if (condition.confidence >= 0.7) {
        indicatorHtml = '<span class="high-confidence-indicator pulse me-2"></span>';
        
        // Add warning for potentially serious conditions
        if (condition.isPotentiallySerious) {
            warningHtml = `
                <div class="alert alert-danger mt-2 mb-2 p-2 heartbeat">
                    <i class="fas fa-exclamation-triangle"></i> 
                    This may require medical attention
                </div>
            `;
        }
    }
    
    return `
        <div class="condition-card staggered-item" style="transition-delay: ${index * 150}ms;">
            <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-1">${indicatorHtml}${condition.name}</h5>
                <span class="badge bg-${confidenceLevel === 'High' ? 'danger' : confidenceLevel === 'Medium' ? 'warning' : 'info'}">
                    ${confidenceLevel} ${confidencePercentage}%
                </span>
            </div>
            <p class="text-muted mb-2">${condition.description || 'No description available'}</p>
            ${warningHtml}
            <div class="confidence-bar">
                <div class="confidence-value" style="width: 0%; background-color: ${confidenceColor}"></div>
            </div>
            <div class="mt-3">
                <button class="btn btn-sm btn-outline-secondary condition-info-btn" 
                        data-condition="${encodeURIComponent(JSON.stringify(condition))}">
                    <i class="fas fa-info-circle"></i> More Info
                </button>
            </div>
        </div>
    `;
}

function showError(container, message) {
    container.innerHTML = `
        <div class="analysis-results">
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i> 
                Error: ${message}
            </div>
            <div class="text-center mt-3">
                <button class="btn btn-primary new-analysis-btn">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        </div>
    `;
    
    const newAnalysisBtn = container.querySelector('.new-analysis-btn');
    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', () => {
            resetAnalysis();
        });
    }
}

function showNotification(container, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} notification-toast`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '1050';
    notification.style.minWidth = '300px';
    notification.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
    notification.innerHTML = message;
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.style.position = 'absolute';
    closeBtn.style.right = '10px';
    closeBtn.style.top = '10px';
    
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(notification);
    });
    
    notification.appendChild(closeBtn);
    
    // Add to document
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 5000);
}

function resetAnalysis() {
    // Reset the image upload component
    const uploadContainer = document.getElementById('image-upload-component');
    if (uploadContainer) {
        // Find the preview container and drop area
        const previewContainer = uploadContainer.querySelector('#previewContainer');
        const dropArea = uploadContainer.querySelector('#dropArea');
        
        if (previewContainer && dropArea) {
            // Reset the form
            const fileInput = uploadContainer.querySelector('#fileInput');
            const previewImage = uploadContainer.querySelector('#previewImage');
            
            if (fileInput) fileInput.value = '';
            if (previewImage) previewImage.src = '';
            
            previewContainer.style.display = 'none';
            dropArea.style.display = 'block';
        }
    }
    
    // Reset the analysis results component
    const analysisContainer = document.getElementById('analysis-results-component');
    if (analysisContainer) {
        renderInitialAnalysisUI(analysisContainer);
    }
}

function navigateToPage(pageId) {
    // Get all nav links
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Simulate a click on the correct nav link
    navLinks.forEach(link => {
        if (link.getAttribute('data-page') === pageId) {
            link.click();
        }
    });
}
