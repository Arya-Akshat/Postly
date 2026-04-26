import { z } from 'zod';

export const publishPostSchema = z.object({
  body: z.object({
    postId: z.string().uuid()
  }),
});
