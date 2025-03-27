/**
 * Analysis History Component
 * 
 * Displays the user's saved analysis history with options to view details,
 * delete individual analyses, and share results.
 */

// Initialize the component in the global namespace
if (!window.SymptomSentryAnalysisHistory) {
    window.SymptomSentryAnalysisHistory = {};
}

/**
 * Initialize and render the Analysis History component
 * 
 * @param {HTMLElement} container - The container element to render the component in
 */
function initAnalysisHistory(container) {
    console.log('[Analysis History] Initializing component');
    
    // Check authentication - using cookie validation to be more reliable
    if (!window.SymptomSentryUtils.isAuthenticated()) {
        console.log('[Analysis History] Initial auth check failed, will try cookie validation');
        
        // We'll validate with the server in case localStorage is out of sync but cookies are valid
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
                console.log('[Analysis History] Valid cookie authentication found, loading history');
                
                // Store the validated user information for future use
                if (data.accessToken) {
                    localStorage.setItem('authToken', data.accessToken);
                }
                
                // Now load the history since we're authenticated
                renderAnalysisHistoryUI(container);
                setupEventListeners(container);
                loadAnalysisHistory(container);
            } else {
                console.log('[Analysis History] No valid authentication found, showing login prompt');
                renderLoginPrompt(container);
            }
        })
        .catch(error => {
            console.error('[Analysis History] Authentication check failed:', error.message);
            renderLoginPrompt(container);
        });
        
        // Show loading state while we validate
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Checking authentication status...</p>
            </div>
        `;
        
        return;
    }
    
    // Render the initial UI
    renderAnalysisHistoryUI(container);
    
    // Setup event listeners
    setupEventListeners(container);
    
    // Load analysis history data
    loadAnalysisHistory(container);
}

/**
 * Render the login prompt for unauthenticated users
 * 
 * @param {HTMLElement} container - The container element
 */
function renderLoginPrompt(container) {
    container.innerHTML = `
        <div class="alert alert-warning">
            <i class="fas fa-user-lock me-2"></i> 
            <strong>Authentication Required</strong>
            <p class="mt-2">Please log in to view your analysis history.</p>
            <button class="btn btn-primary mt-2 login-btn">Sign In / Register</button>
        </div>
    `;
    
    // Add login button event listener
    const loginButton = container.querySelector('.login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            // Use the app's login function
            if (window.SymptomSentryApp && typeof window.SymptomSentryApp.handleRegistration === 'function') {
                window.SymptomSentryApp.handleRegistration();
            }
        });
    }
}

/**
 * Render the analysis history UI
 * 
 * @param {HTMLElement} container - The container element
 */
function renderAnalysisHistoryUI(container) {
    container.innerHTML = `
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Analysis History</h5>
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" id="sortDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-sort me-1"></i> Sort
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="sortDropdown">
                        <li><a class="dropdown-item sort-option" data-sort="newest" href="#">Newest First</a></li>
                        <li><a class="dropdown-item sort-option" data-sort="oldest" href="#">Oldest First</a></li>
                        <li><a class="dropdown-item sort-option" data-sort="type" href="#">By Analysis Type</a></li>
                    </ul>
                </div>
            </div>
            <div class="card-body">
                <div class="history-list-container">
                    <div class="history-loading">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <p class="mt-2">Loading your analysis history...</p>
                    </div>
                    <div class="history-empty d-none">
                        <div class="text-center py-4">
                            <i class="fas fa-history fa-3x mb-3 text-muted"></i>
                            <h5>No Analyses Yet</h5>
                            <p class="text-muted">Your saved analyses will appear here.</p>
                            <a href="#" class="btn btn-primary start-analysis-btn">Start An Analysis</a>
                        </div>
                    </div>
                    <div class="history-list d-none">
                        <!-- Analysis history items will be added here -->
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Analysis Detail Modal -->
        <div class="modal fade" id="analysisDetailModal" tabindex="-1" aria-labelledby="analysisDetailModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="analysisDetailModalLabel">Analysis Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="analysis-detail-container">
                        <!-- Analysis details will be loaded here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-danger delete-analysis-btn">Delete</button>
                        <button type="button" class="btn btn-primary share-analysis-btn">Share</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Set up event listeners for the analysis history component
 * 
 * @param {HTMLElement} container - The container element
 */
