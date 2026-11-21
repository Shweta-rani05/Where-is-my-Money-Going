import { Request, Response, NextFunction } from 'express';
import { investmentService } from '../services/investment.service';

export const getPortfolio = async (
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

    const portfolio = await investmentService.getUserPortfolio(userId);
    res.status(200).json({
      status: 'success',
      data: portfolio,
    });
  } catch (error) {
    next(error);
  }
};

export const createInvestment = async (
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

    const {
      name,
      symbol,
      assetClass,
      quantity,
      buyPrice,
      currentPrice,
      currency,
      purchaseDate,
      notes,
      recordAsExpense,
    } = req.body;

    if (!name || !assetClass || !quantity || buyPrice === undefined) {
      res.status(400).json({
        status: 'fail',
        message: 'Name, assetClass, quantity, and buyPrice are required',
      });
      return;
    }

    const investment = await investmentService.createInvestment(userId, {
      name,
      symbol,
      assetClass,
      quantity: Number(quantity),
      buyPrice: Number(buyPrice),
      currentPrice: currentPrice !== undefined ? Number(currentPrice) : undefined,
      currency,
      purchaseDate,
      notes,
      recordAsExpense: Boolean(recordAsExpense),
    });

    res.status(201).json({
      status: 'success',
      message: `Investment in ${investment.name} recorded successfully.`,
      data: { investment },
    });
  } catch (error) {
    next(error);
  }
};

export const updateInvestment = async (
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

    const { id } = req.params;
    const updated = await investmentService.updateInvestment(userId, id, req.body);
    if (!updated) {
      res.status(404).json({ status: 'fail', message: 'Investment holding not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Investment updated successfully',
      data: { investment: updated },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteInvestment = async (
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

    const { id } = req.params;
    const deleted = await investmentService.deleteInvestment(userId, id);
    if (!deleted) {
      res.status(404).json({ status: 'fail', message: 'Investment holding not found' });
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Investment removed from portfolio',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshPrices = async (
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

    const updatedPortfolio = await investmentService.refreshPrices(userId);
    res.status(200).json({
      status: 'success',
      message: 'Market quotes refreshed successfully.',
      data: updatedPortfolio,
    });
  } catch (error) {
    next(error);
  }
};

