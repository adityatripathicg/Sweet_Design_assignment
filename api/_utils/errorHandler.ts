import { VercelResponse } from '@vercel/node';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createNotFoundError = (message: string = 'Resource not found') => {
  return new AppError(message, 404);
};

export const createValidationError = (message: string, details?: any) => {
  const error = new AppError(message, 400);
  (error as any).details = details;
  return error;
};

export const handleError = (error: any, res: VercelResponse) => {
  console.error('API Error:', error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      details: (error as any).details || null,
    });
  }

  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: any, res: any) => {
    Promise.resolve(fn(req, res)).catch((error) => {
      handleError(error, res);
    });
  };
};
