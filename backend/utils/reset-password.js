/**
 * User Password Reset Utility
 * 
 * Use this script to reset a user's password in the database.
 * This is useful for administrative purposes or for recovering accounts
 * when a user has forgotten their password.
 * 
 * Usage: node reset-password.js <email> <new_password>
 */

const bcrypt = require('bcryptjs');
const { User } = require('../db/models');

// Get email and password from command line arguments
const args = process.argv.slice(2);
const userEmail = args[0] || 'jt@test.com';
const newPassword = args[1] || 'password123';

async function resetPassword() {
    try {
        console.log(`Finding user with email: ${userEmail}`);
        
        // Find the user
        const user = await User.findByEmail(userEmail);
        if (!user) {
            console.error(`User with email ${userEmail} not found`);
            process.exit(1);
        }
        
        console.log(`User found: ${user.name} (${user.email})`);
        console.log('Current password hash:', user.password);
        
        // Update via direct database query to ensure we know exactly what's happening
        const db = require('../db/db');
        
        // Generate hash for new password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        console.log('New password hash generated:', passwordHash);
        
        // Update user's password directly in the database
        const updated = await db('users')
            .where({ id: user.id })
            .update({ password: passwordHash, updated_at: db.fn.now() });
        
        console.log(`Password updated successfully (rows affected: ${updated})`);
        
        // Verify the new password
        const updatedUser = await User.findByEmail(userEmail);
        console.log('Updated user password hash:', updatedUser.password);
        
        const isVerified = await User.verifyPassword(newPassword, updatedUser.password);
        console.log(`Password verification test: ${isVerified ? 'SUCCESS' : 'FAILED'}`);
        
        // Try direct bcrypt comparison
        const bcryptResult = await bcrypt.compare(newPassword, updatedUser.password);
        console.log(`Direct bcrypt verification: ${bcryptResult ? 'SUCCESS' : 'FAILED'}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
}

console.log('='.repeat(50));
console.log('PASSWORD RESET UTILITY');
console.log('='.repeat(50));
console.log(`Resetting password for user: ${userEmail}`);
console.log(`New password will be: ${newPassword}`);
console.log('='.repeat(50));

resetPassword();