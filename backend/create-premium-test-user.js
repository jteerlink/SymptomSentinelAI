/**
 * Create Premium Test User Script
 * 
 * This script creates a premium test user for API testing purposes.
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const knex = require('./db/knex');

async function createPremiumTestUser() {
    const premiumUser = {
        id: uuidv4(),
        email: 'prem@example.com',
        password: await bcrypt.hash('PremiumUser123!', 10),
        name: 'Premium User',
        subscription: 'premium',
        email_verified: true,
        created_at: new Date(),
        updated_at: new Date()
    };
    
    console.log('Creating premium test user:', premiumUser.email);
    
    try {
        // Check if user already exists
        const existingUser = await knex('users')
            .where({ email: premiumUser.email })
            .first();
        
        if (existingUser) {
            console.log('Premium test user already exists. Updating subscription and password...');
            
            await knex('users')
                .where({ email: premiumUser.email })
                .update({
                    password: premiumUser.password,
                    subscription: 'premium',
                    updated_at: new Date()
                });
            
            console.log('Premium user updated successfully!');
        } else {
            console.log('Creating new premium test user...');
            
            await knex('users').insert(premiumUser);
            
            console.log('Premium test user created successfully!');
        }
        
        console.log('Premium test user details:');
        console.log('- Email:', premiumUser.email);
        console.log('- Password: PremiumUser123!');
        console.log('- Subscription:', premiumUser.subscription);
    } catch (error) {
        console.error('Error creating premium test user:', error);
    } finally {
        // Close database connection
        knex.destroy();
    }
}

// Run the script
createPremiumTestUser();