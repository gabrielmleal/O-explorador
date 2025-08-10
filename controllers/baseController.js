// Base controller with common functionality
class BaseController {
    constructor() {
        this.name = this.constructor.name;
    }

    // Common error handling
    handleError(res, error, message = 'An error occurred') {
        console.error(`${this.name} Error:`, error);
        res.status(500).json({
            success: false,
            message: message,
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }

    // Common success response
    sendSuccess(res, data = null, message = 'Success') {
        res.status(200).json({
            success: true,
            message: message,
            data: data
        });
    }

    // Common validation error response
    sendValidationError(res, errors) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors
        });
    }

    // Common not found response
    sendNotFound(res, message = 'Resource not found') {
        res.status(404).json({
            success: false,
            message: message
        });
    }

    // Common unauthorized response
    sendUnauthorized(res, message = 'Unauthorized access') {
        res.status(401).json({
            success: false,
            message: message
        });
    }
}

module.exports = BaseController;