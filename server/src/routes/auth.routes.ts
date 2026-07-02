import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser, getCurrentUser } from '../controllers/auth.controller';
import { registerValidator, loginValidator } from '../validators/auth.validators';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many authentication attempts. Please try again later.'
  }
});

/**
 * Public routes: Sign-up and Sign-in endpoints.
 */
router.post('/register', authLimiter, registerValidator, registerUser);
router.post('/login', authLimiter, loginValidator, loginUser);

/**
 * Protected routes: User session retrieval.
 */
router.get('/me', protect, getCurrentUser);

export default router;