function setupEventListeners(container) {
    // Start analysis button
    const startAnalysisBtn = container.querySelector('.start-analysis-btn');
    if (startAnalysisBtn) {
        startAnalysisBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to analyze page
            const analyzeNavLink = document.querySelector('[data-page="analyze"]');
            if (analyzeNavLink) {
                analyzeNavLink.click();
            }
        });
    }
    
    // Sort dropdown options
    const sortOptions = container.querySelectorAll('.sort-option');
    sortOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.preventDefault();
            const sortType = e.target.getAttribute('data-sort');
            sortAnalysisHistory(sortType, container);
        });
    });
    
    // Delete analysis button in modal
    const deleteAnalysisBtn = document.querySelector('.delete-analysis-btn');
    if (deleteAnalysisBtn) {
        deleteAnalysisBtn.addEventListener('click', () => {
            const analysisId = deleteAnalysisBtn.getAttribute('data-analysis-id');
            if (analysisId) {
                deleteAnalysis(analysisId, container);
            }
        });
    }
    
    // Share analysis button in modal
    const shareAnalysisBtn = document.querySelector('.share-analysis-btn');
    if (shareAnalysisBtn) {
        shareAnalysisBtn.addEventListener('click', () => {
            const analysisId = shareAnalysisBtn.getAttribute('data-analysis-id');
            if (analysisId) {
                shareAnalysis(analysisId);
            }
        });
    }
}

/**
 * Load the user's analysis history from the API
 * 
 * @param {HTMLElement} container - The container element
 */
