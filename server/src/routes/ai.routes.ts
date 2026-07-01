import { Router } from 'express';
import { chatWithAI } from '../controllers/ai.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/chat', chatWithAI);

export default router;
