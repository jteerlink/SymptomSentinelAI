/**
 * Symptom Assessment API Tests
 * 
 * This test file verifies the functionality of the manual symptom entry
 * and assessment API endpoints.
 */

const request = require('supertest');
const app = require('../server');
const knex = require('../db/knex');

// Setup test variables
let testUserToken = null;
let testUserId = null;
let savedAnalysisId = null;

// Test data
const testUser = {
    email: 'testuser2@example.com',
    password: 'Test1234!',
    name: 'Test User'
};

const throatSymptoms = [
    'Sore throat',
    'Fever',
    'Red, swollen tonsils',
    'White patches on tonsils',
    'Difficulty swallowing'
];

const earSymptoms = [
    'Ear pain',
    'Drainage of fluid from the ear',
    'Difficulty hearing',
    'Dizziness',
    'Fever'
];

// Test suite
describe('Symptom Assessment API', () => {
    // Before all tests, set up the test environment
    beforeAll(async () => {
        // Log in the test user to get a token
        const loginResponse = await request(app)
            .post('/api/login')
            .send({
                email: testUser.email,
                password: testUser.password
            });
        
        // Store the token and user ID for use in subsequent tests
        if (loginResponse.status === 200) {
            testUserToken = loginResponse.body.accessToken;
            testUserId = loginResponse.body.user.id;
            console.log('Test user logged in successfully');
        } else {
            console.error('Failed to log in test user:', loginResponse.body);
            throw new Error('Test setup failed: Unable to log in test user');
        }
    });
    
    // After all tests, clean up the test environment
    afterAll(async () => {
        // Delete any analysis records created during tests
        if (savedAnalysisId) {
            try {
                await request(app)
                    .delete(`/api/analysis/${savedAnalysisId}`)
                    .set('Authorization', `Bearer ${testUserToken}`);
                
                console.log('Test analysis record deleted');
            } catch (error) {
                console.error('Error cleaning up test data:', error);
            }
        }
    });
    
    describe('GET /api/conditions/:type', () => {
        it('should return throat conditions when type is throat', async () => {
            const response = await request(app)
                .get('/api/conditions/throat');
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.conditions)).toBe(true);
            expect(response.body.conditions.length).toBeGreaterThan(0);
            
            // Verify condition structure
            const condition = response.body.conditions[0];
            expect(condition).toHaveProperty('id');
            expect(condition).toHaveProperty('name');
            expect(condition).toHaveProperty('description');
            expect(condition).toHaveProperty('symptoms');
            expect(condition).toHaveProperty('treatmentOptions');
            expect(condition).toHaveProperty('prevention');
        });
        
        it('should return ear conditions when type is ear', async () => {
            const response = await request(app)
                .get('/api/conditions/ear');
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.conditions)).toBe(true);
            expect(response.body.conditions.length).toBeGreaterThan(0);
            
            // Verify condition structure
            const condition = response.body.conditions[0];
            expect(condition).toHaveProperty('id');
            expect(condition).toHaveProperty('name');
            expect(condition).toHaveProperty('symptoms');
        });
        
        it('should return 400 Bad Request for invalid condition type', async () => {
            const response = await request(app)
                .get('/api/conditions/invalid-type');
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Invalid condition type');
        });
    });
    
    describe('GET /api/symptoms', () => {
        it('should return a list of all unique symptoms', async () => {
            const response = await request(app)
                .get('/api/symptoms');
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.symptoms)).toBe(true);
            expect(response.body.symptoms.length).toBeGreaterThan(0);
            
            // Verify the symptoms are strings
            expect(typeof response.body.symptoms[0]).toBe('string');
            
            // Check for common symptoms that should be present
            const symptomSet = new Set(response.body.symptoms);
            expect(symptomSet.has('Fever')).toBe(true);
            expect(symptomSet.has('Sore throat')).toBe(true);
            expect(symptomSet.has('Ear pain')).toBe(true);
        });
    });
    
    describe('POST /api/analyze-symptoms', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/analyze-symptoms')
                .send({
                    type: 'throat',
                    symptoms: throatSymptoms
                });
            
            expect(response.status).toBe(401);
        });
        
        it('should analyze throat symptoms and return potential conditions', async () => {
            const response = await request(app)
                .post('/api/analyze-symptoms')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    type: 'throat',
                    symptoms: throatSymptoms
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.type).toBe('throat');
            expect(Array.isArray(response.body.userSymptoms)).toBe(true);
            expect(response.body.userSymptoms).toEqual(throatSymptoms);
            expect(Array.isArray(response.body.conditions)).toBe(true);
            expect(response.body.conditions.length).toBeGreaterThan(0);
            
            // Verify condition structure
            const condition = response.body.conditions[0];
            expect(condition).toHaveProperty('id');
            expect(condition).toHaveProperty('name');
            expect(condition).toHaveProperty('confidence');
            expect(condition).toHaveProperty('matchingSymptoms');
            expect(Array.isArray(condition.matchingSymptoms)).toBe(true);
            
            // Conditions should be sorted by confidence (highest first)
            for (let i = 0; i < response.body.conditions.length - 1; i++) {
                expect(response.body.conditions[i].confidence).toBeGreaterThanOrEqual(
                    response.body.conditions[i + 1].confidence
                );
            }
        });
        
        it('should analyze ear symptoms and return potential conditions', async () => {
            const response = await request(app)
                .post('/api/analyze-symptoms')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    type: 'ear',
                    symptoms: earSymptoms
                });
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.type).toBe('ear');
            expect(Array.isArray(response.body.userSymptoms)).toBe(true);
            expect(response.body.userSymptoms).toEqual(earSymptoms);
            expect(Array.isArray(response.body.conditions)).toBe(true);
            expect(response.body.conditions.length).toBeGreaterThan(0);
        });
        
        it('should return 400 Bad Request when type is missing', async () => {
            const response = await request(app)
                .post('/api/analyze-symptoms')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    symptoms: throatSymptoms
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
        
        it('should return 400 Bad Request when symptoms are missing', async () => {
            const response = await request(app)
                .post('/api/analyze-symptoms')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    type: 'throat'
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
        
        it('should return 400 Bad Request when type is invalid', async () => {
            const response = await request(app)
                .post('/api/analyze-symptoms')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    type: 'invalid-type',
                    symptoms: throatSymptoms
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
    
    describe('POST /api/save-symptom-assessment', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/save-symptom-assessment')
                .send({
                    type: 'throat',
                    userSymptoms: throatSymptoms,
                    conditions: [
                        {
                            id: 'strep-throat',
                            name: 'Strep Throat',
                            confidence: 0.85
                        }
                    ]
                });
            
            expect(response.status).toBe(401);
        });
        
        it('should save a valid symptom assessment', async () => {
            // First, get a valid analysis result
            const analysisResponse = await request(app)
                .post('/api/analyze-symptoms')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    type: 'throat',
                    symptoms: throatSymptoms
                });
            
            expect(analysisResponse.status).toBe(200);
            
            // Now save the analysis result
            const saveResponse = await request(app)
                .post('/api/save-symptom-assessment')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send(analysisResponse.body);
            
            expect(saveResponse.status).toBe(201);
            expect(saveResponse.body.success).toBe(true);
            expect(saveResponse.body.message).toContain('saved successfully');
            expect(saveResponse.body.analysisId).toBeDefined();
            
            // Save the analysis ID for cleanup in afterAll
            savedAnalysisId = saveResponse.body.analysisId;
        });
        
        it('should return 400 Bad Request when required fields are missing', async () => {
            const response = await request(app)
                .post('/api/save-symptom-assessment')
                .set('Authorization', `Bearer ${testUserToken}`)
                .send({
                    // Missing required fields
                    timestamp: new Date().toISOString()
                });
            
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });
    
    describe('GET /api/analysis/:id', () => {
        it('should retrieve a saved symptom assessment by ID', async () => {
            // Ensure we have a saved analysis ID
            expect(savedAnalysisId).toBeDefined();
            
            const response = await request(app)
                .get(`/api/analysis/${savedAnalysisId}`)
                .set('Authorization', `Bearer ${testUserToken}`);
            
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.analysis).toBeDefined();
            expect(response.body.analysis.analysis_id).toBe(savedAnalysisId);
            expect(response.body.analysis.analysis_type).toBe('symptom-assessment');
            expect(response.body.analysis.type).toBe('throat');
            expect(response.body.analysis.data).toBeDefined();
            expect(Array.isArray(response.body.analysis.data.userSymptoms)).toBe(true);
            expect(Array.isArray(response.body.analysis.data.conditions)).toBe(true);
        });
    });
});