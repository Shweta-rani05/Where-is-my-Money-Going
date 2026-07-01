import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Budget } from '../models/Budget';
import { Transaction } from '../models/Transaction';

/**
 * @route   POST /api/budgets
 * @desc    Creates or updates a spending budget limit for a category (upsert).
 * @access  Private
 */
export const createOrUpdateBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { category, limit } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    // Upsert budget to avoid duplicate categories for the same user
    const budget = await Budget.findOneAndUpdate(
      { userId, category },
      { limit },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: { budget }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/budgets
 * @desc    Retrieves all user budgets merged with current-month spent aggregates.
 * @access  Private
 */
export const getBudgets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    // Fetch user budget configurations
    const budgets = await Budget.find({ userId }).sort({ category: 1 });

    // Aggregate monthly expenses per category
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const expenseSums = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          spent: { $sum: '$amount' }
        }
      }
    ]);

    // Map aggregates to a look-up dictionary
    const expenseMap = new Map<string, number>(
      expenseSums.map((item) => [item._id, item.spent])
    );

    // Merge spent sums with budget bounds
    const budgetsWithSpent = budgets.map((b) => ({
      _id: b._id,
      category: b.category,
      limit: b.limit,
      spent: expenseMap.get(b.category) || 0,
      createdAt: b.createdAt,
      updatedAt: b.updatedAt
    }));

    res.status(200).json({
      status: 'success',
      data: { budgets: budgetsWithSpent }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/budgets/:id
 * @desc    Removes a category budget.
 * @access  Private
 */
export const deleteBudget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    const budget = await Budget.findOneAndDelete({ _id: id, userId });
    if (!budget) {
      res.status(404).json({
        status: 'fail',
        message: 'Budget category not found or unauthorized deletion access.'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Budget deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
