import { prisma } from '../../db/prisma';

export const DashboardService = {
  async getStats(userId: string) {
    const totalPosts = await prisma.post.count({ where: { user_id: userId, deleted_at: null } });
    const successPlatformPosts = await prisma.platformPost.count({ where: { post: { user_id: userId, deleted_at: null }, status: 'PUBLISHED' } });
    const totalPlatformPosts = await prisma.platformPost.count({ where: { post: { user_id: userId, deleted_at: null } } });

    const successRate = totalPlatformPosts ? (successPlatformPosts / totalPlatformPosts) * 100 : 0;

    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const posts_this_week = await prisma.post.count({
      where: { user_id: userId, deleted_at: null, created_at: { gte: lastWeek } }
    });

    const platforms = await prisma.platformPost.groupBy({
      by: ['platform'],
      where: { post: { user_id: userId, deleted_at: null } },
      _count: { platform: true }
    });
    
    const posts_per_platform = platforms.reduce((acc: any, curr) => {
      acc[curr.platform] = curr._count.platform;
      return acc;
    }, {});

    return {
      totalPosts,
      successRate,
      posts_this_week,
      posts_per_platform
    };
  }
};
