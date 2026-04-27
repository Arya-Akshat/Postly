import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db/prisma';

describe('Authentication API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User'
  };

  beforeAll(async () => {
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.data.user).toHaveProperty('email', testUser.email);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('should login the registered user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('accessToken');
  });

  it('should fail login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'wrongpassword'
      });

    expect(res.status).toBe(401);
  });
});
