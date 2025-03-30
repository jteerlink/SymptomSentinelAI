/**
 * Analysis Detail Component
 * 
 * This component displays the full details of a single analysis.
 * It is designed to be shown on its own page rather than in a modal.
 */

// Initialize the component with the analysis ID from the URL
function initAnalysisDetail(container) {
    console.log('[Analysis Detail] Initializing component');
    
    // Extract the analysis ID from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const analysisId = urlParams.get('id');
    
    if (!analysisId) {
        renderError(container, 'No analysis ID provided. Please select an analysis from your history.');
        return;
    }
    
    // Render the initial container
    container.innerHTML = `
        <div class="container mt-4">
            <div class="row">
                <div class="col-12">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="#" class="back-to-history">Analysis History</a></li>
                            <li class="breadcrumb-item active" aria-current="page">Analysis Details</li>
                        </ol>
                    </nav>
                    
                    <div class="card mb-4 shadow-sm">
                        <div class="card-body p-0">
                            <div class="analysis-loading p-4 text-center">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="mt-2">Loading analysis details...</p>
                            </div>
                            <div class="analysis-content p-4 d-none">
                                <!-- Analysis details will be loaded here -->
                            </div>
                            <div class="analysis-error p-4 d-none">
                                <!-- Error messages will be shown here -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between">
                        <a href="#" class="btn btn-outline-secondary back-to-history">
                            <i class="fas fa-arrow-left me-2"></i>Back to History
                        </a>
                        <div>
                            <button class="btn btn-danger delete-analysis-btn" data-analysis-id="${analysisId}">
                                <i class="fas fa-trash me-2"></i>Delete
                            </button>
                            <button class="btn btn-primary share-analysis-btn" data-analysis-id="${analysisId}">
                                <i class="fas fa-share-alt me-2"></i>Share
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Set up event listeners
    setupEventListeners(container, analysisId);
    
    // Load the analysis data
    loadAnalysisData(container, analysisId);
}

/**
 * Set up event listeners for the component
 * 
 * @param {HTMLElement} container - The container element
 * @param {string} analysisId - The ID of the analysis
 */
function setupEventListeners(container, analysisId) {
    // Back to history links
    const backLinks = container.querySelectorAll('.back-to-history');
    backLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Navigate to history page
            const historyNavLink = document.querySelector('[data-page="history"]');
            if (historyNavLink) {
                historyNavLink.click();
            }
        });
    });
    
    // Delete button
    const deleteBtn = container.querySelector('.delete-analysis-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            deleteAnalysis(container, analysisId);
        });
    }
    
    // Share button
    const shareBtn = container.querySelector('.share-analysis-btn');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            shareAnalysis(analysisId);
        });
    }
}

/**
 * Load analysis data from the API
 * 
 * @param {HTMLElement} container - The container element
 * @param {string} analysisId - The ID of the analysis
 */
function loadAnalysisData(container, analysisId) {
    console.log(`[Analysis Detail] Loading data for analysis: ${analysisId}`);
    
    const loadingEl = container.querySelector('.analysis-loading');
    const contentEl = container.querySelector('.analysis-content');
    const errorEl = container.querySelector('.analysis-error');
    
    // Get auth token
    const token = window.SymptomSentryUtils.getAuthToken();
    if (!token) {
        console.error('[Analysis Detail] No auth token found');
        renderError(container, 'Authentication error. Please try logging in again.');
        return;
    }
    
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
        console.log('[Analysis Detail] Analysis data loaded:', data);
        
        // Hide loading indicator
        if (loadingEl) loadingEl.classList.add('d-none');
        
        // Extract the analysis object from the response
        // Our endpoint returns either { analysis: {...} } or the analysis directly
        const analysis = data.analysis || data;
        
        // Render the analysis details
        if (contentEl) {
            contentEl.classList.remove('d-none');
            renderAnalysisDetails(contentEl, analysis);
        }
    })
    .catch(error => {
        console.error('[Analysis Detail] Error loading analysis:', error);
        renderError(container, 'Failed to load analysis details. Please try again later.');
    });
}

/**
 * Render analysis details in the container
 * 
 * @param {HTMLElement} container - The container element
 * @param {Object} analysis - The analysis data
 */
function renderAnalysisDetails(container, analysis) {
    // Format date and time
    const date = new Date(analysis.created_at || analysis.timestamp || analysis.createdAt);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Render the analysis details
    container.innerHTML = `
        <div class="mb-4">
            <h2 class="mb-4">Analysis Results</h2>
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header bg-light">
                            <h5 class="mb-0">Analysis Information</h5>
                        </div>
                        <div class="card-body">
                            <table class="table table-bordered">
                                <tr>
                                    <th>Date</th>
                                    <td>${formattedDate}</td>
                                </tr>
                                <tr>
                                    <th>Type</th>
                                    <td>
                                        <span class="badge ${analysis.type === 'throat' ? 'bg-danger' : 'bg-info'} text-capitalize">
                                            ${analysis.type}
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <th>ID</th>
                                    <td><small class="text-muted">${analysis.id}</small></td>
                                </tr>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card h-100">
                        <div class="card-header bg-light">
                            <h5 class="mb-0">Analysis Summary</h5>
                        </div>
                        <div class="card-body">
                            ${renderAnalysisSummary(analysis)}
                        </div>
                    </div>
                </div>
            </div>
            
            <h3 class="mb-3">Detected Conditions</h3>
            <div class="row">
                ${renderConditionCards(analysis.conditions)}
            </div>
        </div>
    `;
}

/**
 * Render a summary of the analysis
 * 
 * @param {Object} analysis - The analysis data
 * @returns {string} HTML for the summary
 */
function renderAnalysisSummary(analysis) {
    // Get the top condition (highest confidence)
    if (!analysis.conditions || analysis.conditions.length === 0) {
        return `<div class="alert alert-info">No conditions detected in this analysis.</div>`;
    }
    
    // Sort by confidence
    const sortedConditions = [...analysis.conditions].sort((a, b) => b.confidence - a.confidence);
    const topCondition = sortedConditions[0];
    
    // Format confidence as percentage
    const confidencePercent = Math.round(topCondition.confidence * 100);
    
    // Determine confidence class
    let confidenceClass = 'success';
    if (confidencePercent < 50) {
        confidenceClass = 'warning';
    } else if (confidencePercent < 30) {
        confidenceClass = 'danger';
    }
    
    return `
        <h4 class="mb-3">Primary Detected Condition</h4>
        <div class="d-flex align-items-center mb-3">
            <h5 class="mb-0 me-3">${topCondition.name}</h5>
            <span class="badge bg-${confidenceClass}">${confidencePercent}% confidence</span>
        </div>
        <p>${topCondition.description || 'No description available.'}</p>
        ${topCondition.isPotentiallySerious ? 
            `<div class="alert alert-warning mt-3 mb-0">
                <i class="fas fa-exclamation-triangle me-2"></i>
                This condition may require medical attention.
            </div>` : ''}
    `;
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
 * @param {HTMLElement} container - The container element
 * @param {string} analysisId - The ID of the analysis to delete
 */
function deleteAnalysis(container, analysisId) {
    console.log(`[Analysis Detail] Deleting analysis: ${analysisId}`);
    
    // Get auth token
    const token = window.SymptomSentryUtils.getAuthToken();
    if (!token) {
        console.error('[Analysis Detail] No auth token found');
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
        console.log('[Analysis Detail] Analysis deleted:', data);
        
        // Show success notification
        window.SymptomSentryUtils.showNotification('Analysis deleted successfully', 'success');
        
        // Navigate back to history page
        const historyNavLink = document.querySelector('[data-page="history"]');
        if (historyNavLink) {
            historyNavLink.click();
        }
    })
    .catch(error => {
        console.error('[Analysis Detail] Error deleting analysis:', error);
        window.SymptomSentryUtils.showNotification('Failed to delete analysis. Please try again later.', 'danger');
    });
}

/**
 * Share an analysis
 * 
 * @param {string} analysisId - The ID of the analysis to share
 */
function shareAnalysis(analysisId) {
    console.log(`[Analysis Detail] Sharing analysis: ${analysisId}`);
    
    // For now, we'll just create a share URL and copy it to clipboard
    const shareUrl = `${window.location.origin}/share?id=${analysisId}`;
    
    // Try to use the clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl)
            .then(() => {
                window.SymptomSentryUtils.showNotification('Share link copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('[Analysis Detail] Could not copy text: ', err);
                // Fallback to prompt
                prompt('Copy this link to share your analysis:', shareUrl);
            });
    } else {
        // Fallback for browsers that don't support clipboard API
        prompt('Copy this link to share your analysis:', shareUrl);
    }
}

/**
 * Render an error message
 * 
 * @param {HTMLElement} container - The container element
 * @param {string} message - The error message
 */
function renderError(container, message) {
    const loadingEl = container.querySelector('.analysis-loading');
    const contentEl = container.querySelector('.analysis-content');
    const errorEl = container.querySelector('.analysis-error');
    
    if (loadingEl) loadingEl.classList.add('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    
    if (errorEl) {
        errorEl.classList.remove('d-none');
        errorEl.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-circle me-2"></i>
                <strong>Error:</strong> ${message}
            </div>
        `;
    }
}

// Export the component to the global namespace
window.SymptomSentryAnalysisDetail = {
    init: initAnalysisDetail
};