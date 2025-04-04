// This component handles the symptom entry functionality

// Initialize the components namespace if it doesn't exist
window.SymptomSentryComponents = window.SymptomSentryComponents || {};

// Add the symptom entry component to the components namespace
window.SymptomSentryComponents.initializeSymptomEntry = function(container) {
    if (!container) return;
    
    // Render the symptom entry UI
    renderSymptomEntryUI(container);
    
    // Setup event listeners for the symptom entry functionality
    setupSymptomEntryEventListeners(container);
    
    // Add event listener for authentication state changes
    document.addEventListener('authStateChanged', (event) => {
        console.log('[SymptomEntry] Auth state changed event received:', event.detail.isAuthenticated);
        // Re-render UI based on new auth state
        renderSymptomEntryUI(container);
        setupSymptomEntryEventListeners(container);
    });
}

// Export function to update component when auth state changes
window.SymptomSentryComponents.SymptomEntry = window.SymptomSentryComponents.SymptomEntry || {};
window.SymptomSentryComponents.SymptomEntry.updateAuthState = function(isAuthenticated) {
    console.log('[SymptomEntry] Updating for auth state change:', isAuthenticated);
    const container = document.getElementById('symptom-entry-component');
    if (container) {
        renderSymptomEntryUI(container);
        setupSymptomEntryEventListeners(container);
    }
}

