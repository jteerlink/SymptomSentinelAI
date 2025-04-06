/**
 * API Error Utility
 * 
 * This utility provides a consistent way to create and throw API errors
 * with standardized formats throughout the application.
 */

class ApiError extends Error {
    /**
     * Create a new API error
     * 
     * @param {string} message - Human-readable error message
     * @param {string} code - Error code for client-side error handling
     * @param {number} status - HTTP status code
     * @param {Object} details - Additional error details (only sent in development)
     */
    constructor(message, code = 'SERVER_ERROR', status = 500, details = {}) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
        this.status = status;
        this.details = details;
        this.isApiError = true;
    }

    /**
     * Convert the error to a JSON response object
     * 
     * @param {boolean} includeDetails - Whether to include detailed error information
     * @returns {Object} Error response object
     */
    toResponse(includeDetails = process.env.NODE_ENV === 'development') {
        const response = {
            error: true,
            success: false,
            message: this.message,
            code: this.code
        };

        if (includeDetails) {
            response.details = this.details;
        }

        return response;
    }

    /**
     * Static helper methods for common error types
     */

    static badRequest(message, code = 'BAD_REQUEST', details = {}) {
        return new ApiError(message, code, 400, details);
    }

    static unauthorized(message = 'Authentication required', code = 'UNAUTHORIZED', details = {}) {
        return new ApiError(message, code, 401, details);
    }

    static forbidden(message = 'Permission denied', code = 'FORBIDDEN', details = {}) {
        return new ApiError(message, code, 403, details);
    }

    static notFound(message = 'Resource not found', code = 'NOT_FOUND', details = {}) {
        return new ApiError(message, code, 404, details);
    }

    static validationError(message = 'Validation failed', errors = {}, code = 'VALIDATION_ERROR') {
        return new ApiError(message, code, 400, { validationErrors: errors });
    }

    static conflict(message = 'Resource conflict', code = 'CONFLICT', details = {}) {
        return new ApiError(message, code, 409, details);
    }

    static tooManyRequests(message = 'Rate limit exceeded', code = 'RATE_LIMIT', details = {}) {
        return new ApiError(message, code, 429, details);
    }

    static analysisLimitExceeded(message = 'Monthly analysis limit reached', details = {}) {
        return new ApiError(message, 'ANALYSIS_LIMIT_EXCEEDED', 429, details);
    }

    static internalError(message = 'Internal server error', code = 'SERVER_ERROR', details = {}) {
        return new ApiError(message, code, 500, details);
    }

    static invalidImage(message = 'Invalid image format or content', details = {}) {
        return new ApiError(message, 'INVALID_IMAGE_FORMAT', 400, details);
    }

    static invalidModel(message = 'Invalid or unsupported analysis model', details = {}) {
        return new ApiError(message, 'INVALID_MODEL_TYPE', 400, details);
    }
}

module.exports = ApiError;