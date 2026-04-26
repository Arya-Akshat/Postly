import { Router } from 'express';
import { AiController } from './ai.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { updateAiKeysSchema } from './ai.schemas';

const router = Router();

router.put('/keys', authenticate, validate(updateAiKeysSchema), AiController.updateKeys);
router.get('/keys/status', authenticate, AiController.getKeysStatus);

export default router;
