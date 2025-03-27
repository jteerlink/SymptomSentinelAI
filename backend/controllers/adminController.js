/**
 * Admin Controller
 * 
 * This controller handles administrative functions for testing and development.
 * WARNING: These endpoints should be disabled or protected in production!
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');
const ApiError = require('../utils/apiError');

/**
 * Clear all users from the database
 */
exports.clearAllUsers = async (req, res, next) => {
    console.log('🚨 ADMIN: Clearing all users from the database');
    
    try {
        // Delete all user-related data
        // First, delete any analyses that might be linked to users
        await db('analyses').del();
        
        // Then delete the users
        const result = await db('users').del();
        
        res.status(200).json({
            success: true,
            message: `Successfully deleted ${result} user(s) and their data.`
        });
    } catch (error) {
        console.error('Error clearing users:', error);
        next(new ApiError('Failed to clear users', 500));
    }
};

/**
 * Get user count
 */
exports.getUserCount = async (req, res, next) => {
    try {
        const result = await db('users').count('id as count').first();
        
        res.status(200).json({
            success: true,
            count: result.count
        });
    } catch (error) {
        console.error('Error getting user count:', error);
        next(new ApiError('Failed to get user count', 500));
    }
};

/**
 * Create a test user
 */
exports.createTestUser = async (req, res, next) => {
    const { email, password, firstName, lastName } = req.body;
    
    if (!email || !password || !firstName || !lastName) {
        return next(new ApiError('Missing required fields', 400));
    }
    
    const name = `${firstName} ${lastName}`;
    console.log(`🚨 ADMIN: Creating test user: ${email} / ${name}`);
    
    try {
        // Check if user already exists
        const existingUser = await db('users').where({ email }).first();
        
        let userId;
        
        if (existingUser) {
            console.log(`🚨 ADMIN: User ${email} already exists. Updating instead.`);
            
            // Update existing user
            const hashedPassword = await bcrypt.hash(password, 10);
            await db('users')
                .where({ email })
                .update({
                    name,
                    password: hashedPassword,
                    subscription: 'free',
                    analysis_count: 0,
                    last_reset_date: new Date()
                });
                
            userId = existingUser.id;
        } else {
            // Create new user
            const hashedPassword = await bcrypt.hash(password, 10);
            userId = uuidv4();
            
            await db('users').insert({
                id: userId,
                email,
                name,
                password: hashedPassword,
                subscription: 'free',
                created_at: new Date(),
                updated_at: new Date(),
                analysis_count: 0,
                last_reset_date: new Date()
            });
        }
        
        res.status(200).json({
            success: true,
            message: existingUser ? 'User updated successfully' : 'User created successfully',
            userId,
            email,
            name
        });
    } catch (error) {
        console.error('Error creating test user:', error);
        next(new ApiError('Failed to create test user', 500));
    }
};

/**
 * Health check with detailed status
 */
exports.getSystemHealth = async (req, res, next) => {
    try {
        // Test database connection
        let dbStatus = 'unknown';
        try {
            await db.raw('SELECT 1+1 as result');
            dbStatus = 'connected';
        } catch (dbError) {
            console.error('Database health check error:', dbError);
            dbStatus = 'disconnected';
        }
        
        // Return comprehensive health status
        res.status(200).json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            database: dbStatus,
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        console.error('Health check error:', error);
        next(new ApiError('Health check failed', 500));
    }
};

/**
 * Check ML system status
 */
exports.getMLStatus = async (req, res, next) => {
    try {
        // In a real implementation, you would check actual ML system status
        // For now, we'll return a placeholder
        res.status(200).json({
            status: 'operational',
            models: {
                throat: 'loaded',
                ear: 'loaded'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('ML status check error:', error);
        next(new ApiError('ML status check failed', 500));
    }
};