import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getRecurring,
  createRecurring,
  updateRecurring,
  updateRecurringStatus,
  deleteRecurring,
  processDueTransactions,
} from '../controllers/recurring.controller';

const router = Router();

router.use(protect);

router.get('/', getRecurring);
router.post('/', createRecurring);
router.post('/process-due', processDueTransactions);
router.put('/:id', updateRecurring);
router.patch('/:id/status', updateRecurringStatus);
router.delete('/:id', deleteRecurring);

export default router;

