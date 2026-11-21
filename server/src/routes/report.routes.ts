import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import { sendEmailReport, getReportPreview } from '../controllers/report.controller';

const router = Router();

// Protect all report endpoints
router.use(protect);

router.post('/send-email', sendEmailReport);
router.get('/preview', getReportPreview);

export default router;

