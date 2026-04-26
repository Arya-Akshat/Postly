import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../db/prisma';
import { env } from '../../config/env';

const generateTokens = (userId: string, email: string) => {
  const accessToken = jwt.sign(
    { id: userId, email },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: userId },
    env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const AuthService = {
  async register(data: any) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw { status: 409, message: 'Email already in use' };
    }

    const password_hash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash,
        name: data.name,
      },
    });

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password_hash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  },

  async login(data: any) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    await prisma.refreshToken.create({
      data: {
        user_id: user.id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const { password_hash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, accessToken, refreshToken };
  },

  async refresh(tokenStr: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: tokenStr },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw { status: 401, message: 'Invalid refresh token' };
    }

    if (tokenRecord.revoked) {
      // Token reuse detected - revoke all tokens for this user
      await prisma.refreshToken.updateMany({
        where: { user_id: tokenRecord.user_id },
        data: { revoked: true },
      });
      throw { status: 401, message: 'Token reuse detected. All sessions revoked.' };
    }

    if (tokenRecord.expires_at < new Date()) {
      throw { status: 401, message: 'Refresh token expired' };
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revoked: true },
    });

    const { accessToken, refreshToken } = generateTokens(tokenRecord.user.id, tokenRecord.user.email);

    await prisma.refreshToken.create({
      data: {
        user_id: tokenRecord.user_id,
        token: refreshToken,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  },

  async logout(userId: string, tokenStr: string) {
    await prisma.refreshToken.updateMany({
      where: { token: tokenStr, user_id: userId },
      data: { revoked: true },
    });
  },

  async logoutAll(userId: string) {
    await prisma.refreshToken.deleteMany({
      where: { user_id: userId },
    });
  },

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw { status: 404, message: 'User not found' };
    
    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
};

// Handles JWT rotation and invalidates old tokens
