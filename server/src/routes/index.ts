import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import transactionRoutes from './transaction.routes';
import budgetRoutes from './budget.routes';
import goalRoutes from './goal.routes';
import userRoutes from './user.routes';
import aiRoutes from './ai.routes';
import statementRoutes from './statement.routes';
import reportRoutes from './report.routes';
import bankRoutes from './bank.routes';
import recurringRoutes from './recurring.routes';
import investmentRoutes from './investment.routes';
import notificationRoutes from './notification.routes';
import currencyRoutes from './currency.routes';
import creditScoreRoutes from './creditScore.routes';

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
router.use('/reports', reportRoutes);
router.use('/banks', bankRoutes);
router.use('/recurring', recurringRoutes);
router.use('/investments', investmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/currency', currencyRoutes);
router.use('/credit-score', creditScoreRoutes);

export default router;


