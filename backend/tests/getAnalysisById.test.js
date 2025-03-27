/**
 * Test for getAnalysisById Controller Function
 * 
 * This test suite verifies that the getAnalysisById controller function
 * correctly handles various scenarios when retrieving an analysis by its ID.
 */

// Import controller function to test
const imageAnalysisController = require('../controllers/imageAnalysisController');

// Mock dependencies and modules
jest.mock('../models/Analysis');
jest.mock('../utils/apiError');

// Import mocked dependencies
const Analysis = require('../models/Analysis');
const ApiError = require('../utils/apiError');

// Mock error functions
ApiError.unauthorized = jest.fn().mockImplementation((message, code) => {
  const error = new Error(message);
  error.code = code;
  error.status = 401;
  error.isApiError = true;
  error.toResponse = jest.fn().mockReturnValue({
    error: true,
    code,
    message,
    status: 401
  });
  return error;
});

ApiError.badRequest = jest.fn().mockImplementation((message, code) => {
  const error = new Error(message);
  error.code = code;
  error.status = 400;
  error.isApiError = true;
  error.toResponse = jest.fn().mockReturnValue({
    error: true,
    code,
    message,
    status: 400
  });
  return error;
});

ApiError.notFound = jest.fn().mockImplementation((message, code) => {
  const error = new Error(message);
  error.code = code;
  error.status = 404;
  error.isApiError = true;
  error.toResponse = jest.fn().mockReturnValue({
    error: true,
    code,
    message,
    status: 404
  });
  return error;
});

ApiError.forbidden = jest.fn().mockImplementation((message, code) => {
  const error = new Error(message);
  error.code = code;
  error.status = 403;
  error.isApiError = true;
  error.toResponse = jest.fn().mockReturnValue({
    error: true,
    code,
    message,
    status: 403
  });
  return error;
});

ApiError.internalError = jest.fn().mockImplementation((message, code) => {
  const error = new Error(message);
  error.code = code;
  error.status = 500;
  error.isApiError = true;
  error.toResponse = jest.fn().mockReturnValue({
    error: true,
    code,
    message,
    status: 500
  });
  return error;
});

// Helper functions to create mock request and response objects
const mockRequest = (params = {}, user = null) => ({
  params,
  user
});

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('getAnalysisById Controller', () => {
  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  test('should return 401 if user is not authenticated', async () => {
    // Setup
    const req = mockRequest({ id: '123' }, null);
    const res = mockResponse();
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(ApiError.unauthorized).toHaveBeenCalledWith(
      'Authentication required to view analysis',
      'AUTH_REQUIRED'
    );
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'AUTH_REQUIRED'
    }));
  });
  
  test('should return 400 if analysis ID is missing', async () => {
    // Setup
    const req = mockRequest({}, { id: 'user-123' });
    const res = mockResponse();
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(ApiError.badRequest).toHaveBeenCalledWith(
      'Analysis ID is required',
      'MISSING_ID'
    );
    
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'MISSING_ID'
    }));
  });
  
  test('should return 404 if analysis is not found', async () => {
    // Setup
    const req = mockRequest({ id: 'analysis-123' }, { id: 'user-123' });
    const res = mockResponse();
    
    // Mock Analysis.findById to return null (not found)
    Analysis.findById.mockResolvedValue(null);
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(Analysis.findById).toHaveBeenCalledWith('analysis-123', 'user-123');
    expect(ApiError.notFound).toHaveBeenCalledWith(
      'Analysis not found',
      'ANALYSIS_NOT_FOUND'
    );
    
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'ANALYSIS_NOT_FOUND'
    }));
  });
  
  test('should return 403 if analysis belongs to another user', async () => {
    // Setup
    const req = mockRequest({ id: 'analysis-123' }, { id: 'user-123' });
    const res = mockResponse();
    
    // Mock Analysis.findById to return an analysis belonging to another user
    Analysis.findById.mockResolvedValue({
      id: 'analysis-123',
      user_id: 'another-user',
      type: 'throat',
      conditions: []
    });
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(Analysis.findById).toHaveBeenCalledWith('analysis-123', 'user-123');
    expect(ApiError.forbidden).toHaveBeenCalledWith(
      'You do not have permission to view this analysis',
      'FORBIDDEN'
    );
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: 'FORBIDDEN'
    }));
  });
  
  test('should return analysis if found and authorized', async () => {
    // Setup
    const req = mockRequest({ id: 'analysis-123' }, { id: 'user-123' });
    const res = mockResponse();
    
    // Mock Analysis.findById to return a valid analysis
    const mockAnalysis = {
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
    Analysis.findById.mockResolvedValue(mockAnalysis);
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(Analysis.findById).toHaveBeenCalledWith('analysis-123', 'user-123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      analysis: mockAnalysis
    });
  });
  
  test('should handle database errors gracefully', async () => {
    // Setup
    const req = mockRequest({ id: 'analysis-123' }, { id: 'user-123' });
    const res = mockResponse();
    
    // Mock Analysis.findById to throw an error
    const dbError = new Error('Database error');
    Analysis.findById.mockRejectedValue(dbError);
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(Analysis.findById).toHaveBeenCalledWith('analysis-123', 'user-123');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: expect.stringMatching(/ANALYSIS_RETRIEVAL_ERROR|SERVER_ERROR/)
    }));
  });
});