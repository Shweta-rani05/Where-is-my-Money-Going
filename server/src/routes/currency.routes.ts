import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getCurrencies,
  getRates,
  convertCurrency,
  updateUserCurrency,
} from '../controllers/currency.controller';

const router = Router();

// Publicly readable currency exchange rates & calculator
router.get('/', getCurrencies);
router.get('/rates', getRates);
router.get('/convert', convertCurrency);

// Authenticated user preferred currency setting
router.patch('/preference', protect, updateUserCurrency);

export default router;

