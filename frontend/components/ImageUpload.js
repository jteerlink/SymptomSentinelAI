// This component handles the image upload functionality

export function initializeImageUpload(container) {
    if (!container) return;
    
    // Render the upload component UI
    renderUploadUI(container);
    
    // Setup event listeners for the upload functionality
    setupUploadEventListeners(container);
}

function renderUploadUI(container) {
    container.innerHTML = `
        <div class="upload-container">
            <div class="upload-instructions mb-4">
                <p>Select the area you want to analyze, then take or upload a clear image for AI analysis.</p>
            </div>
            
            <div class="scan-type-selection mb-4">
                <h5 class="text-center mb-4">
                    Select what you want to scan
                </h5>
                <div class="scan-options">
                    <div class="scan-option-card" id="throat-option">
                        <div class="scan-option-icon">
                            <i class="fas fa-head-side-cough fa-2x"></i>
                        </div>
                        <h5 class="scan-option-label">
                            Throat
                        </h5>
                        <p class="scan-option-description">Strep throat, tonsillitis, pharyngitis</p>
                    </div>
                    <div class="scan-option-card" id="ear-option">
                        <div class="scan-option-icon">
                            <i class="fas fa-deaf fa-2x"></i>
                        </div>
                        <h5 class="scan-option-label">
                            Ear
                        </h5>
                        <p class="scan-option-description">Ear infections, earwax buildup, otitis</p>
                    </div>
                </div>
            </div>
            
            <div id="analysis-type-info" style="display: none;" class="mb-4">
                <div id="throat-instructions" style="display: none;">
                    <div class="alert alert-primary">
                        <h5>
                            <i class="fas fa-head-side-cough"></i> Throat Scan Selected
                        </h5>
                        <p>Upload a clear image of your throat area for analysis. Position the camera to show the back of your throat.</p>
                    </div>
                </div>
                <div id="ear-instructions" style="display: none;">
                    <div class="alert alert-primary">
                        <h5>
                            <i class="fas fa-deaf"></i> Ear Scan Selected
                        </h5>
                        <p>Upload a clear image of your ear canal for analysis. Gently pull your ear up and back to better expose the ear canal.</p>
                    </div>
                    <div class="alert alert-warning mt-2">
                        <h6>
                            <i class="fas fa-exclamation-triangle"></i> Important Note:
                        </h6>
                        <p>For proper ear canal images, a digital otoscope is required. Regular phone cameras cannot capture the inner ear canal properly.</p>
                        <a href="https://www.amazon.com/s?k=digital+otoscope" target="_blank" class="btn btn-sm btn-outline-primary mt-1">
                            <i class="fas fa-shopping-cart"></i> View Digital Otoscopes on Amazon
                        </a>
                    </div>
                </div>
                
                <div class="alert alert-info mt-3">
                    <strong>
                        For best results:
                    </strong>
                    <ul class="mb-0">
                        <li>Ensure good lighting</li>
                        <li>Keep the camera steady</li>
                        <li>Focus on the area of concern</li>
                    </ul>
                </div>
            </div>
            
            <div class="drop-area" id="dropArea" style="display: none;">
                <i class="fas fa-cloud-upload-alt fa-3x mb-3"></i>
                <p>
                    Drag and drop an image here, or click to browse
                </p>
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
            }, 300);
            
            return;
        }
        
        // Update selected type
        selectedAnalysisType = type;
        
        // Update UI to show selection
        throatOption.classList.remove('selected');
        earOption.classList.remove('selected');
        
        if (type === 'throat') {
            throatOption.classList.add('selected');
            throatInstructions.style.display = 'block';
            earInstructions.style.display = 'none';
        } else {
            earOption.classList.add('selected');
            throatInstructions.style.display = 'none';
            earInstructions.style.display = 'block';
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
        // Use the resized image if available (from our previous resizing step)
        // Otherwise create a new optimized version
        let imageData;
        
        if (previewImage.dataset.resizedImage) {
            // Use already resized image
            imageData = previewImage.dataset.resizedImage;
            console.log('Using pre-resized image for analysis');
        } else {
            // Create a new optimized version (fallback)
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Set a max size for the image to keep file size reasonable
            const MAX_SIZE = 800;
            let width = previewImage.naturalWidth;
            let height = previewImage.naturalHeight;
            
            // Scale down if needed
            if (width > height && width > MAX_SIZE) {
                height = Math.round(height * (MAX_SIZE / width));
                width = MAX_SIZE;
            } else if (height > MAX_SIZE) {
                width = Math.round(width * (MAX_SIZE / height));
                height = MAX_SIZE;
            }
            
            // Set canvas dimensions to the optimized size
            canvas.width = width;
            canvas.height = height;
            
            // Draw the image onto the canvas
            ctx.drawImage(previewImage, 0, 0, width, height);
            
            // Get optimized base64 representation
            imageData = canvas.toDataURL('image/jpeg', 0.85);
            console.log(`Image optimized from ${previewImage.naturalWidth}x${previewImage.naturalHeight} to ${width}x${height}`);
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
                
                if (responseData && responseData.message) {
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
            showAnalysisError(error.message || 'An unexpected error occurred during analysis.');
        }
    });
    
    // Function to handle files after they are selected
    function handleFiles(files) {
        if (files && files.length > 0) {
            const file = files[0];
            
            // Validate file type
            if (!file.type.match('image.*')) {
                alert('Please select an image file.');
                return;
            }
            
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Please select an image smaller than 5MB.');
                return;
            }
            
            // Create a FileReader to read the image
            const reader = new FileReader();
            
            reader.onload = (e) => {
                // Show preview
                previewImage.src = e.target.result;
                previewContainer.style.display = 'block';
                
                // Create a pre-resized version now to optimize later upload
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Set a reasonable max size
                    const MAX_SIZE = 800;
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
                    
                    // Set canvas size and draw resized image
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Store the resized image data in the preview image element
                    previewImage.dataset.resizedImage = canvas.toDataURL('image/jpeg', 0.85);
                };
                img.src = e.target.result;
            };
            
            reader.readAsDataURL(file);
        }
    }
    
    function resetUpload() {
        previewImage.src = '#';
        previewContainer.style.display = 'none';
        fileInput.value = '';
        delete previewImage.dataset.resizedImage;
    }
    
    function showAnalysisLoading() {
        // Create loading overlay if it doesn't exist
        let loadingOverlay = document.querySelector('.analysis-loading-overlay');
        
        if (!loadingOverlay) {
            loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'analysis-loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="analysis-loading-content">
                    <div class="heartbeat-loader"></div>
                    <div class="analysis-loading-text">
                        Analyzing Image<span class="dot-animation">.</span><span class="dot-animation">.</span><span class="dot-animation">.</span>
                    </div>
                    <div class="analysis-steps">
                        <div class="processing-step">
                            <i class="fas fa-cogs"></i> Processing image...
                        </div>
                        <div class="detection-step">
                            <i class="fas fa-search"></i> Detecting features...
                        </div>
                        <div class="diagnosis-step">
                            <i class="fas fa-stethoscope"></i> Analyzing conditions...
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(loadingOverlay);
        }
        
        // Show the loading overlay
        loadingOverlay.style.display = 'flex';
        
        // Animate the steps sequentially
        const steps = loadingOverlay.querySelectorAll('.analysis-steps > div');
        steps.forEach((step, index) => {
            setTimeout(() => {
                step.classList.add('active');
            }, index * 1000 + 500);
        });
    }
    
    function hideAnalysisLoading() {
        const loadingOverlay = document.querySelector('.analysis-loading-overlay');
        if (loadingOverlay) {
            // Fade out for a smoother experience
            loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                loadingOverlay.style.display = 'none';
                loadingOverlay.style.opacity = '1';
                
                // Reset steps for next time
                const steps = loadingOverlay.querySelectorAll('.analysis-steps > div');
                steps.forEach(step => step.classList.remove('active'));
            }, 500);
        }
    }
    
    function showAnalysisError(message) {
        // Create a notification
        const notification = document.createElement('div');
        notification.className = 'alert alert-danger';
        notification.innerHTML = `
            <strong><i class="fas fa-exclamation-triangle"></i> Analysis Error</strong>
            <p>${message}</p>
            <p>Please try again or select a different image.</p>
        `;
        
        // Check if the notification container exists, if not create it
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            document.body.appendChild(notificationContainer);
        }
        
        // Add the notification
        notificationContainer.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            notification.remove();
        }, 10000);
    }
}