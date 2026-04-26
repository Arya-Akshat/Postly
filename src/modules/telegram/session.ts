import { redis } from '../../config/redis';

const SESSION_TTL = 30 * 60; // 30 minutes

export const TelegramSession = {
  async get(chatId: number) {
    const data = await redis.get(`telegram_session:${chatId}`);
    return data ? JSON.parse(data) : null;
  },

  async set(chatId: number, data: any) {
    await redis.setex(`telegram_session:${chatId}`, SESSION_TTL, JSON.stringify(data));
  },

  async clear(chatId: number) {
    await redis.del(`telegram_session:${chatId}`);
  }
};
