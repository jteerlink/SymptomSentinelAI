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
        
        const { firstName, lastName, name, email } = req.body;
        
        // Prepare update data
        const updateData = {};
        
        // Handle either combined name or separate first/last name
        if (firstName || lastName) {
            // Format the first name with proper case
            if (firstName) {
                updateData.firstName = formatNameProperCase(firstName);
            }
            
            if (lastName) {
                updateData.lastName = lastName;
            }
            
            // If both first and last name provided, update the full name
            if (firstName && lastName) {
                updateData.name = `${formatNameProperCase(firstName)} ${lastName}`;
            }
            // If only first name, use that with existing last name (if any)
            else if (firstName) {
                const user = await User.findById(userId);
                const existingLastName = user.lastName || '';
                updateData.name = `${formatNameProperCase(firstName)} ${existingLastName}`.trim();
            }
            // If only last name, use that with existing first name
            else if (lastName) {
                const user = await User.findById(userId);
                const existingFirstName = user.firstName || '';
                updateData.name = `${existingFirstName} ${lastName}`.trim();
            }
        } 
        // For backward compatibility, also accept full name
        else if (name) {
            updateData.name = name;
            
            // Try to parse first and last name from full name
            const nameParts = name.trim().split(/\s+/);
            if (nameParts.length >= 1) {
                updateData.firstName = formatNameProperCase(nameParts[0]);
            }
            if (nameParts.length >= 2) {
                // Last name could be multiple words, so join the rest
                updateData.lastName = nameParts.slice(1).join(' ');
            }
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
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
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
