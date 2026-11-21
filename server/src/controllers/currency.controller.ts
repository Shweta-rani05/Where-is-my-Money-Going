import { Request, Response, NextFunction } from 'express';
import { currencyService } from '../services/currency.service';
import { User } from '../models/User';

export const getCurrencies = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currencies = currencyService.getSupportedCurrencies();
    res.status(200).json({
      status: 'success',
      data: { currencies },
    });
  } catch (error) {
    next(error);
  }
};

export const getRates = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rates = currencyService.getExchangeRates();
    res.status(200).json({
      status: 'success',
      data: rates,
    });
  } catch (error) {
    next(error);
  }
};

export const convertCurrency = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount, from, to } = req.query;
    if (!amount) {
      res.status(400).json({ status: 'fail', message: 'Amount is required' });
      return;
    }

    const result = currencyService.convert(
      Number(amount),
      (from as string) || 'INR',
      (to as string) || 'USD'
    );

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUserCurrency = async (
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

    const { currency } = req.body;
    if (!currency) {
      res.status(400).json({ status: 'fail', message: 'Currency code is required' });
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { currency: currency.toUpperCase() } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      message: `Preferred currency updated to ${currency.toUpperCase()}`,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

