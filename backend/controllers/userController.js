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
    console.log('📥 LOGIN REQUEST RECEIVED 📥');
    console.log('==============================');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    
    try {
        const { email, password } = req.body;

        // Basic validation
        if (!email || !password) {
            console.log('❌ Login validation failed: Missing email or password');
            return res.status(400).json({
                error: true,
                message: 'Please provide email and password'
            });
        }

        console.log('👤 Attempting to find user with email:', email);
        
        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            console.log('❌ User not found with email:', email);
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials'
            });
        }

        console.log('✅ User found:', { id: user.id, email: user.email });
        console.log('🔐 Verifying password...');
        
        // Verify password
        const isPasswordValid = await User.verifyPassword(password, user.password);
        if (!isPasswordValid) {
            console.log('❌ Password verification failed for user:', email);
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials'
            });
        }

        console.log('✅ Password verified successfully');
        console.log('🔑 Generating JWT token...');
        
        // Generate JWT token
        const token = jwt.sign({ id: user.id }, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });

        // Prepare response object
        const responseObject = {
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                subscription: user.subscription
            },
            token
        };
        
        console.log('✅ Login successful for user:', email);
        console.log('📤 Response structure:', JSON.stringify(responseObject, null, 2));
        
        res.status(200).json(responseObject);
    } catch (error) {
        console.error('❌ Error logging in:', error);
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
        
        // Handle name update
        if (name) {
            updateData.name = name;
        }
        
        if (email) {
            updateData.email = email.toLowerCase();
        }
        
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

/**
 * Update user password
 */
exports.updatePassword = async (req, res, next) => {
    try {
        // Extract user ID from request (set by auth middleware)
        const userId = req.user.id;
        
        const { currentPassword, newPassword } = req.body;
        
        // Validate request
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: true,
                message: 'Current password and new password are required'
            });
        }
        
        // Fetch user to verify current password
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({
                error: true,
                message: 'User not found'
            });
        }
        
        // Verify current password
        const isPasswordValid = await User.verifyPassword(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: true,
                message: 'Current password is incorrect'
            });
        }
        
        // Update password
        const updatedUser = await User.update(userId, {
            password: newPassword // Will be hashed in the User model
        });
        
        res.status(200).json({
            message: 'Password updated successfully'
        });
    } catch (error) {
        console.error('Error updating password:', error);
        next(error);
    }
};

/**
 * Helper function to format a name with proper case
 * Converts "john" or "JOHN" to "John"
 */
function formatNameProperCase(name) {
    if (!name) return '';
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/**
 * Validate user's authentication token
 */
exports.validateToken = async (req, res, next) => {
    try {
        // The authenticate middleware has already verified the token
        // and attached the user to the request object
        // So if we've reached this point, the token is valid
        
        return res.status(200).json({
            valid: true,
            user: {
                id: req.user.id,
                email: req.user.email,
                name: req.user.name,
                subscription: req.user.subscription
            }
        });
    } catch (error) {
        console.error('Error validating token:', error);
        return res.status(401).json({
            valid: false,
            error: true,
            message: 'Invalid token'
        });
    }
};

/**
 * Update user's subscription
 */
exports.updateSubscription = async (req, res, next) => {
    try {
        // Extract user ID from request (set by auth middleware)
        const userId = req.user.id;
        
        const { subscription_level, payment_token } = req.body;
        
        // Validate request
        if (!subscription_level || !payment_token) {
            return res.status(400).json({
                error: true,
                message: 'Subscription level and payment token are required'
            });
        }
        
        // Validate subscription level
        if (!['free', 'premium'].includes(subscription_level)) {
            return res.status(400).json({
                error: true,
                message: 'Invalid subscription level'
            });
        }
        
        // In a real app, we would process the payment here
        // using a payment processor like Stripe
        
        // Update user's subscription
        const updateData = {
            subscription: subscription_level
        };
        
        // Update user in database
        const updatedUser = await User.update(userId, updateData);
        
        if (!updatedUser) {
            return res.status(404).json({
                error: true,
                message: 'User not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Subscription updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                subscription: updatedUser.subscription
            }
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        next(error);
    }
};
