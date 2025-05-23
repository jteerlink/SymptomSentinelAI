/**
 * User Model
 * 
 * This model handles user-related database operations and includes
 * authentication, password management, and profile operations.
 */

const knex = require('../knex');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validatePassword, generateResetToken, calculateTokenExpiration } = require('../../utils/passwordValidator');
const ApiError = require('../../utils/apiError');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

// Subscription limits
const SUBSCRIPTION_LIMITS = {
    'free': {
        analysesPerMonth: 2
    },
    'premium': {
        analysesPerMonth: Infinity
    }
};

class User {
    // Make subscription limits available as a static property
    static SUBSCRIPTION_LIMITS = SUBSCRIPTION_LIMITS;
    
    /**
     * Check if a user has exceeded their monthly analysis limit
     * 
     * @param {Object} user - User object
     * @returns {boolean} True if the user has exceeded their limit
     */
    static hasExceededAnalysisLimit(user) {
        if (!user) return false;
        
        // Premium users have unlimited analyses
        if (user.subscription === 'premium') {
            return false;
        }
        
        // Free users are limited to 2 analyses per month
        const limit = SUBSCRIPTION_LIMITS[user.subscription]?.analysesPerMonth || 2;
        return (user.analysis_count || 0) >= limit;
    }
    /**
     * Find a user by email
     * 
     * @param {string} email - User email
     * @returns {Object|null} User object or null if not found
     */
    static async findByEmail(email) {
        try {
            const user = await knex('users')
                .where({ email: email.toLowerCase() })
                .first();
            
            return user || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            return null;
        }
    }
    
    /**
     * Verify a password against a hashed password
     * 
     * @param {string} plainPassword - The plain text password to verify
     * @param {string} hashedPassword - The hashed password to compare against
     * @returns {Promise<boolean>} True if the password matches, false otherwise
     */
    static async verifyPassword(plainPassword, hashedPassword) {
        try {
            console.log(`[Password Verification] Comparing password with bcrypt.compare`);
            console.log(`[Password Verification] Plain password length: ${plainPassword.length}`);
            console.log(`[Password Verification] Hashed password starts with: ${hashedPassword.substring(0, 7)}...`);
            
            // Check if the hashed password has a valid bcrypt format
            if (!hashedPassword.startsWith('$2a$') && !hashedPassword.startsWith('$2b$') && !hashedPassword.startsWith('$2y$')) {
                console.error('[Password Verification] Invalid bcrypt hash format:', hashedPassword.substring(0, 10) + '...');
                console.error('[Password Verification] This suggests the password was not properly hashed originally');
                return false;
            }
            
            // Verify using bcrypt
            const isValid = await bcrypt.compare(plainPassword, hashedPassword);
            console.log(`[Password Verification] bcrypt.compare result: ${isValid}`);
            return isValid;
        } catch (error) {
            console.error('[Password Verification] Error verifying password:', error);
            console.error('[Password Verification] Error details:', error.message);
            console.error('[Password Verification] Stack trace:', error.stack);
            return false;
        }
    }
    
    /**
     * Create a new user
     * 
     * @param {Object} userData - User data including email, password, name
     * @returns {Object} Created user object (without password)
     */
    static async create(userData) {
        const { email, password, name } = userData;
        
        // Check if user already exists
        const existingUser = await knex('users').where({ email }).first();
        if (existingUser) {
            throw new ApiError('Email already in use', 'EMAIL_IN_USE', 409);
        }
        
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.isValid) {
            throw new ApiError(passwordValidation.message, 'INVALID_PASSWORD', 400);
        }
        
        // Generate password hash
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        // Create user
        const result = await knex('users').insert({
            email,
            password: passwordHash,
            name,
            subscription: 'free',
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
        }).returning('id');
        
        // Extract the userId as a string
        const userId = result[0].id || result[0];
        
        // Get created user
        const user = await knex('users')
            .select('id', 'email', 'name', 'subscription', 'created_at')
            .where('id', userId)
            .first();
            
