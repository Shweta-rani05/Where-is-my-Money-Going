import { Request, Response, NextFunction } from 'express';
import { bankService } from '../services/bank.service';

/**
 * @route   GET /api/banks/institutions
 * @desc    Fetch supported bank institutions catalog
 * @access  Private
 */
export const getInstitutions = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const institutions = bankService.getSupportedInstitutions();
    res.status(200).json({
      status: 'success',
      data: { institutions },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/banks/accounts
 * @desc    Fetch all linked bank accounts for current user
 * @access  Private
 */
export const getUserAccounts = async (
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

    const accounts = await bankService.getUserAccounts(userId);
    res.status(200).json({
      status: 'success',
      data: { accounts },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/banks/connect
 * @desc    Link a new bank account and execute initial sync
 * @access  Private
 */
export const connectAccount = async (
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

    const { institutionId, accountType, initialBalance, accountNumberLast4 } = req.body;

    if (!institutionId || !accountType) {
      res.status(400).json({
        status: 'fail',
        message: 'institutionId and accountType are required',
      });
      return;
    }

    const result = await bankService.connectAccount(userId, {
      institutionId,
      accountType,
      initialBalance: initialBalance ? Number(initialBalance) : undefined,
      accountNumberLast4,
    });

    res.status(201).json({
      status: 'success',
      message: `Successfully linked ${result.account.institutionName} account.`,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * @route   POST /api/banks/accounts/:id/sync
 * @desc    Sync transactions for a specific bank account
 * @access  Private
 */
export const syncAccount = async (
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

    const accountId = req.params.id;
    const result = await bankService.syncAccount(userId, accountId);

    res.status(200).json({
      status: 'success',
      message: `Sync complete: imported ${result.importedCount} new transactions (${result.duplicateCount} duplicates skipped).`,
      data: result,
    });
  } catch (error: any) {
    next(error);
  }
};

/**
 * @route   DELETE /api/banks/accounts/:id
 * @desc    Disconnect and remove a bank account
 * @access  Private
 */
export const disconnectAccount = async (
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

    const accountId = req.params.id;
    const result = await bankService.disconnectAccount(userId, accountId);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error: any) {
    next(error);
  }
};

