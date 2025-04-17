/**
 * Attention Map Visualization Component
 * 
 * This component displays the attention map visualization for a condition,
 * showing where the AI model is focusing attention during analysis.
 */

// Initialize the components namespace if it doesn't exist
window.SymptomSentryComponents = window.SymptomSentryComponents || {};

/**
 * Initialize the attention map visualization component
 * 
 * @param {HTMLElement} container - The container to render the visualization in
 * @param {string} attentionMapUrl - URL to the attention map image
 * @param {Object} options - Additional options for the visualization
 */
window.SymptomSentryComponents.initializeAttentionMapVisualization = function(container, attentionMapUrl, options = {}) {
    console.log('[Attention Map] Initializing with URL:', attentionMapUrl);
    
    if (!container) {
        console.error('[Attention Map] No container provided');
        return;
    }
    
    if (!attentionMapUrl) {
        renderError(container, 'No attention map available for this analysis.');
        return;
    }
    
    // Default options
    const defaultOptions = {
        title: 'AI Attention Map',
        description: 'This visualization shows where the AI focused when analyzing your image.',
        showTitle: true,
        showDescription: true,
        showLoadingIndicator: true,
        onError: null
    };
    
    // Merge options
    const settings = { ...defaultOptions, ...options };
    
    // Render initial container
    container.innerHTML = `
        <div class="attention-map-container">
            ${settings.showTitle ? `<h4 class="attention-map-title">${settings.title}</h4>` : ''}
            ${settings.showDescription ? `<p class="attention-map-description text-muted">${settings.description}</p>` : ''}
            
            <div class="attention-map-content">
                ${settings.showLoadingIndicator ? `
                    <div class="attention-map-loading">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading attention map...</span>
                        </div>
                        <p class="mt-2">Loading visualization...</p>
                    </div>
                ` : ''}
                
                <div class="attention-map-display" style="display: none;">
                    <img src="${attentionMapUrl}" alt="AI Attention Map" class="img-fluid attention-map-image">
                </div>
                
                <div class="attention-map-error" style="display: none;"></div>
            </div>
            
            <div class="attention-map-legend mt-3">
                <div class="d-flex justify-content-between align-items-center">
                    <span class="legend-label">Less focus</span>
                    <div class="legend-gradient"></div>
                    <span class="legend-label">More focus</span>
                </div>
            </div>
        </div>
    `;
    
    // Add styles
    addStyles();
    
    // Load the image
    loadAttentionMap(container, attentionMapUrl, settings);
};

/**
 * Load the attention map image
 * 
 * @param {HTMLElement} container - The container element
 * @param {string} imageUrl - The URL to the attention map image
 * @param {Object} settings - The component settings
 */
function loadAttentionMap(container, imageUrl, settings) {
    const loadingEl = container.querySelector('.attention-map-loading');
    const displayEl = container.querySelector('.attention-map-display');
    const errorEl = container.querySelector('.attention-map-error');
    const imageEl = container.querySelector('.attention-map-image');
    
    if (!imageEl) {
        console.error('[Attention Map] Image element not found');
        return;
    }
    
    // Load the image
    imageEl.onload = function() {
        // Hide loading indicator
        if (loadingEl) loadingEl.style.display = 'none';
        
        // Show the display
        if (displayEl) displayEl.style.display = 'block';
    };
    
    imageEl.onerror = function() {
        console.error('[Attention Map] Failed to load image:', imageUrl);
        
        // Hide loading indicator and display
        if (loadingEl) loadingEl.style.display = 'none';
        if (displayEl) displayEl.style.display = 'none';
        
        // Show error
        renderError(container, 'Failed to load attention map visualization.');
        
        // Call error callback if provided
        if (settings.onError && typeof settings.onError === 'function') {
            settings.onError(new Error('Failed to load attention map image'));
        }
    };
    
    // Set the image source (which triggers the load)
    imageEl.src = imageUrl;
}

/**
 * Render an error message
 * 
 * @param {HTMLElement} container - The container element
 * @param {string} message - The error message
 */
function renderError(container, message) {
    const loadingEl = container.querySelector('.attention-map-loading');
    const displayEl = container.querySelector('.attention-map-display');
    const errorEl = container.querySelector('.attention-map-error');
    
    // Hide loading and display
    if (loadingEl) loadingEl.style.display = 'none';
    if (displayEl) displayEl.style.display = 'none';
    
    // Show error
    if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.innerHTML = `
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
    }
}

/**
 * Add CSS styles for the attention map visualization
 */
function addStyles() {
    // Check if styles already exist
    if (document.getElementById('attention-map-styles')) {
        return;
    }
    
    // Create style element
    const styleEl = document.createElement('style');
    styleEl.id = 'attention-map-styles';
    
    // Add styles
    styleEl.textContent = `
        .attention-map-container {
            margin-bottom: 1.5rem;
        }
        
        .attention-map-title {
            margin-bottom: 0.5rem;
        }
        
        .attention-map-description {
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }
        
        .attention-map-content {
            position: relative;
            border-radius: 0.5rem;
            overflow: hidden;
            background-color: #f8f9fa;
            min-height: 200px;
        }
        
        .attention-map-loading {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background-color: rgba(255, 255, 255, 0.8);
            z-index: 1;
        }
        
        .attention-map-image {
            display: block;
            max-width: 100%;
            height: auto;
            margin: 0 auto;
            border-radius: 0.5rem;
        }
        
        .attention-map-legend {
            font-size: 0.8rem;
        }
        
        .legend-gradient {
            height: 10px;
            width: 200px;
            background: linear-gradient(to right, 
                #3366cc, /* Blue for low attention */
                #dc3912, /* Red for medium attention */
                #ff9900  /* Yellow/Orange for high attention */
            );
            border-radius: 5px;
            margin: 0 10px;
        }
    `;
    
    // Add to document head
    document.head.appendChild(styleEl);
}

// For backward compatibility
window.SymptomSentryAttentionMap = {
    init: window.SymptomSentryComponents.initializeAttentionMapVisualization
};