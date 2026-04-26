import { Router } from 'express';
import { SocialController } from './social.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { connectSocialSchema } from './social.schemas';

const router = Router();

router.post('/connect', authenticate, validate(connectSocialSchema), SocialController.connectAccount);
router.get('/', authenticate, SocialController.getAccounts);
router.delete('/:id', authenticate, SocialController.disconnectAccount);

export default router;
