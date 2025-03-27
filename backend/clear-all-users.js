/**
 * Clear All Users Script
 * 
 * This script clears all users from the database.
 * USE WITH CAUTION! This is destructive and will delete all user accounts.
 * 
 * Usage: 
 * node clear-all-users.js
 */

require('dotenv').config();
const db = require('./db/db');

async function clearAllUsers() {
    console.log('\x1b[31m⚠️ WARNING: This will delete ALL user accounts from the database!\x1b[0m');
    console.log('----------------------------------------');
    
    try {
        // Get count of users before deletion
        const userCount = await db('users').count('id as count').first();
        
        if (userCount.count === 0 || userCount.count === '0') {
            console.log('No users found in the database.');
            return;
        }
        
        console.log(`Found ${userCount.count} user(s) in the database.`);
        
        // Get input from command line argument or environment
        const forceDelete = process.argv.includes('--force') || process.env.FORCE_DELETE === 'true';
        
        if (!forceDelete) {
            // Only use readline if not forced
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });
            
            const answer = await new Promise(resolve => {
                readline.question('\x1b[33mType "DELETE" to confirm deletion of all users: \x1b[0m', resolve);
            });
            
            readline.close();
            
            if (answer !== 'DELETE') {
                console.log('Operation cancelled.');
                return;
            }
        }
        
        // Delete all user-related data
        // First, delete any analyses that might be linked to users
        console.log('Deleting user analyses...');
        await db('analyses').del();
        
        // Then delete the users
        console.log('Deleting user accounts...');
        const deletedCount = await db('users').del();
        
        console.log(`\x1b[32m✅ Successfully deleted ${deletedCount} users and their data.\x1b[0m`);
    } catch (error) {
        console.error('\x1b[31m❌ Error clearing users:\x1b[0m', error);
        process.exit(1);
    } finally {
        // Close database connection
        await db.destroy();
    }
}

// Execute the function
clearAllUsers();