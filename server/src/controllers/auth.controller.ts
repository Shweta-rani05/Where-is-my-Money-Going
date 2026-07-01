import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

/**
 * Sign JWT tokens with user IDs.
 */
const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET || 'super_secret_dev_key_for_where_is_my_money_going';
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as any;
  return jwt.sign({ id: userId }, secret, { expiresIn });
};


/**
 * @route   POST /api/auth/register
 * @desc    Registers a new user and returns user info + JWT token.
 * @access  Public
 */
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, avatar } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({
        status: 'fail',
        message: 'A user with this email address already exists.'
      });
      return;
    }

    // Create user (triggers password hashing in model pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      avatar: avatar || ''
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      status: 'success',
      data: {
        token,
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
 * @route   POST /api/auth/login
 * @desc    Authenticates credentials and returns user info + JWT token.
 * @access  Public
 */
export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password credentials.'
      });
      return;
    }

    // Verify candidate password matches hashed password in DB
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        status: 'fail',
        message: 'Invalid email or password credentials.'
      });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      status: 'success',
      data: {
        token,
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
 * @route   GET /api/auth/me
 * @desc    Retrieves current user details using session validation.
 * @access  Private
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};
