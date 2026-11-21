import { Request, Response, NextFunction } from 'express';
import { creditScoreService } from '../services/creditScore.service';

export const getCreditScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const creditData = await creditScoreService.getCreditScore(userId);
    res.status(200).json({
      status: 'success',
      data: creditData,
    });
  } catch (error) {
    next(error);
  }
};

export const recalculateScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const creditData = await creditScoreService.calculateCreditScore(userId);
    res.status(200).json({
      status: 'success',
      message: 'Credit score recalculated successfully based on latest financial records.',
      data: creditData,
    });
  } catch (error) {
    next(error);
  }
};

export const simulateScore = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Unauthorized session' });
      return;
    }

    const { action, value } = req.body;
    if (!action) {
      res.status(400).json({ status: 'fail', message: 'Action is required' });
      return;
    }

    const result = await creditScoreService.simulateScore(userId, action, Number(value) || 0);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

