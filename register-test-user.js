/**
 * Register a test user using the API directly
 */

// Use the built-in fetch API
const fetch = globalThis.fetch;

async function registerTestUser() {
    const apiUrl = 'http://localhost:5000/api';
    
    try {
        // Register a new test user
        console.log('Registering test user...');
        
        const userData = {
            email: 'testuser2@example.com',
            password: 'Test1234!',
            name: 'Test User',
            termsAccepted: true
        };
        
        const registerResponse = await fetch(`${apiUrl}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const registerData = await registerResponse.json();
        
        if (!registerResponse.ok) {
            // If registration failed because user already exists, try logging in
            if (registerData.message && registerData.message.includes('already exists')) {
                console.log('User already exists, trying to log in...');
                return await loginTestUser();
            } else {
                console.error('Registration failed:', registerData.message);
                throw new Error(`Registration failed: ${registerData.message}`);
            }
        }
        
        console.log('Registration successful!');
        console.log('Auth token:', registerData.token);
        
        return {
            token: registerData.token,
            user: registerData.user
        };
    } catch (error) {
        console.error('Error during registration:', error.message);
        throw error;
    }
}

async function loginTestUser() {
    const apiUrl = 'http://localhost:5000/api';
    
    try {
        // Login with test user
        console.log('Logging in test user...');
        
        const loginResponse = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'testuser2@example.com',
                password: 'Test1234!'
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
            console.error('Login failed:', loginData.message);
            throw new Error(`Login failed: ${loginData.message}`);
        }
        
        console.log('Login successful!');
        console.log('Auth token:', loginData.token);
        
        return {
            token: loginData.token,
            user: loginData.user
        };
    } catch (error) {
        console.error('Error during login:', error.message);
        throw error;
    }
}

// Run the registration/login process
registerTestUser().catch(err => {
    console.error('Failed to register/login test user:', err);
    process.exit(1);
});