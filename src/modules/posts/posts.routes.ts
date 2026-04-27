import { Router } from 'express';
import { PostsController } from './posts.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/authenticate';
import { publishPostSchema } from './posts.schemas';

const router = Router();

router.post('/publish', authenticate, validate(publishPostSchema), PostsController.publish);
router.post('/schedule', authenticate, PostsController.schedule);
router.get('/', authenticate, PostsController.getPosts);
router.get('/:id', authenticate, PostsController.getPostById);
router.post('/:id/retry', authenticate, PostsController.retry);
router.delete('/:id', authenticate, PostsController.deletePost);
router.post('/:id/restore', authenticate, PostsController.restorePost);

export default router;
