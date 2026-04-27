import { z } from 'zod';

export const updateAiKeysSchema = z.object({
  body: z.object({
    openai_key: z.string().optional(),
    anthropic_key: z.string().optional(),
  }),
});

export const generateContentSchema = z.object({
  body: z.object({
    idea: z.string().max(500),
    post_type: z.string(),
    platforms: z.array(z.string()),
    tone: z.string(),
    language: z.string(),
    model: z.string(),
    level: z.string().optional(),
  }),
});
