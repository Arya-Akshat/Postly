import express from 'express';
import cors from 'cors';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler } from './middlewares/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import socialRoutes from './modules/social/social.routes';
import aiRoutes from './modules/ai/ai.routes';
import telegramRoutes from './modules/telegram/telegram.routes';
import postRoutes from './modules/posts/posts.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import adminRoutes from './modules/admin/admin.routes';
import './modules/telegram/handlers';
import { authLimiter, userLimiter } from './middlewares/rateLimiter';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/user', userLimiter, userRoutes);
app.use('/api/social', userLimiter, socialRoutes);
app.use('/api/ai', userLimiter, aiRoutes);
app.use('/api/webhooks/telegram', telegramRoutes);
app.use('/api/posts', userLimiter, postRoutes);
app.use('/api/dashboard', userLimiter, dashboardRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