        return user;
    }
    
    /**
     * Authenticate a user with email and password
     * 
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Object} User data and tokens
     */
    static async authenticate(email, password) {
        // Find user
        const user = await knex('users').where({ email }).first();
        if (!user) {
            throw new ApiError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new ApiError('Invalid email or password', 'INVALID_CREDENTIALS', 401);
        }
        
        // Generate tokens
        const accessToken = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        const refreshToken = jwt.sign(
            { userId: user.id, tokenType: 'refresh' },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );
        
        // Return user data and tokens
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscription_type: user.subscription
            },
            tokens: {
                accessToken,
                refreshToken
            }
        };
    }
    
    /**
     * Get user by ID
     * 
     * @param {string} userId - User ID
     * @returns {Object} User object
     */
    static async getById(userId) {
        // Ensure userId is treated as a string
        const id = typeof userId === 'object' && userId.id ? userId.id : userId;
        
        const user = await knex('users')
            .select('id', 'email', 'name', 'subscription', 'created_at', 'updated_at', 'analysis_count', 'last_reset_date')
            .where('id', id)
            .first();
            
        if (!user) {
            throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
        }
        
        return user;
    }
    
    /**
     * Update user profile
     * 
     * @param {string} userId - User ID
     * @param {Object} profileData - Profile data to update
     * @returns {Object} Updated user object
     */
    static async updateProfile(userId, profileData) {
        const { name, email } = profileData;
        
        // Verify user exists
        const user = await this.getById(userId);
        
        // Check if email is changing and if it's already in use
        if (email && email !== user.email) {
            const existingUser = await knex('users').where({ email }).first();
            if (existingUser) {
                throw new ApiError('Email already in use', 'EMAIL_IN_USE', 409);
            }
        }
        
        // Update fields
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        updateData.updated_at = knex.fn.now();
        
        // Ensure userId is treated as a string
        const id = typeof userId === 'object' && userId.id ? userId.id : userId;
        
        // Update in database
        await knex('users')
            .where('id', id)
            .update(updateData);
            
        // Get updated user
        return await this.getById(userId);
    }
    
    /**
     * Update user password
     * 
     * @param {string} userId - User ID
     * @param {string} currentPassword - Current password
     * @param {string} newPassword - New password
     * @returns {boolean} Success indicator
     */
    static async updatePassword(userId, currentPassword, newPassword) {
        // Ensure userId is treated as a string
        const id = typeof userId === 'object' && userId.id ? userId.id : userId;
        
        // Get user with password
        const user = await knex('users')
            .where('id', id)
            .first();
            
        if (!user) {
            throw new ApiError('User not found', 'USER_NOT_FOUND', 404);
        }
        
        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new ApiError('Current password is incorrect', 'INVALID_PASSWORD', 400);
        }
        
        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            throw new ApiError(passwordValidation.message, 'INVALID_PASSWORD', 400);
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        // Ensure userId is treated as a string
        const updateId = typeof userId === 'object' && userId.id ? userId.id : userId;
        
        // Update password
        await knex('users')
            .where('id', updateId)
            .update({
                password: passwordHash,
                updated_at: knex.fn.now()
            });
            
        return true;
    }
    
    /**
     * Update user subscription
     * 
     * @param {string} userId - User ID
     * @param {string} subscriptionType - Subscription type (free or premium)
     * @returns {Object} Updated user object
     */
    static async updateSubscription(userId, subscriptionType) {
        // Verify subscription type
        if (!['free', 'premium'].includes(subscriptionType)) {
            throw new ApiError('Invalid subscription type', 'INVALID_SUBSCRIPTION', 400);
        }
        
        // Verify user exists
        const user = await this.getById(userId);
        
        // Ensure userId is treated as a string
        const updateId = typeof userId === 'object' && userId.id ? userId.id : userId;
        
        // Update subscription
        await knex('users')
            .where('id', updateId)
            .update({
                subscription: subscriptionType,
                updated_at: knex.fn.now()
            });
            
        // Get updated user
        return await this.getById(userId);
    }
    
    /**
     * Generate password reset token
     * 
     * @param {string} email - User email
     * @returns {Object} Reset token info
     */
    static async generatePasswordResetToken(email) {
        // Find user
        const user = await knex('users').where({ email }).first();
        if (!user) {
            // For security, we don't want to reveal if email exists or not
            return {
                success: true,
                message: 'If your email is registered, you will receive a password reset link'
            };
        }
        
        // Generate reset token
        const resetToken = generateResetToken();
        const tokenExpires = calculateTokenExpiration();
        
        // Save token to database
        await knex('users')
            .where({ id: user.id })
            .update({
                reset_token: resetToken,
                reset_token_expires: tokenExpires,
                updated_at: knex.fn.now()
            });
            
        return {
            success: true,
            token: resetToken,
            expires: tokenExpires,
            userId: user.id
        };
    }
    
    /**
     * Reset password with token
     * 
     * @param {string} token - Reset token
     * @param {string} newPassword - New password
     * @returns {Object} Result object
     */
    static async resetPasswordWithToken(token, newPassword) {
        // Find user with token
        const user = await knex('users')
            .where({ reset_token: token })
            .first();
            
        if (!user) {
            return {
                success: false,
                message: 'Invalid or expired reset token'
            };
        }
        
        // Check if token is expired
        const now = new Date();
        const tokenExpiry = new Date(user.reset_token_expires);
        
        if (now > tokenExpiry) {
            return {
                success: false,
                message: 'Reset token has expired'
            };
        }
        
        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return {
                success: false,
                message: passwordValidation.message
            };
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        
        // Update password and clear token
        await knex('users')
            .where({ id: user.id })
            .update({
                password: passwordHash,
                reset_token: null,
                reset_token_expires: null,
                updated_at: knex.fn.now()
            });
            
        return {
            success: true,
            message: 'Password has been reset successfully'
        };
    }
    
    /**
     * Increment user analysis count
     * 
     * @param {string} userId - User ID 
     * @returns {number} Updated analysis count
     */
    static async incrementAnalysisCount(userId) {
        // Get user
        const user = await this.getById(userId);
        
        // Check if we need to reset counter (new month)
        const lastReset = user.last_reset_date ? new Date(user.last_reset_date) : new Date(0);
        const now = new Date();
        
        let analysisCount = user.analysis_count || 0;
        
        // Reset counter if it's a new month
        if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
            analysisCount = 1; // This is the first analysis of the new month
            
            // Ensure userId is treated as a string
            const id = typeof userId === 'object' && userId.id ? userId.id : userId;
            
            await knex('users')
                .where('id', id)
                .update({
                    analysis_count: analysisCount,
                    last_reset_date: now,
                    updated_at: now
                });
        } else {
            // Increment counter
            analysisCount += 1;
            
            // Ensure userId is treated as a string
            const id = typeof userId === 'object' && userId.id ? userId.id : userId;
            
            await knex('users')
                .where('id', id)
                .update({
                    analysis_count: analysisCount,
                    updated_at: now
                });
        }
        
        return analysisCount;
    }
    
    /**
     * Track user analysis count
     * 
     * @param {string} userId - User ID
     * @returns {Object} Updated analysis count info
     */
    static async trackAnalysis(userId) {
        // Get user
        const user = await this.getById(userId);
        
        // Check if we need to reset counter (new month)
        const lastReset = new Date(user.last_reset_date);
        const now = new Date();
        
        let analysisCount = user.analysis_count;
        
        // Reset counter if it's a new month
        if (lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
            analysisCount = 1; // This is the first analysis of the new month
            
            // Ensure userId is treated as a string
            const updateId = typeof userId === 'object' && userId.id ? userId.id : userId;
            
            await knex('users')
                .where('id', updateId)
                .update({
                    analysis_count: analysisCount,
                    last_reset_date: now,
                    updated_at: now
                });
        } else {
            // Increment counter
            analysisCount += 1;
            
            // Ensure userId is treated as a string
            const updateId = typeof userId === 'object' && userId.id ? userId.id : userId;
            
            await knex('users')
                .where('id', updateId)
                .update({
                    analysis_count: analysisCount,
                    updated_at: now
                });
        }
        
        // Check if user has exceeded limit (free = 2 per month, premium = unlimited)
        const isLimitExceeded = user.subscription === 'free' && analysisCount > 2;
        
        return {
            analysisCount,
            isLimitExceeded,
            subscriptionType: user.subscription
        };
    }
    
    /**
     * Delete a user from the database
     * 
     * @param {string} userId - User ID
     * @returns {boolean} Success indicator
     */
    static async delete(userId) {
        try {
            // Ensure userId is treated as a string
            const id = typeof userId === 'object' && userId.id ? userId.id : userId;
            
            // Delete the user
            const deleted = await knex('users')
                .where('id', id)
                .delete();
                
            return deleted > 0;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    }
}

module.exports = User;