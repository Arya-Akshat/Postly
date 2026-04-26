import { Redis } from 'ioredis';
import { env } from './env';

// Primary Redis client for the API server
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

// Factory for separate worker connections (BullMQ requires separate instances)
export const createRedisConnection = () => {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
};
