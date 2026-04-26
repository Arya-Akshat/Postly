import { Bot, webhookCallback } from 'grammy';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

export const bot = env.TELEGRAM_BOT_TOKEN ? new Bot(env.TELEGRAM_BOT_TOKEN) : null;

export const telegramWebhook = bot 
  ? webhookCallback(bot, 'express', {
      secretToken: env.TELEGRAM_WEBHOOK_SECRET,
    })
  : (req: any, res: any) => res.status(500).send('Bot not configured');

// Configure Telegram Webhook callback explicitly
