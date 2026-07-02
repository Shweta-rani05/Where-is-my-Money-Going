import { Router } from 'express';
import { chatWithAI, getChatHistory, getInsights } from '../controllers/ai.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.use(protect);

router.post('/chat', chatWithAI);
router.get('/history', getChatHistory);
router.get('/insights', getInsights);

export default router;
