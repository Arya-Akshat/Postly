import { prisma } from '../../db/prisma';
import { encrypt } from '../../utils/encryption';

export const AiService = {
  async updateKeys(userId: string, data: any) {
    const existing = await prisma.aiKey.findUnique({
      where: { user_id: userId },
    });

    const openai_key_enc = data.openai_key ? encrypt(data.openai_key) : undefined;
    const anthropic_key_enc = data.anthropic_key ? encrypt(data.anthropic_key) : undefined;

    if (existing) {
      return await prisma.aiKey.update({
        where: { user_id: userId },
        data: {
          ...(openai_key_enc && { openai_key_enc }),
          ...(anthropic_key_enc && { anthropic_key_enc }),
        },
      });
    }

    return await prisma.aiKey.create({
      data: {
        user_id: userId,
        openai_key_enc: openai_key_enc || null,
        anthropic_key_enc: anthropic_key_enc || null,
      },
    });
  },

  async getKeysStatus(userId: string) {
    const keys = await prisma.aiKey.findUnique({
      where: { user_id: userId },
    });

    return {
      has_openai: !!keys?.openai_key_enc,
      has_anthropic: !!keys?.anthropic_key_enc,
      updated_at: keys?.updated_at || null,
    };
  }
};
