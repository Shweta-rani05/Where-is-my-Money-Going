import { Router } from 'express';
import {
  createOrUpdateBudget,
  getBudgets,
  deleteBudget,
} from '../controllers/budget.controller';
import { budgetValidator } from '../validators/budget.validators';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth protected guards globally
router.use(protect);

/**
 * Endpoints for category budgets
 */
router.post('/', budgetValidator, createOrUpdateBudget);
router.get('/', getBudgets);
router.delete('/:id', deleteBudget);

export default router;
