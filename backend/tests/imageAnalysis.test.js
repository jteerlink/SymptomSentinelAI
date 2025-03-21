// Set test environment
process.env.NODE_ENV = 'test';

const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Mock the Analysis model
jest.mock('../db/models/Analysis', () => ({
  create: jest.fn().mockResolvedValue({
    id: '123e4567-e89b-12d3-a456-426614174111',
    type: 'throat',
    conditions: [
      {
        id: 'strep_throat',
        name: 'Strep Throat',
        confidence: 0.78,
      }
    ],
    created_at: new Date().toISOString()
  })
}));

// Mock the User model
jest.mock('../models/User', () => {
  // Mock subscription limits
  const SUBSCRIPTION_LIMITS = {
    free: {
      analysesPerMonth: 5,
      advancedFeatures: false,
      highResolutionDownload: false,
      detailedReports: false
    },
    premium: {
      analysesPerMonth: Infinity, // Unlimited analyses
      advancedFeatures: true,
      highResolutionDownload: true,
      detailedReports: true
    }
  };
  
  // Create a mock user object
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    subscription: 'premium',
    analysisCount: 3,
    lastResetDate: new Date().toISOString(),
    hasExceededAnalysisLimit: jest.fn().mockReturnValue(false),
    incrementAnalysisCount: jest.fn().mockReturnValue(4)
  };
  
  // Return mock class and properties
  return {
    SUBSCRIPTION_LIMITS,
    mockUser
  };
});

// Mock the auth middleware
jest.mock('../middleware/auth', () => {
  const User = require('../models/User');
  
  return {
    // Mock the authenticate middleware to always provide the mock user
    authenticate: (req, res, next) => {
      req.user = User.mockUser;
      next();
    },
    
    // Mock the optional authenticate middleware to do the same
    optionalAuthenticate: (req, res, next) => {
      req.user = User.mockUser;
      next();
    }
  };
});

const apiRoutes = require('../routes/api');

// Create test app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api', apiRoutes);

describe('Image Analysis API', () => {
    // Test valid analysis request
    test('should analyze an image successfully', async () => {
        const response = await request(app)
            .post('/api/analyze')
            .send({
                type: 'throat',
                image: 'data:image/jpeg;base64,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' 
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('type', 'throat');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('conditions');
        expect(Array.isArray(response.body.conditions)).toBe(true);
        
        // Verify the conditions have the detailed format
        const conditions = response.body.conditions;
        expect(conditions.length).toBeGreaterThan(0);
        
        // Check the first condition for required properties
        const firstCondition = conditions[0];
        expect(firstCondition).toHaveProperty('id');
        expect(firstCondition).toHaveProperty('name');
        expect(firstCondition).toHaveProperty('confidence');
        expect(firstCondition).toHaveProperty('description');
        expect(firstCondition).toHaveProperty('symptoms');
        expect(firstCondition).toHaveProperty('isPotentiallySerious');
    });

    // Test invalid type
    test('should reject analysis with invalid type', async () => {
        const response = await request(app)
            .post('/api/analyze')
            .send({
                type: 'invalid',
                image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBaRXhp...' 
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', true);
        expect(response.body.message).toContain('Invalid analysis type');
    });

    // Test missing image
    test('should reject analysis without an image', async () => {
        const response = await request(app)
            .post('/api/analyze')
            .send({
                type: 'throat'
            });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('error', true);
        expect(response.body.message).toContain('No image provided');
    });

    // Test saving analysis result
    test('should save analysis result', async () => {
        const analysisData = {
            id: '123e4567-e89b-12d3-a456-426614174111', // Valid UUID format
            type: 'throat',
            conditions: [
                {
                    id: 'strep_throat',
                    name: 'Strep Throat',
                    confidence: 0.78,
                    description: 'A bacterial infection that causes inflammation and pain in the throat.',
                    symptoms: [
                        'Throat pain',
                        'Red and swollen tonsils'
                    ],
                    isPotentiallySerious: true
                }
            ]
        };

        const response = await request(app)
            .post('/api/save-analysis')
            .send(analysisData);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Analysis saved successfully');
        expect(response.body).toHaveProperty('analysis');
        // ID will be generated by server, no need to check specific value
        expect(response.body.analysis).toHaveProperty('id');
        expect(response.body.analysis).toHaveProperty('type', 'throat');
        
        // Check for subscription info
        expect(response.body).toHaveProperty('subscription');
        expect(response.body.subscription).toHaveProperty('subscription', 'premium');
        expect(response.body.subscription).toHaveProperty('analysisCount');
        expect(response.body.subscription).toHaveProperty('analysisLimit');
        expect(response.body.subscription).toHaveProperty('analysisRemaining');
        expect(response.body.subscription).toHaveProperty('lastResetDate');
    });
});