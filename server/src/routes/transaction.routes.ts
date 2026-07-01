import { Router } from 'express';
import {
  createTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getTransactionSummary,
} from '../controllers/transaction.controller';
import { transactionValidator } from '../validators/transaction.validators';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Enforce session validation globally across transaction routes
router.use(protect);

/**
 * Endpoints for transaction CRUD queries
 */
router.post('/', transactionValidator, createTransaction);
router.get('/', getTransactions);
router.get('/summary', getTransactionSummary);
router.put('/:id', transactionValidator, updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;

