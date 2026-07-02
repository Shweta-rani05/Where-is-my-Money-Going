import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';
import budgetRoutes from './budget.routes';
import goalRoutes from './goal.routes';
import userRoutes from './user.routes';
import aiRoutes from './ai.routes';
import statementRoutes from './statement.routes';

const router = Router();

// Wire sub-routers
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/transactions', transactionRoutes);
router.use('/budgets', budgetRoutes);
router.use('/goals', goalRoutes);
router.use('/user', userRoutes);
router.use('/ai', aiRoutes);
router.use('/statements', statementRoutes);

export default router;


