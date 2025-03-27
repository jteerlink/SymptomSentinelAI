/**
 * Create Test User Script
 * 
 * This script creates a test user for API testing purposes.
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { knex } = require('./db');

async function createTestUser() {
    const testUser = {
        id: uuidv4(),
        email: 'test@example.com',
        password: await bcrypt.hash('TestPassword123!', 10),
        name: 'Test User',
        subscription: 'premium',
        email_verified: true,
        created_at: new Date()
    };
    
    console.log('Creating test user:', testUser.email);
    
    try {
        // Check if user already exists
        const existingUser = await knex('users')
            .where({ email: testUser.email })
            .first();
        
        if (existingUser) {
            console.log('Test user already exists. Updating password...');
            
            await knex('users')
                .where({ email: testUser.email })
                .update({
                    password: testUser.password
                });
            
            console.log('Password updated successfully!');
        } else {
            console.log('Creating new test user...');
            
            await knex('users').insert(testUser);
            
            console.log('Test user created successfully!');
        }
        
        console.log('Test user details:');
        console.log('- Email:', testUser.email);
        console.log('- Password: TestPassword123!');
        console.log('- Subscription:', testUser.subscription);
    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        // Close database connection
        knex.destroy();
    }
}

// Run the script
createTestUser();