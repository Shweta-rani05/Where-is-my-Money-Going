import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { summaryCache } from '../utils/cache';



/**
 * @route   POST /api/transactions
 * @desc    Creates a new transaction for the authenticated user.
 * @access  Private
 */
export const createTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { amount, type, category, paymentMethod, notes, date } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    const transaction = await Transaction.create({
      userId,
      amount,
      type,
      category,
      paymentMethod,
      notes,
      date: date || new Date()
    });

    // Invalidate dashboard cache
    summaryCache.delete(`summary_${userId}`);

    res.status(201).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/transactions
 * @desc    Fetches paginated transactions for the current user with search and filtering.
 * @access  Private
 */
export const getTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    // Destructure query parameters
    const {
      search,
      type,
      category,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    // Construct mongoose query object
    const queryFilter: any = { userId };

    // Notes regex fuzzy search
    if (search) {
      queryFilter.notes = { $regex: search.toString(), $options: 'i' };
    }

    // Type filter (income | expense)
    if (type) {
      queryFilter.type = type.toString();
    }

    // Category filter
    if (category) {
      queryFilter.category = category.toString();
    }

    // Date range filter
    if (startDate || endDate) {
      queryFilter.date = {};
      if (startDate) {
        queryFilter.date.$gte = new Date(startDate.toString());
      }
      if (endDate) {
        queryFilter.date.$lte = new Date(endDate.toString());
      }
    }

    // Pagination parameters
    const pageNum = parseInt(page.toString(), 10);
    const limitNum = parseInt(limit.toString(), 10);
    const skipOffset = (pageNum - 1) * limitNum;

    // Query databases sorted by date descending (latest first)
    const transactions = await Transaction.find(queryFilter)
      .sort({ date: -1 })
      .skip(skipOffset)
      .limit(limitNum);

    const totalTransactions = await Transaction.countDocuments(queryFilter);
    const totalPages = Math.ceil(totalTransactions / limitNum);

    res.status(200).json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          totalCount: totalTransactions,
          totalPages,
          currentPage: pageNum,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/transactions/:id
 * @desc    Updates a user's transaction.
 * @access  Private
 */
export const updateTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const { amount, type, category, paymentMethod, notes, date } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    // Find and update, verifying ownership
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      { amount, type, category, paymentMethod, notes, date },
      { new: true, runValidators: true }
    );

    // Invalidate dashboard cache
    summaryCache.delete(`summary_${userId}`);

    if (!transaction) {
      res.status(404).json({
        status: 'fail',
        message: 'Transaction not found or unauthorized modification access.'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/transactions/:id
 * @desc    Deletes a user's transaction.
 * @access  Private
 */
export const deleteTransaction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    const transaction = await Transaction.findOneAndDelete({ _id: id, userId });
    if (!transaction) {
      res.status(404).json({
        status: 'fail',
        message: 'Transaction not found or unauthorized deletion access.'
      });
      return;
    }

    // Invalidate dashboard cache
    summaryCache.delete(`summary_${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Transaction deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/transactions/summary
 * @desc    Fetches cashflow trends and expense distribution for overview dashboard.
 * @access  Private
 */
export const getTransactionSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    const cacheKey = `summary_${userId}`;
    const cachedData = summaryCache.get(cacheKey);
    
    if (cachedData) {
      res.status(200).json({
        status: 'success',
        data: cachedData
      });
      return;
    }

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // 1. Current Month Totals for Stats Cards
    const totalsResult = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
        }
      }
    ]);

    const income = totalsResult[0]?.income || 0;
    const expenses = totalsResult[0]?.expenses || 0;
    const savings = Math.max(0, income - expenses);

    // Sum total limits set in Budgets table
    const budgets = await Budget.find({ userId });
    const budgetLimit = budgets.reduce((sum, b) => sum + b.limit, 0) || 50000;
    const remainingBudget = Math.max(0, budgetLimit - expenses);


    // 2. Cash Flow Trends (Past 6 Months)
    const trendResult = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          Income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          Expenses: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Map aggregation results to Recharts array structure, filling empty months with zeroes
    const trendMap = new Map(trendResult.map(t => [`${t._id.year}-${t._id.month}`, t]));

    const cashFlowTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const year = d.getFullYear();
      const month = d.getMonth() + 1; // 1-indexed for MongoDB group match
      const key = `${year}-${month}`;
      const name = monthNames[d.getMonth()];

      const match = trendMap.get(key);
      cashFlowTrend.push({
        name,
        Income: match?.Income || 0,
        Expenses: match?.Expenses || 0
      });
    }

    // 3. Category Distribution (Current Month Expenses)
    const categoryDistribution = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: "$category",
          value: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1
        }
      }
    ]);

    const responseData = {
      totals: {
        income,
        expenses,
        savings,
        remainingBudget
      },
      cashFlowTrend,
      categoryDistribution
    };

    // Cache for 5 minutes
    summaryCache.set(cacheKey, responseData, 300);

    // Format final response
    res.status(200).json({
      status: 'success',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

