/**
 * API Error utility class for standardized error handling
 * 
 * This class is used to create standardized error objects
 * that can be caught and processed by the API error middleware.
 */

class ApiError extends Error {
    /**
     * Create a new API error
     * 
     * @param {string} message - Error message
     * @param {number} status - HTTP status code
     * @param {string} code - Error code for client-side identification
     */
    constructor(message, status = 500, code = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code || this.getCodeFromStatus(status);
        this.isApiError = true;
    }

    /**
     * Get a default error code based on HTTP status
     * 
     * @param {number} status - HTTP status code
     * @returns {string} Error code
     */
    getCodeFromStatus(status) {
        switch (status) {
            case 400: return 'BAD_REQUEST';
            case 401: return 'UNAUTHORIZED';
            case 403: return 'FORBIDDEN';
            case 404: return 'NOT_FOUND';
            case 409: return 'CONFLICT';
            case 422: return 'VALIDATION_ERROR';
            case 429: return 'TOO_MANY_REQUESTS';
            default: return 'SERVER_ERROR';
        }
    }

    /**
     * Create a 400 Bad Request error
     * 
     * @param {string} message - Error message
     * @param {string} code - Optional custom error code
     * @returns {ApiError} 400 error instance
     */
    static badRequest(message, code = null) {
        return new ApiError(message, 400, code);
    }

    /**
     * Create a 401 Unauthorized error
     * 
     * @param {string} message - Error message
     * @param {string} code - Optional custom error code
     * @returns {ApiError} 401 error instance
     */
    static unauthorized(message = 'Authentication required', code = null) {
        return new ApiError(message, 401, code);
    }

    /**
     * Create a 403 Forbidden error
     * 
     * @param {string} message - Error message
     * @param {string} code - Optional custom error code
     * @returns {ApiError} 403 error instance
     */
    static forbidden(message = 'Permission denied', code = null) {
        return new ApiError(message, 403, code);
    }

    /**
     * Create a 404 Not Found error
     * 
     * @param {string} message - Error message
     * @param {string} code - Optional custom error code
     * @returns {ApiError} 404 error instance
     */
    static notFound(message = 'Resource not found', code = null) {
        return new ApiError(message, 404, code);
    }

    /**
     * Create a 409 Conflict error
     * 
     * @param {string} message - Error message
     * @param {string} code - Optional custom error code
     * @returns {ApiError} 409 error instance
     */
    static conflict(message, code = null) {
        return new ApiError(message, 409, code);
    }

    /**
     * Create a 422 Validation Error
     * 
     * @param {string} message - Error message
     * @param {string} code - Optional custom error code
     * @returns {ApiError} 422 error instance
     */
    static validationError(message, code = null) {
        return new ApiError(message, 422, code || 'VALIDATION_ERROR');
    }

    /**
     * Create a 429 Too Many Requests error
     * 
     * @param {string} message - Error message
     * @param {string} code - Optional custom error code
     * @returns {ApiError} 429 error instance
     */
    static tooManyRequests(message = 'Too many requests', code = null) {
        return new ApiError(message, 429, code);
    }

    /**
     * Create a 500 Server Error
     * 
     * @param {string} message - Error message
     * @param {string} code - Optional custom error code
     * @returns {ApiError} 500 error instance
     */
    static serverError(message = 'Internal server error', code = null) {
        return new ApiError(message, 500, code);
    }
}

module.exports = ApiError;