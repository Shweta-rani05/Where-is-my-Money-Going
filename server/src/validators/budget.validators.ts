import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

/**
 * Validator payload response mapper.
 */
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

/**
 * Rules mapping for upserting budgets.
 */
export const budgetValidator = [
  body('category')
    .isIn(['Food', 'Rent', 'Shopping', 'Transport', 'Bills', 'Healthcare', 'Entertainment', 'Others'])
    .withMessage('Please choose a valid budgeting category option'),
  body('limit')
    .isFloat({ min: 0.01 })
    .withMessage('Budget limit must be a positive number greater than 0'),
  validateFields
];
