/**
 * User Password Reset Utility
 * 
 * Use this script to reset a user's password in the database.
 * This is useful for administrative purposes or for recovering accounts
 * when a user has forgotten their password.
 */

const { User } = require('../db/models');
const bcrypt = require('bcryptjs');

// Configuration
const email = 'jt@test.com'; // The email of the user to reset
const newPassword = 'password123'; // The new password to set

async function resetPassword() {
  try {
    console.log(`Looking for user with email: ${email}`);
    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }
    
    console.log(`Found user: ${user.id}, ${user.email}, ${user.name}`);
    
    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updateData = { password: hashedPassword };
    
    // Update in the database directly
    const updatedUser = await User.update(user.id, updateData);
    
    console.log(`Password successfully reset for user: ${user.email}`);
    console.log(`Updated user data: ${JSON.stringify({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      subscription: updatedUser.subscription
    }, null, 2)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

console.log('='.repeat(50));
console.log('PASSWORD RESET UTILITY');
console.log('='.repeat(50));
console.log(`Preparing to reset password for: ${email}`);
console.log('='.repeat(50));

resetPassword();