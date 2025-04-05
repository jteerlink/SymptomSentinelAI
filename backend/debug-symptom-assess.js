/**
 * Debug Symptom Assessment
 * 
 * This script manually tests the Analysis model's ability to save and retrieve symptom assessments
 */
const Analysis = require('./db/models/Analysis');
const { v4: uuidv4 } = require('uuid');

async function testSaveAndRetrieve() {
    try {
        console.log('Testing Analysis model functions for symptom assessment...\n');
        
        // Create a test user ID (must be a valid UUID for the database)
        const userId = uuidv4();
        
        // Create a test analysis ID
        const analysisId = uuidv4();
        console.log(`Generated analysis ID: ${analysisId}`);
        
        // Create test symptoms
        const userSymptoms = ['Sore throat', 'Fever', 'Red, swollen tonsils'];
        
        // Create test conditions
        const conditions = [
            {
                name: 'Tonsillitis',
                confidence: 0.37,
                matchingSymptoms: ['Sore throat', 'Red, swollen tonsils', 'Fever'],
                description: 'Inflammation of the tonsils, typically caused by viral or bacterial infection.'
            },
            {
                name: 'Strep Throat',
                confidence: 0.12,
                matchingSymptoms: ['Fever'],
                description: 'Bacterial infection causing inflammation and pain in the throat.'
            }
        ];
        
        // Test data for saving
        const assessmentData = {
            userSymptoms,
            conditions,
            timestamp: new Date().toISOString(),
            analysisType: 'symptom-assessment'
        };
        
        console.log('\nStep 1: Saving analysis with symptom assessment data...');
        const savedAnalysis = await Analysis.create({
            id: analysisId,
            userId: userId,
            type: 'throat',
            conditions: assessmentData,
            imageUrl: null
        });
        
        console.log('✅ Analysis saved successfully');
        console.log('Saved analysis ID:', savedAnalysis.id);
        console.log('User ID:', savedAnalysis.user_id);
        
        console.log('\nStep 2: Retrieving analysis by ID...');
        const retrievedAnalysis = await Analysis.findById(analysisId);
        
        if (!retrievedAnalysis) {
            throw new Error(`Analysis with ID ${analysisId} not found`);
        }
        
        console.log('✅ Analysis retrieved successfully');
        console.log('Retrieved analysis ID:', retrievedAnalysis.id);
        console.log('User ID:', retrievedAnalysis.user_id);
        console.log('Type:', retrievedAnalysis.type);
        
        // Check if conditions were properly parsed
        if (typeof retrievedAnalysis.conditions === 'object') {
            console.log('\nConditions data correctly parsed as object');
            console.log('Analysis type:', retrievedAnalysis.conditions.analysisType);
            console.log('User symptoms:', retrievedAnalysis.conditions.userSymptoms);
            console.log('Conditions count:', retrievedAnalysis.conditions.conditions.length);
            console.log('Top condition:', retrievedAnalysis.conditions.conditions[0].name);
        } else {
            console.log('⚠️ Conditions not parsed correctly:', typeof retrievedAnalysis.conditions);
            console.log(retrievedAnalysis.conditions);
        }
        
        console.log('\nStep 3: Cleaning up test data...');
        const deleteResult = await Analysis.delete(analysisId);
        console.log('Delete result:', deleteResult);
        
        console.log('\n🎉 All tests completed successfully!');
    } catch (error) {
        console.error('❌ Error during tests:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        // Disconnect from database to allow process to exit
        process.exit(0);
    }
}

// Run the tests
testSaveAndRetrieve();