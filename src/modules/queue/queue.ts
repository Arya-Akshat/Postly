import { Queue } from 'bullmq';
import { createRedisConnection } from '../../config/redis';

export const queues: Record<string, Queue> = {
  TWITTER: new Queue('postly:publish:twitter', { connection: createRedisConnection() }),
  LINKEDIN: new Queue('postly:publish:linkedin', { connection: createRedisConnection() }),
  INSTAGRAM: new Queue('postly:publish:instagram', { connection: createRedisConnection() }),
  THREADS: new Queue('postly:publish:threads', { connection: createRedisConnection() })
};
