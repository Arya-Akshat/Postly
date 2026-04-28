import { prisma } from '../../db/prisma';
import { queues } from '../queue/queue';

export const PostsService = {
  async publish(userId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, user_id: userId, deleted_at: null },
      include: { platform_posts: true }
    });

    if (!post) throw { status: 404, message: 'Post not found' };

    await prisma.post.update({ where: { id: postId }, data: { status: 'QUEUED' } });

    const socials = await prisma.socialAccount.findMany({
      where: { user_id: userId, platform: { in: post.platform_posts.map((p: any) => p.platform) } }
    });
    const socialMap = Object.fromEntries(socials.map((s: any) => [s.platform, s]));

    for (const pp of post.platform_posts) {
      const social = socialMap[pp.platform];

      if (!social && pp.platform !== 'TEST') continue; // Skip if no account connected

      await prisma.platformPost.update({ where: { id: pp.id }, data: { status: 'QUEUED' } });

      const queue = queues[pp.platform];
      if (queue) {
        await queue.add('publish', {
          postId,
          platformPostId: pp.id,
          userId,
          platform: pp.platform,
          content: pp.content,
          accessToken: social ? social.access_token_enc : '0000000000000000000000000000000000000000000000000000000000000000:000000000000000000000000:00000000000000000000000000000000'
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 }
        });
      }
    }
  },

  async getPosts(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const total = await prisma.post.count({ where: { user_id: userId, deleted_at: null } });
    const posts = await prisma.post.findMany({
      where: { user_id: userId, deleted_at: null },
      skip,
      take: limit,
      include: { platform_posts: true }
    });
    return {
      posts,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    };
  },

  async softDelete(userId: string, postId: string) {
    await prisma.post.updateMany({
      where: { id: postId, user_id: userId },
      data: { deleted_at: new Date() }
    });
  },

  async restore(userId: string, postId: string) {
    await prisma.post.updateMany({
      where: { id: postId, user_id: userId },
      data: { deleted_at: null }
    });
  },

  async getById(userId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, user_id: userId, deleted_at: null },
      include: { platform_posts: true }
    });
    if (!post) throw { status: 404, message: 'Post not found' };
    return post;
  },

  async schedule(userId: string, postId: string, scheduledAt: Date) {
    const post = await prisma.post.findFirst({
      where: { id: postId, user_id: userId, deleted_at: null }
    });
    if (!post) throw { status: 404, message: 'Post not found' };

    return await prisma.post.update({
      where: { id: postId },
      data: { publish_at: scheduledAt, status: 'QUEUED' }
    });
  },

  async retry(userId: string, postId: string) {
    const post = await prisma.post.findFirst({
      where: { id: postId, user_id: userId, deleted_at: null },
      include: { platform_posts: { where: { status: 'FAILED' } } }
    });

    if (!post) throw { status: 404, message: 'Post not found' };
    
    // Logic to re-add failed jobs to queue would go here
    // For now, we just reset the status
    await prisma.platformPost.updateMany({
      where: { post_id: postId, status: 'FAILED' },
      data: { status: 'QUEUED' }
    });
    
    return this.publish(userId, postId);
  }
};
