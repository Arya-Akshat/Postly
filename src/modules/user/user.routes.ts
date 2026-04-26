import { Router } from 'express';
import { UserController } from './user.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { updateProfileSchema } from './user.schemas';

const router = Router();

router.put('/profile', authenticate, validate(updateProfileSchema), UserController.updateProfile);

export default router;
