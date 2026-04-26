import { z } from 'zod';

export const updateAiKeysSchema = z.object({
  body: z.object({
    openai_key: z.string().optional(),
    anthropic_key: z.string().optional(),
  }),
});
