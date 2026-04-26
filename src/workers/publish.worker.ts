import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { createRedisConnection } from '../config/redis';
import { decrypt } from '../utils/encryption';
import axios from 'axios';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

const processJob = async (job: Job) => {
  const { platformPostId, platform, content, accessToken } = job.data;

  // DB Sync Contract
  await prisma.platformPost.update({
    where: { id: platformPostId },
    data: { status: 'PROCESSING' }
  });

  const post = await prisma.platformPost.findUnique({
    where: { id: platformPostId },
    include: { post: true }
  });

  if (post?.post.status === 'CANCELLED') {
    throw new Error('Post cancelled');
  }

  try {
    const token = decrypt(accessToken);
    if (platform === 'TWITTER') {
      logger.info(`[Worker] Publishing to Twitter: ${content}`);
    } else if (platform === 'LINKEDIN') {
      logger.info(`[Worker] Publishing to LinkedIn: ${content}`);
    } else {
      logger.info(`[Worker] Publishing mock to ${platform}: ${content}`);
    }

    await prisma.platformPost.update({
      where: { id: platformPostId },
      data: { status: 'PUBLISHED', published_at: new Date() }
    });

  } catch (error: any) {
    await prisma.platformPost.update({
      where: { id: platformPostId },
      data: { error_message: error.message }
    });
    throw error;
  }
};

const setupWorkers = () => {
  const platforms = ['twitter', 'linkedin', 'instagram', 'threads'];
  platforms.forEach(platform => {
    new Worker(`postly:publish:${platform}`, processJob, {
      connection: createRedisConnection()
    }).on('failed', async (job: Job | undefined, err: Error) => {
      if (job) {
        if (job.attemptsMade >= 3) {
          await prisma.platformPost.update({
            where: { id: job.data.platformPostId },
            data: { status: 'FAILED', attempts: job.attemptsMade, error_message: err.message }
          });
        }
      }
    });
  });
};

setupWorkers();
logger.info('Workers started');
