import { prisma } from '../../db/prisma';

export const UserService = {
  async updateProfile(userId: string, data: any) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};
