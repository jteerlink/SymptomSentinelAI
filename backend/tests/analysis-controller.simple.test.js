/**
 * Simple tests for the imageAnalysisController getAnalysisById function
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Create mocks
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

// Import the controller
const controller = require('../controllers/imageAnalysisController');

describe('getAnalysisById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console logs in tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should return 401 if user is not authenticated', async () => {
    // Setup request with no user
    const req = {
      params: { id: 'test-id' },
      user: null
    };
    
    // Setup mock response
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Call the controller method
    await controller.getAnalysisById(req, res);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'AUTH_REQUIRED'
    }));
  });
  
  test('should return 400 if analysis ID is missing', async () => {
    // Setup request with no ID
    const req = {
      params: {},
      user: { id: 'user-123' }
    };
    
    // Setup mock response
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Call the controller method
    await controller.getAnalysisById(req, res);
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'MISSING_ID'
    }));
  });
  
  test('should return 404 if analysis is not found', async () => {
    // Setup request
    const req = {
      params: { id: 'analysis-123' },
      user: { id: 'user-123' }
    };
    
    // Setup mock response
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Setup mock to return null (not found)
    mockAnalysis.findById.mockResolvedValue(null);
    
    // Call the controller method
    await controller.getAnalysisById(req, res);
    
    // Verify the right parameters were passed to findById
    expect(mockAnalysis.findById).toHaveBeenCalledWith('analysis-123', 'user-123');
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'ANALYSIS_NOT_FOUND'
    }));
  });
  
  test('should return 403 if analysis belongs to another user', async () => {
    // Setup request
    const req = {
      params: { id: 'analysis-123' },
      user: { id: 'user-123' }
    };
    
    // Setup mock response
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Setup mock to return analysis owned by a different user
    mockAnalysis.findById.mockResolvedValue({
      id: 'analysis-123',
      user_id: 'another-user', // Different from the requesting user
      type: 'throat',
      conditions: []
    });
    
    // Call the controller method
    await controller.getAnalysisById(req, res);
    
    // Verify the right parameters were passed to findById
    expect(mockAnalysis.findById).toHaveBeenCalledWith('analysis-123', 'user-123');
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'FORBIDDEN'
    }));
  });
  
  test('should return analysis if found and authorized', async () => {
    // Setup request
    const req = {
      params: { id: 'analysis-123' },
      user: { id: 'user-123' }
    };
    
    // Setup mock response
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Create mock analysis
    const analysisResult = {
      id: 'analysis-123',
      user_id: 'user-123', // Same as the requesting user
      type: 'throat',
      conditions: [
        {
          id: 'strep_throat',
          name: 'Strep Throat',
          confidence: 0.78
        }
      ]
    };
    
    // Setup mock to return a valid analysis
    mockAnalysis.findById.mockResolvedValue(analysisResult);
    
    // Call the controller method
    await controller.getAnalysisById(req, res);
    
    // Verify the right parameters were passed to findById
    expect(mockAnalysis.findById).toHaveBeenCalledWith('analysis-123', 'user-123');
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      analysis: analysisResult
    });
  });
  
  test('should handle database errors gracefully', async () => {
    // Setup request
    const req = {
      params: { id: 'analysis-123' },
      user: { id: 'user-123' }
    };
    
    // Setup mock response
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    // Setup mock to throw an error
    const dbError = new Error('Database error');
    mockAnalysis.findById.mockRejectedValue(dbError);
    
    // Call the controller method
    await controller.getAnalysisById(req, res);
    
    // Verify the right parameters were passed to findById
    expect(mockAnalysis.findById).toHaveBeenCalledWith('analysis-123', 'user-123');
    
    // Verify response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'ANALYSIS_RETRIEVAL_ERROR'
    }));
  });
});