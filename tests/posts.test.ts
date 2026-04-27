import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/db/prisma';

describe('Posts API', () => {
  let token: string;
  let userId: string;

  beforeAll(async () => {
    // Setup user and token
    await prisma.platformPost.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    const reg = await request(app).post('/api/auth/register').send({
      email: 'post-test@example.com',
      password: 'Password123!',
      name: 'Post Tester'
    });
    token = reg.body.data.accessToken;
    userId = reg.body.data.user.id;
  });

  it('should return empty list of posts initially', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.posts).toBeInstanceOf(Array);
    expect(res.body.data.posts.length).toBe(0);
  });

  it('should generate content via API', async () => {
    const res = await request(app)
      .post('/api/content/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        idea: 'A test idea for automated testing',
        platforms: ['TEST'],
        tone: 'PROFESSIONAL',
        post_type: 'ANNOUNCEMENT',
        model: 'groq',
        language: 'English'
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data[0]).toHaveProperty('platform', 'TEST');
  });

  it('should list the generated post', async () => {
    const res = await request(app)
      .get('/api/posts')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.posts.length).toBeGreaterThan(0);
  });
});
