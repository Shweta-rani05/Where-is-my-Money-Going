import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';
import { Budget } from '../models/Budget';
import { Goal } from '../models/Goal';

/**
 * @route   PUT /api/user/profile
 * @desc    Updates the authenticated user's name and/or email.
 * @access  Private
 */
export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { name, email } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    // Check email uniqueness if changing email
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        res.status(400).json({
          status: 'fail',
          message: 'This email address is already in use by another account.'
        });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      res.status(404).json({ status: 'fail', message: 'User not found.' });
      return;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/user/password
 * @desc    Changes the authenticated user's password after verifying the current one.
 * @access  Private
 */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    // Fetch user WITH password field
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ status: 'fail', message: 'User not found.' });
      return;
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({
        status: 'fail',
        message: 'Current password is incorrect.'
      });
      return;
    }

    // Set new password (triggers pre-save hash)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/user/account
 * @desc    Permanently deletes the user and all associated data (transactions, budgets, goals).
 * @access  Private
 */
export const deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ status: 'fail', message: 'Session unauthorized' });
      return;
    }

    // Cascade delete all user data
    await Promise.all([
      Transaction.deleteMany({ userId }),
      Budget.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    res.status(200).json({
      status: 'success',
      message: 'Account and all associated data deleted permanently.'
    });
  } catch (error) {
    next(error);
  }
};
