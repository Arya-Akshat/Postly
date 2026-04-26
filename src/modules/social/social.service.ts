import { prisma } from '../../db/prisma';
import { encrypt } from '../../utils/encryption';

export const SocialService = {
  async connectAccount(userId: string, data: any) {
    const existing = await prisma.socialAccount.findFirst({
      where: { user_id: userId, platform: data.platform },
    });

    const access_token_enc = encrypt(data.access_token);
    const refresh_token_enc = data.refresh_token ? encrypt(data.refresh_token) : null;

    if (existing) {
      return await prisma.socialAccount.update({
        where: { id: existing.id },
        data: {
          access_token_enc,
          refresh_token_enc,
          handle: data.handle,
        },
      });
    }

    return await prisma.socialAccount.create({
      data: {
        user_id: userId,
        platform: data.platform,
        access_token_enc,
        refresh_token_enc,
        handle: data.handle,
      },
    });
  },

  async getAccounts(userId: string) {
    const accounts = await prisma.socialAccount.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        platform: true,
        handle: true,
        connected_at: true,
      },
    });
    return accounts;
  },

  async disconnectAccount(userId: string, accountId: string) {
    await prisma.socialAccount.deleteMany({
      where: { id: accountId, user_id: userId },
    });
  }
};
