/**
 * Error handling utilities
 *
 * Consistent error responses across the API
 */

export enum ErrorCode {
    // 4xx Client Errors
    BAD_REQUEST = 'BAD_REQUEST',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

    // Database Errors
    DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
    INVALID_REFERENCE = 'INVALID_REFERENCE',
    REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
    INVALID_DATA = 'INVALID_DATA',

    // 5xx Server Errors
    INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export class AppError extends Error {
    constructor(
        public code: ErrorCode,
        public statusCode: number,
        message: string,
        public details?: Record<string, unknown>,
    ) {
        super(message);

        this.name = 'AppError';

        Object.setPrototypeOf(this, new.target.prototype);
    }
}

/**
 * Validation error - 400
 */
export class ValidationError extends AppError {
    constructor(
        message = 'Validation failed',
        details?: Record<string, unknown>,
    ) {
        super(
            ErrorCode.VALIDATION_ERROR,
            400,
            message,
            details,
        );

        this.name = 'ValidationError';
    }
}

/**
 * Bad request - 400
 */
export class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(
            ErrorCode.BAD_REQUEST,
            400,
            message,
        );

        this.name = 'BadRequestError';
    }
}

/**
 * Not found - 404
 */
export class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(
            ErrorCode.NOT_FOUND,
            404,
            message,
        );

        this.name = 'NotFoundError';
    }
}

/**
 * Conflict - 409
 */
export class ConflictError extends AppError {
    constructor(
        message = 'Resource already exists',
        details?: Record<string, unknown>,
    ) {
        super(
            ErrorCode.CONFLICT,
            409,
            message,
            details,
        );

        this.name = 'ConflictError';
    }
}

/**
 * Duplicate database entry - 409
 */
export class DuplicateEntryError extends AppError {
    constructor(
        message = 'A record with this value already exists',
        details?: Record<string, unknown>,
    ) {
        super(
            ErrorCode.DUPLICATE_ENTRY,
            409,
            message,
            details,
        );

        this.name = 'DuplicateEntryError';
    }
}

/**
 * Invalid relation/reference - 400
 */
export class InvalidReferenceError extends AppError {
    constructor(
        message = 'Referenced record does not exist',
        details?: Record<string, unknown>,
    ) {
        super(
            ErrorCode.INVALID_REFERENCE,
            400,
            message,
            details,
        );

        this.name = 'InvalidReferenceError';
    }
}

/**
 * Unauthorized - 401
 */
export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(
            ErrorCode.UNAUTHORIZED,
            401,
            message,
        );

        this.name = 'UnauthorizedError';
    }
}

/**
 * Forbidden - 403
 */
export class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(
            ErrorCode.FORBIDDEN,
            403,
            message,
        );

        this.name = 'ForbiddenError';
    }
}

/**
 * Rate limit - 429
 */
export class RateLimitError extends AppError {
    constructor(retryAfter?: number) {
        super(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            429,
            'Rate limit exceeded',
            retryAfter
                ? { retryAfter }
                : undefined,
        );

        this.name = 'RateLimitError';
    }
}

/**
 * Format error response
 */
export function formatErrorResponse(error: unknown) {
    if (error instanceof AppError) {
        return {
            code: error.code,
            message: error.message,
            ...(error.details && {
                details: error.details,
            }),
            statusCode: error.statusCode,
        };
    }

    return {
        code: ErrorCode.INTERNAL_SERVER_ERROR,
        message: 'An unexpected error occurred',
        statusCode: 500,
    };
}
