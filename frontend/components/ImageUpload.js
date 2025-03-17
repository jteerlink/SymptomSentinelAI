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
                <h4>Upload an Image for Analysis</h4>
                <p>Take or upload a clear image of your throat or ear for AI analysis.</p>
                
                <div class="alert alert-info">
                    <strong>For best results:</strong>
                    <ul class="mb-0">
                        <li>Ensure good lighting</li>
                        <li>Keep the camera steady</li>
                        <li>Focus on the area of concern</li>
                    </ul>
                </div>
            </div>
            
            <div class="tab-container mb-4">
                <ul class="nav nav-tabs" id="uploadTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="throat-tab" data-bs-toggle="tab" data-bs-target="#throat-content" type="button" role="tab">
                            <i class="fas fa-head-side-cough"></i> Throat
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="ear-tab" data-bs-toggle="tab" data-bs-target="#ear-content" type="button" role="tab">
                            <i class="fas fa-deaf"></i> Ear
                        </button>
                    </li>
                </ul>
                
                <div class="tab-content p-3 border border-top-0 rounded-bottom" id="uploadTabsContent">
                    <div class="tab-pane fade show active" id="throat-content" role="tabpanel">
                        <p>Upload a clear image of your throat area for analysis. Position the camera to show the back of your throat.</p>
                    </div>
                    <div class="tab-pane fade" id="ear-content" role="tabpanel">
                        <p>Upload a clear image of your ear canal for analysis. Gently pull your ear up and back to better expose the ear canal.</p>
                    </div>
                </div>
            </div>
            
            <div class="drop-area" id="dropArea">
                <i class="fas fa-cloud-upload-alt fa-3x mb-3"></i>
                <p>Drag and drop an image here, or click to browse</p>
                <input type="file" class="file-input" id="fileInput" accept="image/*">
                <button class="btn btn-primary mt-3" id="browseButton">
                    <i class="fas fa-folder-open"></i> Browse Files
                </button>
                <button class="btn btn-secondary mt-3 ms-2" id="cameraButton">
                    <i class="fas fa-camera"></i> Take Photo
                </button>
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
        // Get the canvas element to convert image to base64
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas dimensions to match the image
        canvas.width = previewImage.naturalWidth;
        canvas.height = previewImage.naturalHeight;
        
        // Draw the image onto the canvas
        ctx.drawImage(previewImage, 0, 0);
        
        // Get base64 representation (data URL) of the image
        const imageData = canvas.toDataURL('image/jpeg');
        
        // Get the type of analysis (throat or ear) from the active tab
        const analysisType = document.querySelector('#throat-tab').classList.contains('active') 
            ? 'throat' 
            : 'ear';
        
        // Show loading state
        showAnalysisLoading();
        
        try {
            // Send the image data to your backend API
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData,
                    type: analysisType
                }),
            });
            
            if (!response.ok) {
                throw new Error('Analysis failed');
            }
            
            const results = await response.json();
            
            // Emit a custom event with the analysis results
            const analysisEvent = new CustomEvent('imageAnalyzed', {
                detail: results
            });
            document.dispatchEvent(analysisEvent);
            
            // Hide loading state
            hideAnalysisLoading();
        } catch (error) {
            console.error('Error analyzing image:', error);
            
            // Hide loading state and show error
            hideAnalysisLoading();
            showAnalysisError(error.message);
        }
    });
    
    // Handle files selected either via drop or input
    function handleFiles(files) {
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
            // Display the image preview
            previewImage.src = e.target.result;
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
        dropArea.style.display = 'block';
    }
    
    // Show loading state during analysis
    function showAnalysisLoading() {
        analyzeButton.disabled = true;
        analyzeButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Analyzing...';
    }
    
    // Hide loading state after analysis
    function hideAnalysisLoading() {
        analyzeButton.disabled = false;
        analyzeButton.innerHTML = '<i class="fas fa-microscope"></i> Analyze Image';
    }
    
    // Show error message if analysis fails
    function showAnalysisError(message) {
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger mt-3';
        errorAlert.innerHTML = `
            <i class="fas fa-exclamation-circle"></i> 
            Analysis Error: ${message || 'Failed to analyze image. Please try again.'}
        `;
        
        // Remove any existing error messages
        const existingError = container.querySelector('.alert-danger');
        if (existingError) {
            existingError.remove();
        }
        
        // Add the error message to the container
        previewContainer.appendChild(errorAlert);
        
        // Auto-remove the error after 5 seconds
        setTimeout(() => {
            if (errorAlert.parentNode) {
                errorAlert.remove();
            }
        }, 5000);
    }
}
