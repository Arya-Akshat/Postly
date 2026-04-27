import { env } from '../../config/env';
import { prisma } from '../../db/prisma';
import { decrypt } from '../../utils/encryption';
import axios from 'axios';

export const AiEngineService = {
  async generateForPlatforms(userId: string, platforms: string[], idea: string, tone: string, postType: string, model: string, level: string = 'MEDIUM') {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const keys = await prisma.aiKey.findUnique({ where: { user_id: userId } });

    const groqKey = env.GROQ_API_KEY || (keys?.openai_key_enc ? decrypt(keys.openai_key_enc) : null);
    
    console.log(`[AI] Generating for platforms: ${platforms.join(', ')} using model: ${model}, level: ${level}`);

    if (!groqKey) {
      console.error('[AI] Groq API key not configured');
      throw new Error('Groq API key not configured');
    }

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
        console.log(`[AI] Generating for platform: ${platform}...`);
        const content = await this.generateWithRetry(model, platform, idea, tone, postType, user?.default_language || 'English', groqKey, level);
        console.log(`[AI] Successfully generated for ${platform} (${content.length} chars)`);
        
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
        console.error(`[AI] Error generating for ${platform}:`, error.message);
        results.push({ platform, content: null, error: error.message });
      }
    }

    return results;
  },

  async generateWithRetry(model: string, platform: string, idea: string, tone: string, postType: string, language: string, groqKey: string, level: string): Promise<string> {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const prompt = this.getSystemPrompt(platform, tone, language, level) + `\n\nIdea: ${idea}\nPost Type: ${postType}`;
        
        // Routing everything to Groq
        const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: 'Generate the content.' }
          ]
        }, {
          headers: { 'Authorization': `Bearer ${groqKey}`, 'Content-Type': 'application/json' },
          timeout: 15000
        });
        return res.data.choices[0].message.content.trim();
      } catch (error) {
        attempts++;
        if (attempts >= 3) throw error;
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    throw new Error('Failed to generate content');
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
