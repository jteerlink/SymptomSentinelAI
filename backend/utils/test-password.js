/**
 * Password Verification Test Utility
 * 
 * This script tests bcrypt password verification with a known password and hash.
 * It helps diagnose issues with the password verification logic.
 */

const bcrypt = require('bcryptjs');
const { User } = require('../db/models');

// Known password we're trying to verify
const plainPassword = 'password123';

// Test with different algorithms
async function testVerification() {
  try {
    // First get the user from the database
    const user = await User.findByEmail('jt@test.com');
    if (!user) {
      console.error('User not found');
      return;
    }

    console.log('User found:', {
      id: user.id,
      email: user.email,
      name: user.name
    });
    
    console.log('Stored password hash:', user.password);
    console.log('Hash type: $2b$ indicates bcrypt with cost factor 10');
    
    // Generate a new hash for comparison
    const newHash = await bcrypt.hash(plainPassword, 10);
    console.log('Fresh hash of same password:', newHash);
    
    // Test both with bcrypt directly and with our User method
    console.log('\n--- Testing with bcrypt directly ---');
    const bcryptResult = await bcrypt.compare(plainPassword, user.password);
    console.log('bcrypt.compare result:', bcryptResult);
    
    console.log('\n--- Testing with User.verifyPassword ---');
    const userVerifyResult = await User.verifyPassword(plainPassword, user.password);
    console.log('User.verifyPassword result:', userVerifyResult);
    
    // Test with the test user that works for comparison
    console.log('\n--- Testing with known working user ---');
    const workingUser = await User.findByEmail('test@example.com');
    if (workingUser) {
      console.log('Working user hash:', workingUser.password);
      const workingUserResult = await bcrypt.compare(plainPassword, workingUser.password);
      console.log('bcrypt.compare result with working user:', workingUserResult);
    }
    
    // Create a fresh hash and verify it to ensure bcrypt is working correctly
    console.log('\n--- Testing with fresh hash ---');
    const freshHash = await bcrypt.hash(plainPassword, 10);
    const freshVerify = await bcrypt.compare(plainPassword, freshHash);
    console.log('Fresh hash verification result:', freshVerify);
    
  } catch (error) {
    console.error('Error during password verification test:', error);
  }
}

console.log('='.repeat(50));
console.log('PASSWORD VERIFICATION DIAGNOSTIC');
console.log('='.repeat(50));
console.log(`Testing password verification with: ${plainPassword}`);
console.log('='.repeat(50));

// Connect to database and run tests
testVerification().then(() => {
  console.log('\nTest complete.');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});