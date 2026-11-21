import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getCreditScore,
  recalculateScore,
  simulateScore,
} from '../controllers/creditScore.controller';

const router = Router();

router.use(protect);

router.get('/', getCreditScore);
router.post('/refresh', recalculateScore);
router.post('/simulate', simulateScore);

export default router;

