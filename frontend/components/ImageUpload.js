// This component handles the image upload functionality

// Initialize the components namespace if it doesn't exist
window.SymptomSentryComponents = window.SymptomSentryComponents || {};

// Add the image upload component to the components namespace
window.SymptomSentryComponents.initializeImageUpload = function(container) {
    if (!container) return;
    
    // Render the upload component UI
    renderUploadUI(container);
    
    // Setup event listeners for the upload functionality
    setupUploadEventListeners(container);
}

function renderUploadUI(container) {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
        // User is not logged in, show login prompt
        container.innerHTML = `
            <div class="upload-container">
                <div class="auth-required-message text-center p-5">
                    <div class="mb-4">
                        <i class="fas fa-lock fa-4x text-muted"></i>
                    </div>
                    <h3>Authentication Required</h3>
                    <p class="text-muted mb-4">You must be logged in to upload and analyze images.</p>
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
        <div class="upload-container">
            <div class="upload-instructions mb-4">
                <p>Select the area you want to analyze, then take or upload a clear image for AI analysis.</p>
            </div>
            
            <div class="scan-type-selection mb-4">
                <h5 class="text-center mb-4">Select what you want to scan:</h5>
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
            
            <div id="analysis-type-info" style="display: none;" class="mb-4">
                <div id="throat-instructions" style="display: none;">
                    <div class="alert alert-primary">
                        <h5><i class="fas fa-head-side-cough"></i> Throat Scan Selected</h5>
                        <p>Upload a clear image of your throat area for analysis. Position the camera to show the back of your throat.</p>
                    </div>
                </div>
                <div id="ear-instructions" style="display: none;">
                    <div class="alert alert-primary">
                        <h5><i class="fas fa-deaf"></i> Ear Scan Selected</h5>
                        <p>Upload a clear image of your ear canal for analysis. Gently pull your ear up and back to better expose the ear canal.</p>
                    </div>
                    <div class="alert alert-warning mt-2">
                        <h6><i class="fas fa-exclamation-triangle"></i> Important Note:</h6>
                        <p>For proper ear canal images, a digital otoscope is required. Regular phone cameras cannot capture the inner ear canal properly.</p>
                        <a href="https://www.amazon.com/s?k=digital+otoscope" target="_blank" class="btn btn-sm btn-outline-primary mt-1">
                            <i class="fas fa-shopping-cart"></i> View Digital Otoscopes on Amazon
                        </a>
                    </div>
                </div>
                
                <div class="card mb-3">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Tips for Image Upload</h5>
                        <button class="btn btn-sm btn-outline-primary" type="button" data-bs-toggle="collapse" data-bs-target="#tipCollapse" aria-expanded="false" aria-controls="tipCollapse">
                            <i class="fas fa-lightbulb"></i> Show Tips
                        </button>
                    </div>
                    <div class="collapse" id="tipCollapse">
                        <div class="card-body">
                            <div id="throatTips" class="scan-type-tips" style="display: none;">
                                <h6><i class="fas fa-check-circle text-success"></i> Tips for Throat Images:</h6>
                                <ul class="mb-3">
                                    <li>Position in good lighting (natural light is best)</li>
                                    <li>Open mouth wide and say "Ahh" to expose the throat area</li>
                                    <li>Hold phone 6-8 inches from mouth</li>
                                    <li>Keep steady and focus on the back of the throat</li>
                                    <li>Use flash only if necessary and avoid shadows</li>
                                </ul>
                            </div>
                            
                            <div id="earTips" class="scan-type-tips" style="display: none;">
                                <h6><i class="fas fa-check-circle text-success"></i> Tips for Ear Images:</h6>
                                <ul class="mb-3">
                                    <li>Ensure good lighting (bright, indirect light works best)</li>
                                    <li>Gently pull top of ear upward and back to straighten ear canal</li>
                                    <li>Hold phone 1-2 inches from ear opening</li>
                                    <li>Keep steady and focus on the ear canal</li>
                                    <li>For children, have another adult help hold them still</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="drop-area" id="dropArea" style="display: none;">
                <i class="fas fa-cloud-upload-alt fa-3x mb-3"></i>
                <p>Drag and drop an image here, or click to browse</p>
                <input type="file" class="file-input" id="fileInput" accept="image/*">
                <div class="mt-3">
                    <button class="btn btn-primary" id="browseButton">
                        <i class="fas fa-folder-open"></i> Browse Files
                    </button>
                    <button class="btn btn-secondary ms-2" id="cameraButton">
                        <i class="fas fa-camera"></i> Take Photo
                    </button>
                </div>
                <div class="mt-3">
                    <button class="btn btn-outline-secondary btn-sm" id="backToOptionsButton">
                        <i class="fas fa-arrow-left"></i> Back to Scan Options
                    </button>
                </div>
            </div>
            
            <div class="preview-container mt-4" style="display: none;" id="previewContainer">
                <h5>Preview:</h5>
                <img src="#" alt="Preview" class="preview-image" id="previewImage">
                <div class="mt-3">
                    <button class="btn btn-danger" id="removeButton">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                    <button class="btn btn-success" id="analyzeButton">
                        <i class="fas fa-microscope"></i> Analyze Image
                    </button>
                </div>
            </div>
        </div>
    `;
}

