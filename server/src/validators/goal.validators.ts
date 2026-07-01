import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

const validateFields = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      status: 'fail',
      errors: errors.array().map((err: any) => ({
        field: err.path || err.type,
        message: err.msg
      }))
    });
    return;
  }
  next();
};

export const goalValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Goal title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('targetAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be a positive number'),
  body('savedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Saved amount cannot be negative'),
  validateFields
];

export const goalUpdateValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Title cannot exceed 100 characters'),
  body('targetAmount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Target amount must be a positive number'),
  body('savedAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Saved amount cannot be negative'),
  validateFields
];
