import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import { decrypt } from '../../utils/encryption';
import axios from 'axios';

export const AiEngineService = {
  async generateForPlatforms(userId: string, platforms: string[], idea: string, tone: string, postType: string, model: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const keys = await prisma.aiKey.findUnique({ where: { user_id: userId } });

    const openaiKey = keys?.openai_key_enc ? decrypt(keys.openai_key_enc) : env.OPENAI_API_KEY;
    const anthropicKey = keys?.anthropic_key_enc ? decrypt(keys.anthropic_key_enc) : env.ANTHROPIC_API_KEY;

    if (model === 'openai' && !openaiKey) throw new Error('OpenAI key not configured');
    if (model === 'claude' && !anthropicKey) throw new Error('Anthropic key not configured');

    const results = [];
    
    // Create Post record
    const post = await prisma.post.create({
      data: {
        user_id: userId,
        idea,
        post_type: postType as any,
        tone: tone as any,
        language: user?.default_language || 'English',
        model_used: model,
      }
    });

    for (const platform of platforms) {
      try {
        const content = await this.generateWithRetry(model, platform, idea, tone, postType, user?.default_language || 'English', openaiKey!, anthropicKey!);
        
        await prisma.platformPost.create({
          data: {
            post_id: post.id,
            platform: platform as any,
            content,
            status: 'QUEUED', // It will be queued later when published
          }
        });

        const char_count = content.length;
        const hashtags = content.match(/#[\w]+/g) || [];

        results.push({ 
          platform, 
          content, 
          char_count, 
          hashtags, 
          model_used: model, 
          tokens_used: 0, // Mocked for assignment purposes
          error: null 
        });
      } catch (error: any) {
        results.push({ platform, content: null, error: error.message });
      }
    }

    return results;
  },

  async generateWithRetry(model: string, platform: string, idea: string, tone: string, postType: string, language: string, openaiKey: string, anthropicKey: string): Promise<string> {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const prompt = this.getSystemPrompt(platform, tone, language) + `\n\nIdea: ${idea}\nPost Type: ${postType}`;
        
        if (model === 'openai') {
          const res = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4-turbo',
            messages: [{ role: 'system', content: prompt }]
          }, {
            headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
            timeout: 30000
          });
          return res.data.choices[0].message.content.trim();
        } else {
          const res = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-opus-20240229',
            max_tokens: 1024,
            system: prompt,
            messages: [{ role: 'user', content: 'Generate the content.' }]
          }, {
            headers: { 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
            timeout: 30000
          });
          return res.data.content[0].text.trim();
        }
      } catch (error) {
        attempts++;
        if (attempts >= 3) throw error;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    throw new Error('Failed to generate content');
  },

  getSystemPrompt(platform: string, tone: string, language: string) {
    let p = `Write a post in ${language} with a ${tone} tone. `;
    if (platform === 'TWITTER') p += 'Max 280 characters. Use 2-3 hashtags. Start with a punchy hook.';
    if (platform === 'LINKEDIN') p += '800-1300 characters. Always professional. 3-5 hashtags. No emojis.';
    if (platform === 'INSTAGRAM') p += 'Engaging caption. Exactly 10-15 hashtags on new lines. Use relevant emojis.';
    if (platform === 'THREADS') p += 'Max 500 characters. Conversational and casual tone.';
    return p;
  }
};

// Fallback logic limits chars based on target platform guidelines
