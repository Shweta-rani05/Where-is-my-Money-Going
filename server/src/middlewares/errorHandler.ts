import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
}

/**
 * Global Express Error Handling Middleware.
 * Standardizes API error formats, handles common Mongoose errors,
 * and restricts detail exposure (like stack traces) in production.
 */
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Log full error for internal tracking (exclude in raw response to client)
  console.error(`[Error Middleware] Code ${statusCode} - ${message}`, error);

  // 1. Mongoose bad ObjectId Cast Error
  if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Resource identifier is invalid.';
  }

  // 2. Mongoose Validation Error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values((error as any).errors)
      .map((val: any) => val.message)
      .join(', ');
  }

  // 3. MongoDB Duplicate Key Error (11000)
  if (error.code === 11000) {
    statusCode = 400;
    const duplicatedField = Object.keys((error as any).keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${duplicatedField}. Please choose another value.`;
  }

  // Return final response payload
  res.status(statusCode).json({
    status: 'error',
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
};
