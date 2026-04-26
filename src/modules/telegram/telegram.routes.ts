import { Router } from 'express';
import { telegramWebhook } from './bot';

const router = Router();

router.post('/webhook', telegramWebhook);

export default router;
