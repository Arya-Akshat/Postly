import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middlewares/authenticate';

const router = Router();

router.get('/stats', authenticate, DashboardController.getStats);

export default router;