function loadAnalysisHistory(container) {
    console.log('[Analysis History] Loading history data');
    
    // Show loading indicator
    const loadingEl = container.querySelector('.history-loading');
    const historyListEl = container.querySelector('.history-list');
    const emptyHistoryEl = container.querySelector('.history-empty');
    
    if (loadingEl) loadingEl.classList.remove('d-none');
    if (historyListEl) historyListEl.classList.add('d-none');
    if (emptyHistoryEl) emptyHistoryEl.classList.add('d-none');
    
    // Get auth token
    const token = window.SymptomSentryUtils.getAuthToken();
    if (!token) {
        console.error('[Analysis History] No auth token found');
        showError(container, 'Authentication error. Please try logging in again.');
        return;
    }
    
    // Fetch history data from API
    fetch('/api/analysis-history', {
        method: 'GET',
        credentials: 'include', // Include cookies for auth
        headers: {
            'Content-Type': 'application/json',
            ...(token !== 'use-cookies' ? { 'Authorization': `Bearer ${token}` } : {})
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('[Analysis History] History data loaded:', data);
        
        // Hide loading indicator
        if (loadingEl) loadingEl.classList.add('d-none');
        
        // Check if there are any analyses
        if (!data.history || data.history.length === 0) {
            if (emptyHistoryEl) emptyHistoryEl.classList.remove('d-none');
            return;
        }
        
        // Render the history list
        if (historyListEl) {
            historyListEl.classList.remove('d-none');
            renderAnalysisList(data.history, historyListEl);
        }
    })
    .catch(error => {
        console.error('[Analysis History] Error loading history:', error);
        showError(container, 'Failed to load analysis history. Please try again later.');
    });
}

/**
 * Render the list of analysis history items
 * 
 * @param {Array} analyses - The array of analysis objects
 * @param {HTMLElement} container - The container element
 */
function renderAnalysisList(analyses, container) {
    // Default sort: newest first
    analyses.sort((a, b) => new Date(b.created_at || b.timestamp) - new Date(a.created_at || a.timestamp));
    
    const historyHTML = analyses.map(analysis => {
        const date = new Date(analysis.created_at || analysis.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Get the top condition (highest confidence)
        let topCondition = { name: 'Unknown', confidence: 0 };
        if (analysis.conditions && analysis.conditions.length > 0) {
            // Sort by confidence
            const sortedConditions = [...analysis.conditions].sort((a, b) => b.confidence - a.confidence);
            topCondition = sortedConditions[0];
        }
        
        // Format confidence as percentage
        const confidencePercent = Math.round(topCondition.confidence * 100);
        
        return `
            <div class="analysis-item card mb-2" data-analysis-id="${analysis.id}" data-timestamp="${date.toISOString()}" data-type="${analysis.type}">
                <div class="card-body py-2">
                    <div class="row align-items-center">
                        <div class="col-md-3">
                            <div class="small text-muted">${formattedDate}</div>
                            <div class="small">${formattedTime}</div>
                        </div>
                        <div class="col-md-3">
                            <span class="badge ${analysis.type === 'throat' ? 'bg-danger' : 'bg-info'} text-capitalize">
                                ${analysis.type}
                            </span>
                        </div>
                        <div class="col-md-4">
                            <div class="small fw-bold">${topCondition.name}</div>
                            <div class="small text-muted">${confidencePercent}% confidence</div>
                        </div>
                        <div class="col-md-2">
                            <button class="btn btn-sm btn-outline-primary view-details-btn">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = historyHTML;
    
    // Add event listeners to view details buttons
    const viewDetailsButtons = container.querySelectorAll('.view-details-btn');
    viewDetailsButtons.forEach(button => {
        button.addEventListener('click', () => {
            const analysisItem = button.closest('.analysis-item');
            const analysisId = analysisItem.getAttribute('data-analysis-id');
            viewAnalysisDetails(analysisId);
        });
    });
}

/**
 * Sort the analysis history list
 * 
 * @param {string} sortType - The sort type ('newest', 'oldest', 'type')
 * @param {HTMLElement} container - The container element
 */
function sortAnalysisHistory(sortType, container) {
    console.log(`[Analysis History] Sorting by: ${sortType}`);
    
    const historyListEl = container.querySelector('.history-list');
    if (!historyListEl) return;
    
    const items = Array.from(historyListEl.querySelectorAll('.analysis-item'));
    if (items.length === 0) return;
    
    // Sort the items based on the selected sort type
    items.sort((a, b) => {
        const aTimestamp = new Date(a.getAttribute('data-timestamp'));
        const bTimestamp = new Date(b.getAttribute('data-timestamp'));
        const aType = a.getAttribute('data-type');
        const bType = b.getAttribute('data-type');
        
        if (sortType === 'newest') {
            return bTimestamp - aTimestamp;
        } else if (sortType === 'oldest') {
            return aTimestamp - bTimestamp;
        } else if (sortType === 'type') {
            // First sort by type, then by newest
            return aType === bType ? bTimestamp - aTimestamp : aType.localeCompare(bType);
        }
    });
    
    // Reorder the items in the DOM
    items.forEach(item => {
        historyListEl.appendChild(item);
    });
    
    // Update the sort dropdown button text
    const sortDropdown = container.querySelector('#sortDropdown');
    if (sortDropdown) {
        let sortText = 'Sort';
        if (sortType === 'newest') sortText = 'Newest First';
        else if (sortType === 'oldest') sortText = 'Oldest First';
        else if (sortType === 'type') sortText = 'By Type';
        
        sortDropdown.innerHTML = `<i class="fas fa-sort me-1"></i> ${sortText}`;
    }
}

/**
 * View the details of a specific analysis
 * 
 * @param {string} analysisId - The ID of the analysis to view
 */
function viewAnalysisDetails(analysisId) {
    console.log(`[Analysis History] Viewing details for analysis: ${analysisId}`);
    
    // Get auth token
    const token = window.SymptomSentryUtils.getAuthToken();
    if (!token) {
        console.error('[Analysis History] No auth token found');
        window.SymptomSentryUtils.showNotification('Authentication error. Please try logging in again.', 'danger');
        return;
    }
    
    // Show loading state in modal
    const modalBody = document.getElementById('analysis-detail-container');
    if (modalBody) {
        modalBody.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading analysis details...</p>
            </div>
        `;
    }
    
    // Set the analysis ID for the delete and share buttons
    const deleteButton = document.querySelector('.delete-analysis-btn');
    const shareButton = document.querySelector('.share-analysis-btn');
    if (deleteButton) deleteButton.setAttribute('data-analysis-id', analysisId);
    if (shareButton) shareButton.setAttribute('data-analysis-id', analysisId);
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('analysisDetailModal'));
    modal.show();
    
    // Fetch the analysis details
    fetch(`/api/analysis/${analysisId}`, {
        method: 'GET',
        credentials: 'include', // Include cookies for auth
        headers: {
            'Content-Type': 'application/json',
            ...(token !== 'use-cookies' ? { 'Authorization': `Bearer ${token}` } : {})
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('[Analysis History] Analysis details loaded:', data);
        
        // Extract the analysis object from the response
        // Our new endpoint returns { analysis: {...} }
        const analysis = data.analysis || data;
        
        if (modalBody) {
            // Format date and time
            const date = new Date(analysis.created_at || analysis.timestamp || analysis.createdAt);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // Render the analysis details using the same format as the Analysis component
            modalBody.innerHTML = `
                <div class="mb-4">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h6>Analysis Date:</h6>
                            <p>${formattedDate}</p>
                        </div>
                        <div>
                            <h6>Analysis Type:</h6>
                            <p class="text-capitalize">
                                <span class="badge ${analysis.type === 'throat' ? 'bg-danger' : 'bg-info'}">${analysis.type}</span>
                            </p>
                        </div>
                    </div>
                    <hr>
                    <h5 class="mb-3">Detected Conditions</h5>
                    <div class="row">
                        ${renderConditionCards(analysis.conditions)}
                    </div>
                </div>
            `;
        }
    })
    .catch(error => {
        console.error('[Analysis History] Error loading analysis details:', error);
        if (modalBody) {
            modalBody.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Failed to load analysis details. Please try again later.
                </div>
            `;
        }
    });
}

/**
 * Render condition cards for the analysis details
 * 
 * @param {Array} conditions - The array of condition objects
 * @returns {string} The HTML for the condition cards
 */
function renderConditionCards(conditions) {
    if (!conditions || conditions.length === 0) {
        return `
            <div class="col-12">
                <div class="alert alert-info">
                    No conditions detected in this analysis.
                </div>
            </div>
        `;
    }
    
    // Sort conditions by confidence (highest first)
    const sortedConditions = [...conditions].sort((a, b) => b.confidence - a.confidence);
    
    return sortedConditions.map((condition, index) => {
        // Format confidence as percentage
        const confidencePercent = Math.round(condition.confidence * 100);
        
        // Determine confidence class
        let confidenceClass = 'bg-success';
        if (confidencePercent < 50) {
            confidenceClass = 'bg-warning';
        } else if (confidencePercent < 30) {
            confidenceClass = 'bg-danger';
        }
        
        // Create symptom list if available
        let symptomsList = '';
        if (condition.symptoms && condition.symptoms.length > 0) {
            symptomsList = `
                <h6 class="mt-3">Common Symptoms:</h6>
                <ul class="small">
                    ${condition.symptoms.map(symptom => `<li>${symptom}</li>`).join('')}
                </ul>
            `;
        }
        
        return `
            <div class="col-md-6 mb-3">
                <div class="card h-100 ${index === 0 ? 'border-primary' : ''}">
                    <div class="card-header ${index === 0 ? 'bg-primary text-white' : ''}">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">${condition.name}</h5>
                            <span class="badge ${confidenceClass}">${confidencePercent}%</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <p>${condition.description || 'No description available.'}</p>
                        ${symptomsList}
                        ${condition.isPotentiallySerious ? 
                            `<div class="alert alert-warning mt-3 mb-0 small">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                This condition may require medical attention.
                            </div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Delete an analysis
 * 
 * @param {string} analysisId - The ID of the analysis to delete
 * @param {HTMLElement} container - The container element for the history list
 */
function deleteAnalysis(analysisId, container) {
    console.log(`[Analysis History] Deleting analysis: ${analysisId}`);
    
    // Get auth token
    const token = window.SymptomSentryUtils.getAuthToken();
    if (!token) {
        console.error('[Analysis History] No auth token found');
        window.SymptomSentryUtils.showNotification('Authentication error. Please try logging in again.', 'danger');
        return;
    }
    
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
        return;
    }
    
    // Delete the analysis
    fetch(`/api/analysis/${analysisId}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies for auth
        headers: {
            'Content-Type': 'application/json',
            ...(token !== 'use-cookies' ? { 'Authorization': `Bearer ${token}` } : {})
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('[Analysis History] Analysis deleted:', data);
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('analysisDetailModal'));
        if (modal) modal.hide();
        
        // Remove the analysis from the list
        const analysisItem = container.querySelector(`.analysis-item[data-analysis-id="${analysisId}"]`);
        if (analysisItem) {
            analysisItem.remove();
            
            // If no analyses left, show empty state
            const historyList = container.querySelector('.history-list');
            if (historyList && historyList.children.length === 0) {
                historyList.classList.add('d-none');
                const emptyHistory = container.querySelector('.history-empty');
                if (emptyHistory) emptyHistory.classList.remove('d-none');
            }
        }
        
        // Show success notification
        window.SymptomSentryUtils.showNotification('Analysis deleted successfully', 'success');
    })
    .catch(error => {
        console.error('[Analysis History] Error deleting analysis:', error);
        window.SymptomSentryUtils.showNotification('Failed to delete analysis. Please try again later.', 'danger');
    });
}

/**
 * Share an analysis
 * 
 * @param {string} analysisId - The ID of the analysis to share
 */
function shareAnalysis(analysisId) {
    console.log(`[Analysis History] Sharing analysis: ${analysisId}`);
    
    // For now, we'll just create a share URL and copy it to clipboard
    const shareUrl = `${window.location.origin}/share?id=${analysisId}`;
    
    // Try to use the clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                window.SymptomSentryUtils.showNotification('Share link copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('[Analysis History] Could not copy text: ', err);
                // Fallback to prompt
                prompt('Copy this link to share your analysis:', shareUrl);
            });
    } else {
        // Fallback for browsers that don't support clipboard API
        prompt('Copy this link to share your analysis:', shareUrl);
    }
}

/**
 * Show an error message in the history container
 * 
 * @param {HTMLElement} container - The container element
 * @param {string} message - The error message to show
 */
function showError(container, message) {
    const loadingEl = container.querySelector('.history-loading');
    const historyListEl = container.querySelector('.history-list');
    const emptyHistoryEl = container.querySelector('.history-empty');
    
    if (loadingEl) loadingEl.classList.add('d-none');
    if (historyListEl) historyListEl.classList.add('d-none');
    if (emptyHistoryEl) emptyHistoryEl.classList.add('d-none');
    
    // Create and show error alert
    const errorAlert = document.createElement('div');
    errorAlert.className = 'alert alert-danger';
    errorAlert.innerHTML = `
        <i class="fas fa-exclamation-circle me-2"></i>
        <strong>Error:</strong> ${message}
    `;
    
    // Find a good place to insert the error
    const historyContainer = container.querySelector('.history-list-container');
    if (historyContainer) {
        historyContainer.innerHTML = '';
        historyContainer.appendChild(errorAlert);
    } else {
        // Fallback if container structure changes
        container.appendChild(errorAlert);
    }
}

// Export functions to the global namespace
window.SymptomSentryAnalysisHistory = {
    init: initAnalysisHistory,
    loadAnalysisHistory: loadAnalysisHistory,
    sortHistory: sortAnalysisHistory,
    viewDetails: viewAnalysisDetails,
    deleteAnalysis: deleteAnalysis,
    shareAnalysis: shareAnalysis
};