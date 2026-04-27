import { Queue } from 'bullmq';
import { createRedisConnection } from '../../config/redis';

export const queues: Record<string, Queue> = {
  TWITTER: new Queue('postly_publish_twitter', { connection: createRedisConnection() }),
  LINKEDIN: new Queue('postly_publish_linkedin', { connection: createRedisConnection() }),
  INSTAGRAM: new Queue('postly_publish_instagram', { connection: createRedisConnection() }),
  THREADS: new Queue('postly_publish_threads', { connection: createRedisConnection() }),
  TEST: new Queue('postly_publish_test', { connection: createRedisConnection() })
};
