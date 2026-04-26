import { Router } from 'express';
import { PostsController } from './posts.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { publishPostSchema } from './posts.schemas';

const router = Router();

router.post('/publish', authenticate, validate(publishPostSchema), PostsController.publish);
router.get('/', authenticate, PostsController.getPosts);
router.delete('/:id', authenticate, PostsController.deletePost);
router.post('/:id/restore', authenticate, PostsController.restorePost);

export default router;
