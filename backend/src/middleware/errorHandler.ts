import { Request, Response, NextFunction } from 'express';
import { APIError } from '../types';

export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: any;

  constructor(message: string, statusCode = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: APIError;

  if (err instanceof AppError) {
    error = {
      message: err.message,
      code: err.code,
      status: err.statusCode,
      details: err.details,
    };
  } else {
    // Handle specific error types
    if (err.name === 'ValidationError') {
      error = {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        status: 400,
        details: err.message,
      };
    } else if (err.name === 'CastError') {
      error = {
        message: 'Invalid data format',
        code: 'INVALID_FORMAT',
        status: 400,
        details: err.message,
      };
    } else if (err.message?.includes('duplicate key')) {
      error = {
        message: 'Resource already exists',
        code: 'DUPLICATE_RESOURCE',
        status: 409,
        details: err.message,
      };
    } else {
      error = {
        message: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : err.message || 'Unknown error occurred',
        code: 'INTERNAL_ERROR',
        status: 500,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      };
    }
  }

  // Log error details
  console.error('🚨 Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  res.status(error.status).json({
    success: false,
    error: error.message,
    code: error.code,
    ...(error.details && { details: error.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// Async error handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Common error creators
export const createValidationError = (message: string, details?: any) => {
  return new AppError(message, 400, 'VALIDATION_ERROR', details);
};

export const createNotFoundError = (resource: string) => {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
};

export const createUnauthorizedError = (message = 'Unauthorized access') => {
  return new AppError(message, 401, 'UNAUTHORIZED');
};

export const createForbiddenError = (message = 'Access forbidden') => {
  return new AppError(message, 403, 'FORBIDDEN');
};

export const createConflictError = (message: string, details?: any) => {
  return new AppError(message, 409, 'CONFLICT', details);
};
