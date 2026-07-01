import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';

interface DecodedToken {
  id: string;
  iat: number;
  exp: number;
}

/**
 * Route protection middleware.
 * Verifies JWT signature and binds the associated database user object to the request.
 */
export const protect = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  // Retrieve token from Authorization header (Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      status: 'fail',
      message: 'Access denied. Authorization token is missing.'
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'super_secret_dev_key_for_where_is_my_money_going';
    const decoded = jwt.verify(token, secret) as DecodedToken;

    // Fetch user from DB, excluding the hashed password field
    const dbUser = await User.findById(decoded.id).select('-password');
    if (!dbUser) {
      res.status(401).json({
        status: 'fail',
        message: 'Access denied. User associated with this token does not exist.'
      });
      return;
    }

    // Bind user information to the request context
    req.user = {
      _id: dbUser._id.toString(),
      name: dbUser.name,
      email: dbUser.email,
      avatar: dbUser.avatar,
      createdAt: dbUser.createdAt
    };

    next();
  } catch (error) {
    res.status(401).json({
      status: 'fail',
      message: 'Access denied. Token is invalid or has expired.'
    });
  }
};
