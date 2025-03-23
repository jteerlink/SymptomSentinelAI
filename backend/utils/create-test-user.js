/**
 * Create Test User Utility
 * 
 * This script creates a test user with a known password for testing.
 */

const { User } = require('../db/models');

// User details
const testUser = {
    email: 'test-user@example.com',
    password: 'Password123!@#', // Updated to meet password requirements
    name: 'Test User'
};

async function createUser() {
    try {
        console.log(`Creating new user with email: ${testUser.email}`);
        
        // Check if user already exists
        const existingUser = await User.findByEmail(testUser.email);
        if (existingUser) {
            console.log('User already exists, deleting first...');
            await User.delete(existingUser.id);
            console.log('Existing user deleted');
        }
        
        // Create the user
        const newUser = await User.create(testUser);
        
        console.log('User created successfully:');
        console.log({
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            subscription: newUser.subscription
        });
        
        // Retrieve the user to make sure we have the password hash
        const retrievedUser = await User.findByEmail(testUser.email);
        
        // Test login immediately
        console.log('\nTesting login immediately after creation...');
        console.log('Retrieved password hash:', retrievedUser.password);
        const loginSuccess = await User.verifyPassword(testUser.password, retrievedUser.password);
        console.log(`Login test result: ${loginSuccess ? 'SUCCESS' : 'FAILED'}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating test user:', error);
        process.exit(1);
    }
}

console.log('='.repeat(50));
console.log('CREATE TEST USER UTILITY');
console.log('='.repeat(50));
createUser();