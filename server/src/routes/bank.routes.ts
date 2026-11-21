import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import {
  getInstitutions,
  getUserAccounts,
  connectAccount,
  syncAccount,
  disconnectAccount,
} from '../controllers/bank.controller';

const router = Router();

// Protect all banking routes with JWT auth
router.use(protect);

router.get('/institutions', getInstitutions);
router.get('/accounts', getUserAccounts);
router.post('/connect', connectAccount);
router.post('/accounts/:id/sync', syncAccount);
router.delete('/accounts/:id', disconnectAccount);

export default router;

