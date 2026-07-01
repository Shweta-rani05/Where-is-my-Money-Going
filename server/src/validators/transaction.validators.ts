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
 * Rules mapping for creating and updating transactions.
 */
export const transactionValidator = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number greater than 0'),
  body('type')
    .isIn(['income', 'expense'])
    .withMessage('Type must be either income or expense'),
  body('category')
    .isIn([
      'Food',
      'Rent',
      'Shopping',
      'Transport',
      'Bills',
      'Healthcare',
      'Entertainment',
      'Investment',
      'Salary',
      'Others'
    ])
    .withMessage('Please choose a valid category option'),
  body('paymentMethod')
    .isIn(['Cash', 'Credit Card', 'Bank Transfer', 'UPI', 'Others'])
    .withMessage('Please choose a valid payment method'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Notes cannot exceed 200 characters'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid ISO date format'),
  validateFields
];
