import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import { decrypt } from '../../utils/encryption';
import axios from 'axios';

export const AiEngineService = {
  async generateForPlatforms(userId: string, platforms: string[], idea: string, tone: string, postType: string, model: string, level: string = 'MEDIUM') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const keys = await prisma.aiKey.findUnique({ where: { user_id: userId } });

    // Key selection logic
    let apiKey: string | null = null;
    let provider: 'groq' | 'openai' | 'anthropic' = 'groq';

    if (model === 'openai') {
      apiKey = (keys?.openai_key_enc ? decrypt(keys.openai_key_enc) : env.OPENAI_API_KEY) || null;
      provider = 'openai';
    } else if (model === 'claude') {
      apiKey = (keys?.anthropic_key_enc ? decrypt(keys.anthropic_key_enc) : env.ANTHROPIC_API_KEY) || null;
      provider = 'anthropic';
    } else {
      apiKey = env.GROQ_API_KEY || null;
      provider = 'groq';
    }

    if (!apiKey) {
      throw new Error(`API key for ${provider} not configured`);
    }

    console.log(`[AI] Generating for platforms: ${platforms.join(', ')} using provider: ${provider}, level: ${level}`);

    const results = [];
    
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
        console.log(`[AI] Generating for platform: ${platform}...`);
        const content = await this.generateWithRetry(provider, platform, idea, tone, postType, user?.default_language || 'English', apiKey, level);
        console.log(`[AI] Successfully generated for ${platform} (${content.length} chars)`);
        
        await prisma.platformPost.create({
          data: {
            post_id: post.id,
            platform: platform as any,
            content,
            status: 'QUEUED',
          }
        });

        results.push({ 
          platform, 
          content, 
          char_count: content.length, 
          hashtags: content.match(/#[\w]+/g) || [], 
          model_used: model, 
          tokens_used: 0, 
          error: null 
        });
      } catch (error: any) {
        console.error(`[AI] Error generating for ${platform}:`, error.message);
        results.push({ platform, content: null, error: error.message });
      }
    }

    return results;
  },

  async generateWithRetry(provider: string, platform: string, idea: string, tone: string, postType: string, language: string, apiKey: string, level: string): Promise<string> {
    let attempts = 0;
    const prompt = this.getSystemPrompt(platform, tone, language, level) + `\n\nIdea: ${idea}\nPost Type: ${postType}`;

    while (attempts < 3) {
      try {
        let res;
        if (provider === 'openai') {
          res = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o',
            messages: [{ role: 'system', content: prompt }, { role: 'user', content: 'Generate content' }]
          }, { headers: { 'Authorization': `Bearer ${apiKey}` }, timeout: 15000 });
        } else if (provider === 'anthropic') {
          res = await axios.post('https://api.anthropic.com/v1/messages', {
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1024,
            messages: [{ role: 'user', content: prompt + '\n\nGenerate content.' }]
          }, { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, timeout: 15000 });
        } else {
          res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'system', content: prompt }, { role: 'user', content: 'Generate content' }]
          }, { headers: { 'Authorization': `Bearer ${apiKey}` }, timeout: 15000 });
        }

        const content = provider === 'anthropic' ? res.data.content[0].text : res.data.choices[0].message.content;
        return content.trim();
      } catch (error: any) {
        attempts++;
        if (attempts >= 3) throw error;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    throw new Error('Failed to generate content after retries');
  },

  getSystemPrompt(platform: string, tone: string, language: string, level: string) {
    let p = `Write a post in ${language} with a ${tone} tone. `;
    
    // Length & Detail Instructions
    if (level === 'MINIMAL') {
      p += "Instruction: Keep it extremely short (1-2 sentences). Use ONLY the provided idea with zero fluff. ";
    } else if (level === 'MEDIUM') {
      p += "Instruction: Provide a balanced post (3-5 sentences). Add some context and a clear message based on the idea. ";
    } else if (level === 'HIGH') {
      p += "Instruction: Provide a long, comprehensive post (2-3 detailed paragraphs). Expand the idea with storytelling, depth, and creative details. ";
    }

    // Platform Specifics
    if (platform === 'TWITTER') {
      p += 'Constraint: Max 280 characters total. Use 2-3 hashtags. Start with a punchy hook.';
    } else if (platform === 'LINKEDIN') {
      p += 'Constraint: Target length 800-1300 characters. Use professional formatting, line breaks, and 3-5 hashtags. No emojis.';
    } else if (platform === 'INSTAGRAM') {
      p += 'Constraint: Write an engaging caption. Exactly 10-15 hashtags on new lines. Use relevant emojis.';
    } else if (platform === 'THREADS') {
      p += 'Constraint: Max 500 characters. Maintain a conversational and casual tone.';
    } else if (platform === 'TEST') {
      // Allow TEST to be flexible based on level
      const maxChars = level === 'HIGH' ? 1000 : (level === 'MEDIUM' ? 500 : 200);
      p += `Constraint: Max ${maxChars} characters. This is a test post, make it fun and engaging. Use 2 hashtags.`;
    }
    
    p += " IMPORTANT: Do not include any prefix like 'Here is your post' or 'Sure, here it is'. Just output the content of the post.";
    
    return p;
  }
};
