// Import required modules
const { v4: uuidv4 } = require('uuid');

// Mock user database for demo
const users = [];

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
        const existingUser = users.find(user => user.email === email);
        if (existingUser) {
            return res.status(409).json({
                error: true,
                message: 'User already exists with this email'
            });
        }

        // Create new user (in a real app, password would be hashed)
        const newUser = {
            id: uuidv4(),
            email,
            password, // In a real app, this would be hashed
            name,
            createdAt: new Date().toISOString(),
            subscription: 'free' // Default subscription level
        };

        // Save user (for demo, just push to array)
        users.push(newUser);

        // Create user response (exclude password)
        const userResponse = {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            subscription: newUser.subscription,
            createdAt: newUser.createdAt
        };

        res.status(201).json({
            message: 'User registered successfully',
            user: userResponse
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
        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials'
            });
        }

        // Verify password (in a real app, this would compare hashed passwords)
        if (user.password !== password) {
            return res.status(401).json({
                error: true,
                message: 'Invalid credentials'
            });
        }

        // Create user response (exclude password)
        const userResponse = {
            id: user.id,
            email: user.email,
            name: user.name,
            subscription: user.subscription
        };

        // In a real app, this would generate and return a JWT token
        res.status(200).json({
            message: 'Login successful',
            user: userResponse,
            token: `mock-token-${user.id}` // Mock token for demo
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
        // In a real app, this would extract the user ID from the JWT token
        // and fetch the user from the database
        
        // Mock response
        const mockUser = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'John Doe',
            email: 'john.doe@example.com',
            subscription: 'premium',
            createdAt: '2023-01-15T08:30:00Z'
        };
        
        res.status(200).json({
            user: mockUser
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
        const { name, email } = req.body;

        // In a real app, this would extract the user ID from the JWT token
        // and update the user in the database
        
        // Mock response
        const updatedUser = {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: name || 'John Doe',
            email: email || 'john.doe@example.com',
            subscription: 'premium',
            updatedAt: new Date().toISOString()
        };
        
        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        next(error);
    }
};
