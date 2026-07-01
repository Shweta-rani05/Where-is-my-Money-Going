import { Request, Response, NextFunction } from 'express';

/**
 * Custom 404 Not Found response middleware.
 * Returns a standardized JSON payload for unmatched API routes.
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  res.status(404).json({
    status: 'fail',
    message: `Resource not found: ${req.method} ${req.originalUrl}`
  });
};