function setupUploadEventListeners(container) {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    
    if (!authToken) {
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
    const dropArea = container.querySelector('#dropArea');
    const fileInput = container.querySelector('#fileInput');
    const browseButton = container.querySelector('#browseButton');
    const cameraButton = container.querySelector('#cameraButton');
    const previewContainer = container.querySelector('#previewContainer');
    const previewImage = container.querySelector('#previewImage');
    const removeButton = container.querySelector('#removeButton');
    const analyzeButton = container.querySelector('#analyzeButton');
    
    // Get scan option elements
    const throatOption = container.querySelector('#throat-option');
    const earOption = container.querySelector('#ear-option');
    const analysisTypeInfo = container.querySelector('#analysis-type-info');
    const throatInstructions = container.querySelector('#throat-instructions');
    const earInstructions = container.querySelector('#ear-instructions');
    
    // Track selected analysis type
    let selectedAnalysisType = null;
    
    // Add click event listeners to scan options
    throatOption.addEventListener('click', () => {
        selectAnalysisType('throat');
    });
    
    earOption.addEventListener('click', () => {
        selectAnalysisType('ear');
    });
    
    // Get the back to options button
    const backToOptionsButton = container.querySelector('#backToOptionsButton');
    
    // Add event listener for the back button
    backToOptionsButton.addEventListener('click', () => {
        // Reset the analysis type
        selectedAnalysisType = null;
        
        // Hide the instructions and drop area
        analysisTypeInfo.classList.remove('show');
        dropArea.classList.remove('show');
        
        // Use setTimeout to wait for animations to complete
        setTimeout(() => {
            analysisTypeInfo.style.display = 'none';
            dropArea.style.display = 'none';
            
            // Reset the selection UI
            throatOption.classList.remove('selected');
            earOption.classList.remove('selected');
            
            // Reset instructions
            throatInstructions.style.display = 'none';
            earInstructions.style.display = 'none';
            
            // Hide tips sections
            const throatTips = container.querySelector('#throatTips');
            const earTips = container.querySelector('#earTips');
            if (throatTips) throatTips.style.display = 'none';
            if (earTips) earTips.style.display = 'none';
        }, 300);
    });
    
    // Function to handle scan type selection
    function selectAnalysisType(type) {
        // Check if the same type is already selected (toggle functionality)
        if (selectedAnalysisType === type) {
            // Reset selection and hide instructions and drop area
            selectedAnalysisType = null;
            throatOption.classList.remove('selected');
            earOption.classList.remove('selected');
            
            // Hide with animation
            analysisTypeInfo.classList.remove('show');
            dropArea.classList.remove('show');
            
            // Hide elements after animation completes
            setTimeout(() => {
                analysisTypeInfo.style.display = 'none';
                dropArea.style.display = 'none';
                throatInstructions.style.display = 'none';
                earInstructions.style.display = 'none';
                
                // Hide tips sections
                const throatTips = container.querySelector('#throatTips');
                const earTips = container.querySelector('#earTips');
                if (throatTips) throatTips.style.display = 'none';
                if (earTips) earTips.style.display = 'none';
            }, 300);
            
            return;
        }
        
        // Update selected type
        selectedAnalysisType = type;
        
        // Update UI to show selection
        throatOption.classList.remove('selected');
        earOption.classList.remove('selected');
        
        // Get tip sections
        const throatTips = container.querySelector('#throatTips');
        const earTips = container.querySelector('#earTips');
        
        if (type === 'throat') {
            throatOption.classList.add('selected');
            throatInstructions.style.display = 'block';
            earInstructions.style.display = 'none';
            
            // Show throat tips and hide ear tips
            if (throatTips) throatTips.style.display = 'block';
            if (earTips) earTips.style.display = 'none';
        } else {
            earOption.classList.add('selected');
            throatInstructions.style.display = 'none';
            earInstructions.style.display = 'block';
            
            // Show ear tips and hide throat tips
            if (throatTips) throatTips.style.display = 'none';
            if (earTips) earTips.style.display = 'block';
        }
        
        // Show instructions and drop area
        analysisTypeInfo.style.display = 'block';
        dropArea.style.display = 'block';
        
        // Add animation for smooth transition
        setTimeout(() => {
            analysisTypeInfo.classList.add('show');
            dropArea.classList.add('show');
        }, 10);
    }
    
    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.add('highlight');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => {
            dropArea.classList.remove('highlight');
        }, false);
    });
    
    // Handle file drop
    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }, false);
    
    // Handle file selection from input
    fileInput.addEventListener('change', () => {
        handleFiles(fileInput.files);
    });
    
    // Browse button click
    browseButton.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Camera button click - for mobile devices
    cameraButton.addEventListener('click', () => {
        fileInput.setAttribute('capture', 'environment');
        fileInput.click();
    });
    
    // Remove button click
    removeButton.addEventListener('click', () => {
        resetUpload();
    });
    
    // Analyze button click
    analyzeButton.addEventListener('click', async () => {
        // Double-check authentication before proceeding
        if (!window.SymptomSentryUtils.isAuthenticated()) {
            showAnalysisError('You must be logged in to analyze images');
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                navigateToPage('profile');
            }, 1500);
            return;
        }
        
        // Validate the analysis type is selected
        if (!selectedAnalysisType) {
            showAnalysisError('Please select a scan type (throat or ear) first');
            return;
        }
        
        // Use the resized image if available (from our previous resizing step)
        // Otherwise create a new optimized version
        let imageData;
        let imageSize = 0;
        let originalWidth = 0;
        let originalHeight = 0;
        let optimizedWidth = 0;
        let optimizedHeight = 0;
        
        try {
            // Get original image dimensions for validation
            originalWidth = previewImage.naturalWidth;
            originalHeight = previewImage.naturalHeight;
            
            // Validate that the image appears to be valid
            if (!originalWidth || !originalHeight) {
                throw new Error('The selected image appears to be invalid or corrupted');
            }
            
            // Log original dimensions
            console.log(`[Analysis] Original image dimensions: ${originalWidth}x${originalHeight}`);
            
            if (previewImage.dataset.resizedImage) {
                // Use already resized image
                imageData = previewImage.dataset.resizedImage;
                // Calculate approximate size of base64 data (for validation)
                imageSize = imageData.length * 0.75; // base64 is ~33% larger than binary
                console.log('[Analysis] Using pre-resized image for analysis');
            } else {
                // Create a new optimized version (fallback)
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set a max size for the image to keep file size reasonable
                const MAX_SIZE = 800;
                let width = originalWidth;
                let height = originalHeight;
                
                // Scale down if needed
                if (width > height && width > MAX_SIZE) {
                    height = Math.round(height * (MAX_SIZE / width));
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width = Math.round(width * (MAX_SIZE / height));
                    height = MAX_SIZE;
                }
                
                // Save optimized dimensions for logging
                optimizedWidth = width;
                optimizedHeight = height;
                
                // Set canvas dimensions to the optimized size
                canvas.width = width;
                canvas.height = height;
                
                // Draw the image onto the canvas
                ctx.drawImage(previewImage, 0, 0, width, height);
                
                // Get optimized base64 representation
                imageData = canvas.toDataURL('image/jpeg', 0.85);
                imageSize = imageData.length * 0.75; // base64 is ~33% larger than binary
                console.log(`[Analysis] Image optimized from ${originalWidth}x${originalHeight} to ${width}x${height}`);
            }
            
            // Validate file size before sending
            const MAX_SIZE_MB = 5;
            const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
            
            if (imageSize > MAX_SIZE_BYTES) {
                throw new Error(`Image is too large (${(imageSize / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${MAX_SIZE_MB}MB.`);
            }
        } catch (imageError) {
            console.error('[Analysis] Image preparation error:', imageError);
            showAnalysisError(imageError.message || 'Failed to process image');
            return;
        }
        
        // Show loading state
        showAnalysisLoading();
        
        try {
            // ===== CRITICAL FIX =====
            // Try the direct /analyze endpoint to avoid proxy issues
            const apiUrl = '/analyze';
            
            console.log('[Analysis DEBUG] Using direct endpoint: ' + apiUrl);
            console.log('[Analysis DEBUG] Current environment:', window.location.hostname);
                
            console.log(`[Analysis] Sending request to: ${apiUrl}`);
            console.log(`[Analysis] Analysis type: ${selectedAnalysisType}`);
            console.log(`[Analysis] Image data length: ${imageData ? imageData.length : 0} characters`);
            
            // Create a more compact version of the image data for testing (if needed)
            // This helps reduce payload size for debugging
            let imagePayload = imageData;
            
            // Always ensure we have proper content type
            const headers = {
                'Content-Type': 'application/json',
                'X-Request-Source': 'frontend-image-upload',
                'X-Request-Time': new Date().toISOString() // Add timestamp for tracking request time
            };
            
            // Add authentication token if available
            const token = localStorage.getItem('authToken');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Try using FormData for better handling of large binary data
            const formData = new FormData();
            
            // Convert base64 data URL to a Blob - more reliable approach
            // Extract the base64 data from the payload
            const base64Data = imagePayload.split(',')[1];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            
            // Convert base64 to byte array
            for (let i = 0; i < byteCharacters.length; i += 512) {
                const slice = byteCharacters.slice(i, i + 512);
                const byteNumbers = new Array(slice.length);
                for (let j = 0; j < slice.length; j++) {
                    byteNumbers[j] = slice.charCodeAt(j);
                }
                const byteArray = new Uint8Array(byteNumbers);
                byteArrays.push(byteArray);
            }
            
            // Create a blob from the byte arrays
            const blob = new Blob(byteArrays, { type: 'image/jpeg' });
            
            // Add the data to the FormData
            formData.append('type', selectedAnalysisType);
            formData.append('image', blob, 'image.jpg');
            
            console.log('[Analysis] Using FormData approach with blob');
            console.log('[Analysis] FormData contains:', [...formData.entries()].map(entry => entry[0]));
            
            // For easier debugging
            console.log('[Analysis] Request details:', {
                url: apiUrl,
                method: 'POST',
                formDataContents: [...formData.entries()].map(entry => entry[0]),
                blobSize: blob.size
            });
            
            // Don't set Content-Type header with FormData (browser sets it with boundary)
            const formHeaders = {
                'X-Request-Source': 'frontend-image-upload',
                'X-Request-Time': new Date().toISOString()
            };
            
            // Add authentication token to FormData request headers if available
            if (token) {
                formHeaders['Authorization'] = `Bearer ${token}`;
            }
            
            // Make the API request with FormData
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: formHeaders,
                body: formData,
                credentials: 'same-origin' // Include cookies if needed
            });
            
            console.log(`[Analysis] Response status: ${response.status} ${response.statusText}`);
            
            // Parse the response JSON data - do this only once
            let responseData;
            try {
                responseData = await response.json();
                console.log('[Analysis] Response data:', responseData);
            } catch (parseError) {
                console.error('[Analysis] Could not parse response:', parseError);
                throw new Error('Could not communicate with the server properly');
            }
            
            // Check for non-200 responses and handle them
            if (!response.ok) {
                let errorMessage = `Server error (${response.status})`;
                
                // Special handling for auth errors to provide a better message
                if (response.status === 401) {
                    errorMessage = 'You need to be logged in to analyze images. Please sign in to continue.';
                    
                    // Auto-trigger login modal
                    setTimeout(() => {
                        // Use dynamic import to avoid circular dependencies
                        import('../app.js').then(app => {
                            // If handleRegistration exists, call it
                            if (typeof app.handleRegistration === 'function') {
                                app.handleRegistration();
                            } else {
                                // Use the window event as a fallback
                                const loginEvent = new CustomEvent('openLoginModal');
                                window.dispatchEvent(loginEvent);
                            }
                        }).catch(err => {
                            console.error('Failed to import app.js:', err);
                        });
                    }, 500);
                } else if (response.status === 413) {
                    errorMessage = 'The image file is too large. Please use an image smaller than 5MB.';
                } else if (response.status === 429 && responseData && responseData.code === 'ANALYSIS_LIMIT_EXCEEDED') {
                    errorMessage = 'You have reached your monthly analysis limit. Please upgrade to Premium for unlimited analyses.';
                } else if (responseData && responseData.message) {
                    errorMessage = responseData.message;
                } else if (responseData && responseData.error) {
                    errorMessage = responseData.error;
                }
                
                console.error('[Analysis] Error details:', responseData);
                throw new Error(errorMessage);
            }
            
            // Use the already parsed response data
            const results = responseData;
            console.log('[Analysis] Results received:', results);
            
            // After getting results from the analyze endpoint, save them to the user's record
            try {
                // Only try to save if we have a valid ID from the analysis
                if (results && results.id) {
                    console.log('[Analysis] Saving analysis results to user account...');
                    
                    // Make request to save-analysis endpoint
                    const saveResponse = await fetch('/api/save-analysis', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: JSON.stringify(results),
                        credentials: 'same-origin'
                    });
                    
                    // Try to parse the response data
                    let saveResult;
                    try {
                        saveResult = await saveResponse.json();
                    } catch (parseError) {
                        console.error('[Analysis] Could not parse save response:', parseError);
                    }
                    
                    if (saveResponse.ok) {
                        console.log('[Analysis] Analysis saved successfully:', saveResult);
                        
                        // Include subscription info in the results if available
                        if (saveResult && saveResult.subscription) {
                            results.subscription = saveResult.subscription;
                        }
                    } else {
                        console.log('[Analysis] Not authenticated or could not save analysis', saveResult);
                    }
                }
            } catch (saveError) {
                console.error('[Analysis] Error saving analysis:', saveError);
                // Continue anyway since analysis was successful
            }
            
            // Emit a custom event with the analysis results
            const analysisEvent = new CustomEvent('imageAnalyzed', {
                detail: results
            });
            document.dispatchEvent(analysisEvent);
            
            // Hide loading state
            hideAnalysisLoading();
        } catch (error) {
            console.error('[Analysis] Error:', error);
            
            // Hide loading state and show error
            hideAnalysisLoading();
            showAnalysisError(error.message || 'Unknown error occurred');
        }
    });
    
    // Handle files selected either via drop or input
    function handleFiles(files) {
        // Check if the user is authenticated
        if (!window.SymptomSentryUtils.isAuthenticated()) {
            alert('You must be logged in to upload images');
            
            // Redirect to the login page
            setTimeout(() => {
                navigateToPage('profile');
            }, 500);
            return;
        }
        
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Validate file is an image
        if (!file.type.match('image.*')) {
            alert('Please select an image file (jpg, png, etc.)');
            return;
        }
        
        // Create FileReader to read the file
        const reader = new FileReader();
        
        reader.onload = (e) => {
            // Display the image preview and resize it
            const img = new Image();
            img.onload = () => {
                // Create a canvas to resize the image
                const canvas = document.createElement('canvas');
                // Target max width/height (maintain aspect ratio)
                // Use a smaller size to reduce payload significantly
                const MAX_SIZE = 400; // Reduced from 800 to 400 for smaller file size
                let width = img.width;
                let height = img.height;
                
                // Scale down if needed
                if (width > height && width > MAX_SIZE) {
                    height = Math.round(height * (MAX_SIZE / width));
                    width = MAX_SIZE;
                } else if (height > MAX_SIZE) {
                    width = Math.round(width * (MAX_SIZE / height));
                    height = MAX_SIZE;
                }
                
                // Set canvas dimensions and draw the resized image
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Use the resized image for preview and analysis
                // More aggressive compression (0.7 quality instead of 0.85)
                const resizedImageUrl = canvas.toDataURL('image/jpeg', 0.7);
                previewImage.src = resizedImageUrl;
                
                // Store the resized image on the preview element for later use
                previewImage.dataset.resizedImage = resizedImageUrl;
                
                console.log(`Image resized from ${img.width}x${img.height} to ${width}x${height}`);
            };
            
            // Load the original image
            img.src = e.target.result;
            
            // Show the preview container
            previewContainer.style.display = 'block';
            dropArea.style.display = 'none';
        };
        
        reader.readAsDataURL(file);
    }
    
    // Reset the upload form
    function resetUpload() {
        fileInput.value = '';
        previewImage.src = '';
        previewContainer.style.display = 'none';

        // If we're already in an analysis session, just show the drop area again
        if (selectedAnalysisType) {
            dropArea.style.display = 'block';
        } else {
            // Reset the entire selection if no analysis type is selected
            analysisTypeInfo.style.display = 'none';
            throatInstructions.style.display = 'none';
            earInstructions.style.display = 'none';
            dropArea.style.display = 'none';
            
            // Reset the selection UI
            throatOption.classList.remove('selected');
            earOption.classList.remove('selected');
        }
    }
    
    // Show loading state during analysis with a healthcare animation
    function showAnalysisLoading() {
        analyzeButton.disabled = true;
        
        // Create a custom loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'analysis-loading-overlay';
        loadingOverlay.innerHTML = `
            <div class="analysis-loading-content">
                <div class="heartbeat-loader"></div>
                <div class="analysis-loading-text">
                    <span class="analyzing-text">Analyzing</span>
                    <span class="dot-animation">.</span>
                    <span class="dot-animation">.</span>
                    <span class="dot-animation">.</span>
                </div>
                <div class="analysis-steps slide-transition">
                    <span class="badge bg-primary processing-step">Processing Image</span>
                    <span class="badge bg-info detection-step">Detecting Patterns</span>
                    <span class="badge bg-success diagnosis-step">Generating Results</span>
                </div>
            </div>
        `;
        
        // Add the overlay to the container
        container.appendChild(loadingOverlay);
        
        // Show the animation stages with a staggered effect
        setTimeout(() => {
            const steps = loadingOverlay.querySelectorAll('.slide-transition');
            steps.forEach(step => step.classList.add('show'));
            
            // Animate the steps sequentially
            const badges = loadingOverlay.querySelectorAll('.badge');
            badges.forEach((badge, index) => {
                setTimeout(() => {
                    badge.classList.add('active');
                }, index * 1200);
            });
        }, 300);
    }
    
    // Hide loading state after analysis
    function hideAnalysisLoading() {
        analyzeButton.disabled = false;
        analyzeButton.innerHTML = '<i class="fas fa-microscope"></i> Analyze Image';
        
        // Remove the loading overlay with a fade-out effect
        const loadingOverlay = container.querySelector('.analysis-loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                if (loadingOverlay.parentNode) {
                    loadingOverlay.parentNode.removeChild(loadingOverlay);
                }
            }, 500);
        }
    }
    
    // Show error message if analysis fails
    function showAnalysisError(message) {
        // Track whether the error message was shown for analytics
        console.log('[Analysis] Showing error to user:', message);
        
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mt-3';
        
        // Enhanced error categorization with more specific error types
        
        // CATEGORY 1: Authentication Errors
        if (message.includes('need to be logged in') || 
            message.includes('sign in') || 
            message.includes('Authentication required') ||
            message.includes('session expired') ||
            message.includes('unauthorized')) {
            
            console.log('[Analysis] Detected authentication error');
            errorAlert.dataset.errorType = 'auth';
            errorAlert.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 
                <div class="mb-2"><strong>Authentication Required</strong></div>
                <div class="mb-2">${message || 'You need to be logged in to analyze images.'}</div>
                <button class="btn btn-primary btn-sm login-btn mt-2">
                    <i class="fas fa-sign-in-alt"></i> Sign In / Register
                </button>
            `;
            
            // Add a timeout to attach the event listener after the DOM is updated
            setTimeout(() => {
                const loginBtn = errorAlert.querySelector('.login-btn');
                if (loginBtn) {
                    loginBtn.addEventListener('click', function() {
                        // Trigger login modal
                        const authModal = new bootstrap.Modal(document.getElementById('authModal'));
                        authModal.show();
                        
                        // Select the login tab
                        const loginTab = document.querySelector('a[href="#login-tab"]');
                        if (loginTab) {
                            loginTab.click();
                        }
                    });
                }
            }, 100);
        } 
        // CATEGORY 2: File Size/Format Errors
        else if (message.includes('file is too large') || 
                message.includes('5MB limit') || 
                message.includes('image size') ||
                message.includes('MB. Maximum size') ||
                message.includes('file format') ||
                message.includes('invalid image') ||
                message.includes('corrupted')) {
            
            console.log('[Analysis] Detected file size/format error');
            errorAlert.dataset.errorType = 'file';
            
            // Determine if this is specifically a size issue or format issue
            const isSizeIssue = message.includes('too large') || 
                               message.includes('5MB limit') || 
                               message.includes('Maximum size');
            
            const formatTip = isSizeIssue ? 
                'Try reducing the image resolution or compressing the file before uploading.' :
                'Ensure you are uploading a valid JPG or PNG image in good condition.';
            
            errorAlert.innerHTML = `
                <i class="fas fa-file-alt"></i> 
                <div class="mb-2"><strong>${isSizeIssue ? 'File Size Error' : 'Image Format Error'}</strong></div>
                <div class="mb-2">${message || 'There was a problem with your image file.'}</div>
                <div class="small text-muted mb-2">${formatTip}</div>
                <button class="btn btn-primary btn-sm try-again-btn mt-2">
                    <i class="fas fa-redo"></i> Try Another Image
                </button>
            `;
            
            setTimeout(() => {
                const tryAgainBtn = errorAlert.querySelector('.try-again-btn');
                if (tryAgainBtn) {
                    tryAgainBtn.addEventListener('click', function() {
                        resetUpload();
                    });
                }
            }, 100);
        }
        // CATEGORY 3: Subscription Limit Errors
        else if (message.includes('upgrade to Premium') || 
                message.includes('analysis limit') ||
                message.includes('monthly limit') ||
                message.includes('upgrade your account')) {
            
            console.log('[Analysis] Detected subscription limit error');
            errorAlert.dataset.errorType = 'subscription';
            errorAlert.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 
                <div class="mb-2"><strong>Subscription Limit Reached</strong></div>
                <div class="mb-2">${message || 'You have reached your monthly analysis limit.'}</div>
                <div class="small text-muted mb-2">Upgrade to Premium for unlimited analyses and additional features.</div>
                <button class="btn btn-warning btn-sm upgrade-btn mt-2">
                    <i class="fas fa-crown"></i> Upgrade to Premium
                </button>
            `;
            
            setTimeout(() => {
                const upgradeBtn = errorAlert.querySelector('.upgrade-btn');
                if (upgradeBtn) {
                    upgradeBtn.addEventListener('click', function() {
                        // Navigate to subscription page
                        document.getElementById('subscription-nav-item').click();
                    });
                }
            }, 100);
        }
        // CATEGORY 4: Server/Network Errors
        else if (message.includes('server error') || 
                message.includes('try again later') ||
                message.includes('network') ||
                message.includes('connection') ||
                message.includes('timeout') ||
                message.includes('communicate with')) {
            
            console.log('[Analysis] Detected server/network error');
            errorAlert.dataset.errorType = 'server';
            errorAlert.innerHTML = `
                <i class="fas fa-server"></i> 
                <div class="mb-2"><strong>Server Communication Error</strong></div>
                <div class="mb-2">${message || 'There was a problem communicating with the server.'}</div>
                <div class="small text-muted mb-2">This may be a temporary issue. Please try again in a few moments.</div>
                <button class="btn btn-primary btn-sm retry-btn mt-2">
                    <i class="fas fa-sync"></i> Try Again
                </button>
            `;
            
            setTimeout(() => {
                const retryBtn = errorAlert.querySelector('.retry-btn');
                if (retryBtn) {
                    retryBtn.addEventListener('click', function() {
                        // Close error and retry analysis with current image
                        if (errorAlert.parentNode) {
                            errorAlert.remove();
                        }
                        analyzeButton.click();
                    });
                }
            }, 100);
        }
        // CATEGORY 5: Image Analysis Errors
        else if (message.includes('could not analyze') || 
                message.includes('analysis failed') ||
                message.includes('processing error') ||
                message.includes('detection failed') ||
                message.includes('no conditions detected')) {
            
            console.log('[Analysis] Detected analysis processing error');
            errorAlert.dataset.errorType = 'analysis';
            errorAlert.innerHTML = `
                <i class="fas fa-microscope"></i> 
                <div class="mb-2"><strong>Analysis Error</strong></div>
                <div class="mb-2">${message || 'The system could not analyze this image properly.'}</div>
                <div class="small text-muted mb-2">Try using a clearer image with good lighting and focus on the area of concern.</div>
                <button class="btn btn-primary btn-sm try-again-btn mt-2">
                    <i class="fas fa-camera"></i> Take New Photo
                </button>
            `;
            
            setTimeout(() => {
                const tryAgainBtn = errorAlert.querySelector('.try-again-btn');
                if (tryAgainBtn) {
                    tryAgainBtn.addEventListener('click', function() {
                        resetUpload();
                    });
                }
            }, 100);
        }
        // CATEGORY 6: User Input Errors
        else if (message.includes('select a scan type') || 
                message.includes('missing information') ||
                message.includes('must select') ||
                message.includes('choose') ||
                message.includes('not selected')) {
            
            console.log('[Analysis] Detected user input error');
            errorAlert.dataset.errorType = 'input';
            errorAlert.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i> 
                <div class="mb-2"><strong>Input Required</strong></div>
                <div class="mb-2">${message || 'Please complete all required fields.'}</div>
            `;
        }
        // CATEGORY 7: Generic/Fallback Errors
        else {
            console.log('[Analysis] Detected general error');
            errorAlert.dataset.errorType = 'general';
            errorAlert.innerHTML = `
                <i class="fas fa-exclamation-circle"></i> 
                <div class="mb-2"><strong>Analysis Error</strong></div>
                <div class="mb-2">${message || 'Failed to analyze image. Please try again.'}</div>
                <button class="btn btn-secondary btn-sm try-again-btn mt-2">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            `;
            
            setTimeout(() => {
                const tryAgainBtn = errorAlert.querySelector('.try-again-btn');
                if (tryAgainBtn) {
                    tryAgainBtn.addEventListener('click', function() {
                        if (errorAlert.parentNode) {
                            errorAlert.remove();
                        }
                    });
                }
            }, 100);
        }
        
        // Remove any existing error messages
        const existingError = container.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }
        
        // Add the error message to the container
        previewContainer.appendChild(errorAlert);
        
        // Auto-remove certain types of errors after 10 seconds (increased from 5 to give user more time)
        const persistentErrorTypes = ['auth', 'subscription', 'file'];
        const errorType = errorAlert.dataset.errorType || 'general';
        
        if (!persistentErrorTypes.includes(errorType)) {
            setTimeout(() => {
                if (errorAlert.parentNode) {
                    errorAlert.remove();
                }
            }, 10000);
        }
        
        // Log error for analytics
        console.log(`[Analysis] Error shown to user: Type=${errorType}, Message="${message}"`);
    }
    
    // Helper function for navigation
    function navigateToPage(pageId) {
        const navEvent = new CustomEvent('navigate', {
            detail: { pageId: pageId }
        });
        document.dispatchEvent(navEvent);
    }
}

// End of component
