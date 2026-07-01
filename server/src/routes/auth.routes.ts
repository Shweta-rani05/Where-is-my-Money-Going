import { Router } from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/auth.controller';
import { registerValidator, loginValidator } from '../validators/auth.validators';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Public routes: Sign-up and Sign-in endpoints.
 */
router.post('/register', registerValidator, registerUser);
router.post('/login', loginValidator, loginUser);

/**
 * Protected routes: User session retrieval.
 */
router.get('/me', protect, getCurrentUser);

export default router;
