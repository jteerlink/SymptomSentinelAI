// Import required modules
const { User } = require('../db/models');
const { generateTokens, JWT_EXPIRATION, JWT_REFRESH_EXPIRATION } = require('../middleware/auth');
const { validatePassword } = require('../utils/passwordValidator');

/**
 * Constants for cookie configuration
 */
// Convert JWT expiration time strings to milliseconds for cookie maxAge
// '1h' = 3600000ms, '7d' = 604800000ms
const COOKIE_MAX_AGE = 3600000; // 1 hour in milliseconds
const REFRESH_COOKIE_MAX_AGE = 604800000; // 7 days in milliseconds

const COOKIE_OPTIONS = {
    httpOnly: true,           // Prevents client-side JavaScript from accessing cookies
    secure: process.env.NODE_ENV === 'production', // In production use HTTPS only
    sameSite: 'lax',          // Provides some CSRF protection
    maxAge: COOKIE_MAX_AGE    // Expire cookie at the same time as the token (1 hour)
};

/**
 * Register a new user
 */
exports.register = async (req, res, next) => {
    try {
        console.log('📥 REGISTRATION REQUEST RECEIVED 📥');
        console.log('==============================');
        console.log('Request headers:', req.headers);
        console.log('Request body:', req.body);
        
        const { email, password, name } = req.body;
        console.log('👤 Processing registration for:', email);
        console.log('📋 Registration data validation:');

        // Basic validation
        if (!email || !password || !name) {
            console.log('❌ Validation failed: Missing required fields');
            console.log('- Email provided:', !!email);
            console.log('- Password provided:', !!password);
            console.log('- Name provided:', !!name);
            return res.status(400).json({
                error: true,
                message: 'Please provide email, password, and name'
            });
        }

        // Validate password
        console.log('🔐 Validating password strength...');
        const passwordValidation = validatePassword(password);
        console.log('🔐 Password validation result:', passwordValidation.isValid ? '✅ VALID' : '❌ INVALID');
        
        if (!passwordValidation.isValid) {
            console.log('❌ Password validation failed:', passwordValidation.message);
            return res.status(400).json({
                error: true,
                message: passwordValidation.message
            });
        }

        // Check if user already exists
        console.log('🔍 Checking if email already exists:', email);
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            console.log('❌ Email already in use:', email);
            return res.status(409).json({
                error: true,
                message: 'User already exists with this email'
            });
        }
        console.log('✅ Email is available');

        // Create new user with hashed password
        console.log('➕ Creating new user with email:', email);
        console.log('🔒 Password will be hashed in the User model');
        const newUser = await User.create({
            email,
            password, // Password will be hashed in the User model
            name,
            subscription: 'free' // Default subscription level
        });
        console.log('✅ User created with ID:', newUser.id);

        // Generate tokens (access and refresh)
        console.log('🔑 Generating authentication tokens...');
        const { accessToken, refreshToken } = generateTokens(newUser);
        
        // Set cookies for authentication
        res.cookie('authToken', accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: COOKIE_MAX_AGE
        });
        
        res.cookie('refreshToken', refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: REFRESH_COOKIE_MAX_AGE
        });
        
        // Prepare response object
        const responseObject = {
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                subscription: newUser.subscription,
                created_at: newUser.created_at
            },
            accessToken,
            refreshToken,
            tokenExpiration: JWT_EXPIRATION
        };
        
        console.log('✅ Registration successful for user:', email);
        console.log('📤 Response structure:', JSON.stringify({
            ...responseObject,
            accessToken: '***truncated***',
            refreshToken: '***truncated***'
        }, null, 2));
        console.log('🍪 Auth cookies set for user:', email);

        res.status(201).json(responseObject);
    } catch (error) {
        console.error('❌ Error registering user:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Stack trace:', error.stack);
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
        
        // Enhanced password verification logging
        console.log('🔐 Password verification details:');
        console.log('- Input password:', password);
        console.log('- Stored hashed password (first 15 chars):', user.password.substring(0, 15) + '...');
        console.log('- Hash type appears to be:', user.password.startsWith('$2a$') || user.password.startsWith('$2b$') ? 'bcrypt' : 'unknown');
        
        // Verify password
        try {
            const isPasswordValid = await User.verifyPassword(password, user.password);
            console.log('🔐 Password verification result:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
            
            if (!isPasswordValid) {
                console.log('❌ Password verification failed for user:', email);
                return res.status(401).json({
                    error: true,
                    message: 'Invalid credentials'
                });
            }
        } catch (verifyError) {
            console.error('❌ Password verification error:', verifyError);
            return res.status(401).json({
                error: true,
                message: 'Authentication error'
            });
        }

        console.log('✅ Password verified successfully');
        console.log('🔑 Generating tokens...');
        
        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);
        
        // Set cookies for authentication
        res.cookie('authToken', accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: COOKIE_MAX_AGE
        });
        
        res.cookie('refreshToken', refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: REFRESH_COOKIE_MAX_AGE
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
            accessToken,
            refreshToken,
            tokenExpiration: JWT_EXPIRATION
        };
        
        console.log('✅ Login successful for user:', email);
        console.log('📤 Response structure:', JSON.stringify({
            ...responseObject,
            accessToken: '***truncated***',
            refreshToken: '***truncated***'
        }, null, 2));
        console.log('🍪 Auth cookies set for user:', email);
        
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
        const user = await User.getById(userId);
        
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
        const updatedUser = await User.updateProfile(userId, updateData);
        
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
        
        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                error: true,
                message: passwordValidation.message
            });
        }
        
        // Use the User model's updatePassword method which handles all the validation
        const success = await User.updatePassword(userId, currentPassword, newPassword);
        
        if (!success) {
            return res.status(400).json({
                error: true,
                message: 'Failed to update password'
            });
        }
        
        // Generate new tokens after password change
        const user = await User.getById(userId);
        const { accessToken, refreshToken } = generateTokens(user);
        
        // Set cookies for the new tokens
        res.cookie('authToken', accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: COOKIE_MAX_AGE
        });
        
        res.cookie('refreshToken', refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: REFRESH_COOKIE_MAX_AGE
        });
        
        console.log('🔑 Password updated, new auth cookies set for user:', user.id);
        
        res.status(200).json({
            message: 'Password updated successfully',
            accessToken,
            refreshToken,
            tokenExpiration: JWT_EXPIRATION
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
        if (!subscription_level) {
            return res.status(400).json({
                error: true,
                message: 'Subscription level is required'
            });
        }
        
        // Payment token is only required when upgrading to premium
        if (subscription_level === 'premium' && !payment_token) {
            return res.status(400).json({
                error: true,
                message: 'Payment token is required for premium subscription'
            });
        }
        
        // Convert subscription_level to match our database values
        let subscriptionType;
        if (subscription_level === 'free') {
            subscriptionType = 'free'; // Keep as 'free' to match database constraints
        } else if (subscription_level === 'premium') {
            subscriptionType = 'premium';
        } else {
            return res.status(400).json({
                error: true,
                message: 'Invalid subscription level'
            });
        }
        
        // In a real app, we would process the payment here
        // using a payment processor like Stripe
        
        // Update user's subscription
        const updatedUser = await User.updateSubscription(userId, subscriptionType);
        
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

/**
 * Request a password reset
 */
exports.requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                error: true,
                message: 'Email is required'
            });
        }
        
        // Generate a password reset token
        const resetData = await User.generatePasswordResetToken(email);
        
        // The User model will always return a success response for security
        // to avoid revealing whether an email exists in our system
        
        // In a real application, we would send an email with the reset token
        // For now, we'll just return the token in the response for testing purposes
        if (resetData.token) {
            console.log('Password reset token generated for:', email);
            console.log('Token:', resetData.token);
            console.log('Expires:', resetData.expires);
        }
        
        res.status(200).json({
            success: true,
            message: 'If your email is registered, you will receive password reset instructions',
            // For testing only, we return the token
            // In production, this would be sent via email
            debug: resetData.token ? {
                resetToken: resetData.token,
                resetExpires: resetData.expires
            } : {
                info: 'No token generated - email not found or error occurred'
            }
        });
    } catch (error) {
        console.error('Error requesting password reset:', error);
        next(error);
    }
};

