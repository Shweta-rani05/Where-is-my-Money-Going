import { Request, Response, NextFunction } from 'express';
import { recurringService } from '../services/recurring.service';

export const getRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }
    const recurring = await recurringService.getUserRecurring(userId);
    res.status(200).json({
      status: 'success',
      data: { recurring },
    });
  } catch (error) {
    next(error);
  }
};

export const createRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const { title, amount, type, category, paymentMethod, frequency, startDate, nextDueDate, autoProcess, notes } = req.body;
    if (!title || !amount || !type || !category) {
      res.status(400).json({ status: 'fail', message: 'Title, amount, type, and category are required' });
      return;
    }

    const recurring = await recurringService.createRecurring(userId, {
      title,
      amount: Number(amount),
      type,
      category,
      paymentMethod,
      frequency,
      startDate,
      nextDueDate,
      autoProcess,
      notes,
    });

    res.status(201).json({
      status: 'success',
      message: 'Recurring rule created successfully',
      data: { recurring },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const { id } = req.params;
    const updated = await recurringService.updateRecurring(userId, id, req.body);
    if (!updated) {
      res.status(404).json({ status: 'fail', message: 'Recurring transaction not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Recurring rule updated',
      data: { recurring: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRecurringStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;
    if (!['active', 'paused', 'cancelled'].includes(status)) {
      res.status(400).json({ status: 'fail', message: 'Invalid status' });
      return;
    }

    const updated = await recurringService.updateStatus(userId, id, status);
    if (!updated) {
      res.status(404).json({ status: 'fail', message: 'Recurring transaction not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: `Rule marked as ${status}`,
      data: { recurring: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRecurring = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const { id } = req.params;
    const deleted = await recurringService.deleteRecurring(userId, id);
    if (!deleted) {
      res.status(404).json({ status: 'fail', message: 'Recurring transaction not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Recurring rule deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const processDueTransactions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const { ruleId } = req.body;
    const result = await recurringService.processDue(userId, ruleId);

    res.status(200).json({
      status: 'success',
      message: `Processed ${result.processedCount} due recurring transactions.`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

