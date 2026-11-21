import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getPortfolio,
  createInvestment,
  updateInvestment,
  deleteInvestment,
  refreshPrices,
} from '../controllers/investment.controller';

const router = Router();

router.use(protect);

router.get('/', getPortfolio);
router.post('/', createInvestment);
router.post('/refresh', refreshPrices);
router.put('/:id', updateInvestment);
router.delete('/:id', deleteInvestment);

export default router;

