import { z } from 'zod';

export const connectSocialSchema = z.object({
  body: z.object({
    platform: z.enum(['TWITTER', 'LINKEDIN', 'INSTAGRAM', 'THREADS']),
    access_token: z.string(),
    refresh_token: z.string().optional(),
    handle: z.string().optional(),
  }),
});
