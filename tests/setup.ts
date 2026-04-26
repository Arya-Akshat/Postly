import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

beforeAll(async () => {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST as string;
  execSync('npx prisma migrate reset --force', { stdio: 'inherit' });
});

afterAll(async () => {
  await prisma.$disconnect();
});
