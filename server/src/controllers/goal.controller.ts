import { Request, Response, NextFunction } from 'express';
import { Goal } from '../models/Goal';

/**
 * @route   POST /api/goals
 * @desc    Creates a new savings goal.
 * @access  Private
 */
export const createGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { title, targetAmount, savedAmount } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    const goal = await Goal.create({
      userId,
      title,
      targetAmount,
      savedAmount: savedAmount || 0
    });

    res.status(201).json({
      status: 'success',
      data: { goal }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/goals
 * @desc    Retrieves all savings goals for the authenticated user.
 * @access  Private
 */
export const getGoals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      data: { goals }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/goals/:id
 * @desc    Updates a savings goal (title, targetAmount, or savedAmount).
 * @access  Private
 */
export const updateGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const { title, targetAmount, savedAmount } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
    if (savedAmount !== undefined) updateData.savedAmount = savedAmount;

    const goal = await Goal.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!goal) {
      res.status(404).json({
        status: 'fail',
        message: 'Goal not found or unauthorized access.'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: { goal }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/goals/:id
 * @desc    Deletes a savings goal.
 * @access  Private
 */
export const deleteGoal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    const goal = await Goal.findOneAndDelete({ _id: id, userId });
    if (!goal) {
      res.status(404).json({
        status: 'fail',
        message: 'Goal not found or unauthorized deletion access.'
      });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Goal deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