function renderSymptomEntryUI(container) {
    // Check if user is authenticated using the utils function
    const isAuthenticated = window.SymptomSentryUtils.isAuthenticated();
    console.log('[SymptomEntry] Authentication check: isAuthenticated =', isAuthenticated);
    
    if (!isAuthenticated) {
        // User is not logged in, show login prompt
        container.innerHTML = `
            <div class="symptom-entry-container">
                <div class="auth-required-message text-center p-5">
                    <div class="mb-4">
                        <i class="fas fa-lock fa-4x text-muted"></i>
                    </div>
                    <h3>Authentication Required</h3>
                    <p class="text-muted mb-4">You must be logged in to use the symptom assessment feature.</p>
                    <div class="d-grid gap-2 col-md-6 mx-auto">
                        <button class="btn btn-primary login-prompt-btn">
                            <i class="fas fa-sign-in-alt"></i> Sign In
                        </button>
                        <button class="btn btn-outline-secondary register-prompt-btn">
                            <i class="fas fa-user-plus"></i> Create Account
                        </button>
                    </div>
                </div>
            </div>
        `;
        return;
    }
    
    // User is logged in, show normal UI
    container.innerHTML = `
        <div class="symptom-entry-container">
            <div class="symptom-entry-instructions mb-4">
                <p>Select the area you're concerned about and enter your symptoms for an AI-powered assessment.</p>
            </div>
            
            <div class="scan-type-selection mb-4">
                <h5 class="text-center mb-4">Select area of concern:</h5>
                <div class="scan-options">
                    <div class="scan-option-card" id="throat-option">
                        <div class="scan-option-icon">
                            <i class="fas fa-head-side-cough fa-2x"></i>
                        </div>
                        <h5 class="scan-option-label">Throat</h5>
                        <p class="scan-option-description">Strep throat, tonsillitis, pharyngitis</p>
                    </div>
                    <div class="scan-option-card" id="ear-option">
                        <div class="scan-option-icon">
                            <i class="fas fa-deaf fa-2x"></i>
                        </div>
                        <h5 class="scan-option-label">Ear</h5>
                        <p class="scan-option-description">Ear infections, earwax buildup, otitis</p>
                    </div>
                </div>
            </div>
            
            <div id="symptom-selection-container" style="display: none;" class="mb-4">
                <div id="throat-symptom-section" style="display: none;">
                    <div class="alert alert-primary">
                        <h5><i class="fas fa-head-side-cough"></i> Throat Symptoms Selected</h5>
                        <p>Select all symptoms you are experiencing related to your throat.</p>
                    </div>
                </div>
                <div id="ear-symptom-section" style="display: none;">
                    <div class="alert alert-primary">
                        <h5><i class="fas fa-deaf"></i> Ear Symptoms Selected</h5>
                        <p>Select all symptoms you are experiencing related to your ear.</p>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Select Your Symptoms</h5>
                    </div>
                    <div class="card-body">
                        <div class="mb-3">
                            <input type="text" class="form-control" id="symptomSearch" placeholder="Search symptoms...">
                        </div>
                        
                        <div class="symptom-checkbox-container" id="symptomCheckboxes">
                            <div class="text-center p-4">
                                <div class="spinner-border text-primary" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                                <p class="mt-2">Loading symptoms...</p>
                            </div>
                        </div>
                        
                        <div class="alert alert-warning mt-3">
                            <strong>Note:</strong> This is not a replacement for professional medical advice. If you're experiencing severe symptoms, please consult a healthcare professional immediately.
                        </div>
                    </div>
                    <div class="card-footer d-flex justify-content-between">
                        <button class="btn btn-outline-secondary" id="backToOptionsButton">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                        <button class="btn btn-primary" id="analyzeSymptomButton" disabled>
                            <i class="fas fa-microscope"></i> Analyze Symptoms
                        </button>
                    </div>
                </div>
            </div>
            
            <div id="results-container" style="display: none;" class="mb-4">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h5 class="mb-0"><i class="fas fa-stethoscope"></i> Assessment Results</h5>
                    </div>
                    <div class="card-body" id="results-content">
                        <div class="text-center p-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                            <p class="mt-2">Analyzing your symptoms...</p>
                        </div>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-primary" id="saveResultsButton">
                            <i class="fas fa-save"></i> Save Results
                        </button>
                        <button class="btn btn-outline-secondary" id="startOverButton">
                            <i class="fas fa-redo"></i> New Assessment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupSymptomEntryEventListeners(container) {
    // Check if user is authenticated using the utils function
    const isAuthenticated = window.SymptomSentryUtils.isAuthenticated();
    console.log('[SymptomEntry] Authentication check: isAuthenticated =', isAuthenticated);
    
    if (!isAuthenticated) {
        // If not authenticated, add event listeners for login/register buttons
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
        
        // No need to set up other event listeners if the user is not authenticated
        return;
    }
    
    // User is authenticated, set up normal event listeners
    // Get DOM elements
    const throatOption = container.querySelector('#throat-option');
    const earOption = container.querySelector('#ear-option');
    const symptomSelectionContainer = container.querySelector('#symptom-selection-container');
    const throatSymptomSection = container.querySelector('#throat-symptom-section');
    const earSymptomSection = container.querySelector('#ear-symptom-section');
    const backToOptionsButton = container.querySelector('#backToOptionsButton');
    const analyzeSymptomButton = container.querySelector('#analyzeSymptomButton');
    const resultsContainer = container.querySelector('#results-container');
    const saveResultsButton = container.querySelector('#saveResultsButton');
    const startOverButton = container.querySelector('#startOverButton');
    const symptomCheckboxes = container.querySelector('#symptomCheckboxes');
    const symptomSearch = container.querySelector('#symptomSearch');
    
    // Track selected analysis type
    let selectedAnalysisType = null;
    let selectedSymptoms = [];
    let allSymptoms = [];
    let analysisResult = null;
    
    // Add click event listeners to scan options
    throatOption.addEventListener('click', () => {
        selectAnalysisType('throat');
    });
    
    earOption.addEventListener('click', () => {
        selectAnalysisType('ear');
    });
    
    // Add event listener for the back button
    backToOptionsButton.addEventListener('click', () => {
        // Reset the analysis type
        selectedAnalysisType = null;
        selectedSymptoms = [];
        
        // Hide the symptom selection container
        symptomSelectionContainer.style.display = 'none';
        
        // Reset the selection UI
        throatOption.classList.remove('selected');
        earOption.classList.remove('selected');
        
        // Reset instructions
        throatSymptomSection.style.display = 'none';
        earSymptomSection.style.display = 'none';
        
        // Disable analyze button
        analyzeSymptomButton.disabled = true;
    });
    
    // Function to handle area selection
    function selectAnalysisType(type) {
        // Check if the same type is already selected (toggle functionality)
        if (selectedAnalysisType === type) {
            // Reset selection and hide symptom selection container
            selectedAnalysisType = null;
            throatOption.classList.remove('selected');
            earOption.classList.remove('selected');
            symptomSelectionContainer.style.display = 'none';
            throatSymptomSection.style.display = 'none';
            earSymptomSection.style.display = 'none';
            return;
        }
        
        // Update selected type
        selectedAnalysisType = type;
        
        // Update UI for selected option
        throatOption.classList.remove('selected');
        earOption.classList.remove('selected');
        
        if (type === 'throat') {
            throatOption.classList.add('selected');
            throatSymptomSection.style.display = 'block';
            earSymptomSection.style.display = 'none';
        } else {
            earOption.classList.add('selected');
            throatSymptomSection.style.display = 'none';
            earSymptomSection.style.display = 'block';
        }
        
        // Show the symptom selection container
        symptomSelectionContainer.style.display = 'block';
        
        // Load the symptoms
        loadSymptoms();
    }
    
    // Function to load symptoms from the API
    function loadSymptoms() {
        // Show loading state
        symptomCheckboxes.innerHTML = `
            <div class="text-center p-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading symptoms...</p>
            </div>
        `;
        
        // Get all symptoms
        fetch('/api/symptoms')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load symptoms');
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.symptoms) {
                    allSymptoms = data.symptoms;
                    renderSymptomCheckboxes(allSymptoms);
                } else {
                    throw new Error('Invalid response from server');
                }
            })
            .catch(error => {
                console.error('Error loading symptoms:', error);
                symptomCheckboxes.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle"></i> Failed to load symptoms. Please try again.
                    </div>
                    <button class="btn btn-outline-primary btn-sm mt-2" id="retryLoadButton">
                        <i class="fas fa-sync"></i> Retry
                    </button>
                `;
                
                // Add retry button event listener
                const retryButton = symptomCheckboxes.querySelector('#retryLoadButton');
                if (retryButton) {
                    retryButton.addEventListener('click', loadSymptoms);
                }
            });
    }
    
    // Function to render symptom checkboxes
    function renderSymptomCheckboxes(symptoms) {
        if (!symptoms || symptoms.length === 0) {
            symptomCheckboxes.innerHTML = `
                <div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle"></i> No symptoms available.
                </div>
            `;
            return;
        }
        
        let html = '';
        symptoms.forEach((symptom, index) => {
            html += `
                <div class="form-check">
                    <input class="form-check-input symptom-checkbox" type="checkbox" value="${symptom}" id="symptom-${index}">
                    <label class="form-check-label" for="symptom-${index}">
                        ${symptom}
                    </label>
                </div>
            `;
        });
        
        symptomCheckboxes.innerHTML = html;
        
        // Add event listeners to checkboxes
        const checkboxes = symptomCheckboxes.querySelectorAll('.symptom-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectedSymptoms);
        });
    }
    
    // Function to update selected symptoms
    function updateSelectedSymptoms() {
        selectedSymptoms = [];
        const checkboxes = symptomCheckboxes.querySelectorAll('.symptom-checkbox:checked');
        
        checkboxes.forEach(checkbox => {
            selectedSymptoms.push(checkbox.value);
        });
        
        // Enable or disable analyze button based on selection
        analyzeSymptomButton.disabled = selectedSymptoms.length === 0;
        
        console.log('Selected symptoms:', selectedSymptoms);
    }
    
    // Add event listener for symptom search
    if (symptomSearch) {
        symptomSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            if (!searchTerm) {
                renderSymptomCheckboxes(allSymptoms);
                return;
            }
            
            const filteredSymptoms = allSymptoms.filter(symptom => 
                symptom.toLowerCase().includes(searchTerm)
            );
            
            renderSymptomCheckboxes(filteredSymptoms);
            
            // Restore checked state for previously selected symptoms
            const checkboxes = symptomCheckboxes.querySelectorAll('.symptom-checkbox');
            checkboxes.forEach(checkbox => {
                if (selectedSymptoms.includes(checkbox.value)) {
                    checkbox.checked = true;
                }
            });
        });
    }
    
    // Add event listener for analyze symptoms button
    if (analyzeSymptomButton) {
        analyzeSymptomButton.addEventListener('click', () => {
            if (selectedSymptoms.length === 0) {
                window.SymptomSentryUtils.showNotification(
                    'Please select at least one symptom before analyzing.',
                    'warning'
                );
                return;
            }
            
            analyzeUserSymptoms();
        });
    }
    
    // Function to analyze symptoms
    function analyzeUserSymptoms() {
        // Show loading state in results container
        resultsContainer.style.display = 'block';
        
        // Scroll to results container
        resultsContainer.scrollIntoView({ behavior: 'smooth' });
        
        // Prepare data for API
        const data = {
            type: selectedAnalysisType,
            symptoms: selectedSymptoms
        };
        
        // Get auth token
        const token = window.SymptomSentryUtils.getAuthToken();
        
        // Make API call
        fetch('/api/analyze-symptoms', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to analyze symptoms');
            }
            return response.json();
        })
        .then(result => {
            // Store results
            analysisResult = result;
            
            // Display results
            renderAnalysisResults(result);
        })
        .catch(error => {
            console.error('Error analyzing symptoms:', error);
            document.querySelector('#results-content').innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i> Failed to analyze symptoms. Please try again.
                </div>
                <button class="btn btn-outline-primary btn-sm mt-2" id="retryAnalysisButton">
                    <i class="fas fa-sync"></i> Retry Analysis
                </button>
            `;
            
            // Add retry button event listener
            const retryButton = document.querySelector('#retryAnalysisButton');
            if (retryButton) {
                retryButton.addEventListener('click', analyzeUserSymptoms);
            }
        });
    }
    
    // Function to render analysis results
    function renderAnalysisResults(results) {
        console.log('Rendering results:', results);
        
        if (!results.conditions || results.conditions.length === 0) {
            document.querySelector('#results-content').innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> No conditions matched your symptoms.
                </div>
                <div class="mt-3">
                    <p>This could mean:</p>
                    <ul>
                        <li>Your symptoms may not match known patterns for common conditions</li>
                        <li>You may need to select additional symptoms for a more accurate assessment</li>
                        <li>Consider consulting a healthcare professional for personalized advice</li>
                    </ul>
                </div>
            `;
            return;
        }
        
        // Sort conditions by confidence
        const sortedConditions = [...results.conditions].sort((a, b) => b.confidence - a.confidence);
        
        let html = `
            <div class="mb-4">
                <h5>Possible Conditions Based on Your Symptoms</h5>
                <p class="text-muted">Confidence levels indicate how closely your symptoms match typical patterns for each condition.</p>
            </div>
        `;
        
        // Display potential conditions
        html += `<div class="condition-results">`;
        
        sortedConditions.forEach(condition => {
            // Create confidence class based on confidence level
            let confidenceClass = 'bg-info';
            let confidenceLabel = 'Possible Match';
            
            if (condition.confidence >= 0.7) {
                confidenceClass = 'bg-success';
                confidenceLabel = 'Strong Match';
            } else if (condition.confidence >= 0.4) {
                confidenceClass = 'bg-primary';
                confidenceLabel = 'Moderate Match';
            } else if (condition.confidence >= 0.2) {
                confidenceClass = 'bg-warning';
                confidenceLabel = 'Weak Match';
            }
            
            // Render condition card
            html += `
                <div class="card mb-3 condition-card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">${condition.name}</h5>
                        <span class="badge ${confidenceClass}">${confidenceLabel} (${Math.round(condition.confidence * 100)}%)</span>
                    </div>
                    <div class="card-body">
                        <p><strong>Description:</strong> ${condition.description}</p>
                        
                        <div class="symptoms-section">
                            <h6><i class="fas fa-check-circle text-success"></i> Matching Symptoms:</h6>
                            <ul class="matching-symptoms-list">
                                ${condition.matchingSymptoms.map(symptom => `<li>${symptom}</li>`).join('')}
                            </ul>
                            
                            <h6 class="mt-3"><i class="fas fa-list text-primary"></i> Other Common Symptoms:</h6>
                            <ul class="other-symptoms-list">
                                ${condition.symptoms
                                    .filter(symptom => !condition.matchingSymptoms.includes(symptom))
                                    .map(symptom => `<li>${symptom}</li>`)
                                    .join('')}
                            </ul>
                        </div>
                        
                        ${condition.isPotentiallySerious ? `
                        <div class="alert alert-warning mt-3">
                            <i class="fas fa-exclamation-triangle"></i> <strong>Note:</strong> This condition may require prompt medical attention.
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        
        // Add disclaimer
        html += `
            <div class="alert alert-secondary mt-4">
                <i class="fas fa-info-circle"></i> <strong>Disclaimer:</strong> This assessment is based solely on the symptoms you reported and is not a medical diagnosis. 
                Always consult with a qualified healthcare provider for proper diagnosis and treatment.
            </div>
        `;
        
        // Update results container
        document.querySelector('#results-content').innerHTML = html;
    }
    
    // Add event listener for save results button
    if (saveResultsButton) {
        saveResultsButton.addEventListener('click', saveAnalysisResults);
    }
    
    // Function to save analysis results
    function saveAnalysisResults() {
        if (!analysisResult) {
            window.SymptomSentryUtils.showNotification(
                'No analysis results to save.',
                'warning'
            );
            return;
        }
        
        // Show saving state
        saveResultsButton.disabled = true;
        saveResultsButton.innerHTML = `
            <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            Saving...
        `;
        
        // Get auth token
        const token = window.SymptomSentryUtils.getAuthToken();
        
        // Make API call to save analysis
        fetch('/api/save-symptom-assessment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(analysisResult)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save assessment');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.SymptomSentryUtils.showNotification(
                    'Assessment saved successfully!',
                    'success'
                );
                
                // Reset save button
                saveResultsButton.disabled = true;
                saveResultsButton.innerHTML = `
                    <i class="fas fa-check"></i> Saved
                `;
                
                // Optionally navigate to history view
                // window.navigateToAnalysisHistory();
            } else {
                throw new Error(data.message || 'Failed to save assessment');
            }
        })
        .catch(error => {
            console.error('Error saving assessment:', error);
            window.SymptomSentryUtils.showNotification(
                'Failed to save assessment. Please try again.',
                'danger'
            );
            
            // Reset save button
            saveResultsButton.disabled = false;
            saveResultsButton.innerHTML = `
                <i class="fas fa-save"></i> Save Results
            `;
        });
    }
    
    // Add event listener for start over button
    if (startOverButton) {
        startOverButton.addEventListener('click', startNewAssessment);
    }
    
    // Function to start a new assessment
    function startNewAssessment() {
        // Reset all state
        selectedAnalysisType = null;
        selectedSymptoms = [];
        analysisResult = null;
        
        // Reset UI
        throatOption.classList.remove('selected');
        earOption.classList.remove('selected');
        symptomSelectionContainer.style.display = 'none';
        resultsContainer.style.display = 'none';
        
        // Reset save button
        if (saveResultsButton) {
            saveResultsButton.disabled = false;
            saveResultsButton.innerHTML = `
                <i class="fas fa-save"></i> Save Results
            `;
        }
        
        // Scroll to top
        container.scrollIntoView({ behavior: 'smooth' });
    }
}

