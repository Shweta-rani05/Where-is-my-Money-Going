import { Router } from 'express';
import { uploadStatement } from '../controllers/statement.controller';
import { upload } from '../middlewares/upload.middleware';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

/**
 * Protected routes for statement upload and processing
 */
router.post('/upload', protect, upload.single('statement'), uploadStatement as any);

export default router;
