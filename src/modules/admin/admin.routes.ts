import { Router } from 'express';
import { prisma } from '../../db/prisma';
import { createRedisConnection } from '../../config/redis';

const router = Router();

router.post('/clear-all', async (req, res) => {
  try {
    console.log('[Admin] Clearing all data...');
    
    // Clear Postgres
    await prisma.platformPost.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.aiKey.deleteMany({});
    await prisma.socialAccount.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});

    // Clear Redis
    const redis = createRedisConnection();
    const queueNames = [
      'postly_publish_twitter',
      'postly_publish_linkedin',
      'postly_publish_instagram',
      'postly_publish_threads',
      'postly_publish_test'
    ];

    for (const name of queueNames) {
      const keys = await redis.keys(`bull:${name}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }

    // Clear sessions
    const sessionKeys = await redis.keys('tg:session:*');
    if (sessionKeys.length > 0) {
      await redis.del(...sessionKeys);
    }

    await redis.quit();

    res.json({ success: true, message: 'All data cleared successfully' });
  } catch (error: any) {
    console.error('[Admin] Cleanup failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
