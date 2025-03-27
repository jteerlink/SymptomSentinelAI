// This component handles the subscription plans display

// Initialize the components namespace if it doesn't exist
window.SymptomSentryComponents = window.SymptomSentryComponents || {};

// Add the subscription component to the components namespace
window.SymptomSentryComponents.initializeSubscription = function(container) {
    if (!container) return;
    
    // Render the subscription component UI
    renderSubscriptionUI(container);
    
    // Setup event listeners
    setupSubscriptionEventListeners(container);
}

function renderSubscriptionUI(container) {
    container.innerHTML = `
        <div class="subscription-container">
            <div class="subscription-header mb-4">
                <h3>Choose Your Plan</h3>
                <p class="text-muted">Get the most out of SymptomSentryAI with our premium features</p>
            </div>
            
            <div class="row justify-content-center">
                <!-- Free Plan -->
                <div class="col-md-5 mb-4">
                    <div class="subscription-plan h-100">
                        <div class="plan-icon mb-3">
                            <i class="fas fa-user fa-3x text-muted"></i>
                        </div>
                        <h4>Basic</h4>
                        <p class="text-muted">Limited features for occasional use</p>
                        <div class="plan-price">
                            Free
                        </div>
                        <ul class="feature-list">
                            <li><i class="fas fa-check text-success"></i> 2 analyses per month</li>
                            <li><i class="fas fa-check text-success"></i> Basic educational content</li>
                            <li><i class="fas fa-times text-danger"></i> Save analysis history</li>
                            <li><i class="fas fa-times text-danger"></i> Detailed condition information</li>
                            <li><i class="fas fa-times text-danger"></i> Priority analysis</li>
                        </ul>
                        <button class="btn btn-outline-primary btn-lg w-100 subscribe-btn" data-plan="free">
                            Continue with Free
                        </button>
                    </div>
                </div>
                
                <!-- Premium Plan -->
                <div class="col-md-5 mb-4">
                    <div class="subscription-plan plan-highlighted h-100">
                        <div class="popular-badge">Most Popular</div>
                        <div class="plan-icon mb-3">
                            <i class="fas fa-star fa-3x text-warning"></i>
                        </div>
                        <h4>Premium</h4>
                        <p class="text-muted">Enhanced features for regular users</p>
                        <div class="plan-price">
                            $9.99 <small>/month</small>
                        </div>
                        <ul class="feature-list">
                            <li><i class="fas fa-check text-success"></i> Unlimited analyses</li>
                            <li><i class="fas fa-check text-success"></i> Full educational library</li>
                            <li><i class="fas fa-check text-success"></i> Save analysis history</li>
                            <li><i class="fas fa-check text-success"></i> Detailed condition information</li>
                            <li><i class="fas fa-check text-success"></i> Priority analysis</li>
                        </ul>
                        <button class="btn btn-primary btn-lg w-100 subscribe-btn" data-plan="premium">
                            Get Premium
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="subscription-features mt-5">
                <h4 class="text-center mb-4">All Plans Include</h4>
                <div class="row">
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <i class="fas fa-lock fa-3x text-primary mb-3"></i>
                                <h5>Secure Data</h5>
                                <p class="mb-0">Your data is encrypted and secured following HIPAA and GDPR guidelines</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <i class="fas fa-brain fa-3x text-primary mb-3"></i>
                                <h5>AI-Powered Analysis</h5>
                                <p class="mb-0">Our machine learning algorithms provide accurate condition detection</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4 mb-3">
                        <div class="card h-100">
                            <div class="card-body text-center">
                                <i class="fas fa-mobile-alt fa-3x text-primary mb-3"></i>
                                <h5>Cross-Platform</h5>
                                <p class="mb-0">Access your analyses and educational content on any device</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="faq-section mt-5">
                <h4 class="text-center mb-4">Frequently Asked Questions</h4>
                <div class="accordion" id="subscriptionFAQ">
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="headingOne">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne">
                                How accurate is the AI analysis?
                            </button>
                        </h2>
                        <div id="collapseOne" class="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#subscriptionFAQ">
                            <div class="accordion-body">
                                Our AI model has been trained on thousands of medical images and provides high confidence scores for common conditions. However, it should not replace professional medical diagnosis. Always consult with a healthcare provider for definitive diagnosis and treatment.
                            </div>
                        </div>
                    </div>
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="headingTwo">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo">
                                Can I cancel my subscription at any time?
                            </button>
                        </h2>
                        <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#subscriptionFAQ">
                            <div class="accordion-body">
                                Yes, you can cancel your subscription at any time. Your premium features will remain active until the end of your current billing period.
                            </div>
                        </div>
                    </div>
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="headingThree">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree">
                                Is my medical data secure?
                            </button>
                        </h2>
                        <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#subscriptionFAQ">
                            <div class="accordion-body">
                                Yes, we take data security seriously. All your medical data is encrypted both during transmission and storage. We comply with HIPAA and GDPR regulations to ensure your information remains private and secure.
                            </div>
                        </div>
                    </div>
                    <div class="accordion-item">
                        <h2 class="accordion-header" id="headingFour">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour">
                                What payment methods do you accept?
                            </button>
                        </h2>
                        <div id="collapseFour" class="accordion-collapse collapse" aria-labelledby="headingFour" data-bs-parent="#subscriptionFAQ">
                            <div class="accordion-body">
                                We accept all major credit cards, PayPal, and Apple Pay for subscription payments.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function setupSubscriptionEventListeners(container) {
    // Get all subscription buttons
    const subscribeButtons = container.querySelectorAll('.subscribe-btn');
    
    // Add click event listeners to each button
    subscribeButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const planType = button.getAttribute('data-plan');
            
            // Handle free plan selection
            if (planType === 'free') {
                showNotification('You are now using the Basic plan.', 'info');
                return;
            }
            
            // For paid plans, show a modal (or redirect to payment)
            showSubscriptionModal(planType);
        });
    });
}

function showSubscriptionModal(planType) {
    // Check if a modal already exists and remove it
    let existingModal = document.getElementById('subscriptionModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Determine plan details
    const planDetails = {
        premium: {
            name: 'Premium',
            price: '$9.99/month',
            features: [
                'Unlimited analyses',
                'Full educational library',
                'Save analysis history',
                'Detailed condition information',
                'Priority analysis'
            ]
        }
    };
    
    const plan = planDetails[planType];
    
    // Create the modal
    const modalHTML = `
        <div class="modal fade" id="subscriptionModal" tabindex="-1" aria-labelledby="subscriptionModalLabel" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="subscriptionModalLabel">Subscribe to ${plan.name}</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="text-center mb-4">
                            <i class="fas fa-star fa-3x text-warning"></i>
                            <h4 class="mt-3">${plan.name} Plan</h4>
                            <p class="lead">${plan.price}</p>
                        </div>
                        
                        <div class="mb-4">
                            <h5>Plan Features:</h5>
                            <ul class="list-group">
                                ${plan.features.map(feature => `
                                    <li class="list-group-item">
                                        <i class="fas fa-check text-success me-2"></i> ${feature}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle"></i>
                            This is a demo app. In a real implementation, this would connect to a payment processor.
                        </div>
                        
                        <form id="paymentForm">
                            <div class="mb-3">
                                <label for="cardName" class="form-label">Name on Card</label>
                                <input type="text" class="form-control" id="cardName" placeholder="John Doe">
                            </div>
                            <div class="mb-3">
                                <label for="cardNumber" class="form-label">Card Number</label>
                                <input type="text" class="form-control" id="cardNumber" placeholder="1234 5678 9012 3456">
                            </div>
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="cardExpiry" class="form-label">Expiration Date</label>
                                    <input type="text" class="form-control" id="cardExpiry" placeholder="MM/YY">
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="cardCVC" class="form-label">CVC</label>
                                    <input type="text" class="form-control" id="cardCVC" placeholder="123">
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" id="confirmSubscription">Subscribe Now</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add the modal to the document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Get the modal element
    const modalElement = document.getElementById('subscriptionModal');
    
    // Initialize the Bootstrap modal
    const modal = new bootstrap.Modal(modalElement);
    
    // Show the modal
    modal.show();
    
    // Add event listener to the confirm button
    const confirmButton = document.getElementById('confirmSubscription');
    if (confirmButton) {
        confirmButton.addEventListener('click', async () => {
            // In a real app, this would process the payment and get a payment token
            // For demo purposes, we'll use a mock payment token
            const paymentToken = 'demo_payment_token_' + Date.now();
            
            try {
                // Get authentication token
                const token = window.SymptomSentryUtils.getAuthToken();
                
                if (!token) {
                    showNotification('You must be logged in to update your subscription', 'warning');
                    modal.hide();
                    return;
                }
                
                // Call the API to update subscription
                const response = await fetch('/api/update-subscription', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        subscription_level: planType,
                        payment_token: paymentToken
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    modal.hide();
                    showNotification(`You have successfully subscribed to the ${plan.name} plan!`, 'success');
                    
                    // Update the UI to reflect the new subscription
                    if (window.SymptomSentryUtils && window.SymptomSentryUtils.updateProfileUI) {
                        window.SymptomSentryUtils.updateProfileUI(data.user.email, data.user.name, data.user);
                    }
                } else {
                    throw new Error(data.message || 'Failed to update subscription');
                }
            } catch (error) {
                console.error('Subscription update error:', error);
                showNotification(`Error updating subscription: ${error.message}`, 'danger');
            }
        });
    }
}

function showNotification(message, type = 'info') {
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
