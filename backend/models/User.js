/**
 * User Model
 * 
 * In a real application, this would be a proper MongoDB/database model.
 * For this demo, we're using a simple JavaScript class.
 */
class User {
    constructor(id, email, password, name, subscription = 'free') {
        this.id = id;
        this.email = email;
        this.password = password; // In a real app, this would be hashed
        this.name = name;
        this.subscription = subscription;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Convert to JSON for API responses
    toJSON() {
        return {
            id: this.id,
            email: this.email,
            name: this.name,
            subscription: this.subscription,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
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
}

module.exports = User;
