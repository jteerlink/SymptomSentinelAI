/**
 * User Model
 * 
 * In a real application, this would be a proper MongoDB/database model.
 * For this demo, we're using a simple JavaScript class.
 */
class User {
    // Subscription plan limits
    static SUBSCRIPTION_LIMITS = {
        free: {
            analysesPerMonth: 5,
            advancedFeatures: false,
            highResolutionDownload: false,
            detailedReports: false
        },
        premium: {
            analysesPerMonth: Infinity, // Unlimited analyses
            advancedFeatures: true,
            highResolutionDownload: true,
            detailedReports: true
        }
    };
    
    constructor(id, email, password, name, subscription = 'free', analysis_count = 0, last_reset_date = new Date()) {
        this.id = id;
        this.email = email;
        this.password = password; // In a real app, this would be hashed
        this.name = name;
        this.subscription = subscription;
        this.analysis_count = analysis_count; // Current month's analysis count
        this.last_reset_date = last_reset_date; // When the count was last reset
        this.created_at = new Date();
        this.updated_at = new Date();
    }

    // Convert to JSON for API responses
    toJSON() {
        const subscriptionLimits = User.SUBSCRIPTION_LIMITS[this.subscription] || User.SUBSCRIPTION_LIMITS.free;
        
        return {
            id: this.id,
            email: this.email,
            name: this.name,
            subscription: this.subscription,
            analysisCount: this.analysis_count || 0,
            analysisLimit: subscriptionLimits.analysesPerMonth,
            analysisRemaining: Math.max(0, subscriptionLimits.analysesPerMonth - (this.analysis_count || 0)),
            subscriptionDetails: subscriptionLimits,
            lastResetDate: this.last_reset_date,
            createdAt: this.created_at,
            updatedAt: this.updated_at
        };
    }
    
    // Check if user has exceeded their analysis limit
    hasExceededAnalysisLimit() {
        const limits = User.SUBSCRIPTION_LIMITS[this.subscription] || User.SUBSCRIPTION_LIMITS.free;
        return (this.analysis_count || 0) >= limits.analysesPerMonth;
    }
    
    // Increment analysis count and check if reset is needed
    incrementAnalysisCount() {
        // Check if we need to reset the counter (new month)
        const now = new Date();
        const lastReset = new Date(this.last_reset_date || new Date());
        
        if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
            this.analysis_count = 0;
            this.last_reset_date = now;
        }
        
        // Increment count
        this.analysis_count = (this.analysis_count || 0) + 1;
        this.updated_at = now;
        
        return this.analysis_count;
    }

    // Static method to validate user data
    static validate(userData) {
        const errors = [];

        if (!userData.email) {
            errors.push('Email is required');
        } else if (!this.isValidEmail(userData.email)) {
            errors.push('Invalid email format');
        }

        if (!userData.password) {
            errors.push('Password is required');
        } else if (userData.password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }

        if (!userData.name) {
            errors.push('Name is required');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Helper method to validate email format
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Static method to check if a user has exceeded their analysis limit
    static hasExceededAnalysisLimit(user) {
        const limits = this.SUBSCRIPTION_LIMITS[user.subscription] || this.SUBSCRIPTION_LIMITS.free;
        return (user.analysis_count || 0) >= limits.analysesPerMonth;
    }

    // Static method to increment a user's analysis count
    static async incrementAnalysisCount(userId) {
        // In a real database implementation, this would perform an atomic update
        console.log(`Incrementing analysis count for user ${userId}`);
        
        // For demo purposes, we'll just log the action
        return true;
    }

    // Static method to get a user by ID
    static async getById(userId) {
        // This is a mock implementation for testing purposes
        if (userId === 'test-user-id') {
            return new User(
                'test-user-id',
                'test@example.com',
                'password-hash',
                'Test User',
                'premium',
                0, // analysis_count
                new Date() // last_reset_date
            );
        }
        
        // In a real implementation, this would query the database
        console.log(`Getting user with ID ${userId}`);
        
        // For demonstration, return a mock user
        return null;
    }
}

module.exports = User;
