/**
 * Clear All Users Script
 * 
 * This script clears all users from the database.
 * USE WITH CAUTION! This is destructive and will delete all user accounts.
 * 
 * Usage: 
 * node test/clear-all-users.js
 */

require('dotenv').config();
const db = require('../db/db');

async function clearAllUsers() {
    console.log('⚠️ WARNING: This will delete ALL user accounts from the database!');
    console.log('----------------------------------------');
    
    try {
        // Get count of users before deletion
        const userCount = await db('users').count('id as count').first();
        
        if (userCount.count === 0 || userCount.count === '0') {
            console.log('No users found in the database.');
            return;
        }
        
        console.log(`Found ${userCount.count} user(s) in the database.`);
        
        // Delete all user-related data
        // First, delete any analyses that might be linked to users
        console.log('Deleting user analyses...');
        await db('analyses').del();
        
        // Then delete the users
        console.log('Deleting user accounts...');
        await db('users').del();
        
        console.log('✅ Successfully deleted all users and their data.');
    } catch (error) {
        console.error('❌ Error clearing users:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await db.destroy();
    }
}

// Execute the function
clearAllUsers();