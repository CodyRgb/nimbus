import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { connectTelegram, verifyTelegram } from '../controllers/telegram.controller';

const router = Router();

router.post('/connect', protect, connectTelegram);
router.post('/verify', protect, verifyTelegram);

export default router;
