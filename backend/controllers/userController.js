// Import required modules
const { User } = require('../db/models');
const jwt = require('jsonwebtoken');

// JWT secret key (would be in env variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'symptom-sentry-ai-secret-key';
const JWT_EXPIRES_IN = '7d';

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;

        // Basic validation
        if (!email || !password || !name) {
            return res.status(400).json({
                error: true,
                message: 'Please provide email, password, and name'
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(409).json({
                error: true,
                message: 'User already exists with this email'
            });
        }

        // Create new user with hashed password
        const newUser = await User.create({
            email,
            password, // Password will be hashed in the User model
            name,
            subscription: 'free' // Default subscription level
        });

        // Generate JWT token
        const token = jwt.sign({ id: newUser.id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                subscription: newUser.subscription,
                created_at: newUser.created_at
            },
            token
        });
    } catch (error) {
        console.error('Error registering user:', error);
        next(error);
    }
};

/**
 * User login
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            return res.status(400).json({
                error: true,
                message: 'Please provide email and password'
            });
        }

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials'
            });
        }

        // Verify password
        const isPasswordValid = await User.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials'
            });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user.id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscription: user.subscription
            },
            token
        });
    } catch (error) {
        console.error('Error logging in:', error);
        next(error);
    }
};

/**
 * Get user profile
 */
exports.getUserProfile = async (req, res, next) => {
    try {
        // Extract user ID from request (set by auth middleware)
        const userId = req.user.id;
        
        // Fetch user from database
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscription: user.subscription,
                email_verified: user.email_verified,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        next(error);
    }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res, next) => {
    try {
        // Extract user ID from request (set by auth middleware)
        const userId = req.user.id;
        
        const { name, email } = req.body;
        
        // Prepare update data
        const updateData = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        
        // Update user in database
        const updatedUser = await User.update(userId, updateData);
        
        if (!updatedUser) {
            return res.status(404).json({
                error: true,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                subscription: updatedUser.subscription,
                updated_at: updatedUser.updated_at
            }
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        next(error);
    }
};
