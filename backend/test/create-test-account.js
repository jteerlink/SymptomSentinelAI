/**
 * Create Test Account Script
 * 
 * This script creates a new test account with the provided credentials.
 * It's useful for testing the system without automatic login.
 * 
 * Usage: 
 * node test/create-test-account.js email password firstName lastName
 * Example:
 * node test/create-test-account.js test@example.com password123 Test User
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/db');

async function createTestAccount() {
    // Get command line arguments
    const args = process.argv.slice(2);
    if (args.length < 4) {
        console.error('Usage: node test/create-test-account.js email password firstName lastName');
        process.exit(1);
    }
    
    const [email, password, firstName, lastName] = args;
    const name = `${firstName} ${lastName}`;
    
    console.log('----------------------------------------');
    console.log('Creating test account:');
    console.log('Email:', email);
    console.log('Name:', name);
    console.log('----------------------------------------');
    
    try {
        // Check if user already exists
        const existingUser = await db('users').where({ email }).first();
        
        if (existingUser) {
            console.log('⚠️ User already exists with this email. Updating instead of creating new account.');
            
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
                
            console.log('✅ User updated successfully');
            console.log('User ID:', existingUser.id);
        } else {
            // Create new user
            const hashedPassword = await bcrypt.hash(password, 10);
            const userId = uuidv4();
            
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
            
            console.log('✅ User created successfully');
            console.log('User ID:', userId);
        }
        
        console.log('----------------------------------------');
        console.log('LOGIN CREDENTIALS:');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('----------------------------------------');
    } catch (error) {
        console.error('❌ Error creating test user:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await db.destroy();
    }
}

// Execute the function
createTestAccount();