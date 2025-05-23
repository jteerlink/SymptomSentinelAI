/**
 * Test for getAnalysisById Controller Function
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Create mock for Analysis model
const mockAnalysis = {
  findById: jest.fn()
};

// Create a mock for the database models
const mockModels = {
  User: {},
  Analysis: mockAnalysis
};

// Mock the db/models/index module
jest.mock('../db/models/index', () => mockModels);

// Import the controller after mocking dependencies
const imageAnalysisController = require('../controllers/imageAnalysisController');

describe('getAnalysisById Controller', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();
    
    // Suppress console logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  test('should return 401 if user is not authenticated', async () => {
    // Setup
    const req = {
      params: { id: 'test-id' },
      user: null
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Execute
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'AUTH_REQUIRED'
    }));
  });
  
  test('should return 400 if analysis ID is missing', async () => {
    // Setup
    const req = {
      params: {},
      user: { id: 'user-123' }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Execute
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'MISSING_ID'
    }));
  });
  
  test('should return 404 if analysis is not found', async () => {
    // Setup
    const req = {
      params: { id: 'analysis-123' },
      user: { id: 'user-123' }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock findById to return null (not found)
    mockAnalysis.findById.mockResolvedValue(null);
    
    // Execute
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(mockAnalysis.findById).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'ANALYSIS_NOT_FOUND'
    }));
  });
  
  test('should return 403 if analysis belongs to another user', async () => {
    // Setup
    const req = {
      params: { id: 'analysis-123' },
      user: { id: 'user-123' }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock findById to return an analysis belonging to another user
    mockAnalysis.findById.mockResolvedValue({
      id: 'analysis-123',
      user_id: 'another-user',
      type: 'throat',
      conditions: []
    });
    
    // Execute
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(mockAnalysis.findById).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'FORBIDDEN'
    }));
  });
  
  test('should return analysis if found and authorized', async () => {
    // Setup
    const req = {
      params: { id: 'analysis-123' },
      user: { id: 'user-123' }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Create mock analysis result
    const analysisResult = {
      id: 'analysis-123',
      user_id: 'user-123', 
      type: 'throat',
      conditions: [
        {
          id: 'strep_throat',
          name: 'Strep Throat',
          confidence: 0.78
        }
      ]
    };
    
    // Mock findById to return the analysis
    mockAnalysis.findById.mockResolvedValue(analysisResult);
    
    // Execute
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(mockAnalysis.findById).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      analysis: analysisResult
    });
  });
  
  test('should handle database errors gracefully', async () => {
    // Setup
    const req = {
      params: { id: 'analysis-123' },
      user: { id: 'user-123' }
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Mock findById to throw an error
    const dbError = new Error('Database error');
    mockAnalysis.findById.mockRejectedValue(dbError);
    
    // Execute
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(mockAnalysis.findById).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'ANALYSIS_RETRIEVAL_ERROR'
    }));
  });
});