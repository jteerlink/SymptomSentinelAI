/**
 * Test the Symptom Assessment API
 * 
 * This script tests the symptom assessment functionality 
 * using a registered test user.
 */

// Use native fetch in Node.js (available in recent versions)
const apiUrl = 'http://localhost:5000/api';

// Define test symptoms
const throatSymptoms = [
    'Sore throat',
    'Fever',
    'Red, swollen tonsils',
    'White patches on tonsils',
    'Difficulty swallowing'
];

// Define test user credentials
const user = {
    email: 'testuser2@example.com',
    password: 'Test1234!'
};

async function testSymptomAssessment() {
    let token;
    
    try {
        // Step 1: Login to get authentication token
        console.log('Step 1: Logging in test user...');
        
        const loginResponse = await fetch(`${apiUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(user)
        });
        
        const loginData = await loginResponse.json();
        
        if (!loginResponse.ok) {
            throw new Error(`Login failed: ${loginData.message}`);
        }
        
        token = loginData.accessToken;
        console.log('✅ Login successful with token:', token.substring(0, 15) + '...');
        
        // Step 2: Test getting all available symptoms
        console.log('\nStep 2: Fetching available symptoms...');
        
        const symptomsResponse = await fetch(`${apiUrl}/symptoms`);
        const symptomsData = await symptomsResponse.json();
        
        if (!symptomsResponse.ok) {
            throw new Error(`Failed to fetch symptoms: ${symptomsData.message}`);
        }
        
        console.log(`✅ Successfully retrieved ${symptomsData.symptoms.length} symptoms`);
        console.log('Sample symptoms:', symptomsData.symptoms.slice(0, 5));
        
        // Step 3: Test getting throat conditions
        console.log('\nStep 3: Fetching throat conditions...');
        
        const conditionsResponse = await fetch(`${apiUrl}/conditions/throat`);
        const conditionsData = await conditionsResponse.json();
        
        if (!conditionsResponse.ok) {
            throw new Error(`Failed to fetch conditions: ${conditionsData.message}`);
        }
        
        console.log(`✅ Successfully retrieved ${conditionsData.conditions.length} throat conditions`);
        console.log('Condition names:', conditionsData.conditions.map(c => c.name));
        
        // Step 4: Test analyzing symptoms
        console.log('\nStep 4: Analyzing throat symptoms...');
        
        const analyzeResponse = await fetch(`${apiUrl}/analyze-symptoms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                type: 'throat',
                symptoms: throatSymptoms
            })
        });
        
        const analysisData = await analyzeResponse.json();
        
        if (!analyzeResponse.ok) {
            throw new Error(`Failed to analyze symptoms: ${analysisData.message}`);
        }
        
        console.log('✅ Symptom analysis successful');
        console.log('Analysis type:', analysisData.type);
        console.log('User symptoms:', analysisData.userSymptoms);
        console.log('Potential conditions:');
        
        // Print potential conditions with confidence levels
        analysisData.conditions.forEach(condition => {
            const confidencePercent = Math.round(condition.confidence * 100);
            console.log(`- ${condition.name} (${confidencePercent}% confidence)`);
            console.log(`  Matching symptoms: ${condition.matchingSymptoms.join(', ')}`);
        });
        
        // Get the analysis ID from the analysis data before saving
        const analysisId = analysisData.analysisId;
        console.log('Analysis ID from analysis response:', analysisId);
        
        // Step 5: Test saving the assessment
        console.log('\nStep 5: Saving symptom assessment...');
        
        const saveResponse = await fetch(`${apiUrl}/save-symptom-assessment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(analysisData)
        });
        
        const saveData = await saveResponse.json();
        
        if (!saveResponse.ok) {
            throw new Error(`Failed to save assessment: ${saveData.message}`);
        }
        
        console.log('✅ Assessment saved successfully');
        
        // Step 6: Test retrieving the saved assessment
        console.log('\nStep 6: Retrieving saved assessment...');
        
        const retrieveResponse = await fetch(`${apiUrl}/analysis/${analysisId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const retrieveData = await retrieveResponse.json();
        
        if (!retrieveResponse.ok) {
            throw new Error(`Failed to retrieve assessment: ${retrieveData.message}`);
        }
        
        console.log('✅ Successfully retrieved saved assessment');
        console.log('Analysis ID:', retrieveData.analysis.analysis_id);
        console.log('Type:', retrieveData.analysis.type);
        console.log('Created at:', retrieveData.analysis.created_at);
        console.log('Assessment type:', retrieveData.analysis.analysis_type);
        
        console.log('\n🎉 All tests completed successfully!');
    } catch (error) {
        console.error('❌ Error during tests:', error.message);
        process.exit(1);
    }
}

// Run the tests
testSymptomAssessment();