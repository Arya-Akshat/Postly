import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    bio: z.string().max(500).optional(),
    default_tone: z.enum(['PROFESSIONAL', 'CASUAL', 'WITTY', 'AUTHORITATIVE', 'FRIENDLY']).optional(),
    default_language: z.string().optional(),
  }),
});