/**
 * Reset password with token
 */
exports.resetPassword = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;
        
        if (!token || !newPassword) {
            return res.status(400).json({
                error: true,
                message: 'Token and new password are required'
            });
        }
        
        // Validate new password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            return res.status(400).json({
                error: true,
                message: passwordValidation.message
            });
        }
        
        // Reset the password
        const result = await User.resetPasswordWithToken(token, newPassword);
        
        if (!result.success) {
            return res.status(400).json({
                error: true,
                message: result.message
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. Please log in with your new password.'
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        next(error);
    }
};

/**
 * Refresh access token using refresh token
 */
exports.refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({
                error: true,
                message: 'Refresh token is required'
            });
        }
        
        // Import the refreshAccessToken function from auth middleware
        const { refreshAccessToken } = require('../middleware/auth');
        
        const result = await refreshAccessToken(refreshToken);
        
        if (!result.success) {
            return res.status(401).json({
                error: true,
                message: result.message
            });
        }
        
        // Set new cookies for refreshed tokens
        res.cookie('authToken', result.accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: COOKIE_MAX_AGE
        });
        
        res.cookie('refreshToken', result.refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: REFRESH_COOKIE_MAX_AGE
        });
        
        console.log('[Token Refresh] Auth cookies refreshed successfully');
        
        return res.json({
            error: false,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(500).json({
            error: true,
            message: 'Internal server error during token refresh'
        });
    }
};

/**
 * User logout
 */
exports.logout = async (req, res, next) => {
    try {
        console.log('[Logout] Processing logout request for user:', req.user.id);
        
        // In a stateful server, we might invalidate the token in a database
        // or add it to a blocklist to prevent it from being used again
        
        // For our implementation, we'll rely on clearing client-side tokens
        // Here we'll set an empty auth cookie with immediate expiration
        res.cookie('authToken', '', {
            ...COOKIE_OPTIONS,
            maxAge: 0, // Expire immediately
            expires: new Date(0), // Expire immediately
        });
        
        res.cookie('refreshToken', '', {
            ...COOKIE_OPTIONS,
            maxAge: 0, // Expire immediately
            expires: new Date(0), // Expire immediately
        });
        
        console.log('[Logout] Logout successful for user:', req.user.id);
        
        // Return a success response
        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        });
    } catch (error) {
        console.error('[Logout] Error during logout:', error);
        next(error);
    }
};
