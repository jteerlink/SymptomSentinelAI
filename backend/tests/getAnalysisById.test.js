/**
 * Test for getAnalysisById Controller Function
 * 
 * This test suite verifies that the getAnalysisById controller function
 * correctly handles various scenarios when retrieving an analysis by its ID.
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Set up mocks before importing modules
const mockAnalysisFindById = jest.fn();
const mockUnauthorized = jest.fn();
const mockBadRequest = jest.fn();
const mockNotFound = jest.fn();
const mockForbidden = jest.fn();
const mockInternalError = jest.fn();

// Create mocks for modules
jest.mock('../models/Analysis', () => ({
  findById: mockAnalysisFindById
}));

// Set mock implementation for each test in beforeEach

jest.mock('../utils/apiError', () => ({
  unauthorized: mockUnauthorized,
  badRequest: mockBadRequest,
  notFound: mockNotFound,
  forbidden: mockForbidden,
  internalError: mockInternalError
}));

// Import controller function to test
const imageAnalysisController = require('../controllers/imageAnalysisController');

// Create error factory function to simplify error creation
const createApiError = (status) => (message, code) => {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  error.isApiError = true;
  error.toResponse = jest.fn().mockReturnValue({
    error: true,
    code,
    message,
    status
  });
  return error;
};

// Set up the mock implementations
mockUnauthorized.mockImplementation(createApiError(401));
mockBadRequest.mockImplementation(createApiError(400));
mockNotFound.mockImplementation(createApiError(404));
mockForbidden.mockImplementation(createApiError(403));
mockInternalError.mockImplementation(createApiError(500));

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
  // Set test timeout
  jest.setTimeout(10000);

  // Clear all mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Important: Reset mockAnalysisFindById for each test
    jest.resetAllMocks();
    
    // Set default mock implementation that captures both parameters
    mockAnalysisFindById.mockImplementation((id, userId = null) => {
      console.log(`Mock findById called with: id=${id}, userId=${userId}`);
      return Promise.resolve(null);
    });
    
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  // Clean up after all tests
  afterAll(async () => {
    // Add a small delay to let any pending operations finish
    await new Promise(resolve => setTimeout(resolve, 500));
  });
  
  test('should return 401 if user is not authenticated', async () => {
    // Setup
    const req = mockRequest({ id: '123' }, null);
    const res = mockResponse();
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(mockUnauthorized).toHaveBeenCalledWith(
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
    expect(mockBadRequest).toHaveBeenCalledWith(
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
    mockAnalysisFindById.mockResolvedValue(null);
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(mockAnalysisFindById).toHaveBeenCalledWith('analysis-123', 'user-123');
    expect(mockNotFound).toHaveBeenCalledWith(
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
    mockAnalysisFindById.mockResolvedValue({
      id: 'analysis-123',
      user_id: 'another-user',
      type: 'throat',
      conditions: []
    });
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(mockAnalysisFindById).toHaveBeenCalledWith('analysis-123', 'user-123');
    expect(mockForbidden).toHaveBeenCalledWith(
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
    mockAnalysisFindById.mockResolvedValue(mockAnalysis);
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(mockAnalysisFindById).toHaveBeenCalledWith('analysis-123', 'user-123');
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
    mockAnalysisFindById.mockRejectedValue(dbError);
    
    // Call the controller function
    await imageAnalysisController.getAnalysisById(req, res);
    
    // Assert
    expect(mockAnalysisFindById).toHaveBeenCalledWith('analysis-123', 'user-123');
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: true,
      code: expect.stringMatching(/ANALYSIS_RETRIEVAL_ERROR|SERVER_ERROR/)
    }));
  });
});