import { Router } from 'express';
import {
  createGoal,
  getGoals,
  updateGoal,
  deleteGoal,
} from '../controllers/goal.controller';
import { goalValidator, goalUpdateValidator } from '../validators/goal.validators';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/', goalValidator, createGoal);
router.get('/', getGoals);
router.put('/:id', goalUpdateValidator, updateGoal);
router.delete('/:id', deleteGoal);

export default router;
