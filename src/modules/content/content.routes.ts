import { Router } from 'express';
import { AiController } from './ai.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { generateContentSchema } from './ai.schemas';

const router = Router();

router.post('/generate', authenticate, validate(generateContentSchema), AiController.generateContent);

export default router;