// Additional CSS styles for the component
document.addEventListener('DOMContentLoaded', function() {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        .symptom-entry-container {
            padding: 1rem;
        }
        
        .scan-options {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            justify-content: center;
        }
        
        .scan-option-card {
            padding: 1.5rem;
            border: 1px solid #dee2e6;
            border-radius: 0.5rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            flex: 1;
            min-width: 180px;
            max-width: 300px;
            background-color: #f8f9fa;
        }
        
        .scan-option-card:hover {
            background-color: #e9ecef;
            transform: translateY(-3px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .scan-option-card.selected {
            background-color: #e8f4ff;
            border-color: #007bff;
            box-shadow: 0 4px 8px rgba(0,123,255,0.2);
        }
        
        .scan-option-icon {
            margin-bottom: 1rem;
            color: #6c757d;
        }
        
        .scan-option-card.selected .scan-option-icon {
            color: #007bff;
        }
        
        .scan-option-label {
            margin-bottom: 0.5rem;
            font-weight: 600;
        }
        
        .scan-option-description {
            color: #6c757d;
            font-size: 0.9rem;
            margin-bottom: 0;
        }
        
        .symptom-checkbox-container {
            max-height: 300px;
            overflow-y: auto;
            padding: 1rem;
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
        }
        
        .form-check {
            margin-bottom: 0.5rem;
        }
        
        .condition-card {
            border: 1px solid #dee2e6;
            transition: transform 0.2s ease;
        }
        
        .condition-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        
        .matching-symptoms-list, .other-symptoms-list {
            columns: 2;
            padding-left: 1.5rem;
        }
        
        @media (max-width: 768px) {
            .matching-symptoms-list, .other-symptoms-list {
                columns: 1;
            }
        }
    `;
    
    document.head.appendChild(styleSheet);
});